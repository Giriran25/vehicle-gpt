from sqlalchemy import select, func
from sqlalchemy.orm import Session
from .models import TelemetryEvent


def answer_question(db: Session, question: str, vehicle_id: str) -> dict:
    """A transparent, deterministic prototype. It answers only from stored telemetry."""
    q = question.lower()
    base = select(TelemetryEvent).where(TelemetryEvent.vehicle_id == vehicle_id)
    total = db.scalar(select(func.count()).select_from(TelemetryEvent).where(TelemetryEvent.vehicle_id == vehicle_id)) or 0
    if total == 0:
        return {"answer": f"I don't have telemetry for {vehicle_id} yet, so I can't answer reliably.", "evidence": [], "confidence": "low", "abstained": True}

    def values(column):
        rows = db.execute(select(column, TelemetryEvent.recorded_at).where(TelemetryEvent.vehicle_id == vehicle_id, column.is_not(None)).order_by(TelemetryEvent.recorded_at.desc()).limit(500)).all()
        return rows

    evidence = []
    if any(word in q for word in ("temperature", "hot", "overheat", "engine")):
        rows = values(TelemetryEvent.engine_temp_c)
        if not rows:
            return {"answer": "The stored telemetry has no engine-temperature readings, so I can't assess temperature history.", "evidence": [], "confidence": "low", "abstained": True}
        vals = [float(r[0]) for r in rows]
        latest = vals[0]
        peak = max(vals)
        evidence = [{"metric": "latest engine temperature", "value": round(latest, 1), "unit": "°C"}, {"metric": "highest recorded engine temperature", "value": round(peak, 1), "unit": "°C", "samples": len(vals)}]
        if peak >= 110:
            answer = f"The highest stored engine temperature is {peak:.1f}°C, which is elevated and should be checked. The latest reading is {latest:.1f}°C. This is a screening signal, not a diagnosis."
        else:
            answer = f"The highest stored engine temperature is {peak:.1f}°C and the latest is {latest:.1f}°C. No reading in the stored sample reached the prototype's 110°C alert threshold. This does not guarantee the vehicle is problem-free."
    elif any(word in q for word in ("fuel", "efficiency", "consumption", "petrol", "gas")):
        rows = values(TelemetryEvent.fuel_level_pct)
        if len(rows) < 2:
            return {"answer": "There aren't enough fuel-level readings to compare a change reliably. Add at least two readings.", "evidence": [], "confidence": "low", "abstained": True}
        latest, earliest = float(rows[0][0]), float(rows[-1][0])
        delta = latest - earliest
        evidence = [{"metric": "latest fuel level", "value": round(latest, 1), "unit": "%"}, {"metric": "oldest fuel level in sample", "value": round(earliest, 1), "unit": "%"}, {"metric": "change across sample", "value": round(delta, 1), "unit": "percentage points", "samples": len(rows)}]
        answer = f"Fuel level changed by {delta:+.1f} percentage points across {len(rows)} stored readings (from {earliest:.1f}% to {latest:.1f}%). Fuel level alone cannot establish fuel efficiency; distance and fuel consumed over comparable trips are needed."
    elif any(word in q for word in ("speed", "fast", "overspeed")):
        rows = values(TelemetryEvent.speed_kph)
        if not rows:
            return {"answer": "No speed readings are available for this vehicle.", "evidence": [], "confidence": "low", "abstained": True}
        vals = [float(r[0]) for r in rows]
        evidence = [{"metric": "latest speed", "value": round(vals[0], 1), "unit": "km/h"}, {"metric": "maximum recorded speed", "value": round(max(vals), 1), "unit": "km/h", "samples": len(vals)}]
        answer = f"The latest stored speed is {vals[0]:.1f} km/h and the maximum in the available sample is {max(vals):.1f} km/h. I don't know the applicable road speed limit, so I can't determine whether any reading was speeding."
    elif any(word in q for word in ("trip", "distance", "odometer", "mileage")):
        rows = values(TelemetryEvent.odometer_km)
        if len(rows) < 2:
            return {"answer": "There aren't enough odometer readings to estimate distance travelled.", "evidence": [], "confidence": "low", "abstained": True}
        latest, oldest = float(rows[0][0]), float(rows[-1][0])
        distance = latest - oldest
        evidence = [{"metric": "latest odometer", "value": round(latest, 1), "unit": "km"}, {"metric": "oldest odometer in sample", "value": round(oldest, 1), "unit": "km"}, {"metric": "estimated distance across sample", "value": round(distance, 1), "unit": "km"}]
        if distance < 0:
            answer = "The odometer readings appear out of order or inconsistent. I won't estimate distance until the data is checked."
            return {"answer": answer, "evidence": evidence, "confidence": "low", "abstained": True}
        answer = f"The odometer increased by approximately {distance:.1f} km across the available readings. This is the difference between the newest and oldest stored odometer values, not a reconstructed trip-by-trip distance."
    else:
        return {"answer": "I can answer questions about engine temperature, fuel-level changes, speed, or odometer distance from stored telemetry. Try one of those topics. I won't guess beyond the available data.", "evidence": [], "confidence": "low", "abstained": True}
    return {"answer": answer, "evidence": evidence, "confidence": "medium", "abstained": False}

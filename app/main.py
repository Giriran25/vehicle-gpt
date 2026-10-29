from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import json
import logging
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, inspect, select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db
from .logic import answer_question
from .models import QueryLog, TelemetryEvent, Vehicle
from .schemas import (
    QuestionIn,
    TelemetryIn,
    TelemetryOut,
    TelemetrySummary,
    VehicleCreate,
    VehicleOut,
)

logger = logging.getLogger(__name__)
ROOT = Path(__file__).resolve().parent.parent
DEMO_VEHICLE = "demo-vehicle-01"


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def seed_demo_data(db: Session) -> None:
    vehicle = db.scalar(select(Vehicle).where(Vehicle.vehicle_identifier == DEMO_VEHICLE))
    if vehicle is None:
        vehicle = Vehicle(vehicle_identifier=DEMO_VEHICLE, display_name="Demo vehicle")
        db.add(vehicle)
        db.flush()
    if db.scalar(select(TelemetryEvent.id).where(TelemetryEvent.vehicle_id == DEMO_VEHICLE).limit(1)):
        return
    now = datetime.now(timezone.utc)
    samples = [
        (timedelta(days=4), 0, 91.0, 78.0, 48210.0, "Trip started"),
        (timedelta(days=3), 42, 92.0, 72.0, 48246.0, "Urban driving"),
        (timedelta(days=2), 68, 96.0, 61.0, 48291.0, "Highway segment"),
        (timedelta(days=1), 35, 98.0, 48.0, 48324.0, "Mixed driving"),
        (timedelta(hours=3), 0, 94.0, 43.0, 48324.0, "Parked"),
    ]
    for ago, speed, temp, fuel, odometer, notes in samples:
        db.add(
            TelemetryEvent(
                vehicle_id=DEMO_VEHICLE,
                recorded_at=now - ago,
                event_type="sample",
                speed_kph=speed,
                engine_temp_c=temp,
                fuel_level_pct=fuel,
                odometer_km=odometer,
                notes=notes,
                source="simulated",
            )
        )
    db.commit()


def upgrade_legacy_sqlite_schema() -> None:
    """Make additive changes for the prototype's pre-Alembic SQLite database."""
    if not engine.url.drivername.startswith("sqlite"):
        return
    inspector = inspect(engine)
    if "telemetry_events" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("telemetry_events")}
    additions = {
        "engine_rpm": "FLOAT",
        "battery_voltage": "FLOAT",
        "source": "VARCHAR(30) NOT NULL DEFAULT 'api'",
        "created_at": "DATETIME",
    }
    with engine.begin() as connection:
        for name, definition in additions.items():
            if name not in columns:
                connection.execute(text(f"ALTER TABLE telemetry_events ADD COLUMN {name} {definition}"))
        connection.execute(text("UPDATE telemetry_events SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
        connection.execute(text(
            "UPDATE telemetry_events SET source = 'simulated' "
            "WHERE vehicle_id = 'demo-vehicle-01' AND event_type = 'sample'"
        ))
        if "vehicles" not in inspector.get_table_names():
            connection.execute(text(
                "CREATE TABLE vehicles (id INTEGER PRIMARY KEY, vehicle_identifier VARCHAR(80) NOT NULL UNIQUE, "
                "display_name VARCHAR(120), created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL)"
            ))
        connection.execute(text(
            "INSERT OR IGNORE INTO vehicles (vehicle_identifier, display_name, created_at, updated_at) "
            "SELECT DISTINCT vehicle_id, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM telemetry_events"
        ))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    upgrade_legacy_sqlite_schema()
    with SessionLocal() as db:
        seed_demo_data(db)
    yield


app = FastAPI(title="VehicleGPT API", version="1.0.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/analytics", include_in_schema=False)
def analytics_page():
    return FileResponse(ROOT / "static" / "analytics.html")


@app.get("/llm", include_in_schema=False)
def llm_page():
    return FileResponse(ROOT / "static" / "llm.html")


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(select(1))
        count = db.scalar(select(func.count()).select_from(TelemetryEvent)) or 0
        return {"status": "ok", "database": "connected", "telemetry_records": count}
    except SQLAlchemyError as exc:
        logger.exception("Database health check failed")
        raise HTTPException(status_code=503, detail="Database health check failed") from exc


@app.get("/api/vehicles", response_model=list[VehicleOut])
def list_vehicles(db: Session = Depends(get_db)):
    return db.scalars(select(Vehicle).order_by(Vehicle.vehicle_identifier)).all()


@app.post("/api/vehicles", response_model=VehicleOut, status_code=201)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    try:
        db.commit()
        db.refresh(vehicle)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Vehicle identifier already exists") from exc
    return vehicle


@app.get("/api/vehicles/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    vehicle = db.scalar(select(Vehicle).where(Vehicle.vehicle_identifier == vehicle_id))
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@app.get("/api/telemetry/summary", response_model=TelemetrySummary)
def telemetry_summary(
    vehicle_id: str | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
):
    if start and end and _utc(start) > _utc(end):
        raise HTTPException(status_code=422, detail="start must be before or equal to end")
    filters = [TelemetryEvent.vehicle_id == vehicle_id] if vehicle_id else []
    if start:
        filters.append(TelemetryEvent.recorded_at >= _utc(start))
    if end:
        filters.append(TelemetryEvent.recorded_at <= _utc(end))
    stats = db.execute(
        select(
            func.count(TelemetryEvent.id),
            func.max(TelemetryEvent.speed_kph),
            func.min(TelemetryEvent.engine_temp_c),
            func.max(TelemetryEvent.engine_temp_c),
            func.avg(TelemetryEvent.speed_kph),
            func.min(TelemetryEvent.recorded_at),
            func.max(TelemetryEvent.recorded_at),
            func.min(TelemetryEvent.odometer_km),
            func.max(TelemetryEvent.odometer_km),
        ).where(*filters)
    ).one()
    total, max_speed, min_temp, max_temp, avg_speed, earliest, latest, min_odo, max_odo = stats
    latest_temp = db.scalar(
        select(TelemetryEvent.engine_temp_c)
        .where(*filters, TelemetryEvent.engine_temp_c.is_not(None))
        .order_by(TelemetryEvent.recorded_at.desc(), TelemetryEvent.id.desc())
        .limit(1)
    )
    latest_fuel = db.scalar(
        select(TelemetryEvent.fuel_level_pct)
        .where(*filters, TelemetryEvent.fuel_level_pct.is_not(None))
        .order_by(TelemetryEvent.recorded_at.desc(), TelemetryEvent.id.desc())
        .limit(1)
    )
    return TelemetrySummary(
        vehicle_id=vehicle_id,
        total_records=total,
        latest_temperature_c=latest_temp,
        latest_fuel_level_pct=latest_fuel,
        max_speed_kph=max_speed,
        min_temperature_c=min_temp,
        max_temperature_c=max_temp,
        average_speed_kph=avg_speed,
        distance_travelled_km=(max_odo - min_odo) if min_odo is not None and max_odo is not None else None,
        earliest_recorded_at=_utc(earliest) if earliest else None,
        latest_recorded_at=_utc(latest) if latest else None,
    )


@app.get("/api/summary")
def legacy_summary(vehicle_id: str = DEMO_VEHICLE, db: Session = Depends(get_db)):
    summary = telemetry_summary(vehicle_id=vehicle_id, db=db)
    rows = db.scalars(
        select(TelemetryEvent)
        .where(TelemetryEvent.vehicle_id == vehicle_id)
        .order_by(TelemetryEvent.recorded_at.desc(), TelemetryEvent.id.desc())
        .limit(30)
    ).all()
    latest = rows[0] if rows else None
    return {
        "vehicle_id": vehicle_id,
        "total_records": summary.total_records,
        "latest": TelemetryOut.model_validate(latest).model_dump(mode="json") if latest else None,
        "metrics": {
            "max_engine_temp_c": summary.max_temperature_c,
            "latest_fuel_level_pct": summary.latest_fuel_level_pct,
            "max_speed_kph": summary.max_speed_kph,
            "distance_span_km": summary.distance_travelled_km,
        },
        "history": [TelemetryOut.model_validate(row).model_dump(mode="json") for row in reversed(rows)],
    }


@app.get("/api/telemetry", response_model=list[TelemetryOut])
def list_telemetry(
    vehicle_id: str | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    limit: int | None = Query(default=None, ge=1, le=200),
    db: Session = Depends(get_db),
):
    if start and end and _utc(start) > _utc(end):
        raise HTTPException(status_code=422, detail="start must be before or equal to end")
    effective_size = limit or page_size
    filters = []
    if vehicle_id:
        filters.append(TelemetryEvent.vehicle_id == vehicle_id)
    if start:
        filters.append(TelemetryEvent.recorded_at >= _utc(start))
    if end:
        filters.append(TelemetryEvent.recorded_at <= _utc(end))
    offset = 0 if limit else (page - 1) * page_size
    return db.scalars(
        select(TelemetryEvent)
        .where(*filters)
        .order_by(TelemetryEvent.recorded_at.desc(), TelemetryEvent.id.desc())
        .offset(offset)
        .limit(effective_size)
    ).all()


@app.get("/api/telemetry/{record_id}", response_model=TelemetryOut)
def get_telemetry(record_id: int, db: Session = Depends(get_db)):
    row = db.get(TelemetryEvent, record_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Telemetry record not found")
    return row


@app.post("/api/telemetry", response_model=TelemetryOut, status_code=201)
def create_telemetry(payload: TelemetryIn, db: Session = Depends(get_db)):
    if db.scalar(select(Vehicle.id).where(Vehicle.vehicle_identifier == payload.vehicle_id)) is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    row = TelemetryEvent(**payload.model_dump(exclude={"recorded_at"}), recorded_at=payload.recorded_at or datetime.now(timezone.utc))
    db.add(row)
    try:
        db.commit()
        db.refresh(row)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Telemetry insert failed")
        raise HTTPException(status_code=503, detail="Unable to save telemetry") from exc
    return row


@app.post("/api/ask")
def ask(payload: QuestionIn, db: Session = Depends(get_db)):
    result = answer_question(db, payload.question.strip(), payload.vehicle_id)
    log = QueryLog(question=payload.question.strip(), answer=result["answer"], evidence=json.dumps(result["evidence"]))
    db.add(log)
    db.commit()
    result["query_id"] = log.id
    result["created_at"] = log.created_at.isoformat()
    return result


@app.get("/api/queries")
def recent_queries(limit: int = Query(default=8, ge=1, le=25), db: Session = Depends(get_db)):
    rows = db.scalars(select(QueryLog).order_by(QueryLog.created_at.desc()).limit(limit)).all()
    return [{"id": r.id, "question": r.question, "answer": r.answer, "created_at": r.created_at.isoformat()} for r in rows]

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_identifier: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    telemetry: Mapped[list["TelemetryEvent"]] = relationship(
        back_populates="vehicle", cascade="all, delete-orphan"
    )


class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_id: Mapped[str] = mapped_column(
        ForeignKey("vehicles.vehicle_identifier", ondelete="CASCADE"), index=True
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, default=utc_now)
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    speed_kph: Mapped[float | None] = mapped_column(Float, nullable=True)
    engine_temp_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_level_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    odometer_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    engine_rpm: Mapped[float | None] = mapped_column(Float, nullable=True)
    battery_voltage: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(30), default="api")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    vehicle: Mapped[Vehicle] = relationship(back_populates="telemetry")


class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(String(500))
    answer: Mapped[str] = mapped_column(Text)
    evidence: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, default=utc_now)


Index("ix_telemetry_vehicle_recorded", TelemetryEvent.vehicle_id, TelemetryEvent.recorded_at)

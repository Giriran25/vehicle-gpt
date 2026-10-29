from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def valid_identifier(value: str) -> str:
    value = value.strip()
    if not value or any(char.isspace() for char in value):
        raise ValueError("vehicle identifier must be non-empty and contain no whitespace")
    return value


class VehicleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    vehicle_identifier: str = Field(min_length=1, max_length=80)
    display_name: str | None = Field(default=None, max_length=120)

    _validate_identifier = field_validator("vehicle_identifier")(valid_identifier)


class VehicleOut(VehicleCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class TelemetryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    vehicle_id: str = Field(default="demo-vehicle-01", min_length=1, max_length=80)
    recorded_at: datetime | None = None
    event_type: str = Field(default="telemetry", min_length=1, max_length=50)
    speed_kph: float | None = Field(default=None, ge=0, le=350)
    engine_temp_c: float | None = Field(default=None, ge=-50, le=250)
    fuel_level_pct: float | None = Field(default=None, ge=0, le=100)
    odometer_km: float | None = Field(default=None, ge=0, le=10_000_000)
    engine_rpm: float | None = Field(default=None, ge=0, le=20_000)
    battery_voltage: float | None = Field(default=None, ge=0, le=100)
    notes: str | None = Field(default=None, max_length=1000)
    source: str = Field(default="api", min_length=1, max_length=30)

    _validate_identifier = field_validator("vehicle_id")(valid_identifier)

    @field_validator("recorded_at")
    @classmethod
    def require_utc_or_naive(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class TelemetryOut(TelemetryIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: str
    recorded_at: datetime
    event_type: str
    created_at: datetime


class TelemetrySummary(BaseModel):
    vehicle_id: str | None
    total_records: int
    latest_temperature_c: float | None
    latest_fuel_level_pct: float | None
    max_speed_kph: float | None
    min_temperature_c: float | None
    max_temperature_c: float | None
    average_speed_kph: float | None
    distance_travelled_km: float | None
    earliest_recorded_at: datetime | None
    latest_recorded_at: datetime | None


class QuestionIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(min_length=3, max_length=500)
    vehicle_id: str = Field(default="demo-vehicle-01", min_length=1, max_length=80)

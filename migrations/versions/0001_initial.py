"""create VehicleGPT schema

Revision ID: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # The original prototype created tables before migrations existed. The app's
    # additive SQLite compatibility step upgrades that database before stamping it.
    if "vehicles" in sa.inspect(op.get_bind()).get_table_names():
        return
    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("vehicle_identifier", sa.String(80), nullable=False),
        sa.Column("display_name", sa.String(120)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("vehicle_identifier"),
    )
    op.create_index("ix_vehicles_vehicle_identifier", "vehicles", ["vehicle_identifier"])
    op.create_table(
        "telemetry_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("vehicle_id", sa.String(80), sa.ForeignKey("vehicles.vehicle_identifier", ondelete="CASCADE"), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("speed_kph", sa.Float()),
        sa.Column("engine_temp_c", sa.Float()),
        sa.Column("fuel_level_pct", sa.Float()),
        sa.Column("odometer_km", sa.Float()),
        sa.Column("engine_rpm", sa.Float()),
        sa.Column("battery_voltage", sa.Float()),
        sa.Column("notes", sa.Text()),
        sa.Column("source", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_telemetry_vehicle_recorded", "telemetry_events", ["vehicle_id", "recorded_at"])
    op.create_table(
        "query_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("question", sa.String(500), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_query_logs_created_at", "query_logs", ["created_at"])

def downgrade():
    op.drop_table("query_logs")
    op.drop_table("telemetry_events")
    op.drop_table("vehicles")

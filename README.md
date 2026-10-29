# VehicleGPT — Evidence-grounded vehicle intelligence prototype

A small, polished full-stack prototype for exploring vehicle telemetry and asking questions whose answers are grounded in stored readings. It uses FastAPI + SQLAlchemy, a persistent database, and a responsive HTML/CSS/JavaScript frontend served by the same backend process.

> **Honest scope:** the current Q&A engine is deterministic and rule-based. It is not connected to an LLM yet. This is intentional for a reliable first prototype: it only answers supported telemetry questions and abstains when evidence is missing. Do not treat it as a vehicle diagnostic or safety system.

## Features
- Responsive dark dashboard with metric cards, telemetry history, and source table.
- Ask about engine temperature, fuel-level changes, speed, and odometer distance.
- Evidence chips accompany answers; the system says when there is insufficient data.
- Persistent telemetry and query history in SQLAlchemy-backed storage.
- Seeded demo readings on first startup.
- Input validation, API health endpoint, request error handling, and basic API tests.
- SQLite for zero-setup local development; PostgreSQL via Docker Compose for concurrent deployments.

## Run locally (Windows PowerShell)
Requires Python 3.11+.

```powershell
cd vehiclegpt-prototype
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000. API docs are at http://127.0.0.1:8000/docs and health is at http://127.0.0.1:8000/api/health.

If `py -3.12` is unavailable, use your installed supported Python version: `python -m venv .venv`.

The application reads `DATABASE_URL` and `APP_ENV` from environment variables or a local
`.env` file. Copy `.env.example` to `.env` for local configuration. SQLite is the default
and persists to `vehiclegpt.db`; PostgreSQL is recommended for shared deployments.

## Run with PostgreSQL (recommended for shared testing)
Requires Docker Desktop.

```bash
docker compose up --build -d
```

Open http://localhost:8000. Data persists in the `postgres_data` volume. For any non-local deployment, set a strong `POSTGRES_PASSWORD` environment variable; do not use the example password. Back up the database and configure TLS/secrets before exposing it publicly.

## Run tests

```bash
pytest -q
```

Tests use FastAPI's test client. The app seeds the configured database on startup, so for fully isolated test runs use a temporary database or run tests against a clean local database.

## API overview
- `GET /api/health` — API/database health.
- `GET /api/vehicles` and `POST /api/vehicles` — list and create vehicles.
- `GET /api/vehicles/{vehicle_id}` — retrieve one vehicle.
- `GET /api/summary?vehicle_id=demo-vehicle-01` — metrics and recent history.
- `GET /api/telemetry?vehicle_id=demo-vehicle-01&page=1&page_size=12` — latest readings.
- `POST /api/telemetry` — insert a telemetry reading.
- `GET /api/telemetry/{record_id}` — retrieve one telemetry reading.
- `GET /api/telemetry/summary?vehicle_id=demo-vehicle-01` — database aggregate metrics.
- `POST /api/ask` — answer a supported question from stored data and persist the query.
- `GET /api/queries` — recent question history.

The browser UI is available at `/`, `/analytics`, and `/llm`. All three pages are served
directly by FastAPI, so direct navigation and refresh work without a separate frontend server.

Example telemetry request:

```json
{
  "vehicle_id": "demo-vehicle-01",
  "event_type": "telemetry",
  "speed_kph": 48,
  "engine_temp_c": 95.5,
  "fuel_level_pct": 42,
  "odometer_km": 48328,
  "notes": "Urban driving"
}
```

## Database design and migrations
- `vehicles`: identifiers, optional display names, and UTC audit timestamps.
- `telemetry_events`: timestamped vehicle measurements with nullable sensor values and indexes for vehicle and time.
- `query_logs`: user question, response, evidence JSON, and timestamp.

Fresh installations use Alembic:

```powershell
alembic upgrade head
```

After model changes, create and apply a migration:

```powershell
alembic revision --autogenerate -m "describe schema change"
alembic upgrade head
```

Startup creation is retained as a safe first-run fallback for local SQLite. It never drops
tables or deletes data. A narrow additive compatibility step upgrades the original prototype
SQLite schema; use Alembic for all future schema changes.

## Stability and concurrent users
There is no honest universal user count: it depends on request rate, hosting CPU/RAM, database, query complexity, network, and whether a real LLM is added. Use the following only as conservative **planning estimates**, not measured guarantees:

- **Local SQLite demo:** suitable for a few people testing at once (roughly 1–5 active users); SQLite serializes writes, so it is not the right default for a shared multi-user deployment.
- **PostgreSQL + 2 Uvicorn workers on a modest 2-vCPU / 4-GB host:** a reasonable initial target to load-test around 20–50 concurrent active users for these lightweight rule-based endpoints. This is not a promise; actual throughput must be benchmarked on your host.
- **If an LLM is added:** model inference/API limits usually become the bottleneck. Add async job handling, timeouts, concurrency limits, caching, and monitoring; re-test before claiming capacity.

For a hackathon demo, use PostgreSQL Compose if teammates will test simultaneously. Before a public launch, add authentication, request rate limits, observability, production migrations, security review, and a load test (for example with k6 or Locust). Do not expose the prototype publicly without those controls.

## Limitations
- Seeded synthetic/demo data only; no real OBD-II/CAN adapter is included. Synthetic rows use `source=simulated`.
- Q&A is rule-based, not an LLM, and supports a limited set of question categories.
- The 110°C temperature threshold is a simple prototype alert heuristic, not a manufacturer-specific diagnostic threshold.
- No login, role-based access, tenant isolation, or vehicle ownership controls yet.

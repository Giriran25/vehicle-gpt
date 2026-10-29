# VehicleGPT — Evidence-grounded vehicle intelligence prototype

A small, polished full-stack prototype for exploring vehicle telemetry and asking questions whose answers are grounded in stored readings. It uses FastAPI + SQLAlchemy, a persistent database, and a responsive HTML/CSS/JavaScript frontend served by the same backend process.

> **Honest scope:** the current Q&A engine is deterministic and rule-based. It is not connected to an LLM yet. This is intentional for a reliable first prototype: it only answers supported telemetry questions and abstains when evidence is missing. Do not treat it as a vehicle diagnostic or safety system.

## Features
- Responsive dark dashboard with metric cards, telemetry history, and source table.
- Ask about engine temperature, fuel-level changes, speed, and odometer distance.
- Evidence chips accompany answers; the system says when there is insufficient data.
- Persistent telemetry and query history in SQLAlchemy-backed storage.
- Interactive procedural Three.js concept-car hero with telemetry callouts and a CSS fallback.
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

The homepage hero uses a pinned Three.js ES-module import to render an original, unbranded
procedural sports-car concept. It does not download a third-party vehicle model or use a
manufacturer's design. If WebGL or the module import is unavailable, the interface shows a
lightweight CSS car fallback and keeps the telemetry UI usable. The scene pauses when its
panel is off-screen or the document is hidden, caps device pixel ratio, supports pointer
rotation, drag inspection, reset view, keyboard-accessible callouts, and reduced-motion mode.

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

## Vercel deployment

The repository uses Vercel's current zero-configuration FastAPI detection:

- `.python-version` selects Python 3.12.
- `app/main.py` is a supported FastAPI entry point and exports the single `app` instance.
- The existing `StaticFiles` mount serves the frontend assets and is promoted by Vercel.
- No Node.js build step is required.

The configured Neon project is `VehicleGPT` (`lingering-brook-90407182`) in the
`RANJITH KUMAR G` organization. View it in the
[Neon Console](https://console.neon.tech/app/projects/lingering-brook-90407182/).

Import the repository with its root as the Vercel **Root Directory**. Vercel's current
FastAPI integration supports `app/main.py` directly; no custom rewrite or duplicate
function entry point is needed. Configure these
environment variables separately for Preview and Production:

- `DATABASE_URL`: a hosted PostgreSQL connection string from Neon or another compatible provider.
  `postgres://` and `postgresql://` URLs are normalized to the installed Psycopg 3 driver.
- `APP_ENV=production`.
- `SEED_DEMO_DATA=false`, or omit it because production defaults to false.
- Optional pool settings: `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT`, and `DB_POOL_RECYCLE`.

Never commit the real database URL. `.env.example` contains placeholders only.

### Production migrations

Apply migrations once from a trusted shell or CI job before the first production request:

```powershell
$env:DATABASE_URL = "postgresql://user:password@host.example.com/vehiclegpt?sslmode=require"
$env:APP_ENV = "production"
alembic upgrade head
```

Production startup does not run `create_all()` or Alembic migrations and does not insert demo
telemetry. For an explicitly seeded non-production environment, run this after migrations:

```powershell
python -m scripts.seed_demo
```

The command is repeatable and does not duplicate the demo vehicle's records.

### Preview and production deployment

With the Vercel CLI installed and authenticated:

```powershell
vercel --version
vercel link
vercel deploy
vercel deploy --prod
```

Verify `/`, `/analytics`, `/llm`, `/api/health`, and `/docs` on the preview before promoting
to production. `/api/health` must report `"database": "connected"`.

For `500 FUNCTION_INVOCATION_FAILED`, inspect the deployment's Functions logs in the Vercel
dashboard or run:

```powershell
vercel logs <deployment-url>
```

Likely configuration causes are a missing database URL, missing Preview/Production variables,
an unreachable PostgreSQL provider, or migrations not being applied. The app rejects SQLite
when `APP_ENV=production` or Vercel reports `VERCEL_ENV=production`; it will not silently use
an ephemeral deployment filesystem.

### Deployment checks

```powershell
python -m compileall -q app migrations scripts
pytest -q
node --check static\app.js
alembic upgrade head
```

The local suite uses SQLite. PostgreSQL URL/configuration compatibility is tested, but a live
PostgreSQL provider still requires provider credentials and network access to test end-to-end.

# Chat Export

## Project

Deviathon / HR Helper

> Secrets, tokens, passwords, and database connection strings have been redacted.

## 2026-10-29

### Run FastAPI

Backend command:

```bash
cd "backend"
source ../.venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Useful URLs:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

### Swagger CSP errors

Updated the `/docs` CSP to allow Swagger UI resources from:

- `cdn.jsdelivr.net`
- `fastapi.tiangolo.com`

Other routes retain the strict same-origin CSP.

### CSRF error

Fixed missing `X-CSRF-Token` handling by:

- Setting a readable `csrf_token` cookie on login.
- Removing the cookie on logout.
- Adding frontend fallback lookup from the CSRF cookie.

### Gemini configuration

Added this safe placeholder to `.env.example`:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

The backend already supports `gemini_api_key`.

## 2026-11-02

### Run the project

The project runs with Docker Compose:

```bash
docker compose up -d
```

Services:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Background worker

Verification:

```bash
curl http://localhost:8000/health
docker compose ps
```

### Console errors

Fixed frontend issues:

- Removed the unauthenticated session probe that caused a noisy `401`.
- Added `frontend/public/favicon.svg`.
- Registered the favicon in the Next.js metadata.

Frontend tests and production build passed.

### Candidates endpoint HTTP 500

Root cause:

```text
sqlalchemy.exc.ProgrammingError:
relation "candidates" does not exist
```

The API was using a database without the application schema. The local schema was created with:

```bash
docker compose run --rm api alembic upgrade head
```

The authenticated candidates endpoint then returned HTTP 200.

### Health endpoint

The health endpoint is:

```text
GET http://localhost:8000/health
```

It currently verifies that the FastAPI process responds. It does not check PostgreSQL, Redis, the worker, or external APIs.

### Service checks

PostgreSQL:

```bash
docker compose exec postgres pg_isready -U app_user -d resume_review
```

Redis:

```bash
docker compose exec redis redis-cli ping
```

Worker:

```bash
docker compose ps worker
docker compose logs -f worker
```

All services:

```bash
docker compose ps
```

## 2026-11-03

### TablePlus database

TablePlus was connected to a different Neon database. The local Docker database connection is:

```text
Host: 127.0.0.1
Port: 5432
Database: resume_review
User: app_user
Password: [redacted]
```

Application tables include:

- `candidates`
- `resumes`
- `projects`
- `repository_selections`
- `analysis_jobs`
- `analysis_results`
- `benchmark_projects`
- `benchmark_repositories`
- `benchmark_file_fingerprints`
- `alembic_version`

### Neon migration

Neon connection strings are found in the Neon Console under **Connect**. Disable connection pooling to obtain the direct/unpooled URL.

Use:

- pooled URL for normal application traffic
- direct/unpooled URL for Alembic migrations and database import/export

The Neon schema migration completed successfully at:

```text
004_benchmark_catalog (head)
```

The migration configuration was updated to escape `%` characters in Neon URLs for Alembic:

```python
(settings.database_url_unpooled or settings.database_url).replace("%", "%%")
```

### Neon authentication issue

The Neon host was reachable, but authentication failed:

```text
password authentication failed for user 'neondb_owner'
```

The password must be reset in Neon and the complete fresh connection strings copied into `.env`. Connection strings must not be shared or committed.

### `.env` command error

Shell commands were accidentally pasted into `.env`. They were removed. `.env` must contain only environment assignments such as:

```env
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
REDIS_URL=...
```

Run Docker commands from the terminal, not from `.env`:

```bash
docker compose run --rm api alembic upgrade head
```

## Security reminders

- Revoke any exposed GitHub token immediately.
- Rotate any database password that appeared in terminal output or chat.
- Keep `.env` out of version control.
- Use `.env.example` only for placeholders.

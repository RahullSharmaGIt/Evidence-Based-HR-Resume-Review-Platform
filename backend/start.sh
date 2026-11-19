#!/bin/sh
set -e

echo "==> Running database migrations..."
alembic upgrade head

echo "==> Starting background worker in subshell..."
python -m app.jobs.worker &

echo "==> Starting FastAPI web server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
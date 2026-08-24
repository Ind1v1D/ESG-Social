#!/bin/sh
# Entrypoint for the backend container.
# Uses exec so gunicorn receives signals (SIGTERM, etc.) directly.
# WEB_CONCURRENCY controls the number of workers (default: 2).
exec gunicorn main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --workers "${WEB_CONCURRENCY:-2}" \
    --access-logfile -

# ── Stage 1: build dependencies ──────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: production image ────────────────────────────────
FROM python:3.11-slim

# Create non-root user
RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --create-home appuser

WORKDIR /app

# Copy pre-built dependencies from builder
COPY --from=builder /install /usr/local

# Copy application code (only what's needed)
COPY main.py config.py database.py models.py auth.py events.py \
     excel_parser.py template_generator.py generate_sample.py \
     rate_limit.py ./
COPY routers/ ./routers/
COPY entrypoint.sh ./

# Create data directory for SQLite volume and set ownership
RUN chmod +x entrypoint.sh \
    && mkdir -p /app/data \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8000

# Default worker count — overridable via environment
ENV WEB_CONCURRENCY=2

ENTRYPOINT ["./entrypoint.sh"]

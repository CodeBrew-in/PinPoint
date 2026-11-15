FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Run as an unprivileged user. The photo folder belongs to it, so a new volume mounted there is writable.
RUN useradd --create-home --uid 10001 pinpoint \
    && mkdir -p /app/media/photos \
    && chown -R pinpoint:pinpoint /app/media
USER pinpoint

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/api/v1/health' % os.getenv('PORT', '8000'), timeout=4)"

# Apply database migrations, then start the API.
# PORT is set by hosts such as Render; locally it falls back to 8000.
# --proxy-headers takes the client address from the reverse proxy (needed for rate limits and logs).
# The backend is only reachable inside the Docker network, so the proxy in front of it is trusted.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]

#!/usr/bin/env bash
# Backs up the production database and uploaded photos into backups/<timestamp>/.
#
#   bash scripts/backup.sh                       # uses docker-compose.prod.yml and .env.prod
#   COMPOSE_FILE=docker-compose.yml ENV_FILE=.env bash scripts/backup.sh   # the dev stack
#
# Run it daily (cron or a scheduled task), copy backups/ to another machine or cloud storage,
# and keep at least 7 days. A backup that has never been restored is not proven: test scripts/restore.sh.
set -euo pipefail
# Git Bash on Windows would turn container paths like /app/media into Windows paths
export MSYS_NO_PATHCONV=1

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="backups/$STAMP"
mkdir -p "$OUT"

echo "==> Database dump"
"${COMPOSE[@]}" exec -T postgres pg_dump -U pinpoint -d pinpoint --format=custom > "$OUT/pinpoint.dump"

echo "==> Photos"
"${COMPOSE[@]}" exec -T backend tar -C /app/media -czf - . > "$OUT/media.tar.gz"

# A dump smaller than this is almost certainly broken
[ "$(wc -c < "$OUT/pinpoint.dump")" -gt 1000 ] || { echo "Database dump looks empty: $OUT" >&2; exit 1; }

echo "Backup written to $OUT"
ls -l "$OUT"

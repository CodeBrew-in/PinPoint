#!/usr/bin/env bash
# Restores a backup made by scripts/backup.sh. This REPLACES the current database and photos.
#
#   bash scripts/restore.sh backups/20261115T120000Z
set -euo pipefail
# Git Bash on Windows would turn container paths like /app/media into Windows paths
export MSYS_NO_PATHCONV=1

DIR="${1:?Usage: bash scripts/restore.sh backups/<timestamp>}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

[ -f "$DIR/pinpoint.dump" ] && [ -f "$DIR/media.tar.gz" ] || { echo "Missing pinpoint.dump or media.tar.gz in $DIR" >&2; exit 1; }

read -r -p "This replaces the current database and photos with $DIR. Type RESTORE to continue: " answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

echo "==> Database"
"${COMPOSE[@]}" exec -T postgres pg_restore -U pinpoint -d pinpoint --clean --if-exists --no-owner < "$DIR/pinpoint.dump"

echo "==> Photos"
"${COMPOSE[@]}" exec -T backend sh -c 'rm -rf /app/media/photos/* && tar -C /app/media -xzf -' < "$DIR/media.tar.gz"

echo "Restored from $DIR"

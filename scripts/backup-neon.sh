#!/usr/bin/env bash
# Backs up the Neon database (accounts, maps, places AND photos, which live in the database) to backups/<time>.dump.
#
#   DATABASE_URL='postgresql://...neon.tech/neondb?sslmode=require' bash scripts/backup-neon.sh
#
# It runs pg_dump inside a Docker container, so nothing has to be installed. Keep the file somewhere safe and off
# this computer too (a cloud drive). Practise restoring it once with scripts/restore-neon.sh before you need it.
set -euo pipefail
export MSYS_NO_PATHCONV=1  # Git Bash on Windows would rewrite container paths

: "${DATABASE_URL:?Set DATABASE_URL to the Neon connection string}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p backups
OUT="backups/pinpoint-$STAMP.dump"

# The pg_dump version must be at least the server's. If it says "server version mismatch", raise 17 to the server's number.
docker run --rm -e DATABASE_URL postgres:17 sh -c 'pg_dump "$DATABASE_URL" --format=custom --no-owner' > "$OUT"

[ "$(wc -c < "$OUT")" -gt 1000 ] || { echo "The dump looks empty: $OUT" >&2; rm -f "$OUT"; exit 1; }
echo "Backup written to $OUT"
ls -l "$OUT"

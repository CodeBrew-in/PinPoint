#!/usr/bin/env bash
# Restores a dump made by scripts/backup-neon.sh into a Neon database. This REPLACES what is in it.
#
#   DATABASE_URL='postgresql://...' bash scripts/restore-neon.sh backups/pinpoint-20261116T090000Z.dump
#
# To practise, restore into a second, empty Neon project and look at it; never practise on the live one.
set -euo pipefail
export MSYS_NO_PATHCONV=1

: "${DATABASE_URL:?Set DATABASE_URL to the Neon connection string of the database to overwrite}"
FILE="${1:?Usage: bash scripts/restore-neon.sh backups/<file>.dump}"
[ -f "$FILE" ] || { echo "No such file: $FILE" >&2; exit 1; }

read -r -p "This replaces the data in the target database with $FILE. Type RESTORE to continue: " answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

docker run --rm -i -e DATABASE_URL postgres:17 sh -c 'pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL"' < "$FILE"
echo "Restored from $FILE"

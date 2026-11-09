#!/usr/bin/env bash
# Starts the whole stack with Docker Compose and checks that the API works end to end:
# health, signup, login and /auth/me. Used by CI and safe to run on your own PC.
#
#   bash scripts/smoke-test.sh                 # start, test, then remove containers and data
#   KEEP_STACK=1 bash scripts/smoke-test.sh    # leave the stack (and your data) running afterwards
set -euo pipefail

API="${API:-http://localhost:8000/api/v1}"
WEB="${WEB:-http://localhost:5173}"
EMAIL="smoke-$(date +%s)-$RANDOM@pinpoint.com"
PASSWORD="smoke-test-password-1"

cleanup() {
  rm -f .smoke-photo.png .smoke-fake.txt
  if [ "${KEEP_STACK:-0}" = "1" ]; then
    echo "KEEP_STACK=1: leaving the stack running"
  else
    docker compose down -v
  fi
}
trap cleanup EXIT

step() { printf '\n==> %s\n' "$1"; }
fail() { echo "FAILED: $1" >&2; exit 1; }

step "Starting the stack"
docker compose up -d --build --wait

step "Backend health (waiting for migrations and startup, up to 90 s)"
# "docker compose --wait" returns once the containers are running, which can be
# before the backend has finished its migrations, so keep retrying.
for _ in $(seq 1 45); do
  curl -fsS "$API/health" 2>/dev/null | grep -q '"status":"ok"' && break
  sleep 2
done
curl -fsS "$API/health" | grep -q '"status":"ok"' || { docker compose logs backend --tail=40; fail "health check"; }

step "Signup"
curl -fsS -X POST "$API/auth/signup" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -q "$EMAIL" || fail "signup"

step "Signup rejects a duplicate email"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/signup" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
[ "$code" = "400" ] || fail "duplicate signup returned $code, expected 400"

step "Login"
TOKEN=$(curl -fsS -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | sed -E 's/.*"access_token":"([^"]+)".*/\1/')
[ -n "$TOKEN" ] || fail "login returned no token"

step "Current user"
curl -fsS "$API/auth/me" -H "Authorization: Bearer $TOKEN" | grep -q "$EMAIL" || fail "/auth/me"

step "Me rejects a missing token"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/auth/me")
{ [ "$code" = "401" ] || [ "$code" = "403" ]; } || fail "/auth/me without token returned $code"

# --- maps, places, photos and privacy (contract v2) ---
AUTH="Authorization: Bearer $TOKEN"
JSON="Content-Type: application/json"
MEDIA_BASE="${API%/api/v1}"
id_of() { sed -E 's/.*"id":([0-9]+).*/\1/'; }

step "Create a public map and a private map"
PUBLIC_MAP=$(curl -fsS -X POST "$API/maps" -H "$AUTH" -H "$JSON" \
  -d '{"title":"Smoke public map","visibility":"public"}' | id_of)
PRIVATE_MAP=$(curl -fsS -X POST "$API/maps" -H "$AUTH" -H "$JSON" \
  -d '{"title":"Smoke private map","visibility":"private"}' | id_of)
[ -n "$PUBLIC_MAP" ] && [ -n "$PRIVATE_MAP" ] || fail "creating maps"

step "A guest sees the public map but not the private one"
curl -fsS "$API/maps" | grep -q "Smoke public map" || fail "public map missing from the guest list"
curl -fsS "$API/maps" | grep -q "Smoke private map" && fail "private map leaked into the guest list"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/maps/$PRIVATE_MAP")
[ "$code" = "404" ] || fail "private map returned $code to a guest, expected 404"

step "Add a place to each map"
PUBLIC_PLACE=$(curl -fsS -X POST "$API/locations" -H "$AUTH" -H "$JSON" \
  -d "{\"name\":\"Smoke place\",\"lat\":30.34,\"lng\":76.38,\"tags\":[\"smoke\"],\"map_id\":$PUBLIC_MAP}" | id_of)
PRIVATE_PLACE=$(curl -fsS -X POST "$API/locations" -H "$AUTH" -H "$JSON" \
  -d "{\"name\":\"Smoke secret\",\"lat\":30.35,\"lng\":76.39,\"map_id\":$PRIVATE_MAP}" | id_of)
[ -n "$PUBLIC_PLACE" ] && [ -n "$PRIVATE_PLACE" ] || fail "creating places"

step "Places inside a bounding box: guest sees only the public one"
BOX="76.0,30.0,77.0,31.0"
curl -fsS "$API/locations?bbox=$BOX" | grep -q "Smoke place" || fail "public place missing from bbox search"
curl -fsS "$API/locations?bbox=$BOX" | grep -q "Smoke secret" && fail "private place leaked into bbox search"
curl -fsS "$API/locations?bbox=$BOX" -H "$AUTH" | grep -q "Smoke secret" || fail "owner cannot see their private place"

step "Photo upload accepts a real PNG and rejects a fake one"
PNG_FILE=".smoke-photo.png"; FAKE_FILE=".smoke-fake.txt"
printf '\211PNG\r\n\032\n0000000000000000000000000000' > "$PNG_FILE"
echo "not an image" > "$FAKE_FILE"
PHOTO_URL=$(curl -fsS -X POST "$API/locations/$PUBLIC_PLACE/photos" -H "$AUTH" -F "file=@$PNG_FILE;type=image/png" \
  | sed -E 's/.*"url":"([^"]+)".*/\1/')
[ -n "$PHOTO_URL" ] || fail "photo upload"
curl -fsS -o /dev/null "$MEDIA_BASE$PHOTO_URL" || fail "uploaded photo is not served at $PHOTO_URL"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/locations/$PUBLIC_PLACE/photos" -H "$AUTH" -F "file=@$FAKE_FILE;type=image/png")
[ "$code" = "415" ] || fail "fake PNG returned $code, expected 415"
rm -f "$PNG_FILE" "$FAKE_FILE"

step "Verify a place and report it; reports are for moderators only"
curl -fsS -X POST "$API/locations/$PUBLIC_PLACE/verify" -H "$AUTH" | grep -q '"verified_by"' || fail "verify"
curl -fsS -X POST "$API/locations/$PUBLIC_PLACE/reports" -H "$AUTH" -H "$JSON" -d '{"kind":"other","note":"smoke"}' | grep -q '"status":"open"' || fail "report"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/reports" -H "$AUTH")
[ "$code" = "403" ] || fail "reports list returned $code to a normal user, expected 403"
# --- end of maps, places, photos and privacy ---

step "Frontend responds"
for _ in $(seq 1 30); do
  curl -fsS -o /dev/null "$WEB" && break
  sleep 2
done
curl -fsS -o /dev/null "$WEB" || fail "frontend did not respond at $WEB"

echo; echo "Smoke test passed"

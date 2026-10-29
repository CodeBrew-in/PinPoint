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

step "Backend health"
curl -fsS "$API/health" | grep -q '"status":"ok"' || fail "health check"

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

step "Frontend responds"
for _ in $(seq 1 30); do
  curl -fsS -o /dev/null "$WEB" && break
  sleep 2
done
curl -fsS -o /dev/null "$WEB" || fail "frontend did not respond at $WEB"

echo; echo "Smoke test passed"

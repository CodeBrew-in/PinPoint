# Backend Entrypoint Deleted

## Error / Problem

The backend could not start and most tests failed with
`ModuleNotFoundError: No module named 'app.main'`.

Commit `768346e` ("changes in main") deleted the real `backend/app/main.py`
(which connected the auth and health routers) and moved a mock app into
`backend/app/models/main.py`. The mock had a fake login that always
succeeded and returned a fake token, so the working `/auth/*` routes were
never reachable. The Dockerfile still ran `app.main:app`, so the container
crashed on start.

## Solution

- Restored `backend/app/main.py` with the health and auth routers and CORS.
- Deleted the mock app.
- Docker now runs `alembic upgrade head` before starting the API and waits
  for Postgres to be healthy.
- Added auth tests (signup, login, `/me`) so a missing entrypoint or broken
  route is caught by CI.

## Lesson

Saneh and I fixed this independently at the same time. Before fixing a shared
problem, check GitHub for new commits and tell each other who is doing it.
Also review what a commit deletes before merging it, especially into `main`.

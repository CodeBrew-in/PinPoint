# Docker: Database Migrations Not Running

## Error / Problem

After a fresh `docker compose up --build`, the health check worked, but signup returned
`500 Internal Server Error`. The backend logs showed:

```shell
sqlalchemy.exc.ProgrammingError: (psycopg.errors.UndefinedTable) relation "users" does not exist
```

The `users` table is created by the Alembic migration `74cca7508396_create_users_table.py`,
but nothing ran that migration inside Docker:

- The backend `Dockerfile` only copied the `app/` folder, not `alembic/` or `alembic.ini`.
- The container started `uvicorn` directly, without running `alembic upgrade head` first.

So the app worked on a laptop where someone had run migrations by hand, but not for anyone starting from a fresh clone.

### Related problem

Running migrations at startup creates a race: `depends_on: postgres` only waits for the Postgres
container to **start**, not until it's **ready** to accept connections. The migration could run too early and fail.

## Solution

### Implemented Solutions

Backend `Dockerfile`:

```dockerfile
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Apply database migrations before starting the API
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

`docker-compose.yml`: a healthcheck on Postgres, and the backend waits until it passes:

```yaml
backend:
  depends_on:
    postgres:
      condition: service_healthy

postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U pinpoint -d pinpoint"]
    interval: 5s
    timeout: 5s
    retries: 10
```

### Result

Tested with `docker compose down -v` (deletes the database) and then `docker compose up --build`.
The logs showed `Running upgrade -> 74cca7508396, create users table`, all 3 services were healthy,
and signup returned `201`.

### Lesson

Test setup from a **fresh** state (`docker compose down -v`), not only on a machine that already works.
Anything done by hand once (like running migrations) has to be part of the setup itself.

# Local Postgres Port Conflict (5432)

## Error / Problem

Running Alembic or `pytest` from my own terminal (outside Docker) failed with:

```shell
connection to server at "127.0.0.1", port 5432 failed:
FATAL:  password authentication failed for user "pinpoint"
```

The username and password (`pinpoint` / `pinpoint`) were correct for the Docker database.

The cause: a **Windows PostgreSQL service** was already installed on my laptop and also listening on port 5432.

```shell
netstat -ano | grep ":5432 .*LISTEN"
  TCP    0.0.0.0:5432    ...    LISTENING    8252    <- Windows postgres.exe
  TCP    0.0.0.0:5432    ...    LISTENING    13912   <- Docker
```

Connections to `localhost:5432` reached the Windows Postgres, which doesn't have a `pinpoint` user,
instead of the Docker one.

Things **inside** Docker (the backend container) were not affected,
because they connect to `postgres:5432` on Docker's own network.

## Solution

### Implemented Solutions

To verify the backend, I ran the tests inside the Docker network instead of from my terminal:

```shell
docker compose run --rm -v "<path to repo>/backend:/app" backend sh -c "pip install -q pytest; python -m pytest -q"
```

Result: `3 passed`.

### Options for the future

- **Stop the Windows service** when working on PinPoint
  (Services app, then "postgresql-x64-…", then Stop, and set it to Manual), **or**
- Map Docker Postgres to a different host port, e.g. `"5433:5432"`, and use
  `DATABASE_URL=postgresql://pinpoint:pinpoint@localhost:5433/pinpoint` locally.
  (This would need agreement with Tanmay, since it changes `docker-compose.yml` and `.env.example`.)

CI is not affected, because GitHub Actions runners don't have a second Postgres.

### Lesson

If correct details give "password authentication failed", check **which** server you're actually connecting to.
`netstat -ano | grep :5432` shows every program listening on the port.

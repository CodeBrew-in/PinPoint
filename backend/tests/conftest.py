import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# The app refuses to start without a SECRET_KEY (a throw-away value, only used by the tests).
os.environ.setdefault("SECRET_KEY", "test-only-secret-key-for-the-test-suite-0123456789")

# Rate limits are tested on their own (test_hardening.py); everywhere else they would get in the way
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

# Uploaded photos go to a throwaway folder during tests (set before the app is imported).
os.environ.setdefault("MEDIA_DIR", tempfile.mkdtemp(prefix="pinpoint-media-"))



def _use_separate_test_database() -> None:
    """Point the tests at <database>_test, creating it if needed.

    The tests create tables and run in rolled-back transactions; they must never touch the development
    database (they once left its tables without a migration record).
    """
    from dotenv import load_dotenv
    from sqlalchemy import create_engine, text
    from sqlalchemy.engine import make_url

    load_dotenv()
    url = make_url(os.environ["DATABASE_URL"])
    if not url.database.endswith("_test"):
        url = url.set(database=f"{url.database}_test")
    admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as connection:
        exists = connection.execute(text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": url.database}).scalar()
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{url.database}"'))
    admin.dispose()
    os.environ["DATABASE_URL"] = url.render_as_string(hide_password=False)


_use_separate_test_database()

from app.db.base import Base  # noqa: E402
from app.db.database import engine, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app import models as _models  # noqa: E402,F401  (registers every table; a plain "import app.models" would overwrite the app variable)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)


@pytest.fixture
def make_user(request):
    """Creates an account through the API and returns its auth headers: make_user("a@x.com", username="a")."""
    counter = {"n": 0}

    def _make(email=None, username=None, password="password123"):
        client = request.getfixturevalue("client")
        counter["n"] += 1
        email = email or f"user{counter['n']}@pinpoint.com"
        body = {"email": email, "password": password}
        if username:
            body["username"] = username
        assert client.post("/api/v1/auth/signup", json=body).status_code == 201
        token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _make


@pytest.fixture
def client():
    # Run each test inside a transaction that is rolled back afterwards,
    # so tests never leave rows behind in the database.
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    app.dependency_overrides[get_db] = lambda: session
    yield TestClient(app)

    app.dependency_overrides.clear()
    session.close()
    transaction.rollback()
    connection.close()

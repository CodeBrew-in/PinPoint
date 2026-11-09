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

# Uploaded photos go to a throwaway folder during tests (set before the app is imported).
os.environ.setdefault("MEDIA_DIR", tempfile.mkdtemp(prefix="pinpoint-media-"))

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

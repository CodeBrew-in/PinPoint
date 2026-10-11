import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.base import Base  # noqa: E402
from app.db.database import engine, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User  # noqa: E402,F401  (registers the users table)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)


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

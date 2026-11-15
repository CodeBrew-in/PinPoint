"""Production hardening: rate limits, request size limit, security headers, health check."""
import pytest

from app.core import ratelimit

API = "/api/v1"


@pytest.fixture
def limits_on(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    ratelimit.reset()
    yield
    ratelimit.reset()


def test_login_is_rate_limited_per_email(client, limits_on):
    body = {"email": "target@pinpoint.com", "password": "wrong-password"}
    codes = [client.post(f"{API}/auth/login", json=body).status_code for _ in range(11)]

    assert codes[:10] == [401] * 10
    assert codes[10] == 429


def test_rate_limit_answer_says_when_to_retry(client, limits_on):
    body = {"email": "target@pinpoint.com", "password": "wrong-password"}
    for _ in range(10):
        client.post(f"{API}/auth/login", json=body)

    response = client.post(f"{API}/auth/login", json=body)

    assert response.status_code == 429
    assert int(response.headers["Retry-After"]) > 0


def test_signup_is_rate_limited_per_ip(client, limits_on):
    codes = [
        client.post(f"{API}/auth/signup", json={"email": f"new{i}@pinpoint.com", "password": "password123"}).status_code
        for i in range(11)
    ]

    assert codes[:10] == [201] * 10
    assert codes[10] == 429


def test_oversized_body_is_refused_before_it_is_read(client):
    response = client.post(f"{API}/auth/login", content=b"x", headers={"Content-Length": str(7 * 1024 * 1024)})

    assert response.status_code == 413


def test_api_responses_carry_security_headers(client):
    response = client.get(f"{API}/health")

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Cache-Control"] == "no-store"


def test_health_checks_the_database(client):
    assert client.get(f"{API}/health").json() == {"status": "ok"}


def test_health_reports_a_broken_database(client):
    from app.db.database import get_db
    from app.main import app

    class BrokenSession:
        def execute(self, *args, **kwargs):
            raise RuntimeError("database is down")

    app.dependency_overrides[get_db] = lambda: BrokenSession()

    assert client.get(f"{API}/health").status_code == 503

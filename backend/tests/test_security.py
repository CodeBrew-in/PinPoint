import pytest
from app.core.security import hash_password, verify_password


def test_password_hashing():
    password = "testpassword123"

    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)

# ---------- SEC-001: no default JWT signing key ----------


def test_secret_key_is_required_and_long_enough(monkeypatch):
    from app.core.security import load_secret_key

    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError):
        load_secret_key()
    monkeypatch.setenv("SECRET_KEY", "too-short")
    with pytest.raises(RuntimeError):
        load_secret_key()
    monkeypatch.setenv("SECRET_KEY", "x" * 32)
    assert load_secret_key() == "x" * 32


def test_token_signed_with_the_old_default_key_is_rejected():
    from datetime import datetime, timedelta, timezone

    import jwt

    from app.core.security import verify_access_token

    old_default = "dev-only-insecure-secret-key-change-me-in-env"  # the public placeholder that used to be the fallback
    forged = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}, old_default, algorithm="HS256"
    )
    assert verify_access_token(forged) is None


# ---------- SEC-002: email case variants are the same account ----------


def test_email_case_variant_cannot_register_a_second_account(client):
    body = {"email": "ananya@pinpoint.com", "password": "password123"}
    assert client.post("/api/v1/auth/signup", json=body).status_code == 201

    for variant in ("Ananya@pinpoint.com", "ANANYA@PINPOINT.COM", " ananya@pinpoint.com "):
        response = client.post("/api/v1/auth/signup", json={**body, "email": variant})
        assert response.status_code == 400, variant


def test_email_is_stored_in_lower_case_and_login_ignores_case(client):
    created = client.post("/api/v1/auth/signup", json={"email": "Mixed.Case@PinPoint.com", "password": "password123"})
    assert created.status_code == 201
    assert created.json()["email"] == "mixed.case@pinpoint.com"

    login = client.post("/api/v1/auth/login", json={"email": "MIXED.case@pinpoint.com", "password": "password123"})
    assert login.status_code == 200


def test_moderator_email_variant_does_not_create_a_second_moderator(client, monkeypatch):
    assert client.post("/api/v1/auth/signup", json={"email": "mod@pinpoint.com", "password": "password123"}).status_code == 201
    monkeypatch.setenv("MODERATOR_EMAILS", "mod@pinpoint.com")

    clash = client.post("/api/v1/auth/signup", json={"email": "Mod@pinpoint.com", "password": "password123"})
    assert clash.status_code == 400

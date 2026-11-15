"""E-mail verification, password reset, the confirmed-e-mail requirement, and the Gmail API sender."""
import base64
import re
from datetime import datetime, timedelta

import pytest

from app.core import ratelimit

API = "/api/v1"
PASSWORD = "password123"


@pytest.fixture
def outbox(monkeypatch):
    """E-mail switched on, with a fake sender that records messages instead of sending them."""
    sent = []
    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    monkeypatch.setenv("SMTP_HOST", "mail.test")  # makes e-mail count as configured; nothing connects to it
    monkeypatch.setattr("app.services.emailflows.send_email", lambda to, subject, text: sent.append((to, subject, text)))
    return sent


def link_token(message) -> str:
    return re.search(r"token=([\w-]+)", message[2]).group(1)


def signup(client, email="new@pinpoint.com"):
    return client.post(f"{API}/auth/signup", json={"email": email, "password": PASSWORD})


def login(client, email="new@pinpoint.com", password=PASSWORD):
    response = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {response.json()['access_token']}"} if response.status_code == 200 else None


def expire_tokens(client):
    from app.db.database import get_db
    from app.main import app
    from app.models.emailtoken import EmailToken

    session = app.dependency_overrides[get_db]()
    for row in session.query(EmailToken):
        row.expires_at = datetime.utcnow() - timedelta(minutes=1)
    session.flush()


# ---------- confirming the address ----------


def test_signup_sends_a_confirmation_link(client, outbox):
    assert signup(client).status_code == 201

    assert len(outbox) == 1
    to, subject, text = outbox[0]
    assert to == "new@pinpoint.com" and "Confirm" in subject
    assert "/verify-email?token=" in text


def test_nothing_is_sent_when_e_mail_is_not_set_up(client):
    assert signup(client).status_code == 201  # no outbox fixture: signup still works


def test_the_link_confirms_the_address(client, outbox):
    signup(client)
    me = login(client)
    assert client.get(f"{API}/auth/me", headers=me).json()["email_verified"] is False

    response = client.post(f"{API}/auth/verify-email", json={"token": link_token(outbox[0])})

    assert response.status_code == 200 and response.json()["email_verified"] is True
    assert client.get(f"{API}/auth/me", headers=me).json()["email_verified"] is True


def test_a_link_works_only_once(client, outbox):
    signup(client)
    token = link_token(outbox[0])

    assert client.post(f"{API}/auth/verify-email", json={"token": token}).status_code == 200
    assert client.post(f"{API}/auth/verify-email", json={"token": token}).status_code == 400


def test_bad_and_expired_links_are_refused(client, outbox):
    signup(client)
    token = link_token(outbox[0])
    assert client.post(f"{API}/auth/verify-email", json={"token": "x" * 40}).status_code == 400

    expire_tokens(client)

    assert client.post(f"{API}/auth/verify-email", json={"token": token}).status_code == 400


def test_the_database_keeps_only_a_hash_of_the_link(client, outbox):
    from app.db.database import get_db
    from app.main import app
    from app.models.emailtoken import EmailToken

    signup(client)
    token = link_token(outbox[0])

    rows = app.dependency_overrides[get_db]().query(EmailToken).all()
    assert len(rows) == 1 and rows[0].token_hash != token and len(rows[0].token_hash) == 64


def test_resending_cancels_the_old_link(client, outbox):
    signup(client)
    me = login(client)
    first = link_token(outbox[0])

    assert client.post(f"{API}/auth/resend-verification", headers=me).status_code == 202
    second = link_token(outbox[1])

    assert client.post(f"{API}/auth/verify-email", json={"token": first}).status_code == 400
    assert client.post(f"{API}/auth/verify-email", json={"token": second}).status_code == 200


def test_resending_is_limited(client, outbox, monkeypatch):
    signup(client)
    me = login(client)
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    ratelimit.reset()
    try:
        codes = [client.post(f"{API}/auth/resend-verification", headers=me).status_code for _ in range(4)]
    finally:
        ratelimit.reset()

    assert codes == [202, 202, 202, 429]


# ---------- the confirmed-e-mail requirement ----------


def test_unconfirmed_accounts_cannot_add_content_when_it_is_required(client, outbox, monkeypatch):
    monkeypatch.setenv("EMAIL_VERIFICATION", "required")
    signup(client)
    me = login(client)

    blocked = client.post(f"{API}/maps", json={"title": "My map", "visibility": "public"}, headers=me)

    assert blocked.status_code == 403 and "confirm" in blocked.json()["detail"].lower()
    assert client.get(f"{API}/maps?scope=mine", headers=me).status_code == 200  # reading is fine

    client.post(f"{API}/auth/verify-email", json={"token": link_token(outbox[0])})
    assert client.post(f"{API}/maps", json={"title": "My map", "visibility": "public"}, headers=me).status_code == 201


def test_nothing_is_required_when_verification_is_off(client, make_user):
    me = make_user()

    assert client.post(f"{API}/maps", json={"title": "My map", "visibility": "public"}, headers=me).status_code == 201


def test_a_moderator_must_have_a_confirmed_address(client, outbox, monkeypatch):
    monkeypatch.setenv("EMAIL_VERIFICATION", "required")
    signup(client, "boss@pinpoint.com")
    monkeypatch.setenv("MODERATOR_EMAILS", "boss@pinpoint.com")
    me = login(client, "boss@pinpoint.com")

    assert client.get(f"{API}/auth/me", headers=me).json()["role"] == "member"
    assert client.get(f"{API}/reports", headers=me).status_code == 403

    client.post(f"{API}/auth/verify-email", json={"token": link_token(outbox[0])})
    assert client.get(f"{API}/auth/me", headers=me).json()["role"] == "moderator"
    assert client.get(f"{API}/reports", headers=me).status_code == 200


def test_the_server_refuses_to_start_if_verification_is_required_without_e_mail(monkeypatch):
    from app.core.emailconfig import check_email_config

    monkeypatch.setenv("EMAIL_VERIFICATION", "required")
    monkeypatch.delenv("EMAIL_PROVIDER", raising=False)
    with pytest.raises(RuntimeError):
        check_email_config()

    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    monkeypatch.setenv("SMTP_HOST", "mail.test")
    check_email_config()  # now fine


def test_config_tells_the_site_whether_verification_is_on(client, monkeypatch):
    assert client.get(f"{API}/config").json()["email_verification"] is False
    monkeypatch.setenv("EMAIL_VERIFICATION", "required")

    assert client.get(f"{API}/config").json()["email_verification"] is True


# ---------- forgotten password ----------


def test_reset_flow_changes_the_password(client, outbox):
    signup(client)
    outbox.clear()

    assert client.post(f"{API}/auth/forgot-password", json={"email": "new@pinpoint.com"}).status_code == 202
    assert len(outbox) == 1 and "/reset-password?token=" in outbox[0][2]

    done = client.post(f"{API}/auth/reset-password", json={"token": link_token(outbox[0]), "password": "a-brand-new-pass"})

    assert done.status_code == 200
    assert login(client, password=PASSWORD) is None  # the old password is dead
    assert login(client, password="a-brand-new-pass") is not None
    assert done.json()["email_verified"] is True  # the link reached their mailbox, so the address is theirs


def test_forgot_password_does_not_reveal_which_addresses_have_accounts(client, outbox):
    signup(client)
    outbox.clear()

    known = client.post(f"{API}/auth/forgot-password", json={"email": "new@pinpoint.com"})
    unknown = client.post(f"{API}/auth/forgot-password", json={"email": "nobody@pinpoint.com"})

    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()
    assert [m[0] for m in outbox] == ["new@pinpoint.com"]  # only the real account got a message


def test_a_reset_link_works_once_and_expires(client, outbox):
    signup(client)
    outbox.clear()
    client.post(f"{API}/auth/forgot-password", json={"email": "new@pinpoint.com"})
    token = link_token(outbox[0])

    assert client.post(f"{API}/auth/reset-password", json={"token": token, "password": "first-new-pass"}).status_code == 200
    assert client.post(f"{API}/auth/reset-password", json={"token": token, "password": "second-new-pass"}).status_code == 400

    client.post(f"{API}/auth/forgot-password", json={"email": "new@pinpoint.com"})
    expire_tokens(client)
    assert client.post(f"{API}/auth/reset-password", json={"token": link_token(outbox[1]), "password": "third-new-pass"}).status_code == 400


def test_a_confirmation_link_cannot_reset_a_password(client, outbox):
    signup(client)

    response = client.post(f"{API}/auth/reset-password", json={"token": link_token(outbox[0]), "password": "hijacked-pass-1"})

    assert response.status_code == 400  # the two kinds of link are not interchangeable


def test_the_new_password_must_follow_the_rules(client, outbox):
    signup(client)
    outbox.clear()
    client.post(f"{API}/auth/forgot-password", json={"email": "new@pinpoint.com"})

    assert client.post(f"{API}/auth/reset-password", json={"token": link_token(outbox[0]), "password": "short"}).status_code == 422


def test_forgot_password_is_rate_limited(client, outbox, monkeypatch):
    signup(client)
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    ratelimit.reset()
    try:
        codes = [client.post(f"{API}/auth/forgot-password", json={"email": "new@pinpoint.com"}).status_code for _ in range(4)]
    finally:
        ratelimit.reset()

    assert codes == [202, 202, 202, 429]


# ---------- the Gmail API sender ----------


def test_the_gmail_api_sender_refreshes_a_token_and_sends_the_message(monkeypatch):
    from app.services import mailer

    for key, value in {
        "EMAIL_PROVIDER": "gmail_api", "GMAIL_CLIENT_ID": "id", "GMAIL_CLIENT_SECRET": "secret",
        "GMAIL_REFRESH_TOKEN": "refresh", "GMAIL_SENDER": "sender@gmail.com",
    }.items():
        monkeypatch.setenv(key, value)
    mailer._token.update(value="", expires=0.0)
    calls = []

    class Reply:
        def __init__(self, body):
            self._body = body

        def raise_for_status(self):
            pass

        def json(self):
            return self._body

    def fake_post(url, **kwargs):
        calls.append((url, kwargs))
        return Reply({"access_token": "access-1", "expires_in": 3600} if "oauth2" in url else {"id": "m1"})

    monkeypatch.setattr(mailer.httpx, "post", fake_post)

    mailer.send_email("someone@pinpoint.com", "Hello there", "Body text")

    token_call, send_call = calls
    assert token_call[1]["data"]["grant_type"] == "refresh_token" and token_call[1]["data"]["refresh_token"] == "refresh"
    assert send_call[1]["headers"]["Authorization"] == "Bearer access-1"
    raw = base64.urlsafe_b64decode(send_call[1]["json"]["raw"]).decode()
    assert "Subject: Hello there" in raw and "To: someone@pinpoint.com" in raw and "sender@gmail.com" in raw

    mailer.send_email("two@pinpoint.com", "Again", "Body")
    assert len(calls) == 3  # the access token was reused, not refreshed again


def test_a_failing_mail_service_never_raises(monkeypatch):
    from app.services import mailer

    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    monkeypatch.setenv("SMTP_HOST", "127.0.0.1")
    monkeypatch.setenv("SMTP_PORT", "1")  # nothing listens there

    mailer.send_email("someone@pinpoint.com", "Hello", "Body")  # logs the problem, does not raise


def test_an_incomplete_gmail_setup_counts_as_not_configured(monkeypatch):
    from app.core.emailconfig import email_configured

    monkeypatch.setenv("EMAIL_PROVIDER", "gmail_api")
    monkeypatch.setenv("GMAIL_CLIENT_ID", "id")  # the other three settings are missing
    for key in ("GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_SENDER"):
        monkeypatch.delenv(key, raising=False)

    assert email_configured() is False

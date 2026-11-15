"""Sending e-mail: through the Gmail API (HTTPS) or SMTP.

With no provider set up nothing is sent and the message is written to the log, which is handy on a laptop.
Sending runs in a background task, so a slow mail service never makes a request wait, and a mail problem never
breaks the request: the person can simply ask for a new link.
"""
import base64
import logging
import os
import smtplib
import ssl
import threading
import time
from email.message import EmailMessage

import httpx

from app.core.emailconfig import provider, sender_address

log = logging.getLogger("pinpoint.mail")

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"

_token_lock = threading.Lock()
_token = {"value": "", "expires": 0.0}


def _build_message(to: str, subject: str, text: str) -> EmailMessage:
    message = EmailMessage()
    message["From"] = f"PinPoint <{sender_address()}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    return message


def _gmail_access_token() -> str:
    """A short-lived access token, renewed from the long-lived refresh token when it is about to run out."""
    with _token_lock:
        if _token["value"] and time.time() < _token["expires"] - 60:
            return _token["value"]
        response = httpx.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": os.getenv("GMAIL_CLIENT_ID", "").strip(),
                "client_secret": os.getenv("GMAIL_CLIENT_SECRET", "").strip(),
                "refresh_token": os.getenv("GMAIL_REFRESH_TOKEN", "").strip(),
                "grant_type": "refresh_token",
            },
            timeout=20,
        )
        response.raise_for_status()
        body = response.json()
        _token["value"] = body["access_token"]
        _token["expires"] = time.time() + int(body.get("expires_in", 3600))
        return _token["value"]


def _send_gmail_api(message: EmailMessage) -> None:
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
    response = httpx.post(
        GMAIL_SEND_URL,
        json={"raw": raw},
        headers={"Authorization": f"Bearer {_gmail_access_token()}"},
        timeout=20,
    )
    response.raise_for_status()


def _send_smtp(message: EmailMessage) -> None:
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    security = os.getenv("SMTP_SECURITY", "starttls").strip().lower()
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "465" if security == "ssl" else "587"))
    if security == "ssl":
        server = smtplib.SMTP_SSL(host, port, timeout=20, context=ssl.create_default_context())
    else:
        server = smtplib.SMTP(host, port, timeout=20)
    with server:
        if security == "starttls":
            server.starttls(context=ssl.create_default_context())
        if user and password:
            server.login(user, password)
        server.send_message(message)


def send_email(to: str, subject: str, text: str) -> None:
    chosen = provider()
    if not chosen:
        log.warning("E-mail is not configured. Would have sent to %s: %s\n%s", to, subject, text)
        return
    try:
        message = _build_message(to, subject, text)
        if chosen == "gmail_api":
            _send_gmail_api(message)
        else:
            _send_smtp(message)
        log.info("Sent e-mail %r to %s via %s", subject, to, chosen)
    except Exception:
        log.exception("Could not send e-mail %r to %s via %s", subject, to, chosen)

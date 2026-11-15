"""The two e-mail flows: confirm an address, and reset a password.

A link carries a random token. The database keeps only its SHA-256 hash, a link works once, and it expires.
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.core.emailconfig import app_url
from app.models.emailtoken import EmailToken
from app.models.user import User
from app.services.mailer import send_email

VERIFY_HOURS = 24
RESET_HOURS = 1


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _issue(db: Session, user: User, purpose: str, hours: int) -> str:
    """Create a token, and cancel older unused ones of the same kind, so only the newest link works."""
    now = datetime.utcnow()
    for old in db.query(EmailToken).filter(
        EmailToken.user_id == user.id, EmailToken.purpose == purpose, EmailToken.used_at.is_(None)
    ):
        old.used_at = now
    token = secrets.token_urlsafe(32)
    db.add(EmailToken(user_id=user.id, purpose=purpose, token_hash=_hash(token), expires_at=now + timedelta(hours=hours)))
    db.flush()
    return token


def consume(db: Session, token: str, purpose: str) -> Optional[User]:
    """The user the token belongs to, and the token is used up. None if it is unknown, used or expired."""
    row = (
        db.query(EmailToken)
        .filter(EmailToken.token_hash == _hash(token or ""), EmailToken.purpose == purpose)
        .with_for_update()
        .first()
    )
    now = datetime.utcnow()
    if row is None or row.used_at is not None or row.expires_at < now:
        return None
    row.used_at = now
    return db.get(User, row.user_id)


def send_verification(db: Session, user: User, background: BackgroundTasks) -> None:
    token = _issue(db, user, "verify", VERIFY_HOURS)
    link = f"{app_url()}/verify-email?token={token}"
    background.add_task(
        send_email,
        user.email,
        "Confirm your e-mail for PinPoint",
        "Welcome to PinPoint!\n\n"
        f"Confirm your e-mail address by opening this link (valid for {VERIFY_HOURS} hours):\n{link}\n\n"
        "If you did not create an account, you can ignore this message.\n",
    )


def send_password_reset(db: Session, user: User, background: BackgroundTasks) -> None:
    token = _issue(db, user, "reset", RESET_HOURS)
    link = f"{app_url()}/reset-password?token={token}"
    background.add_task(
        send_email,
        user.email,
        "Reset your PinPoint password",
        "Someone asked to reset the password of this PinPoint account.\n\n"
        f"Choose a new password here (the link works once and expires in {RESET_HOURS} hour):\n{link}\n\n"
        "If this was not you, ignore this message: your password has not been changed.\n",
    )

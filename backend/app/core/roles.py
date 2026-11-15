import os


def moderator_emails() -> set[str]:
    """Emails listed in MODERATOR_EMAILS (comma-separated). Read on every call so it is easy to test."""
    raw = os.getenv("MODERATOR_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def is_moderator(email: str) -> bool:
    return email.strip().lower() in moderator_emails()


def has_moderator_role(user) -> bool:
    """A moderator needs the listed address AND, when verification is required, a confirmed e-mail."""
    from app.core.emailconfig import verification_required

    if not is_moderator(user.email):
        return False
    return not verification_required() or user.email_verified_at is not None

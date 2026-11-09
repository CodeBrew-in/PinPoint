import os


def moderator_emails() -> set[str]:
    """Emails listed in MODERATOR_EMAILS (comma-separated). Read on every call so it is easy to test."""
    raw = os.getenv("MODERATOR_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def is_moderator(email: str) -> bool:
    return email.strip().lower() in moderator_emails()

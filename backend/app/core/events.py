"""Security events (logins, signups, moderation, deletions) go to one logger, so they can be collected and searched.

E-mail addresses are masked: the log shows the first letter and the domain only.
"""
import logging

security_log = logging.getLogger("pinpoint.security")


def mask_email(email: str) -> str:
    local, _, domain = (email or "").partition("@")
    return f"{local[:1]}***@{domain}" if domain else "***"


def log_event(event: str, **fields) -> None:
    details = " ".join(f"{key}={value}" for key, value in fields.items())
    security_log.info("%s %s", event, details)

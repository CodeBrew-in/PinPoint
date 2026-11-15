"""E-mail settings, all from environment variables.

EMAIL_PROVIDER      gmail_api | smtp | (empty = no e-mail is sent; the message is written to the log instead)
EMAIL_FROM          the sender shown to people (default: the Gmail or SMTP account)
APP_URL             the public address of the site, used in the links, e.g. https://pinpoint.onrender.com
EMAIL_VERIFICATION  "required" = an account must confirm its e-mail before adding content; "off" (default) = no check

Gmail API (works on hosts that block SMTP ports, such as Render's free tier; see docs/EMAIL_SETUP.md):
GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER (the mailbox that sends)

SMTP (a laptop or a host that allows it):
SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASSWORD, SMTP_SECURITY (starttls | ssl | none)
"""
import os


def _get(name: str) -> str:
    return os.getenv(name, "").strip()


def provider() -> str:
    """The e-mail provider that is fully set up, or "" if none is."""
    wanted = _get("EMAIL_PROVIDER").lower()
    if wanted == "gmail_api" and all(_get(k) for k in ("GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "GMAIL_SENDER")):
        return "gmail_api"
    if wanted == "smtp" and _get("SMTP_HOST"):
        return "smtp"
    return ""


def email_configured() -> bool:
    return provider() != ""


def sender_address() -> str:
    return _get("EMAIL_FROM") or _get("GMAIL_SENDER") or _get("SMTP_USER")


def verification_required() -> bool:
    return _get("EMAIL_VERIFICATION").lower() == "required"


def app_url() -> str:
    return (_get("APP_URL") or "http://localhost:5174").rstrip("/")


def check_email_config() -> None:
    """Called at startup: a server that demands verified e-mails but cannot send e-mail would lock everyone out."""
    if verification_required() and not email_configured():
        raise RuntimeError(
            "EMAIL_VERIFICATION=required needs a working e-mail provider: set EMAIL_PROVIDER=gmail_api with the "
            "GMAIL_* settings, or EMAIL_PROVIDER=smtp with SMTP_HOST. See docs/EMAIL_SETUP.md."
        )

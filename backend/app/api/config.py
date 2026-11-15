from fastapi import APIRouter

from app.core.emailconfig import verification_required
from app.core.settings import signups_open

router = APIRouter(tags=["config"])


@router.get("/config")
def public_config():
    """Settings the website needs before anyone signs in (for example, whether signup is open)."""
    return {"signups_open": signups_open(), "email_verification": verification_required()}

from fastapi import APIRouter

from app.core.settings import signups_open

router = APIRouter(tags=["config"])


@router.get("/config")
def public_config():
    """Settings the website needs before anyone signs in (for example, whether signup is open)."""
    return {"signups_open": signups_open()}

from datetime import datetime, timezone
from typing import Annotated

from pydantic import PlainSerializer


def _as_utc_text(value: datetime) -> str:
    """ISO 8601 in UTC with a trailing Z, as the contract says (the database stores naive UTC)."""
    if value.tzinfo is not None:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)
    return value.isoformat(timespec="seconds") + "Z"


UTCDateTime = Annotated[datetime, PlainSerializer(_as_utc_text, return_type=str)]

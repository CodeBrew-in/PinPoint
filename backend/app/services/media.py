"""Photo storage on local disk. Swap this module for S3 later; the API does not change."""
import os
from pathlib import Path
from typing import Optional

MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB, as in the contract

# content type -> (file extension, check on the first bytes of the file)
ALLOWED = {
    "image/jpeg": ("jpg", lambda b: b[:3] == b"\xff\xd8\xff"),
    "image/png": ("png", lambda b: b[:8] == b"\x89PNG\r\n\x1a\n"),
    "image/webp": ("webp", lambda b: b[:4] == b"RIFF" and b[8:12] == b"WEBP"),
}


def media_root() -> Path:
    return Path(os.getenv("MEDIA_DIR", "media"))


def photos_dir() -> Path:
    path = media_root() / "photos"
    path.mkdir(parents=True, exist_ok=True)
    return path


def extension_for(content_type: Optional[str], data: bytes) -> Optional[str]:
    """The file extension if the type is allowed and the bytes really look like that type, else None.

    Checking the first bytes stops someone from uploading a script and just calling it image/png.
    """
    rule = ALLOWED.get((content_type or "").split(";")[0].strip().lower())
    if rule is None:
        return None
    extension, looks_right = rule
    return extension if looks_right(data) else None


def save_photo(filename: str, data: bytes) -> None:
    (photos_dir() / filename).write_bytes(data)


def delete_photo(filename: Optional[str]) -> None:
    if not filename:
        return
    try:
        (photos_dir() / filename).unlink(missing_ok=True)
    except OSError:
        pass  # a leftover file is better than failing a moderator's action

"""Photo storage and the signed links that serve photos.

Two storage places, chosen with MEDIA_BACKEND:
  local (default)  files in MEDIA_DIR: for a laptop
  db               the bytes live in the photos table: for hosts without a persistent disk (Render free)

Photos are never served from a public folder. The API gives every photo a link signed with SECRET_KEY that
expires, and only people who may see the place receive it, so a private photo cannot be fetched by guessing.
"""
import hashlib
import hmac
import io
import os
import time
from pathlib import Path
from typing import Optional

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB, as in the contract
# Whole request limit: one photo plus room for the multipart wrapping
MAX_REQUEST_BYTES = MAX_PHOTO_BYTES + 512 * 1024
# Stored photos are shrunk so that many fit in a small database
MAX_SIDE = 1600
# How long a photo link stays valid (it is renewed each time the place is loaded)
LINK_WINDOW_SECONDS = 6 * 3600
# Refuse images that would unpack into a huge bitmap ("decompression bombs")
MAX_PIXELS = 24_000_000  # a free host has little memory; 24 MP is more than a phone photo needs
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

# content type -> (file extension, check on the first bytes of the file, Pillow format name)
ALLOWED = {
    "image/jpeg": ("jpg", lambda b: b[:3] == b"\xff\xd8\xff", "JPEG"),
    "image/png": ("png", lambda b: b[:8] == b"\x89PNG\r\n\x1a\n", "PNG"),
    "image/webp": ("webp", lambda b: b[:4] == b"RIFF" and b[8:12] == b"WEBP", "WEBP"),
}


class ImageRejected(ValueError):
    """The bytes are not a usable image of the declared type."""


def media_backend() -> str:
    return "db" if os.getenv("MEDIA_BACKEND", "local").strip().lower() == "db" else "local"


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
    extension, looks_right, _ = rule
    return extension if looks_right(data) else None


def clean_image(extension: str, data: bytes) -> bytes:
    """Re-save the image without its metadata.

    Phone photos carry EXIF data: GPS position, time and camera. On a public map that can show where the
    uploader lives, so it is removed. The picture is first turned upright, because the rotation is stored
    in the same metadata.
    """
    pillow_format = next(fmt for ext, _, fmt in ALLOWED.values() if ext == extension)
    try:
        with Image.open(io.BytesIO(data)) as original:
            if original.format != pillow_format:
                raise ImageRejected("The file is not the image type it claims to be")
            if original.width * original.height > MAX_PIXELS:
                raise ImageRejected("The image is too large")
            image = ImageOps.exif_transpose(original)
            image.load()
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError) as error:
        raise ImageRejected("The file could not be read as an image") from error

    image.thumbnail((MAX_SIDE, MAX_SIDE))  # shrink big photos; small ones stay as they are
    if pillow_format == "JPEG" and image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    image.info = {}  # drop text chunks, ICC and other metadata Pillow would otherwise copy

    out = io.BytesIO()
    options = {"JPEG": {"quality": 90, "optimize": True}, "PNG": {"optimize": True}, "WEBP": {"quality": 90}}
    image.save(out, format=pillow_format, **options[pillow_format])
    return out.getvalue()


def save_photo(filename: str, data: bytes) -> None:
    (photos_dir() / filename).write_bytes(data)


def delete_photo(filename: Optional[str]) -> None:
    if not filename:
        return
    try:
        (photos_dir() / filename).unlink(missing_ok=True)
    except OSError:
        pass  # a leftover file is better than failing a moderator's action


# ---------- signed links ----------

def _secret() -> bytes:
    from app.core.security import SECRET_KEY  # the same key that signs login tokens

    return SECRET_KEY.encode("utf-8")


def _signature(photo_id: int, expires: int) -> str:
    return hmac.new(_secret(), f"photo:{photo_id}:{expires}".encode("utf-8"), hashlib.sha256).hexdigest()


def signed_photo_url(photo_id: int, now: Optional[float] = None) -> str:
    """A relative link to the photo that works for 6 to 12 hours.

    The expiry is rounded to a fixed window, so the same photo gets the same link for hours and the browser can cache it.
    """
    now = time.time() if now is None else now
    expires = (int(now // LINK_WINDOW_SECONDS) + 2) * LINK_WINDOW_SECONDS
    return f"/api/v1/media/photos/{photo_id}?exp={expires}&sig={_signature(photo_id, expires)}"


def link_is_valid(photo_id: int, expires: int, signature: str, now: Optional[float] = None) -> bool:
    now = time.time() if now is None else now
    return expires > now and hmac.compare_digest(_signature(photo_id, expires), signature or "")

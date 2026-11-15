"""Photo storage on local disk. Swap this module for S3 later; the API does not change."""
import io
import os
from pathlib import Path
from typing import Optional

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB, as in the contract
# Whole request limit: one photo plus room for the multipart wrapping
MAX_REQUEST_BYTES = MAX_PHOTO_BYTES + 512 * 1024
# Refuse images that would unpack into a huge bitmap ("decompression bombs"): 40 megapixels is plenty for a phone photo
MAX_PIXELS = 40_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

# content type -> (file extension, check on the first bytes of the file, Pillow format name)
ALLOWED = {
    "image/jpeg": ("jpg", lambda b: b[:3] == b"\xff\xd8\xff", "JPEG"),
    "image/png": ("png", lambda b: b[:8] == b"\x89PNG\r\n\x1a\n", "PNG"),
    "image/webp": ("webp", lambda b: b[:4] == b"RIFF" and b[8:12] == b"WEBP", "WEBP"),
}


class ImageRejected(ValueError):
    """The bytes are not a usable image of the declared type."""


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

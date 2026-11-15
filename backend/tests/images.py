"""Small real images for upload tests (uploads are decoded and re-saved, so fake bytes are rejected)."""
import io

from PIL import Image


def make_image(fmt: str, size=(8, 8), exif: bytes | None = None) -> bytes:
    out = io.BytesIO()
    options = {"exif": exif} if exif else {}
    Image.new("RGB", size, (200, 80, 40)).save(out, format=fmt, **options)
    return out.getvalue()


PNG = make_image("PNG")
JPEG = make_image("JPEG")
WEBP = make_image("WEBP")

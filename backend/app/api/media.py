from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, undefer

from app.db.database import get_db
from app.models.location import Photo
from app.services.media import link_is_valid, photos_dir

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/photos/{photo_id}")
def get_photo(
    photo_id: int,
    exp: int = Query(...),
    sig: str = Query(...),
    db: Session = Depends(get_db),
):
    """Serves a photo to anyone holding a valid signed link. The API only hands such a link to people who may see
    the place, so there is no login here: an <img> tag cannot send one."""
    if not link_is_valid(photo_id, exp, sig):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This photo link is invalid or has expired")

    photo = db.query(Photo).options(undefer(Photo.data)).filter(Photo.id == photo_id).first()
    if photo is None or not photo.stored:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    content = photo.data
    if content is None and photo.filename:
        path = photos_dir() / photo.filename
        if not path.is_file():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
        content = path.read_bytes()

    return Response(
        content=content,
        media_type=photo.content_type or "application/octet-stream",
        headers={
            "Cache-Control": "private, max-age=21600",
            "Content-Security-Policy": "default-src 'none'; sandbox",
            "Content-Disposition": "inline",
        },
    )

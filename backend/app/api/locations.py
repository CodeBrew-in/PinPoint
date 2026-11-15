import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import current_user, optional_user
from app.core.ratelimit import hit
from app.core.roles import is_moderator
from app.db.database import get_db
from app.models.location import Location, LocationNote, Photo, Report
from app.models.map import Map, MapShare
from app.models.user import User
from app.schemas.location import (
    LocationCreate,
    LocationPinList,
    LocationRead,
    NoteCreate,
    PhotoRead,
    ReportCreate,
    ReportRead,
)
from app.services.access import can_view_location, can_view_map
from app.services.media import MAX_PHOTO_BYTES, ImageRejected, clean_image, delete_photo, extension_for, save_photo
from app.services.removal import audit, delete_files, remove_location
from app.services.serializers import location_out, pin_out, report_out

router = APIRouter(prefix="/locations", tags=["locations"])

MAX_PINS = 500
MAX_PHOTOS_PER_PLACE = 10

# Per-user limits for actions that create content (count, per number of seconds)
HOURLY = 3600
LIMITS = {"place": (60, HOURLY), "photo": (60, HOURLY), "note": (30, HOURLY), "report": (20, HOURLY)}


def _limit(kind: str, user: User) -> None:
    count, window = LIMITS[kind]
    hit(f"{kind}:user:{user.id}", limit=count, window_seconds=window)


def _visible_location(db: Session, location_id: int, user: Optional[User]) -> Location:
    """The place, or 404. A private place you may not see is reported as missing."""
    location = db.query(Location).filter(Location.id == location_id).first()
    if location is None or not can_view_location(location, user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return location


def _can_manage(location: Location, user: User) -> bool:
    """The place's author, the owner of the map it is on, or a moderator may remove it and its photos and notes."""
    if location.owner_id == user.id:
        return True
    if location.map is not None and location.map.owner_id == user.id:
        return True
    return is_moderator(user.email)


def _touch(location: Location) -> None:
    """Mark the place, and its map, as changed (maps are listed by last update)."""
    now = datetime.utcnow()
    location.updated_at = now
    if location.map is not None:
        location.map.updated_at = now


def _parse_bbox(bbox: str) -> tuple[float, float, float, float]:
    try:
        west, south, east, north = (float(part) for part in bbox.split(","))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="bbox must be four numbers: west,south,east,north",
        )
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="bbox is out of range or west/south is not smaller than east/north",
        )
    return west, south, east, north


@router.get("", response_model=LocationPinList)
def list_locations(
    bbox: str = Query(..., description="west,south,east,north"),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(optional_user),
):
    west, south, east, north = _parse_bbox(bbox)

    query = db.query(Location).filter(
        Location.lng >= west, Location.lng <= east, Location.lat >= south, Location.lat <= north
    )

    # Guests see public places. Signed-in users also see their own, and those in maps they own or are shared on.
    visible = [Location.visibility == "public"]
    if user is not None:
        shared_map_ids = db.query(MapShare.map_id).filter(MapShare.email == user.email.strip().lower())
        owned_map_ids = db.query(Map.id).filter(Map.owner_id == user.id)
        visible += [
            Location.owner_id == user.id,
            Location.map_id.in_(shared_map_ids),
            Location.map_id.in_(owned_map_ids),
        ]
    query = query.filter(or_(*visible))

    places = query.order_by(Location.created_at.desc(), Location.id.desc()).limit(MAX_PINS).all()
    return LocationPinList(items=[pin_out(p) for p in places])


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def create_location(body: LocationCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    _limit("place", user)
    map_ = None
    if body.map_id is not None:
        map_ = db.query(Map).filter(Map.id == body.map_id).first()
        if map_ is None or not can_view_map(map_, user):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map not found")
        visibility = map_.visibility  # a place always takes its map's visibility
    else:
        visibility = body.visibility

    location = Location(
        map_id=map_.id if map_ else None,
        owner_id=user.id,
        name=body.name,
        description=body.description,
        lat=body.lat,
        lng=body.lng,
        visibility=visibility,
        tags=body.tags,
    )
    db.add(location)
    if map_ is not None:
        map_.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(location)
    return location_out(location)


@router.get("/{location_id}", response_model=LocationRead)
def get_location(location_id: int, db: Session = Depends(get_db), user: Optional[User] = Depends(optional_user)):
    return location_out(_visible_location(db, location_id, user))


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(location_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    location = _visible_location(db, location_id, user)
    if not _can_manage(location, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the author, the map owner or a moderator can do this")
    audit(db, user, "place_deleted", "place", location.id, f"{location.name} (author {location.owner_id})")
    files = remove_location(db, location, user)
    db.commit()
    delete_files(files)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# A plain "def" (not async): reading the file and re-saving the image is blocking work,
# so FastAPI runs it in a worker thread instead of on the event loop.
@router.post("/{location_id}/photos", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
def upload_photo(
    location_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    location = _visible_location(db, location_id, user)
    _limit("photo", user)
    if len([p for p in location.photos if p.filename]) >= MAX_PHOTOS_PER_PLACE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"A place can have at most {MAX_PHOTOS_PER_PLACE} photos",
        )

    # Read one byte past the limit, so a file that is too big is noticed without loading all of it.
    data = file.file.read(MAX_PHOTO_BYTES + 1)
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Photo is larger than 5 MB")
    extension = extension_for(file.content_type, data)
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only JPEG, PNG or WebP photos are allowed"
        )
    try:
        data = clean_image(extension, data)  # removes GPS position, time and camera details
    except ImageRejected as error:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(error))

    photo = Photo(location_id=location.id, uploaded_by_id=user.id)
    db.add(photo)
    db.flush()  # gives the photo its id
    # An unguessable name: /media is served without a login, so the name is what keeps private photos private
    filename = f"{secrets.token_urlsafe(16)}.{extension}"
    try:
        save_photo(filename, data)
    except OSError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not store the photo")
    photo.filename = filename
    _touch(location)
    try:
        db.commit()
    except Exception:
        delete_photo(filename)  # do not leave a file behind that no row points to
        raise
    return PhotoRead(id=photo.id, url=photo.url)


@router.delete("/{location_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location_photo(
    location_id: int, photo_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    location = _visible_location(db, location_id, user)
    photo = next((p for p in location.photos if p.id == photo_id), None)
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    if photo.uploaded_by_id != user.id and not _can_manage(location, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the uploader, the place's author, the map owner or a moderator can do this")
    audit(db, user, "photo_deleted", "photo", photo.id, f"from place {location.id}")
    filename = photo.filename
    location.photos.remove(photo)
    _touch(location)
    db.commit()
    delete_photo(filename)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{location_id}/notes", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def add_note(
    location_id: int, body: NoteCreate, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    location = _visible_location(db, location_id, user)
    _limit("note", user)
    location.notes.append(LocationNote(user_id=user.id, text=body.text))
    _touch(location)
    db.commit()
    db.refresh(location)
    return location_out(location)


@router.delete("/{location_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(location_id: int, note_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    location = _visible_location(db, location_id, user)
    note = next((n for n in location.notes if n.id == note_id), None)
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note.user_id != user.id and not _can_manage(location, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the note's author, the place's author, the map owner or a moderator can do this")
    audit(db, user, "note_deleted", "note", note.id, f"from place {location.id}")
    location.notes.remove(note)
    _touch(location)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{location_id}/verify", response_model=LocationRead)
def verify_location(location_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    location = _visible_location(db, location_id, user)
    if location.owner_id == user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot verify a place you added")
    if location.verified_by_id != user.id:  # verifying again changes nothing
        location.verified_at = datetime.utcnow()
        location.verified_by_id = user.id
        _touch(location)
        db.commit()
        db.refresh(location)
    return location_out(location)


@router.post("/{location_id}/reports", response_model=ReportRead, status_code=status.HTTP_201_CREATED)
def report_location(
    location_id: int, body: ReportCreate, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    location = _visible_location(db, location_id, user)
    _limit("report", user)
    already = (
        db.query(Report)
        .filter(Report.location_id == location.id, Report.reporter_id == user.id, Report.status == "open")
        .first()
    )
    if already is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already reported this place")
    report = Report(
        location_id=location.id,
        place_name=location.name,
        map_title=location.map.title if location.map else None,
        kind=body.kind,
        note=body.note,
        reporter_id=user.id,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report_out(report)

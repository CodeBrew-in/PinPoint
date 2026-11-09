from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import current_user, optional_user
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
from app.services.media import MAX_PHOTO_BYTES, delete_photo, extension_for, save_photo
from app.services.serializers import location_out, pin_out, report_out

router = APIRouter(prefix="/locations", tags=["locations"])

MAX_PINS = 500


def _visible_location(db: Session, location_id: int, user: Optional[User]) -> Location:
    """The place, or 404. A private place you may not see is reported as missing."""
    location = db.query(Location).filter(Location.id == location_id).first()
    if location is None or not can_view_location(location, user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return location


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


@router.post("/{location_id}/photos", response_model=PhotoRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    location_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    location = _visible_location(db, location_id, user)

    # Read one byte past the limit, so a file that is too big is noticed without loading all of it.
    data = await file.read(MAX_PHOTO_BYTES + 1)
    if len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Photo is larger than 5 MB")
    extension = extension_for(file.content_type, data)
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only JPEG, PNG or WebP photos are allowed"
        )

    photo = Photo(location_id=location.id, uploaded_by_id=user.id)
    db.add(photo)
    db.flush()  # gives the photo its id, which becomes the file name
    filename = f"{photo.id}.{extension}"
    try:
        save_photo(filename, data)
    except OSError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not store the photo")
    photo.filename = filename
    _touch(location)
    db.commit()
    return PhotoRead(id=photo.id, url=photo.url)


@router.post("/{location_id}/notes", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def add_note(
    location_id: int, body: NoteCreate, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    location = _visible_location(db, location_id, user)
    location.notes.append(LocationNote(user_id=user.id, text=body.text))
    _touch(location)
    db.commit()
    db.refresh(location)
    return location_out(location)


@router.post("/{location_id}/verify", response_model=LocationRead)
def verify_location(location_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    location = _visible_location(db, location_id, user)
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


def remove_location_files(location: Location) -> list[str]:
    """File names of a place's photos, collected before the place is deleted."""
    return [p.filename for p in location.photos if p.filename]


def delete_files(filenames: list[str]) -> None:
    for name in filenames:
        delete_photo(name)

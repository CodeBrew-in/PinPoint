"""Turn database rows into the response shapes from docs/api-contract.md."""
from typing import Optional

from app.models.location import Location, Report
from app.models.map import Map
from app.models.user import User
from app.schemas.location import LocationPin, LocationRead, NoteRead, PhotoRead, ReportRead
from app.schemas.map import MapPin, MapRead
from app.schemas.user import username_of

MAX_PINS = 12


def map_out(map_: Map, viewer: Optional[User]) -> MapRead:
    places = map_.locations
    contributors = {map_.owner_id} | {p.owner_id for p in places}
    is_owner = viewer is not None and viewer.id == map_.owner_id
    return MapRead(
        id=map_.id,
        title=map_.title,
        description=map_.description,
        category=map_.category,
        visibility=map_.visibility,
        owner_id=map_.owner_id,
        owner_username=username_of(map_.owner),
        owner_name=map_.owner.name or username_of(map_.owner),
        place_count=len(places),
        contributor_count=len(contributors),
        pins=[MapPin(lat=p.lat, lng=p.lng, name=p.name) for p in places[:MAX_PINS]],
        shared_with=sorted(s.email for s in map_.shares) if is_owner else [],
        created_at=map_.created_at,
        updated_at=map_.updated_at,
    )


def location_out(location: Location) -> LocationRead:
    return LocationRead(
        id=location.id,
        map_id=location.map_id,
        name=location.name,
        description=location.description,
        lat=location.lat,
        lng=location.lng,
        visibility=location.visibility,
        tags=list(location.tags or []),
        photos=[PhotoRead(id=p.id, url=p.url) for p in location.photos if p.filename],
        notes=[
            NoteRead(id=n.id, username=username_of(n.user), text=n.text, created_at=n.created_at)
            for n in location.notes
        ],
        owner_id=location.owner_id,
        owner_username=username_of(location.owner),
        verified_at=location.verified_at,
        verified_by=username_of(location.verified_by) if location.verified_by else None,
        created_at=location.created_at,
    )


def pin_out(location: Location) -> LocationPin:
    return LocationPin(
        id=location.id,
        name=location.name,
        lat=location.lat,
        lng=location.lng,
        visibility=location.visibility,
        tags=list(location.tags or []),
    )


def report_out(report: Report) -> ReportRead:
    return ReportRead(
        id=report.id,
        location_id=report.location_id,
        place_name=report.place_name,
        map_title=report.map_title,
        kind=report.kind,
        note=report.note,
        reporter_username=username_of(report.reporter),
        status=report.status,
        created_at=report.created_at,
    )

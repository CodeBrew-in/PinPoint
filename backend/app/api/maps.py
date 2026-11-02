from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api.deps import current_user, optional_user
from app.db.database import get_db
from app.models.map import Map, MapShare
from app.models.user import User
from app.schemas.location import LocationList
from app.schemas.map import MapCreate, MapList, MapRead, ShareCreate
from app.services.access import can_view_map
from app.services.serializers import location_out, map_out

router = APIRouter(prefix="/maps", tags=["maps"])


def _visible_map(db: Session, map_id: int, user: Optional[User]) -> Map:
    """The map, or 404. A private map you may not see is reported as missing, so its existence is not revealed."""
    map_ = db.query(Map).filter(Map.id == map_id).first()
    if map_ is None or not can_view_map(map_, user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map not found")
    return map_


def _owned_map(db: Session, map_id: int, user: User) -> Map:
    map_ = _visible_map(db, map_id, user)
    if map_.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can do this")
    return map_


@router.get("", response_model=MapList)
def list_maps(
    scope: Literal["public", "mine", "shared"] = "public",
    q: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(optional_user),
):
    if scope in ("mine", "shared") and user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    query = db.query(Map)
    if scope == "public":
        query = query.filter(Map.visibility == "public")
    elif scope == "mine":
        query = query.filter(Map.owner_id == user.id)
    else:
        shared_ids = db.query(MapShare.map_id).filter(MapShare.email == user.email.strip().lower())
        query = query.filter(Map.visibility == "private", Map.owner_id != user.id, Map.id.in_(shared_ids))

    if category and category.strip():
        query = query.filter(func.lower(Map.category) == category.strip().lower())
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(or_(Map.title.ilike(like), Map.description.ilike(like), Map.category.ilike(like)))

    maps = query.order_by(Map.updated_at.desc(), Map.id.desc()).all()
    return MapList(items=[map_out(m, user) for m in maps])


@router.post("", response_model=MapRead, status_code=status.HTTP_201_CREATED)
def create_map(body: MapCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    map_ = Map(
        owner_id=user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        visibility=body.visibility,
    )
    db.add(map_)
    db.commit()
    db.refresh(map_)
    return map_out(map_, user)


@router.get("/{map_id}", response_model=MapRead)
def get_map(map_id: int, db: Session = Depends(get_db), user: Optional[User] = Depends(optional_user)):
    return map_out(_visible_map(db, map_id, user), user)


@router.get("/{map_id}/locations", response_model=LocationList)
def list_map_locations(map_id: int, db: Session = Depends(get_db), user: Optional[User] = Depends(optional_user)):
    map_ = _visible_map(db, map_id, user)
    return LocationList(items=[location_out(p) for p in map_.locations])


@router.post("/{map_id}/shares", response_model=MapRead)
def share_map(map_id: int, body: ShareCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    map_ = _owned_map(db, map_id, user)
    if map_.visibility != "private":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Public maps do not need sharing")

    email = body.email.strip().lower()
    if email == user.email.strip().lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already own this map")
    if any(s.email == email for s in map_.shares):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already has access")

    map_.shares.append(MapShare(email=email))
    map_.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(map_)
    return map_out(map_, user)


@router.delete("/{map_id}/shares/{email}", response_model=MapRead)
def unshare_map(map_id: int, email: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    map_ = _owned_map(db, map_id, user)
    wanted = email.strip().lower()
    for share in list(map_.shares):
        if share.email == wanted:
            map_.shares.remove(share)
    map_.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(map_)
    return map_out(map_, user)

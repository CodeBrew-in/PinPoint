"""Who may see what. Every route uses these, so the visibility rule lives in one place.

A private map, and every place in it, is invisible (404) to everyone except the owner and the
emails it is shared with. A flat place (no map) follows its own visibility.
"""
from typing import Optional

from app.models.location import Location
from app.models.map import Map
from app.models.user import User


def can_view_map(map_: Map, user: Optional[User]) -> bool:
    if map_.visibility == "public":
        return True
    if user is None:
        return False
    if map_.owner_id == user.id:
        return True
    email = user.email.strip().lower()
    return any(share.email == email for share in map_.shares)


def can_view_location(location: Location, user: Optional[User]) -> bool:
    if location.map is not None:
        return can_view_map(location.map, user)
    if location.visibility == "public":
        return True
    return user is not None and location.owner_id == user.id

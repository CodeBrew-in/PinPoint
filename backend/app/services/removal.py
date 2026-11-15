"""Deleting places and maps, and recording who did it.

Everything that removes content goes through here, so each path closes the open reports about it,
deletes the photo files, and leaves an audit record.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.core.events import log_event
from app.models.audit import AuditEvent
from app.models.location import Location, Report
from app.models.map import Map
from app.models.user import User
from app.services.media import delete_photo


def audit(db: Session, actor: Optional[User], action: str, target_type: str, target_id: Optional[int], detail: str = "") -> None:
    db.add(
        AuditEvent(
            actor_id=actor.id if actor else None,
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=detail[:300],
        )
    )
    log_event(action, actor_id=actor.id if actor else None, target=f"{target_type}:{target_id}")


def remove_location(db: Session, location: Location, actor: Optional[User], now: Optional[datetime] = None) -> list[str]:
    """Delete a place. Closes its open reports, detaches the others, and returns the photo files to delete after commit."""
    now = now or datetime.utcnow()
    for report in db.query(Report).filter(Report.location_id == location.id).all():
        if report.status == "open":
            report.status = "removed"
            report.resolved_by_id = actor.id if actor else None
            report.resolved_at = now
        report.location_id = None
    files = [p.filename for p in location.photos if p.filename]
    if location.map is not None:
        location.map.updated_at = now
    db.delete(location)
    return files


def remove_map(db: Session, map_: Map, actor: Optional[User]) -> list[str]:
    """Delete a map and every place in it. Returns the photo files to delete after commit."""
    now = datetime.utcnow()
    files: list[str] = []
    for location in list(map_.locations):
        files += remove_location(db, location, actor, now)
    db.delete(map_)
    return files


def delete_files(filenames: list[str]) -> None:
    """Call after the database commit, so a failed commit never leaves a place without its photos."""
    for name in filenames:
        delete_photo(name)

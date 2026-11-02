from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class Location(Base):
    __tablename__ = "locations"
    __table_args__ = (Index("ix_locations_lat_lng", "lat", "lng"),)

    id = Column(Integer, primary_key=True, index=True)
    # Optional, so version 1 style flat places (no map) still work.
    map_id = Column(Integer, ForeignKey("maps.id", ondelete="CASCADE"), nullable=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    description = Column(String(2000), nullable=False, default="")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    visibility = Column(String(10), nullable=False, default="public", index=True)
    tags = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    map = relationship("Map", back_populates="locations")
    owner = relationship("User", foreign_keys=[owner_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    photos = relationship("Photo", back_populates="location", cascade="all, delete-orphan", order_by="Photo.id")
    notes = relationship("LocationNote", back_populates="location", cascade="all, delete-orphan", order_by="LocationNote.id")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(64), nullable=True)  # set right after the file is written
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    location = relationship("Location", back_populates="photos")

    @property
    def url(self) -> str:
        return f"/media/photos/{self.filename}"


class LocationNote(Base):
    """Extra information added by someone who found out a new submission is an existing place."""

    __tablename__ = "location_notes"

    id = Column(Integer, primary_key=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    location = relationship("Location", back_populates="notes")
    user = relationship("User")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    # Becomes NULL when the place is removed; the names below keep the report readable.
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True)
    place_name = Column(String(120), nullable=False)
    map_title = Column(String(72), nullable=True)
    kind = Column(String(30), nullable=False)
    note = Column(String(500), nullable=False, default="")
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(12), nullable=False, default="open", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id])

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class Map(Base):
    """A named collection of places: public, or private to the owner and the emails it is shared with."""

    __tablename__ = "maps"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(72), nullable=False)
    description = Column(String(500), nullable=False, default="")
    category = Column(String(40), nullable=False, default="Other")
    visibility = Column(String(10), nullable=False, default="public", index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User")
    shares = relationship("MapShare", back_populates="map", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="map", order_by="Location.id")


class MapShare(Base):
    """One email that may see a private map."""

    __tablename__ = "map_shares"
    __table_args__ = (UniqueConstraint("map_id", "email", name="uq_map_shares_map_email"),)

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(254), nullable=False, index=True)  # stored lowercase

    map = relationship("Map", back_populates="shares")

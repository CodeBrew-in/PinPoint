from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    # Added in contract v2. Older rows have no username: the API falls back to the email name.
    username = Column(String(30), nullable=True, index=True)
    name = Column(String(60), nullable=True)
    bio = Column(String(180), nullable=False, default="", server_default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

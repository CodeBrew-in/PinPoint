import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.roles import is_moderator
from app.schemas.common import UTCDateTime

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,30}$")


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    username: Optional[str] = None

    @field_validator("username")
    @classmethod
    def check_username(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            return None
        if not USERNAME_PATTERN.match(value):
            raise ValueError("Username must be 3 to 30 characters: letters, digits, _ or -")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=60)
    bio: Optional[str] = Field(default=None, max_length=180)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    name: str
    bio: str
    role: str
    created_at: UTCDateTime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def username_of(user) -> str:
    """Older accounts have no stored username: fall back to the part of the email before the @."""
    return user.username or user.email.split("@")[0]


def user_read(user) -> UserRead:
    username = username_of(user)
    return UserRead(
        id=user.id,
        email=user.email,
        username=username,
        name=user.name or username,
        bio=user.bio or "",
        role="moderator" if is_moderator(user.email) else "member",
        created_at=user.created_at,
    )

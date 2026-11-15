import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.roles import has_moderator_role
from app.schemas.common import UTCDateTime

USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,30}$")


def _lower_email(value: str) -> str:
    """Emails are compared in lower case everywhere (roles, shares), so they are stored in lower case."""
    return value.strip().lower()


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    username: Optional[str] = None

    _lower_email = field_validator("email")(_lower_email)

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

    _lower_email = field_validator("email")(_lower_email)


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
    email_verified: bool
    created_at: UTCDateTime


class TokenBody(BaseModel):
    token: str = Field(min_length=10, max_length=200)


class ForgotPassword(BaseModel):
    email: EmailStr

    _lower_email = field_validator("email")(_lower_email)


class ResetPassword(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class AccountDelete(BaseModel):
    """Deleting an account needs the password again, so a stolen login token alone cannot do it."""

    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def username_of(user) -> str:
    """Older accounts have no stored username. Fall back to "user<id>", never to part of the email, which would be public."""
    return user.username or f"user{user.id}"


def user_read(user) -> UserRead:
    username = username_of(user)
    return UserRead(
        id=user.id,
        email=user.email,
        username=username,
        name=user.name or username,
        bio=user.bio or "",
        role="moderator" if has_moderator_role(user) else "member",
        email_verified=user.email_verified_at is not None,
        created_at=user.created_at,
    )

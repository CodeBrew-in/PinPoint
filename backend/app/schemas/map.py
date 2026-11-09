from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import UTCDateTime

Visibility = Literal["public", "private"]


class MapCreate(BaseModel):
    title: str = Field(min_length=3, max_length=72)
    description: str = Field(default="", max_length=500)
    category: str = Field(default="Other", min_length=1, max_length=40)
    visibility: Visibility

    @field_validator("title", "category")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Cannot be empty")
        return value

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        return value.strip()


class MapPin(BaseModel):
    lat: float
    lng: float
    name: str


class MapRead(BaseModel):
    id: int
    title: str
    description: str
    category: str
    visibility: str
    owner_id: int
    owner_username: str
    owner_name: str
    place_count: int
    contributor_count: int
    pins: list[MapPin]
    shared_with: list[str]
    created_at: UTCDateTime
    updated_at: UTCDateTime


class MapList(BaseModel):
    items: list[MapRead]


class ShareCreate(BaseModel):
    email: EmailStr



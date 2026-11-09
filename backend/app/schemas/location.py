from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.common import UTCDateTime
from app.schemas.map import Visibility

ReportKind = Literal["wrong_location", "no_longer_exists", "duplicate", "spam", "other"]
ReportStatus = Literal["open", "dismissed", "removed"]


class LocationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    # Optional when map_id is given (it is copied from the map); required otherwise, as in version 1.
    visibility: Optional[Visibility] = None
    map_id: Optional[int] = None
    tags: list[str] = Field(default_factory=list, max_length=10)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be empty")
        return value

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        return value.strip()

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, value: list[str]) -> list[str]:
        cleaned: list[str] = []
        for tag in value:
            tag = tag.strip().lower()
            if not 1 <= len(tag) <= 30:
                raise ValueError("Each tag must be 1 to 30 characters")
            if tag not in cleaned:
                cleaned.append(tag)
        return cleaned

    @model_validator(mode="after")
    def need_visibility_without_map(self):
        if self.map_id is None and self.visibility is None:
            raise ValueError("visibility is required when map_id is not given")
        return self


class PhotoRead(BaseModel):
    id: int
    url: str


class NoteRead(BaseModel):
    id: int
    username: str
    text: str
    created_at: UTCDateTime


class NoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Text cannot be empty")
        return value


class LocationRead(BaseModel):
    id: int
    map_id: Optional[int]
    name: str
    description: str
    lat: float
    lng: float
    visibility: str
    tags: list[str]
    photos: list[PhotoRead]
    notes: list[NoteRead]
    owner_id: int
    owner_username: str
    verified_at: Optional[UTCDateTime]
    verified_by: Optional[str]
    created_at: UTCDateTime


class LocationList(BaseModel):
    items: list[LocationRead]


class LocationPin(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    visibility: str
    tags: list[str]


class LocationPinList(BaseModel):
    items: list[LocationPin]


class ReportCreate(BaseModel):
    kind: ReportKind
    note: str = Field(default="", max_length=500)

    @field_validator("note")
    @classmethod
    def strip_note(cls, value: str) -> str:
        return value.strip()


class ReportRead(BaseModel):
    id: int
    location_id: Optional[int]
    place_name: str
    map_title: Optional[str]
    kind: str
    note: str
    reporter_username: str
    status: str
    created_at: UTCDateTime


class ReportList(BaseModel):
    items: list[ReportRead]


class ResolveBody(BaseModel):
    action: Literal["dismiss", "remove"]

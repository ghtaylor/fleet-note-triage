from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated, Self
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    StringConstraints,
    field_validator,
    model_validator,
)

SourceText = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2_000)
]
NoteTitle = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]


class NoteCategory(StrEnum):
    MECHANICAL = "mechanical"
    ELECTRICAL = "electrical"
    SOFTWARE = "software"
    SAFETY = "safety"
    OTHER = "other"


class NotePriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def rank(self) -> int:
        return {
            NotePriority.LOW: 1,
            NotePriority.MEDIUM: 2,
            NotePriority.HIGH: 3,
            NotePriority.CRITICAL: 4,
        }[self]


class NoteStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"


class Note(BaseModel):
    id: UUID
    source_text: SourceText
    title: NoteTitle
    category: NoteCategory
    priority: NotePriority
    created_at: datetime
    resolved_at: datetime | None = None

    model_config = ConfigDict(frozen=True)

    @field_validator("created_at")
    @classmethod
    def normalize_created_at(cls, value: datetime) -> datetime:
        return _as_utc(value)

    @field_validator("resolved_at")
    @classmethod
    def normalize_resolved_at(cls, value: datetime | None) -> datetime | None:
        return _as_utc(value) if value is not None else None

    @model_validator(mode="after")
    def validate_resolution_time(self) -> Self:
        if self.resolved_at is not None and self.resolved_at < self.created_at:
            raise ValueError("resolved_at cannot be earlier than created_at")
        return self

    @property
    def status(self) -> NoteStatus:
        return NoteStatus.RESOLVED if self.resolved_at is not None else NoteStatus.OPEN

    def resolve(self, resolved_at: datetime) -> Self:
        if self.resolved_at is not None:
            return self
        return self._with_resolved_at(resolved_at)

    def reopen(self) -> Self:
        if self.resolved_at is None:
            return self
        return self._with_resolved_at(None)

    def _with_resolved_at(self, resolved_at: datetime | None) -> Self:
        return type(self)(
            id=self.id,
            source_text=self.source_text,
            title=self.title,
            category=self.category,
            priority=self.priority,
            created_at=self.created_at,
            resolved_at=resolved_at,
        )


def _as_utc(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValueError("timestamp must include a timezone")
    return timestamp.astimezone(UTC)

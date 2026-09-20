from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol
from uuid import UUID

from app.domain.extraction import ExtractionResult
from app.domain.note import (
    Note,
    NoteCategory,
    NotePriority,
    NoteStatus,
)


class NoteSortField(StrEnum):
    PRIORITY = "priority"
    CREATED_AT = "created_at"


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


@dataclass(frozen=True)
class NoteQuery:
    category: NoteCategory | None = None
    priority: NotePriority | None = None
    status: NoteStatus | None = None
    sort_by: NoteSortField = NoteSortField.PRIORITY
    direction: SortDirection = SortDirection.DESC
    limit: int = 50
    offset: int = 0

    def __post_init__(self) -> None:
        if not 1 <= self.limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        if self.offset < 0:
            raise ValueError("offset must be at least 0")


@dataclass(frozen=True)
class NotePage:
    items: tuple[Note, ...]
    total: int


class NoteExtractor(Protocol):
    def extract(self, source_text: str) -> ExtractionResult: ...


class NoteRepository(Protocol):
    def add(self, note: Note) -> None: ...

    def get(self, note_id: UUID) -> Note | None: ...

    def list_notes(self, query: NoteQuery) -> NotePage: ...

    def update_status(self, note: Note) -> bool: ...

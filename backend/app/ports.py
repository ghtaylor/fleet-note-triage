from typing import Protocol
from uuid import UUID

from app.domain.extraction import ExtractionResult
from app.domain.note import Note


class NoteExtractor(Protocol):
    def extract(self, source_text: str) -> ExtractionResult: ...


class NoteRepository(Protocol):
    def add(self, note: Note) -> None: ...

    def get(self, note_id: UUID) -> Note | None: ...

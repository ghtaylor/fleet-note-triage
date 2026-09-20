from typing import Protocol
from uuid import UUID

from app.domain.note import Note


class NoteRepository(Protocol):
    def add(self, note: Note) -> None: ...

    def get(self, note_id: UUID) -> Note | None: ...

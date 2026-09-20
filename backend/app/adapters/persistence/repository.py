from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.adapters.persistence.models import NoteRecord
from app.domain.note import Note
from app.ports import NoteRepository


class SqlAlchemyNoteRepository(NoteRepository):
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, note: Note) -> None:
        self._session.add(
            NoteRecord(
                id=str(note.id),
                source_text=note.source_text,
                title=note.title,
                category=note.category,
                priority=note.priority,
                created_at=note.created_at,
                resolved_at=note.resolved_at,
            )
        )

    def get(self, note_id: UUID) -> Note | None:
        record = self._session.get(NoteRecord, str(note_id))
        if record is None:
            return None
        return Note(
            id=UUID(record.id),
            source_text=record.source_text,
            title=record.title,
            category=record.category,
            priority=record.priority,
            created_at=_restore_utc(record.created_at),
            resolved_at=(
                _restore_utc(record.resolved_at)
                if record.resolved_at is not None
                else None
            ),
        )


def _restore_utc(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=UTC)
    return timestamp.astimezone(UTC)

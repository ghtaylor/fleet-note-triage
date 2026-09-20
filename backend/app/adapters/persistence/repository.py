from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.adapters.persistence.models import NoteRecord
from app.domain.note import Note, NotePriority, NoteStatus
from app.ports import (
    NotePage,
    NoteQuery,
    NoteRepository,
    NoteSortField,
    SortDirection,
)


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
        return _to_note(record) if record is not None else None

    def list_notes(self, query: NoteQuery) -> NotePage:
        conditions: list[ColumnElement[bool]] = []
        if query.category is not None:
            conditions.append(NoteRecord.category == query.category)
        if query.priority is not None:
            conditions.append(NoteRecord.priority == query.priority)
        if query.status is NoteStatus.OPEN:
            conditions.append(NoteRecord.resolved_at.is_(None))
        elif query.status is NoteStatus.RESOLVED:
            conditions.append(NoteRecord.resolved_at.is_not(None))

        priority_rank = case(
            *(
                (NoteRecord.priority == priority, priority.rank)
                for priority in NotePriority
            )
        )
        sort_column = (
            priority_rank
            if query.sort_by is NoteSortField.PRIORITY
            else NoteRecord.created_at
        )
        sort_order = (
            sort_column.asc()
            if query.direction is SortDirection.ASC
            else sort_column.desc()
        )
        statement = select(NoteRecord).where(*conditions).order_by(sort_order)
        if query.sort_by is NoteSortField.PRIORITY:
            statement = statement.order_by(NoteRecord.created_at.desc())
        statement = statement.order_by(NoteRecord.id.asc())
        records = self._session.scalars(
            statement.limit(query.limit).offset(query.offset)
        ).all()
        total = self._session.execute(
            select(func.count()).select_from(NoteRecord).where(*conditions)
        ).scalar_one()
        return NotePage(
            items=tuple(_to_note(record) for record in records),
            total=total,
        )

    def update_status(self, note: Note) -> None:
        record = self._session.get(NoteRecord, str(note.id))
        if record is None:
            raise LookupError(f"Note {note.id} does not exist")
        record.resolved_at = note.resolved_at


def _to_note(record: NoteRecord) -> Note:
    return Note(
        id=UUID(record.id),
        source_text=record.source_text,
        title=record.title,
        category=record.category,
        priority=record.priority,
        created_at=_restore_utc(record.created_at),
        resolved_at=(
            _restore_utc(record.resolved_at) if record.resolved_at is not None else None
        ),
    )


def _restore_utc(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=UTC)
    return timestamp.astimezone(UTC)

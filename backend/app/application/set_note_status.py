from collections.abc import Callable
from datetime import UTC, datetime
from uuid import UUID

from app.application.errors import NoteNotFound
from app.domain.note import Note, NoteStatus
from app.ports import NoteRepository


def _utc_now() -> datetime:
    return datetime.now(UTC)


def set_note_status(
    note_id: UUID,
    status: NoteStatus,
    *,
    repository: NoteRepository,
    clock: Callable[[], datetime] = _utc_now,
) -> Note:
    note = repository.get(note_id)
    if note is None:
        raise NoteNotFound(str(note_id))

    updated_note = (
        note.resolve(clock()) if status is NoteStatus.RESOLVED else note.reopen()
    )
    if updated_note is not note and not repository.update_status(updated_note):
        raise NoteNotFound(str(note_id))
    return updated_note

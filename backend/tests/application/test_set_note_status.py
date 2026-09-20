from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from app.application.errors import NoteNotFound
from app.application.set_note_status import set_note_status
from app.domain.note import Note, NoteCategory, NotePriority, NoteStatus
from test_support.fakes import FakeNoteRepository

NOTE_ID = UUID("6d6b7456-208d-4324-b120-5c2bd25d81d0")
CREATED_AT = datetime(2026, 3, 1, 9, 30, tzinfo=UTC)
RESOLVED_AT = datetime(2026, 3, 1, 10, 45, tzinfo=UTC)


def make_note(*, resolved_at: datetime | None = None) -> Note:
    return Note(
        id=NOTE_ID,
        source_text="Brake pads worn on car 12",
        title="Worn brake pads on car 12",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
        created_at=CREATED_AT,
        resolved_at=resolved_at,
    )


def test_set_note_status_resolves_an_open_note() -> None:
    repository = FakeNoteRepository(make_note())

    note = set_note_status(
        NOTE_ID,
        NoteStatus.RESOLVED,
        repository=repository,
        clock=lambda: RESOLVED_AT,
    )

    assert note.status is NoteStatus.RESOLVED
    assert note.resolved_at == RESOLVED_AT
    assert repository.updated_notes == [note]


def test_set_note_status_reopens_a_resolved_note() -> None:
    repository = FakeNoteRepository(make_note(resolved_at=RESOLVED_AT))

    note = set_note_status(NOTE_ID, NoteStatus.OPEN, repository=repository)

    assert note.status is NoteStatus.OPEN
    assert note.resolved_at is None
    assert repository.updated_notes == [note]


def test_set_note_status_rejects_a_missing_note() -> None:
    repository = FakeNoteRepository()

    with pytest.raises(NoteNotFound):
        set_note_status(uuid4(), NoteStatus.RESOLVED, repository=repository)

    assert repository.updated_notes == []

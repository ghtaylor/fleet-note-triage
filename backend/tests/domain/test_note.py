from datetime import UTC, datetime, timedelta, timezone
from uuid import UUID

import pytest
from pydantic import ValidationError

from app.domain.note import Note, NoteCategory, NotePriority, NoteStatus

NOTE_ID = UUID("6d6b7456-208d-4324-b120-5c2bd25d81d0")
CREATED_AT = datetime(2026, 3, 1, 9, 30, tzinfo=UTC)
RESOLVED_AT = datetime(2026, 3, 1, 10, 45, tzinfo=UTC)


def make_note(
    *,
    source_text: str = "Brake pads worn on car 12",
    title: str = "Worn brake pads on car 12",
    category: NoteCategory = NoteCategory.MECHANICAL,
    priority: NotePriority = NotePriority.HIGH,
    created_at: datetime = CREATED_AT,
    resolved_at: datetime | None = None,
) -> Note:
    return Note(
        id=NOTE_ID,
        source_text=source_text,
        title=title,
        category=category,
        priority=priority,
        created_at=created_at,
        resolved_at=resolved_at,
    )


def test_note_trims_bounded_text_fields() -> None:
    note = make_note(source_text="  Brake pads worn  ", title="  Worn brake pads  ")

    assert note.source_text == "Brake pads worn"
    assert note.title == "Worn brake pads"


@pytest.mark.parametrize("source_text", ["   ", "x" * 2_001])
def test_note_rejects_invalid_source_text(source_text: str) -> None:
    with pytest.raises(ValidationError):
        make_note(source_text=source_text)


@pytest.mark.parametrize("title", ["   ", "x" * 101])
def test_note_rejects_invalid_title(title: str) -> None:
    with pytest.raises(ValidationError):
        make_note(title=title)


def test_note_normalizes_timestamps_to_utc_and_derives_status() -> None:
    one_hour_ahead = timezone(timedelta(hours=1))

    note = make_note(created_at=datetime(2026, 3, 1, 10, 30, tzinfo=one_hour_ahead))

    assert note.created_at == CREATED_AT
    assert note.created_at.tzinfo is UTC
    assert note.status is NoteStatus.OPEN


def test_note_rejects_naive_timestamps() -> None:
    with pytest.raises(ValidationError, match="timestamp must include a timezone"):
        make_note(created_at=CREATED_AT.replace(tzinfo=None))


def test_note_resolves_and_reopens_without_mutating_the_original() -> None:
    note = make_note()

    resolved_note = note.resolve(RESOLVED_AT)
    reopened_note = resolved_note.reopen()

    assert note.status is NoteStatus.OPEN
    assert note.resolved_at is None
    assert resolved_note.status is NoteStatus.RESOLVED
    assert resolved_note.resolved_at == RESOLVED_AT
    assert reopened_note.status is NoteStatus.OPEN
    assert reopened_note.resolved_at is None


def test_note_state_transitions_are_idempotent() -> None:
    open_note = make_note()
    resolved_note = open_note.resolve(RESOLVED_AT)

    assert open_note.reopen() is open_note
    assert resolved_note.resolve(RESOLVED_AT + timedelta(hours=1)) is resolved_note


def test_note_rejects_resolution_before_creation() -> None:
    with pytest.raises(
        ValidationError, match="resolved_at cannot be earlier than created_at"
    ):
        make_note(resolved_at=CREATED_AT - timedelta(seconds=1))

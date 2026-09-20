from datetime import UTC, datetime
from uuid import UUID

import pytest
from pydantic import ValidationError

from app.application.errors import ExtractionUnavailable, SourceTextNotActionable
from app.application.submit_note import submit_note
from app.domain.extraction import ExtractedNoteData, UnactionableExtraction
from app.domain.note import Note, NoteCategory, NotePriority, NoteStatus
from test_support.fakes import FakeNoteExtractor, FakeNoteRepository

NOTE_ID = UUID("6d6b7456-208d-4324-b120-5c2bd25d81d0")
CREATED_AT = datetime(2026, 3, 1, 9, 30, tzinfo=UTC)


def submit(
    source_text: str,
    extractor: FakeNoteExtractor,
    repository: FakeNoteRepository,
) -> Note:
    return submit_note(
        source_text,
        extractor=extractor,
        repository=repository,
        id_factory=lambda: NOTE_ID,
        clock=lambda: CREATED_AT,
    )


def test_actionable_source_text_creates_one_open_note() -> None:
    extractor = FakeNoteExtractor(
        ExtractedNoteData(
            title="Worn brake pads on car 12",
            category=NoteCategory.MECHANICAL,
            priority=NotePriority.HIGH,
        )
    )
    repository = FakeNoteRepository()

    note = submit("  Brake pads worn on car 12  ", extractor, repository)

    assert extractor.source_texts == ["Brake pads worn on car 12"]
    assert note == Note(
        id=NOTE_ID,
        source_text="Brake pads worn on car 12",
        title="Worn brake pads on car 12",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
        created_at=CREATED_AT,
    )
    assert note.status is NoteStatus.OPEN
    assert repository.notes == [note]


def test_unactionable_source_text_persists_nothing() -> None:
    extractor = FakeNoteExtractor(UnactionableExtraction(reason="No fleet issue found"))
    repository = FakeNoteRepository()

    with pytest.raises(SourceTextNotActionable):
        submit("Thanks for your help", extractor, repository)

    assert repository.notes == []


def test_extraction_failure_persists_nothing() -> None:
    extractor = FakeNoteExtractor(ExtractionUnavailable("provider timed out"))
    repository = FakeNoteRepository()

    with pytest.raises(ExtractionUnavailable):
        submit("Brake pads worn", extractor, repository)

    assert repository.notes == []


@pytest.mark.parametrize("source_text", ["   ", "x" * 2_001])
def test_invalid_source_text_does_not_invoke_extraction(source_text: str) -> None:
    extractor = FakeNoteExtractor(
        UnactionableExtraction(reason="This result must not be used")
    )
    repository = FakeNoteRepository()

    with pytest.raises(ValidationError):
        submit(source_text, extractor, repository)

    assert extractor.source_texts == []
    assert repository.notes == []

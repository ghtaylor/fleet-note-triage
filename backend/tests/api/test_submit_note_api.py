from collections.abc import Iterator
from datetime import UTC, datetime
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.application.errors import ExtractionUnavailable
from app.dependencies import (
    get_current_time,
    get_note_extractor,
    get_note_id,
    get_note_repository,
)
from app.domain.extraction import ExtractedNoteData, UnactionableExtraction
from app.domain.note import NoteCategory, NotePriority
from app.main import app
from test_support.fakes import FakeNoteExtractor, FakeNoteRepository

NOTE_ID = UUID("6d6b7456-208d-4324-b120-5c2bd25d81d0")
CREATED_AT = datetime(2026, 3, 1, 9, 30, tzinfo=UTC)


@pytest.fixture
def repository() -> FakeNoteRepository:
    return FakeNoteRepository()


@pytest.fixture
def extractor() -> FakeNoteExtractor:
    return FakeNoteExtractor(
        ExtractedNoteData(
            title="Worn brake pads on car 12",
            category=NoteCategory.MECHANICAL,
            priority=NotePriority.HIGH,
        )
    )


@pytest.fixture
def client(
    repository: FakeNoteRepository,
    extractor: FakeNoteExtractor,
) -> Iterator[TestClient]:
    app.dependency_overrides[get_note_repository] = lambda: repository
    app.dependency_overrides[get_note_extractor] = lambda: extractor
    app.dependency_overrides[get_note_id] = lambda: NOTE_ID
    app.dependency_overrides[get_current_time] = lambda: CREATED_AT
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_submit_note_returns_created_note(
    client: TestClient,
    repository: FakeNoteRepository,
    extractor: FakeNoteExtractor,
) -> None:
    response = client.post(
        "/notes",
        json={"source_text": "  Brake pads worn on car 12  "},
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": str(NOTE_ID),
        "source_text": "Brake pads worn on car 12",
        "title": "Worn brake pads on car 12",
        "category": "mechanical",
        "priority": "high",
        "status": "open",
        "created_at": "2026-03-01T09:30:00Z",
        "resolved_at": None,
    }
    assert extractor.source_texts == ["Brake pads worn on car 12"]
    assert len(repository.notes) == 1


def test_submit_note_returns_unactionable_error(
    client: TestClient,
    extractor: FakeNoteExtractor,
    repository: FakeNoteRepository,
) -> None:
    extractor.outcome = UnactionableExtraction(reason="No fleet issue found")

    response = client.post("/notes", json={"source_text": "Thanks for your help"})

    assert response.status_code == 422
    assert response.json() == {"detail": "source_text_not_actionable"}
    assert repository.notes == []


def test_submit_note_returns_extraction_unavailable_error(
    client: TestClient,
    extractor: FakeNoteExtractor,
    repository: FakeNoteRepository,
) -> None:
    extractor.outcome = ExtractionUnavailable("provider timed out")

    response = client.post("/notes", json={"source_text": "Brake pads worn"})

    assert response.status_code == 503
    assert response.json() == {"detail": "extraction_unavailable"}
    assert repository.notes == []


@pytest.mark.parametrize("source_text", ["   ", "x" * 2_001])
def test_submit_note_rejects_invalid_source_text_without_extraction(
    client: TestClient,
    extractor: FakeNoteExtractor,
    source_text: str,
) -> None:
    response = client.post("/notes", json={"source_text": source_text})

    assert response.status_code == 422
    assert extractor.source_texts == []

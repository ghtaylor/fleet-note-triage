from collections.abc import Iterator
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_current_time, get_note_repository
from app.domain.note import Note, NoteCategory, NotePriority
from app.main import app
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


@pytest.fixture
def repository() -> FakeNoteRepository:
    return FakeNoteRepository(make_note())


@pytest.fixture
def client(repository: FakeNoteRepository) -> Iterator[TestClient]:
    app.dependency_overrides[get_note_repository] = lambda: repository
    app.dependency_overrides[get_current_time] = lambda: RESOLVED_AT
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_note_repository)
    app.dependency_overrides.pop(get_current_time)


def test_set_note_status_resolves_an_open_note(
    client: TestClient,
    repository: FakeNoteRepository,
) -> None:
    response = client.patch(f"/notes/{NOTE_ID}", json={"status": "resolved"})

    assert response.status_code == 200
    assert response.json()["status"] == "resolved"
    assert response.json()["resolved_at"] == "2026-03-01T10:45:00Z"
    assert repository.updated_notes == [repository.notes[0]]


def test_set_note_status_reopens_a_resolved_note(
    client: TestClient,
    repository: FakeNoteRepository,
) -> None:
    repository.notes[0] = make_note(resolved_at=RESOLVED_AT)

    response = client.patch(f"/notes/{NOTE_ID}", json={"status": "open"})

    assert response.status_code == 200
    assert response.json()["status"] == "open"
    assert response.json()["resolved_at"] is None


def test_set_note_status_returns_not_found_for_a_missing_note(
    client: TestClient,
) -> None:
    response = client.patch(f"/notes/{uuid4()}", json={"status": "resolved"})

    assert response.status_code == 404
    assert response.json() == {"detail": "note_not_found"}


def test_set_note_status_rejects_an_invalid_status(
    client: TestClient,
    repository: FakeNoteRepository,
) -> None:
    response = client.patch(f"/notes/{NOTE_ID}", json={"status": "closed"})

    assert response.status_code == 422
    assert repository.updated_notes == []

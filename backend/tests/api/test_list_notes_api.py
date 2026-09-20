from collections.abc import Iterator
from datetime import UTC, datetime
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_note_repository
from app.domain.note import Note, NoteCategory, NotePriority, NoteStatus
from app.main import app
from app.ports import NoteQuery, NoteSortField, SortDirection
from test_support.fakes import FakeNoteRepository

NOTE_ID = UUID("6d6b7456-208d-4324-b120-5c2bd25d81d0")


@pytest.fixture
def repository() -> FakeNoteRepository:
    note = Note(
        id=NOTE_ID,
        source_text="Brake pads worn on car 12",
        title="Worn brake pads on car 12",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 3, 1, 9, 30, tzinfo=UTC),
    )
    return FakeNoteRepository(note)


@pytest.fixture
def client(repository: FakeNoteRepository) -> Iterator[TestClient]:
    app.dependency_overrides[get_note_repository] = lambda: repository
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_note_repository)


def test_list_notes_returns_note_page(client: TestClient) -> None:
    response = client.get("/notes")

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "id": str(NOTE_ID),
                "source_text": "Brake pads worn on car 12",
                "title": "Worn brake pads on car 12",
                "category": "mechanical",
                "priority": "high",
                "status": "open",
                "created_at": "2026-03-01T09:30:00Z",
                "resolved_at": None,
            }
        ],
        "total": 1,
    }


def test_list_notes_uses_default_query(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes")

    assert repository.queries == [NoteQuery()]


def test_list_notes_applies_category_filter(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes", params={"category": "electrical"})

    assert repository.queries[0].category is NoteCategory.ELECTRICAL


def test_list_notes_applies_priority_filter(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes", params={"priority": "critical"})

    assert repository.queries[0].priority is NotePriority.CRITICAL


def test_list_notes_applies_status_filter(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes", params={"status": "resolved"})

    assert repository.queries[0].status is NoteStatus.RESOLVED


def test_list_notes_applies_sort_field(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes", params={"sort_by": "created_at"})

    assert repository.queries[0].sort_by is NoteSortField.CREATED_AT


def test_list_notes_applies_sort_direction(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes", params={"direction": "asc"})

    assert repository.queries[0].direction is SortDirection.ASC


def test_list_notes_applies_limit(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes", params={"limit": 25})

    assert repository.queries[0].limit == 25


def test_list_notes_applies_offset(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    client.get("/notes", params={"offset": 10})

    assert repository.queries[0].offset == 10


@pytest.mark.parametrize("limit", [0, 101])
def test_list_notes_rejects_limit_outside_bounds(
    client: TestClient,
    repository: FakeNoteRepository,
    limit: int,
) -> None:
    response = client.get("/notes", params={"limit": limit})

    assert response.status_code == 422
    assert repository.queries == []


def test_list_notes_rejects_negative_offset(
    client: TestClient, repository: FakeNoteRepository
) -> None:
    response = client.get("/notes", params={"offset": -1})

    assert response.status_code == 422
    assert repository.queries == []

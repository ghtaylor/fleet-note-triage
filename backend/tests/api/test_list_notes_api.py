from collections.abc import Iterator
from datetime import UTC, datetime
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_note_repository
from app.domain.note import Note, NoteCategory, NotePriority
from app.main import app
from test_support.fakes import FakeNoteRepository

FIRST_NOTE_ID = UUID(int=1)
SECOND_NOTE_ID = UUID(int=2)


@pytest.fixture
def repository() -> FakeNoteRepository:
    return FakeNoteRepository(
        make_note(
            note_id=FIRST_NOTE_ID,
            created_hour=8,
        ),
        make_note(
            note_id=SECOND_NOTE_ID,
            created_hour=9,
        ),
        make_note(
            note_id=UUID(int=3),
            category=NoteCategory.ELECTRICAL,
            created_hour=10,
        ),
        make_note(
            note_id=UUID(int=4),
            priority=NotePriority.CRITICAL,
            created_hour=11,
        ),
        make_note(
            note_id=UUID(int=5),
            created_hour=12,
            resolved=True,
        ),
    )


@pytest.fixture
def client(repository: FakeNoteRepository) -> Iterator[TestClient]:
    app.dependency_overrides[get_note_repository] = lambda: repository
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_note_repository)


def test_list_notes_returns_response_contract(client: TestClient) -> None:
    response = client.get(
        "/notes",
        params={
            "category": "electrical",
            "priority": "high",
            "status": "open",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "id": str(UUID(int=3)),
                "source_text": "Brake pads worn on car 12",
                "title": "Worn brake pads on car 12",
                "category": "electrical",
                "priority": "high",
                "status": "open",
                "created_at": "2026-03-01T10:00:00Z",
                "resolved_at": None,
            }
        ],
        "total": 1,
    }


def test_list_notes_defaults_to_most_urgent_first(client: TestClient) -> None:
    response = client.get("/notes")

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [
        str(UUID(int=4)),
        str(UUID(int=5)),
        str(UUID(int=3)),
        str(SECOND_NOTE_ID),
        str(FIRST_NOTE_ID),
    ]


def test_list_notes_applies_sorting_and_pagination(client: TestClient) -> None:
    response = client.get(
        "/notes",
        params={
            "category": "mechanical",
            "priority": "high",
            "status": "open",
            "sort_by": "created_at",
            "direction": "asc",
            "limit": 1,
            "offset": 1,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body["items"]] == [str(SECOND_NOTE_ID)]
    assert body["total"] == 2


@pytest.mark.parametrize(
    ("parameter", "value"),
    [("limit", 0), ("limit", 101), ("offset", -1)],
)
def test_list_notes_rejects_invalid_pagination(
    client: TestClient,
    parameter: str,
    value: int,
) -> None:
    response = client.get("/notes", params={parameter: value})

    assert response.status_code == 422


def make_note(
    *,
    note_id: UUID,
    created_hour: int,
    category: NoteCategory = NoteCategory.MECHANICAL,
    priority: NotePriority = NotePriority.HIGH,
    resolved: bool = False,
) -> Note:
    return Note(
        id=note_id,
        source_text="Brake pads worn on car 12",
        title="Worn brake pads on car 12",
        category=category,
        priority=priority,
        created_at=datetime(2026, 3, 1, created_hour, tzinfo=UTC),
        resolved_at=(datetime(2026, 3, 2, tzinfo=UTC) if resolved else None),
    )

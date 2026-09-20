from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import dependencies
from app.adapters.persistence.models import Base
from app.dependencies import get_current_time, get_note_extractor, get_note_id
from app.domain.extraction import ExtractedNoteData
from app.domain.note import NoteCategory, NotePriority
from app.main import app
from test_support.fakes import FakeNoteExtractor

NOTE_ID = UUID("6d6b7456-208d-4324-b120-5c2bd25d81d0")
CURRENT_TIME = datetime(2026, 3, 1, 9, 30, tzinfo=UTC)


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    engine = create_engine(f"sqlite:///{tmp_path / 'notes.db'}")
    Base.metadata.create_all(engine)
    monkeypatch.setattr(dependencies, "_session_factory", sessionmaker(engine))
    app.dependency_overrides[get_note_extractor] = lambda: FakeNoteExtractor(
        ExtractedNoteData(
            title="Worn brake pads on car 12",
            category=NoteCategory.MECHANICAL,
            priority=NotePriority.HIGH,
        )
    )
    app.dependency_overrides[get_note_id] = lambda: NOTE_ID
    app.dependency_overrides[get_current_time] = lambda: CURRENT_TIME

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    engine.dispose()


def test_api_persists_created_notes_and_status_changes(client: TestClient) -> None:
    created = client.post(
        "/notes",
        json={"source_text": "Brake pads worn on car 12"},
    )

    assert created.status_code == 201
    assert client.get("/notes").json()["total"] == 1

    resolved = client.patch(f"/notes/{NOTE_ID}", json={"status": "resolved"})

    assert resolved.status_code == 200
    resolved_notes = client.get("/notes", params={"status": "resolved"}).json()
    assert resolved_notes["total"] == 1
    assert resolved_notes["items"][0]["id"] == str(NOTE_ID)

from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.adapters.persistence.repository import SqlAlchemyNoteRepository
from app.domain.note import Note, NoteCategory, NotePriority

NOTE_ID = UUID("6d6b7456-208d-4324-b120-5c2bd25d81d0")


@pytest.fixture
def migrated_session_factory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> sessionmaker[Session]:
    database_url = f"sqlite:///{tmp_path / 'notes.db'}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    command.upgrade(Config("alembic.ini"), "head")
    return sessionmaker(create_engine(database_url))


def test_repository_round_trips_note(
    migrated_session_factory: sessionmaker[Session],
) -> None:
    note = Note(
        id=NOTE_ID,
        source_text="Brake pads worn on car 12",
        title="Worn brake pads on car 12",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 3, 1, 9, 30, tzinfo=UTC),
        resolved_at=datetime(2026, 3, 1, 10, 45, tzinfo=UTC),
    )

    with migrated_session_factory() as session:
        repository = SqlAlchemyNoteRepository(session)
        repository.add(note)
        session.commit()

    with migrated_session_factory() as session:
        repository = SqlAlchemyNoteRepository(session)

        assert repository.get(NOTE_ID) == note


def test_repository_updates_note_status(
    migrated_session_factory: sessionmaker[Session],
) -> None:
    note = Note(
        id=NOTE_ID,
        source_text="Brake pads worn on car 12",
        title="Worn brake pads on car 12",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 3, 1, 9, 30, tzinfo=UTC),
    )
    resolved_note = note.resolve(datetime(2026, 3, 1, 10, 45, tzinfo=UTC))

    with migrated_session_factory() as session:
        repository = SqlAlchemyNoteRepository(session)
        repository.add(note)
        session.commit()
        repository.update_status(resolved_note)
        session.commit()

    with migrated_session_factory() as session:
        repository = SqlAlchemyNoteRepository(session)

        assert repository.get(NOTE_ID) == resolved_note


def test_repository_returns_none_for_missing_note(
    migrated_session_factory: sessionmaker[Session],
) -> None:
    with migrated_session_factory() as session:
        repository = SqlAlchemyNoteRepository(session)

        assert repository.get(uuid4()) is None

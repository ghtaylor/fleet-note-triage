from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.adapters.persistence.repository import SqlAlchemyNoteRepository
from app.domain.note import Note, NoteCategory, NotePriority, NoteStatus
from app.ports import NotePage, NoteQuery, NoteSortField, SortDirection

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


def test_repository_lists_notes_by_priority_then_creation_time(
    migrated_session_factory: sessionmaker[Session],
) -> None:
    low = make_note(
        note_id=UUID(int=1),
        priority=NotePriority.LOW,
        created_at=datetime(2026, 3, 1, 12, tzinfo=UTC),
    )
    older_high = make_note(
        note_id=UUID(int=2),
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 3, 1, 9, tzinfo=UTC),
    )
    newer_high = make_note(
        note_id=UUID(int=3),
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 3, 1, 10, tzinfo=UTC),
    )
    critical = make_note(
        note_id=UUID(int=4),
        priority=NotePriority.CRITICAL,
        created_at=datetime(2026, 3, 1, 8, tzinfo=UTC),
    )

    with migrated_session_factory() as session:
        repository = SqlAlchemyNoteRepository(session)
        for note in (low, older_high, newer_high, critical):
            repository.add(note)
        session.commit()

        page = repository.list_notes(NoteQuery())

    assert page.items == (critical, newer_high, older_high, low)


@pytest.mark.parametrize(
    ("query", "expected_id"),
    [
        (NoteQuery(category=NoteCategory.MECHANICAL), UUID(int=1)),
        (NoteQuery(priority=NotePriority.HIGH), UUID(int=1)),
        (NoteQuery(status=NoteStatus.OPEN), UUID(int=1)),
        (NoteQuery(status=NoteStatus.RESOLVED), UUID(int=2)),
    ],
)
def test_repository_filters_notes(
    migrated_session_factory: sessionmaker[Session],
    query: NoteQuery,
    expected_id: UUID,
) -> None:
    open_mechanical_high = make_note(note_id=UUID(int=1))
    resolved_software_low = make_note(
        note_id=UUID(int=2),
        category=NoteCategory.SOFTWARE,
        priority=NotePriority.LOW,
        resolved_at=datetime(2026, 3, 1, 11, tzinfo=UTC),
    )

    page = persist_and_list(
        migrated_session_factory,
        open_mechanical_high,
        resolved_software_low,
        query=query,
    )

    assert [note.id for note in page.items] == [expected_id]
    assert page.total == 1


def test_repository_sorts_notes_by_creation_time(
    migrated_session_factory: sessionmaker[Session],
) -> None:
    earlier = make_note(
        note_id=UUID(int=1),
        created_at=datetime(2026, 3, 1, 8, tzinfo=UTC),
    )
    later = make_note(
        note_id=UUID(int=2),
        created_at=datetime(2026, 3, 1, 9, tzinfo=UTC),
    )

    page = persist_and_list(
        migrated_session_factory,
        later,
        earlier,
        query=NoteQuery(
            sort_by=NoteSortField.CREATED_AT,
            direction=SortDirection.ASC,
        ),
    )

    assert page.items == (earlier, later)


def test_repository_paginates_notes_and_returns_full_total(
    migrated_session_factory: sessionmaker[Session],
) -> None:
    oldest = make_note(
        note_id=UUID(int=1),
        created_at=datetime(2026, 3, 1, 8, tzinfo=UTC),
    )
    middle = make_note(
        note_id=UUID(int=2),
        created_at=datetime(2026, 3, 1, 9, tzinfo=UTC),
    )
    newest = make_note(
        note_id=UUID(int=3),
        created_at=datetime(2026, 3, 1, 10, tzinfo=UTC),
    )

    page = persist_and_list(
        migrated_session_factory,
        oldest,
        middle,
        newest,
        query=NoteQuery(limit=1, offset=1),
    )

    assert page.items == (middle,)
    assert page.total == 3


def persist_and_list(
    session_factory: sessionmaker[Session],
    *notes: Note,
    query: NoteQuery,
) -> NotePage:
    with session_factory() as session:
        repository = SqlAlchemyNoteRepository(session)
        for note in notes:
            repository.add(note)
        session.commit()
        return repository.list_notes(query)


def make_note(
    *,
    note_id: UUID,
    category: NoteCategory = NoteCategory.MECHANICAL,
    priority: NotePriority = NotePriority.HIGH,
    created_at: datetime = datetime(2026, 3, 1, 10, tzinfo=UTC),
    resolved_at: datetime | None = None,
) -> Note:
    return Note(
        id=note_id,
        source_text="Brake pads worn on car 12",
        title="Worn brake pads on car 12",
        category=category,
        priority=priority,
        created_at=created_at,
        resolved_at=resolved_at,
    )

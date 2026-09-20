from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.adapters.persistence.repository import SqlAlchemyNoteRepository
from app.config import Settings
from app.domain.note import Note, NoteCategory, NotePriority
from app.ports import NoteRepository

SAMPLE_NOTES = (
    Note(
        id=UUID("c3498de2-8697-4eca-baf7-f64534bf51e3"),
        source_text="brake pads worn on car 12, needs attention this week",
        title="Worn brake pads on car 12",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 3, 1, 8, 30, tzinfo=UTC),
    ),
    Note(
        id=UUID("07e6d859-3c87-488d-a447-734caddad31f"),
        source_text="telemetry unit on car 7 rebooting randomly, low priority",
        title="Telemetry unit restarting on car 7",
        category=NoteCategory.SOFTWARE,
        priority=NotePriority.LOW,
        created_at=datetime(2026, 3, 1, 9, 15, tzinfo=UTC),
    ),
    Note(
        id=UUID("e176fd7f-55ee-411a-a01e-751b921b0ce7"),
        source_text="Brake pedal sinks to the floor on car 18. Do not drive.",
        title="Unsafe brake pedal on car 18",
        category=NoteCategory.SAFETY,
        priority=NotePriority.CRITICAL,
        created_at=datetime(2026, 3, 1, 10, 0, tzinfo=UTC),
    ),
    Note(
        id=UUID("f8b14d18-307b-4b39-85d8-018662759da1"),
        source_text="Cabin USB socket on truck 9 is not supplying power.",
        title="USB socket not working on truck 9",
        category=NoteCategory.ELECTRICAL,
        priority=NotePriority.MEDIUM,
        created_at=datetime(2026, 3, 1, 10, 45, tzinfo=UTC),
        resolved_at=datetime(2026, 3, 1, 14, 0, tzinfo=UTC),
    ),
)


def seed_notes(repository: NoteRepository) -> int:
    inserted_count = 0
    for note in SAMPLE_NOTES:
        if repository.get(note.id) is not None:
            continue
        repository.add(note)
        inserted_count += 1
    return inserted_count


def main() -> None:
    engine = create_engine(Settings().database_url)
    with Session(engine) as session, session.begin():
        inserted_count = seed_notes(SqlAlchemyNoteRepository(session))
    print(f"Seeded {inserted_count} sample notes.")


if __name__ == "__main__":
    main()

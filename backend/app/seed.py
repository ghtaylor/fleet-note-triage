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
        created_at=datetime(2026, 9, 20, 8, 30, tzinfo=UTC),
    ),
    Note(
        id=UUID("07e6d859-3c87-488d-a447-734caddad31f"),
        source_text="telemetry unit on car 7 rebooting randomly, low priority",
        title="Telemetry unit restarting on car 7",
        category=NoteCategory.SOFTWARE,
        priority=NotePriority.LOW,
        created_at=datetime(2026, 9, 20, 9, 15, tzinfo=UTC),
    ),
    Note(
        id=UUID("e176fd7f-55ee-411a-a01e-751b921b0ce7"),
        source_text="Brake pedal sinks to the floor on car 18. Do not drive.",
        title="Unsafe brake pedal on car 18",
        category=NoteCategory.SAFETY,
        priority=NotePriority.CRITICAL,
        created_at=datetime(2026, 9, 21, 6, 0, tzinfo=UTC),
    ),
    Note(
        id=UUID("f8b14d18-307b-4b39-85d8-018662759da1"),
        source_text="Cockpit USB socket on car 9 is not supplying power.",
        title="USB socket not working on car 9",
        category=NoteCategory.ELECTRICAL,
        priority=NotePriority.MEDIUM,
        created_at=datetime(2026, 9, 18, 10, 45, tzinfo=UTC),
        resolved_at=datetime(2026, 9, 18, 14, 0, tzinfo=UTC),
    ),
    Note(
        id=UUID("61e17e21-c548-4c97-a2da-1acb3f96bc31"),
        source_text="Strong fuel smell and visible leak beneath car 4. Keep it parked.",
        title="Fuel leak beneath car 4",
        category=NoteCategory.SAFETY,
        priority=NotePriority.CRITICAL,
        created_at=datetime(2026, 9, 17, 7, 20, tzinfo=UTC),
        resolved_at=datetime(2026, 9, 17, 11, 40, tzinfo=UTC),
    ),
    Note(
        id=UUID("96f92856-5002-4c35-b335-630cd463909f"),
        source_text="Car 22 battery is flat again after standing overnight.",
        title="Overnight battery drain on car 22",
        category=NoteCategory.ELECTRICAL,
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 9, 20, 13, 10, tzinfo=UTC),
    ),
    Note(
        id=UUID("785ceb29-5d1d-481e-af02-a2dd6de6382f"),
        source_text="Steering wheel on car 5 vibrates above 60 mph, alignment may be out.",
        title="Steering vibration on car 5",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.MEDIUM,
        created_at=datetime(2026, 9, 19, 15, 35, tzinfo=UTC),
    ),
    Note(
        id=UUID("d728bdc2-66f6-4a68-8178-07a2756f68d8"),
        source_text="Dashboard on car 3 still shows the old firmware after yesterday's update.",
        title="Dashboard firmware update incomplete",
        category=NoteCategory.SOFTWARE,
        priority=NotePriority.MEDIUM,
        created_at=datetime(2026, 9, 18, 12, 5, tzinfo=UTC),
        resolved_at=datetime(2026, 9, 19, 9, 25, tzinfo=UTC),
    ),
    Note(
        id=UUID("fb4d0a9c-cdc7-4be2-be4e-bd27f29517e4"),
        source_text="Rear-left tyre on car 16 has a deep sidewall cut; replacement needed.",
        title="Sidewall damage on car 16",
        category=NoteCategory.MECHANICAL,
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 9, 17, 16, 50, tzinfo=UTC),
        resolved_at=datetime(2026, 9, 18, 8, 10, tzinfo=UTC),
    ),
    Note(
        id=UUID("bda2eff2-f7a9-4652-a949-e0dc87db8997"),
        source_text="GPS position in the team tracking display lags by two minutes on car 11.",
        title="Delayed GPS position on car 11",
        category=NoteCategory.SOFTWARE,
        priority=NotePriority.LOW,
        created_at=datetime(2026, 9, 19, 11, 30, tzinfo=UTC),
    ),
    Note(
        id=UUID("e1cd545a-c19d-4894-892c-a8f2e492f703"),
        source_text="Rear parking proximity warning on car 6 works intermittently. Check before release.",
        title="Intermittent parking warning on car 6",
        category=NoteCategory.SAFETY,
        priority=NotePriority.HIGH,
        created_at=datetime(2026, 9, 21, 7, 5, tzinfo=UTC),
    ),
    Note(
        id=UUID("3cba3a64-74c4-4abd-a05f-199a70eecfa0"),
        source_text="Charging port flap sensor on car 8 reports open even when fully closed.",
        title="Charging port sensor fault on car 8",
        category=NoteCategory.ELECTRICAL,
        priority=NotePriority.MEDIUM,
        created_at=datetime(2026, 9, 20, 16, 25, tzinfo=UTC),
    ),
    Note(
        id=UUID("e9ee4dfa-3f0a-4cd0-84fe-dc9370acbec0"),
        source_text="Cockpit in car 14 needs a deep clean after a coolant container spilled.",
        title="Cockpit clean-up needed on car 14",
        category=NoteCategory.OTHER,
        priority=NotePriority.LOW,
        created_at=datetime(2026, 9, 18, 15, 45, tzinfo=UTC),
    ),
    Note(
        id=UUID("56f36457-ac5f-4263-b53a-dfc1c5717020"),
        source_text="The latest service paperwork for car 2 is missing from the workshop file.",
        title="Service paperwork missing for car 2",
        category=NoteCategory.OTHER,
        priority=NotePriority.MEDIUM,
        created_at=datetime(2026, 9, 17, 9, 40, tzinfo=UTC),
        resolved_at=datetime(2026, 9, 17, 13, 15, tzinfo=UTC),
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

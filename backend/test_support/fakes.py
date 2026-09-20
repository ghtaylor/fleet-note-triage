from uuid import UUID

from app.domain.note import Note
from app.ports import NotePage, NoteQuery, NoteSortField, SortDirection


class FakeNoteRepository:
    def __init__(self, *notes: Note) -> None:
        self.notes = list(notes)
        self.queries: list[NoteQuery] = []
        self.updated_notes: list[Note] = []

    def add(self, note: Note) -> None:
        self.notes.append(note)

    def get(self, note_id: UUID) -> Note | None:
        return next((note for note in self.notes if note.id == note_id), None)

    def list_notes(self, query: NoteQuery) -> NotePage:
        self.queries.append(query)
        notes = [
            note
            for note in self.notes
            if (query.category is None or note.category is query.category)
            and (query.priority is None or note.priority is query.priority)
            and (query.status is None or note.status is query.status)
        ]
        notes.sort(key=lambda note: str(note.id))
        if query.sort_by is NoteSortField.PRIORITY:
            notes.sort(key=lambda note: note.created_at, reverse=True)
            notes.sort(
                key=lambda note: note.priority.rank,
                reverse=query.direction is SortDirection.DESC,
            )
        else:
            notes.sort(
                key=lambda note: note.created_at,
                reverse=query.direction is SortDirection.DESC,
            )
        return NotePage(
            items=tuple(notes[query.offset : query.offset + query.limit]),
            total=len(notes),
        )

    def update_status(self, note: Note) -> None:
        for index, existing_note in enumerate(self.notes):
            if existing_note.id == note.id:
                self.notes[index] = note
                self.updated_notes.append(note)
                return
        raise LookupError(f"Note {note.id} does not exist")

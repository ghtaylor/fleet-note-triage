from uuid import UUID

from app.domain.note import Note


class FakeNoteRepository:
    def __init__(self, *notes: Note) -> None:
        self.notes = list(notes)
        self.updated_notes: list[Note] = []

    def add(self, note: Note) -> None:
        self.notes.append(note)

    def get(self, note_id: UUID) -> Note | None:
        return next((note for note in self.notes if note.id == note_id), None)

    def update_status(self, note: Note) -> None:
        for index, existing_note in enumerate(self.notes):
            if existing_note.id == note.id:
                self.notes[index] = note
                self.updated_notes.append(note)
                return
        raise LookupError(f"Note {note.id} does not exist")

import type { NoteListResponse } from "@/api/types.gen";
import { NoteCard } from "@/components/note-card";

export function NoteList({ notes }: { notes: NoteListResponse | null }) {
  if (!notes) {
    return (
      <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
        Notes are unavailable. Try again shortly.
      </p>
    );
  }

  if (notes.items.length === 0) {
    return <p className="rounded border border-gray-300 p-4">No fleet notes have been submitted.</p>;
  }

  return (
    <section aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="mb-3 text-lg font-medium">
        {notes.total} {notes.total === 1 ? "note" : "notes"}
      </h2>
      <ul className="space-y-3">
        {notes.items.map((note) => (
          <li key={note.id}>
            <NoteCard note={note} />
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { NoteStatusAction } from "@/actions/note-status";
import { NoteCard, type NoteCardNote } from "@/components/note-card";

export type NoteListProps =
  | { availability: "unavailable" }
  | {
      availability: "available";
      items: readonly NoteCardNote[];
      total: number;
      changeStatusAction: NoteStatusAction;
    };

export function NoteList(props: NoteListProps) {
  if (props.availability === "unavailable") {
    return (
      <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
        Notes are unavailable. Try again shortly.
      </p>
    );
  }

  if (props.items.length === 0) {
    return <p className="rounded border border-gray-300 p-4">No fleet notes have been submitted.</p>;
  }

  return (
    <section aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="mb-3 text-lg font-medium">
        {props.total} {props.total === 1 ? "note" : "notes"}
      </h2>
      <ul className="space-y-3">
        {props.items.map((note) => (
          <li key={note.id}>
            <NoteCard note={note} changeStatusAction={props.changeStatusAction} />
          </li>
        ))}
      </ul>
    </section>
  );
}

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
      <p
        role="alert"
        className="m-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"
      >
        Notes are unavailable. Try again shortly.
      </p>
    );
  }

  if (props.items.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-gray-500">
        No fleet notes have been submitted.
      </p>
    );
  }

  return (
    <section aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="sr-only">
        {props.total} {props.total === 1 ? "note" : "notes"}
      </h2>
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] gap-3 border-b border-gray-200 px-5 py-2 text-xs font-bold tracking-wide text-gray-500 uppercase md:grid"
      >
        <span>Issue</span>
        <span>Category</span>
        <span>Priority</span>
        <span />
      </div>
      <ul className="divide-y divide-gray-200">
        {props.items.map((note) => (
          <li key={note.id} className="note-row">
            <NoteCard note={note} changeStatusAction={props.changeStatusAction} />
          </li>
        ))}
      </ul>
      <p className="border-t border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-500 tabular-nums">
        Showing {props.items.length} of {props.total} {props.total === 1 ? "note" : "notes"}
      </p>
    </section>
  );
}

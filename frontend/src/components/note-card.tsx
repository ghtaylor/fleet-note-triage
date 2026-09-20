import clsx from "clsx";

import type { NoteStatusAction } from "@/actions/note-status";
import type { NoteCategory, NotePriority, NoteStatus } from "@/api/types.gen";
import { NoteStatusControl } from "@/components/note-status-control";

export type NoteCardNote = {
  id: string;
  title: string;
  status: NoteStatus;
  sourceText: string;
  priority: NotePriority;
  category: NoteCategory;
  createdAt: string;
};

const createdAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

const priorityDotClassName: Record<NotePriority, string> = {
  critical: "bg-red-700",
  high: "bg-orange-500",
  medium: "bg-amber-600",
  low: "bg-gray-400",
};

export function NoteCard({
  note,
  changeStatusAction,
}: {
  note: NoteCardNote;
  changeStatusAction: NoteStatusAction;
}) {
  const isResolved = note.status === "resolved";

  return (
    <article
      className={clsx(
        "grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 transition-colors duration-150 hover:bg-orange-50/40 motion-reduce:transition-none sm:px-5 md:grid-cols-[minmax(0,1fr)_7rem_6rem_6rem]",
        isResolved && "bg-gray-50 text-gray-500",
      )}
    >
      <div className="col-span-2 min-w-0 md:col-span-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className={clsx(
              "size-2 shrink-0 rounded-full",
              isResolved ? "bg-gray-400" : priorityDotClassName[note.priority],
            )}
          />
          <h3 className={clsx("truncate text-sm font-bold", isResolved && "line-through")}>
            {note.title}
          </h3>
        </div>
        <p className="mt-1 break-words pl-4 text-xs leading-5 text-gray-600">
          “{note.sourceText}”
        </p>
        <p className="mt-1 pl-4 text-xs text-gray-500">
          <time dateTime={note.createdAt}>
            {createdAtFormatter.format(new Date(note.createdAt))}
          </time>
        </p>
      </div>
      <p className="pl-4 text-xs font-semibold capitalize md:pl-0">{note.category}</p>
      {isResolved ? (
        <p className="col-start-1 flex items-center gap-1.5 pl-4 text-xs font-bold text-green-700 md:col-auto md:pl-0">
          <span aria-hidden="true" className="size-2 rounded-full bg-green-700" />
          Resolved
        </p>
      ) : (
        <p className="col-start-1 flex items-center gap-1.5 pl-4 text-xs font-bold text-gray-700 capitalize md:col-auto md:pl-0">
          <span
            aria-hidden="true"
            className={clsx("size-2 rounded-full", priorityDotClassName[note.priority])}
          />
          {note.priority}
        </p>
      )}
      <div className="col-start-2 row-start-2 row-span-2 self-center md:col-auto md:row-auto">
        <NoteStatusControl
          note={{ id: note.id, title: note.title, status: note.status }}
          changeStatusAction={changeStatusAction}
        />
      </div>
    </article>
  );
}

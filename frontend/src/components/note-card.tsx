import type { NoteCategory, NotePriority, NoteStatus } from "@/api/types.gen";

export type NoteCardNote = {
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

export function NoteCard({ note }: { note: NoteCardNote }) {
  return (
    <article className="rounded border border-gray-300 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{note.title}</h3>
        <span className="capitalize">{note.status}</span>
      </div>
      <p className="mt-2 text-gray-700">{note.sourceText}</p>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-1">
          <dt className="font-medium">Priority:</dt>
          <dd className="capitalize">{note.priority}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium">Category:</dt>
          <dd className="capitalize">{note.category}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="font-medium">Created:</dt>
          <dd>
            <time dateTime={note.createdAt}>
              {createdAtFormatter.format(new Date(note.createdAt))}
            </time>
          </dd>
        </div>
      </dl>
    </article>
  );
}

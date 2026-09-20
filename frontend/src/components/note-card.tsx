import type { NoteResponse } from "@/api/types.gen";

const createdAtFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NoteCard({ note }: { note: NoteResponse }) {
  return (
    <article className="rounded border border-gray-300 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{note.title}</h3>
        <span className="capitalize">{note.status}</span>
      </div>
      <p className="mt-2 text-gray-700">{note.source_text}</p>
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
            <time dateTime={note.created_at}>
              {createdAtFormatter.format(new Date(note.created_at))}
            </time>
          </dd>
        </div>
      </dl>
    </article>
  );
}

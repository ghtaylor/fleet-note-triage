import Link from "next/link";

import type { NoteStatusAction } from "@/actions/note-status";
import { NoteCard, type NoteCardNote } from "@/components/note-card";

export type NotePagination = {
  page: number;
  pageSize: number;
  previousHref?: string;
  nextHref?: string;
};

export type NoteListProps =
  | { availability: "unavailable" }
  | {
      availability: "available";
      items: readonly NoteCardNote[];
      total: number;
      hasActiveFilters: boolean;
      pagination: NotePagination;
      changeStatusAction: NoteStatusAction;
    };

const paginationLinkClassName =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600";

function NotePaginationControls({
  itemsOnPage,
  total,
  pagination,
}: {
  itemsOnPage: number;
  total: number;
  pagination: NotePagination;
}) {
  const firstItem = (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = firstItem + itemsOnPage - 1;
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

  return (
    <nav
      aria-label="Notes pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-5"
    >
      <p className="text-xs text-gray-500 tabular-nums">
        {itemsOnPage > 0 ? `Showing ${firstItem}–${lastItem} of ${total}` : `${total} notes`}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 tabular-nums">
          Page {pagination.page} of {totalPages}
        </span>
        {pagination.previousHref ? (
          <Link href={pagination.previousHref} scroll={false} className={paginationLinkClassName}>
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={`${paginationLinkClassName} cursor-not-allowed opacity-40`}
          >
            Previous
          </span>
        )}
        {pagination.nextHref ? (
          <Link href={pagination.nextHref} scroll={false} className={paginationLinkClassName}>
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={`${paginationLinkClassName} cursor-not-allowed opacity-40`}
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

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

  if (props.total === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-gray-500">
        {props.hasActiveFilters
          ? "No notes match these filters."
          : "No fleet notes have been submitted."}
      </p>
    );
  }

  return (
    <section aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="sr-only">
        {props.total} {props.total === 1 ? "note" : "notes"}
      </h2>
      {props.items.length > 0 ? (
        <>
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
        </>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-gray-500">No notes on this page.</p>
      )}
      <NotePaginationControls
        itemsOnPage={props.items.length}
        total={props.total}
        pagination={props.pagination}
      />
    </section>
  );
}

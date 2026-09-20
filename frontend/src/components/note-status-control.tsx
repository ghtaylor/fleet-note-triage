"use client";

import clsx from "clsx";
import { useActionState } from "react";

import {
  initialNoteStatusState,
  type NoteStatusAction,
} from "@/actions/note-status";
import type { NoteStatus } from "@/api/types.gen";

export type NoteStatusControlNote = {
  id: string;
  status: NoteStatus;
};

export function NoteStatusControl({
  note,
  changeStatusAction,
}: {
  note: NoteStatusControlNote;
  changeStatusAction: NoteStatusAction;
}) {
  const [state, formAction, isPending] = useActionState(
    changeStatusAction,
    initialNoteStatusState,
  );
  const targetStatus = note.status === "open" ? "resolved" : "open";
  const buttonLabel = targetStatus === "resolved" ? "Resolve note" : "Reopen note";
  const pendingLabel = targetStatus === "resolved" ? "Resolving…" : "Reopening…";
  const hasError = state.status === "error";

  return (
    <form action={formAction} aria-busy={isPending}>
      <input type="hidden" name="note_id" value={note.id} />
      <input type="hidden" name="status" value={targetStatus} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          role={hasError ? "alert" : "status"}
          aria-live="polite"
          className={clsx("min-h-5 text-sm", hasError ? "text-red-700" : "text-green-700")}
        >
          {state.message}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded border border-gray-400 px-3 py-2 text-sm font-medium hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          {isPending ? pendingLabel : buttonLabel}
        </button>
      </div>
    </form>
  );
}

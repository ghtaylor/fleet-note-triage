"use client";

import { useActionState } from "react";
import { toast } from "sonner";

import {
  initialNoteStatusState,
  type NoteStatusAction,
  type NoteStatusState,
} from "@/actions/note-status";
import type { NoteStatus } from "@/api/types.gen";

export type NoteStatusControlNote = {
  id: string;
  title: string;
  status: NoteStatus;
};

export function NoteStatusControl({
  note,
  changeStatusAction,
}: {
  note: NoteStatusControlNote;
  changeStatusAction: NoteStatusAction;
}) {
  const targetStatus = note.status === "open" ? "resolved" : "open";
  const buttonLabel = targetStatus === "resolved" ? "Resolve note" : "Reopen note";
  const [, formAction, isPending] = useActionState(
    async (previousState: NoteStatusState, formData: FormData) => {
      const nextState = await changeStatusAction(previousState, formData);
      if (nextState.status === "success") {
        const completedAction = targetStatus === "resolved" ? "resolved" : "reopened";
        toast.success(`"${note.title}" ${completedAction}.`);
      } else if (nextState.status === "error") {
        toast.error(nextState.message);
      }
      return nextState;
    },
    initialNoteStatusState,
  );

  return (
    <form action={formAction} aria-busy={isPending} className="flex justify-end">
      <input type="hidden" name="note_id" value={note.id} />
      <input type="hidden" name="status" value={targetStatus} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border border-gray-400 px-3 py-2 text-sm font-medium hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {buttonLabel}
      </button>
    </form>
  );
}

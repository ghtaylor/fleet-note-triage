"use client";

import clsx from "clsx";
import { useActionState, useState } from "react";

import {
  initialNoteSubmissionState,
  type NoteSubmissionAction,
  type NoteSubmissionState,
} from "@/actions/note-submission";
import { NoteComposerInput } from "@/components/note-composer-input";

export function NoteComposer({ submitAction }: { submitAction: NoteSubmissionAction }) {
  const [sourceText, setSourceText] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (previousState: NoteSubmissionState, formData: FormData) => {
      const nextState = await submitAction(previousState, formData);
      if (nextState.status === "success") {
        setSourceText("");
      }
      return nextState;
    },
    initialNoteSubmissionState,
  );

  const hasError = state.status === "error";

  return (
    <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
      <form
        action={formAction}
        aria-label="Submit a fleet note"
        aria-busy={isPending}
        className="rounded-2xl border border-gray-300 bg-white p-3 shadow-lg"
      >
        <NoteComposerInput
          value={sourceText}
          onValueChange={setSourceText}
          disabled={isPending}
          invalid={hasError}
          describedBy="source-text-hint submission-message"
        />
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-h-10 text-sm">
            <p id="source-text-hint" className="text-gray-500">
              One issue per note. Press Ctrl or ⌘ + Enter to submit.
            </p>
            <p
              id="submission-message"
              role={hasError ? "alert" : "status"}
              aria-live="polite"
              className={clsx("mt-1", hasError ? "text-red-700" : "text-green-700")}
            >
              {state.message}
            </p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-full bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isPending ? "Submitting…" : "Submit note"}
          </button>
        </div>
      </form>
    </div>
  );
}

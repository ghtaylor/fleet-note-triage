"use client";

import clsx from "clsx";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import {
  initialNoteSubmissionState,
  type NoteSubmissionAction,
  type NoteSubmissionState,
} from "@/actions/note-submission";
import { NoteComposerInput } from "@/components/note-composer-input";

const MINIMUM_ANALYSIS_TIME_MS = 700;

function waitForMinimumAnalysisTime() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, MINIMUM_ANALYSIS_TIME_MS);
  });
}

export function NoteComposer({ submitAction }: { submitAction: NoteSubmissionAction }) {
  const [sourceText, setSourceText] = useState("");
  const [state, formAction, isPending] = useActionState(
    async (previousState: NoteSubmissionState, formData: FormData) => {
      const [nextState] = await Promise.all([
        submitAction(previousState, formData),
        waitForMinimumAnalysisTime(),
      ]);
      if (nextState.status === "success") {
        setSourceText("");
        toast.success(nextState.message);
      } else if (nextState.status === "error") {
        toast.error(nextState.message);
      }
      return nextState;
    },
    initialNoteSubmissionState,
  );

  const hasError = state.status === "error";

  return (
    <form
      action={formAction}
      aria-label="Submit a fleet note"
      aria-busy={isPending}
      className={clsx(
        "rounded border border-gray-300 bg-white p-4",
        isPending && "composer-pending",
      )}
    >
      <NoteComposerInput
        value={sourceText}
        onValueChange={setSourceText}
        disabled={isPending}
        invalid={hasError}
        describedBy="source-text-hint"
      />
      <div className="mt-2 flex items-end justify-between gap-3">
        <p
          id="source-text-hint"
          role="status"
          aria-live="polite"
          className="text-sm text-gray-500"
        >
          {isPending
            ? "Extracting title, category, and priority…"
            : "One issue per note. Press Enter to submit or Shift + Enter for a new line."}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          Submit note
        </button>
      </div>
    </form>
  );
}

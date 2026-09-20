"use client";

import clsx from "clsx";
import { type KeyboardEvent, useActionState, useState } from "react";
import { toast } from "sonner";

import {
  initialNoteSubmissionState,
  type NoteSubmissionAction,
  type NoteSubmissionState,
} from "@/actions/note-submission";

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

  function submitWithEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form
      action={formAction}
      aria-label="Submit a fleet note"
      aria-busy={isPending}
      className={clsx(
        "rounded-xl border border-gray-200 bg-white p-5",
        isPending && "composer-pending",
      )}
    >
      <h2 className="text-lg font-bold tracking-tight">Add note</h2>
      <p className="mt-1 mb-4 text-xs leading-5 text-gray-500">
        Title, category and priority are generated from the source note.
      </p>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="source-text" className="text-xs font-bold">
          Technician note
        </label>
        <span className="text-xs tabular-nums text-gray-500">{sourceText.length} / 2,000</span>
      </div>
      <textarea
        id="source-text"
        name="source_text"
        value={sourceText}
        onChange={(event) => setSourceText(event.target.value)}
        onKeyDown={submitWithEnter}
        required
        maxLength={2000}
        disabled={isPending}
        aria-describedby="source-text-hint"
        aria-invalid={state.status === "error"}
        placeholder="e.g. Brake pedal on car 18 feels soft after two laps."
        rows={6}
        className="block w-full resize-none rounded-lg border border-gray-300 p-3 text-sm leading-6 outline-none placeholder:text-gray-400 focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 disabled:bg-gray-50"
      />
      <p
        id="source-text-hint"
        role="status"
        aria-live="polite"
        className="mt-2 text-xs leading-5 text-gray-500"
      >
        {isPending
          ? "Extracting title, category, and priority…"
          : "Describe one vehicle issue per note. Press Enter to submit or Shift + Enter for a new line."}
      </p>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 min-h-11 w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-gray-950 hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Submit note
      </button>
    </form>
  );
}

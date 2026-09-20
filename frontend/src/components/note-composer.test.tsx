import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Toaster } from "sonner";
import { describe, expect, it, vi } from "vitest";

import type { NoteSubmissionAction } from "@/actions/note-submission";
import { NoteComposer } from "@/components/note-composer";

function actionReturning(
  result: Awaited<ReturnType<NoteSubmissionAction>>,
): NoteSubmissionAction {
  return vi.fn(async () => result);
}

function renderComposer(submitAction: NoteSubmissionAction) {
  render(
    <>
      <NoteComposer submitAction={submitAction} />
      <Toaster />
    </>,
  );
}

describe("NoteComposer", () => {
  it("clears source text after a successful submission", async () => {
    const action = actionReturning({ status: "success", message: "Note added." });
    renderComposer(action);

    const sourceText = screen.getByRole("textbox", { name: "Technician note" });
    fireEvent.change(sourceText, { target: { value: "Brake pads worn on car 12." } });
    fireEvent.submit(screen.getByRole("form", { name: "Submit a fleet note" }));

    await waitFor(() =>
      expect(within(screen.getByLabelText(/Notifications/)).getByText("Note added.")).toBeInTheDocument(),
    );
    expect(sourceText).toHaveValue("");
  });

  it("preserves source text and shows an expected error", async () => {
    const action = actionReturning({
      status: "error",
      message: "Describe a specific vehicle issue and try again.",
    });
    renderComposer(action);

    const sourceText = screen.getByRole("textbox", { name: "Technician note" });
    fireEvent.change(sourceText, { target: { value: "unclear" } });
    fireEvent.submit(screen.getByRole("form", { name: "Submit a fleet note" }));

    await waitFor(() =>
      expect(
        within(screen.getByLabelText(/Notifications/)).getByText(
          "Describe a specific vehicle issue and try again.",
        ),
      ).toBeInTheDocument(),
    );
    expect(sourceText).toHaveValue("unclear");
  });

  it("shows the analysis state and prevents another submission while pending", async () => {
    let completeSubmission: ((value: Awaited<ReturnType<NoteSubmissionAction>>) => void) | undefined;
    const action: NoteSubmissionAction = vi.fn(
      () =>
        new Promise<Awaited<ReturnType<NoteSubmissionAction>>>((resolve) => {
          completeSubmission = resolve;
        }),
    );
    renderComposer(action);

    fireEvent.change(screen.getByRole("textbox", { name: "Technician note" }), {
      target: { value: "Telemetry keeps restarting." },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Submit a fleet note" }));

    const submitButton = screen.getByRole("button", { name: "Submit note" });
    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(screen.getByRole("textbox", { name: "Technician note" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Extracting title, category, and priority…",
    );

    await act(async () => {
      completeSubmission?.({ status: "success", message: "Note added." });
    });
  });

  it("submits with Enter", async () => {
    const action = actionReturning({ status: "success", message: "Note added." });
    renderComposer(action);

    const sourceText = screen.getByRole("textbox", { name: "Technician note" });
    fireEvent.change(sourceText, { target: { value: "Telemetry keeps restarting." } });
    fireEvent.keyDown(sourceText, { key: "Enter" });

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });
});

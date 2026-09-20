import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { NoteSubmissionAction } from "@/actions/note-submission";
import { NoteComposer } from "@/components/note-composer";

function actionReturning(
  result: Awaited<ReturnType<NoteSubmissionAction>>,
): NoteSubmissionAction {
  return vi.fn(async () => result);
}

describe("NoteComposer", () => {
  it("clears source text after a successful submission", async () => {
    const action = actionReturning({ status: "success", message: "Note added." });
    render(<NoteComposer submitAction={action} />);

    const sourceText = screen.getByRole("textbox", { name: "Fleet note" });
    fireEvent.change(sourceText, { target: { value: "Brake pads worn on car 12." } });
    fireEvent.submit(screen.getByRole("form", { name: "Submit a fleet note" }));

    await waitFor(() => expect(screen.getByText("Note added.")).toBeInTheDocument());
    expect(sourceText).toHaveValue("");
  });

  it("preserves source text and shows an expected error", async () => {
    const action = actionReturning({
      status: "error",
      message: "Describe a specific vehicle issue and try again.",
    });
    render(<NoteComposer submitAction={action} />);

    const sourceText = screen.getByRole("textbox", { name: "Fleet note" });
    fireEvent.change(sourceText, { target: { value: "unclear" } });
    fireEvent.submit(screen.getByRole("form", { name: "Submit a fleet note" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Describe a specific vehicle issue and try again.",
      ),
    );
    expect(sourceText).toHaveValue("unclear");
  });

  it("prevents another submission while one is pending", async () => {
    let completeSubmission: ((value: Awaited<ReturnType<NoteSubmissionAction>>) => void) | undefined;
    const action: NoteSubmissionAction = vi.fn(
      () =>
        new Promise<Awaited<ReturnType<NoteSubmissionAction>>>((resolve) => {
          completeSubmission = resolve;
        }),
    );
    render(<NoteComposer submitAction={action} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Fleet note" }), {
      target: { value: "Telemetry keeps restarting." },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Submit a fleet note" }));

    const submitButton = await screen.findByRole("button", { name: "Submitting…" });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Fleet note" })).toBeDisabled();

    await act(async () => {
      completeSubmission?.({ status: "success", message: "Note added." });
    });
  });

  it("submits with Enter", async () => {
    const action = actionReturning({ status: "success", message: "Note added." });
    render(<NoteComposer submitAction={action} />);

    const sourceText = screen.getByRole("textbox", { name: "Fleet note" });
    fireEvent.change(sourceText, { target: { value: "Telemetry keeps restarting." } });
    fireEvent.keyDown(sourceText, { key: "Enter" });

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });
});

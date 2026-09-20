import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Toaster } from "sonner";
import { describe, expect, it, vi } from "vitest";

import type { NoteStatusAction } from "@/actions/note-status";
import {
  NoteStatusControl,
  type NoteStatusControlNote,
} from "@/components/note-status-control";

const noteId = "1d9f15de-fc3b-4ead-b076-bcaa83fbc630";

function renderStatusControl(
  note: NoteStatusControlNote,
  changeStatusAction: NoteStatusAction,
) {
  render(
    <>
      <NoteStatusControl note={note} changeStatusAction={changeStatusAction} />
      <Toaster />
    </>,
  );
}

describe("NoteStatusControl", () => {
  it("reopens a resolved note", async () => {
    const action = vi.fn<NoteStatusAction>(async (_previousState, formData) => {
      expect(formData.get("note_id")).toBe(noteId);
      expect(formData.get("status")).toBe("open");
      return { status: "success", message: "Note reopened." };
    });
    renderStatusControl({ id: noteId, title: "Worn brake pads", status: "resolved" }, action);

    fireEvent.click(screen.getByRole("button", { name: "Reopen note" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(
      within(screen.getByLabelText(/Notifications/)).getByText('"Worn brake pads" reopened.'),
    ).toBeInTheDocument();
  });

  it("shows the note title after resolving it", async () => {
    const action = vi.fn<NoteStatusAction>(async () => ({
      status: "success",
      message: "Note resolved.",
    }));
    renderStatusControl({ id: noteId, title: "Worn brake pads", status: "open" }, action);

    fireEvent.click(screen.getByRole("button", { name: "Resolve note" }));

    await waitFor(() =>
      expect(
        within(screen.getByLabelText(/Notifications/)).getByText('"Worn brake pads" resolved.'),
      ).toBeInTheDocument(),
    );
  });

  it("keeps the action label stable while a status change is pending", async () => {
    let completeChange: ((value: Awaited<ReturnType<NoteStatusAction>>) => void) | undefined;
    const action: NoteStatusAction = vi.fn(
      () =>
        new Promise<Awaited<ReturnType<NoteStatusAction>>>((resolve) => {
          completeChange = resolve;
        }),
    );
    renderStatusControl({ id: noteId, title: "Worn brake pads", status: "open" }, action);

    const resolveButton = screen.getByRole("button", { name: "Resolve note" });
    fireEvent.click(resolveButton);

    expect(resolveButton).toBeDisabled();
    expect(resolveButton).toHaveAccessibleName("Resolve note");

    await act(async () => {
      completeChange?.({ status: "success", message: "Note resolved." });
    });
  });

  it("shows an error when an open note cannot be resolved", async () => {
    const action = vi.fn<NoteStatusAction>(async () => ({
      status: "error",
      message: "The note status could not be updated. Try again.",
    }));
    renderStatusControl({ id: noteId, title: "Worn brake pads", status: "open" }, action);

    fireEvent.click(screen.getByRole("button", { name: "Resolve note" }));

    await waitFor(() =>
      expect(
        within(screen.getByLabelText(/Notifications/)).getByText(
          "The note status could not be updated. Try again.",
        ),
      ).toBeInTheDocument(),
    );
  });
});

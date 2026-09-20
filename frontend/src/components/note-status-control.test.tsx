import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { NoteStatusAction } from "@/actions/note-status";
import { NoteStatusControl } from "@/components/note-status-control";

const noteId = "1d9f15de-fc3b-4ead-b076-bcaa83fbc630";

describe("NoteStatusControl", () => {
  it("reopens a resolved note", async () => {
    const action = vi.fn<NoteStatusAction>(async (_previousState, formData) => {
      expect(formData.get("note_id")).toBe(noteId);
      expect(formData.get("status")).toBe("open");
      return { status: "success", message: "Note reopened." };
    });
    render(
      <NoteStatusControl
        note={{ id: noteId, status: "resolved" }}
        changeStatusAction={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reopen note" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(screen.getByRole("status")).toHaveTextContent("Note reopened.");
  });

  it("shows an error when an open note cannot be resolved", async () => {
    const action = vi.fn<NoteStatusAction>(async () => ({
      status: "error",
      message: "The note status could not be updated. Try again.",
    }));
    render(
      <NoteStatusControl
        note={{ id: noteId, status: "open" }}
        changeStatusAction={action}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Resolve note" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The note status could not be updated. Try again.",
    );
  });
});

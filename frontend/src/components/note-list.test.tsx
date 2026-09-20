import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { NoteListResponse } from "@/api/types.gen";
import { NoteList } from "@/components/note-list";

const notes: NoteListResponse = {
  items: [
    {
      id: "1d9f15de-fc3b-4ead-b076-bcaa83fbc630",
      source_text: "Brake pads worn on car 12.",
      title: "Worn brake pads",
      category: "mechanical",
      priority: "high",
      status: "open",
      created_at: "2026-09-20T12:00:00Z",
      resolved_at: null,
    },
  ],
  total: 1,
};

describe("NoteList", () => {
  it("shows an alert when notes are unavailable", () => {
    render(<NoteList notes={null} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Notes are unavailable. Try again shortly.",
    );
  });

  it("shows an empty state when there are no notes", () => {
    render(<NoteList notes={{ items: [], total: 0 }} />);

    expect(screen.getByText("No fleet notes have been submitted.")).toBeInTheDocument();
  });

  it("shows the note count and note details", () => {
    render(<NoteList notes={notes} />);

    expect(screen.getByRole("heading", { level: 2, name: "1 note" })).toBeInTheDocument();

    const note = screen.getByRole("article");
    expect(
      within(note).getByRole("heading", { level: 3, name: "Worn brake pads" }),
    ).toBeInTheDocument();
    expect(within(note).getByText("Brake pads worn on car 12.")).toBeInTheDocument();
    expect(within(note).getByText("high")).toBeInTheDocument();
    expect(within(note).getByText("mechanical")).toBeInTheDocument();
  });
});

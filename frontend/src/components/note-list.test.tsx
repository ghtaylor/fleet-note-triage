import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NoteList, type NoteListProps } from "@/components/note-list";

const notes = {
  availability: "available",
  items: [
    {
      id: "1d9f15de-fc3b-4ead-b076-bcaa83fbc630",
      note: {
        sourceText: "Brake pads worn on car 12.",
        title: "Worn brake pads",
        category: "mechanical",
        priority: "high",
        status: "open",
        createdAt: "2026-09-20T12:00:00Z",
      },
    },
  ],
  total: 1,
} satisfies NoteListProps;

describe("NoteList", () => {
  it("shows an alert when notes are unavailable", () => {
    render(<NoteList availability="unavailable" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Notes are unavailable. Try again shortly.",
    );
  });

  it("shows an empty state when there are no notes", () => {
    render(<NoteList availability="available" items={[]} total={0} />);

    expect(screen.getByText("No fleet notes have been submitted.")).toBeInTheDocument();
  });

  it("shows the note count and note details", () => {
    render(<NoteList availability="available" items={notes.items} total={notes.total} />);

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

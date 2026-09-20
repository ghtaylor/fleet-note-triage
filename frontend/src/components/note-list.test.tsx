import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { NoteStatusAction } from "@/actions/note-status";
import { NoteList, type NoteListProps } from "@/components/note-list";

const changeStatusAction: NoteStatusAction = async () => ({
  status: "success",
  message: "Note resolved.",
});

const notes = {
  availability: "available",
  items: [
    {
      id: "1d9f15de-fc3b-4ead-b076-bcaa83fbc630",
      sourceText: "Brake pads worn on car 12.",
      title: "Worn brake pads",
      category: "mechanical",
      priority: "high",
      status: "open",
      createdAt: "2026-09-20T12:00:00Z",
    },
  ],
  total: 1,
  hasActiveFilters: false,
  pagination: { page: 1, pageSize: 10 },
  changeStatusAction,
} satisfies NoteListProps;

describe("NoteList", () => {
  it("shows an alert when notes are unavailable", () => {
    render(<NoteList availability="unavailable" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Notes are unavailable. Try again shortly.",
    );
  });

  it("shows an empty state when there are no notes", () => {
    render(
      <NoteList
        availability="available"
        items={[]}
        total={0}
        hasActiveFilters={false}
        pagination={{ page: 1, pageSize: 10 }}
        changeStatusAction={changeStatusAction}
      />,
    );

    expect(screen.getByText("No fleet notes have been submitted.")).toBeInTheDocument();
  });

  it("shows a filtered empty state when no notes match", () => {
    render(
      <NoteList
        availability="available"
        items={[]}
        total={0}
        hasActiveFilters
        pagination={{ page: 1, pageSize: 10 }}
        changeStatusAction={changeStatusAction}
      />,
    );

    expect(screen.getByText("No notes match these filters.")).toBeInTheDocument();
  });

  it("shows the note count and note details", () => {
    render(
      <NoteList
        availability="available"
        items={notes.items}
        total={notes.total}
        hasActiveFilters={notes.hasActiveFilters}
        pagination={notes.pagination}
        changeStatusAction={notes.changeStatusAction}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "1 note" })).toBeInTheDocument();

    const note = screen.getByRole("article");
    expect(
      within(note).getByRole("heading", { level: 3, name: "Worn brake pads" }),
    ).toBeInTheDocument();
    expect(note).toHaveTextContent("Brake pads worn on car 12.");
    expect(within(note).getByText("high")).toBeInTheDocument();
    expect(within(note).getByText("mechanical")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
  });

  it("links to the previous and next pages", () => {
    render(
      <NoteList
        {...notes}
        total={25}
        pagination={{
          page: 2,
          pageSize: 10,
          previousHref: "/?page=1",
          nextHref: "/?page=3",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/?page=1");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/?page=3");
    expect(screen.getByText("Showing 11–11 of 25")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });
});

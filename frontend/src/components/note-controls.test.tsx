import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NoteControls, NoteStatusTabs } from "@/components/note-controls";
import type { NoteQuery } from "@/data/note-query";

const { replaceRoute } = vi.hoisted(() => ({ replaceRoute: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceRoute }),
}));

describe("NoteControls", () => {
  beforeEach(() => {
    replaceRoute.mockReset();
  });

  it("shows the active filters and sorting", () => {
    const query: NoteQuery = {
      category: "mechanical",
      priority: "high",
      status: "open",
      sortBy: "created_at",
      direction: "asc",
    };

    render(
      <>
        <NoteStatusTabs query={query} />
        <NoteControls query={query} />
      </>,
    );

    expect(screen.getByRole("combobox", { name: "Category" })).toHaveValue("mechanical");
    expect(screen.getByRole("combobox", { name: "Priority" })).toHaveValue("high");
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue("created_at");
    expect(screen.getByRole("combobox", { name: "Direction" })).toHaveValue("asc");
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/");
  });

  it("links status tabs while preserving the active query", () => {
    render(
      <NoteStatusTabs
        query={{ category: "mechanical", sortBy: "priority", direction: "desc" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Resolved" })).toHaveAttribute(
      "href",
      "/?category=mechanical&status=resolved",
    );
  });

  it("updates the URL immediately and omits default query parameters", () => {
    render(<NoteControls query={{ sortBy: "priority", direction: "desc" }} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), {
      target: { value: "mechanical" },
    });

    expect(replaceRoute).toHaveBeenCalledWith("/?category=mechanical", { scroll: false });
  });

  it("removes a query parameter when its default is selected", () => {
    render(
      <NoteControls
        query={{ category: "mechanical", sortBy: "created_at", direction: "desc" }}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "priority" },
    });

    expect(replaceRoute).toHaveBeenCalledWith("/?category=mechanical", { scroll: false });
  });
});

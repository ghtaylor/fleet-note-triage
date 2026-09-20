import { describe, expect, it } from "vitest";

import { createNoteSearchParams, parseNoteQuery } from "@/data/note-query";

describe("parseNoteQuery", () => {
  it("parses supported filters and sorting", () => {
    expect(
      parseNoteQuery({
        category: "mechanical",
        priority: "high",
        status: "open",
        sort_by: "created_at",
        direction: "asc",
        page: "3",
      }),
    ).toEqual({
      category: "mechanical",
      priority: "high",
      status: "open",
      sortBy: "created_at",
      direction: "asc",
      page: 3,
    });
  });

  it("ignores invalid and repeated values while preserving valid values", () => {
    expect(
      parseNoteQuery({
        category: "invalid",
        priority: "critical",
        status: ["open", "resolved"],
        sort_by: "invalid",
        direction: "invalid",
      }),
    ).toEqual({
      category: undefined,
      priority: "critical",
      status: "open",
      sortBy: "priority",
      direction: "desc",
      page: 1,
    });
  });

  it("uses an explicit value to show all statuses", () => {
    const query = parseNoteQuery({ status: "all" });

    expect(query.status).toBeUndefined();
    expect(createNoteSearchParams(query).get("status")).toBe("all");
  });

  it("omits the default open status", () => {
    const query = parseNoteQuery({});

    expect(query.status).toBe("open");
    expect(createNoteSearchParams(query).has("status")).toBe(false);
  });

  it("defaults invalid page values to the first page", () => {
    expect(parseNoteQuery({ page: "0" }).page).toBe(1);
    expect(parseNoteQuery({ page: "2.5" }).page).toBe(1);
    expect(parseNoteQuery({ page: ["1", "2"] }).page).toBe(1);
  });
});

import { describe, expect, it } from "vitest";

import { parseNoteQuery } from "@/data/note-query";

describe("parseNoteQuery", () => {
  it("parses supported filters and sorting", () => {
    expect(
      parseNoteQuery({
        category: "mechanical",
        priority: "high",
        status: "open",
        sort_by: "created_at",
        direction: "asc",
      }),
    ).toEqual({
      category: "mechanical",
      priority: "high",
      status: "open",
      sortBy: "created_at",
      direction: "asc",
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
      status: undefined,
      sortBy: "priority",
      direction: "desc",
    });
  });
});

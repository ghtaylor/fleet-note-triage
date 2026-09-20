import { describe, expect, it } from "vitest";

import { fetchNotes } from "./notes";

const backendUrl = "https://api.example.test";

const noteListResponse = {
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

describe("fetchNotes", () => {
  it("sends filters and sorting as query parameters", async () => {
    const request = async (input: RequestInfo | URL) => {
      expect(input.toString()).toBe(
        "https://api.example.test/notes?category=mechanical&priority=high&status=open&sort_by=created_at&direction=asc&limit=10&offset=20",
      );
      return Response.json(noteListResponse);
    };

    await fetchNotes(
      backendUrl,
      {
        category: "mechanical",
        priority: "high",
        status: "open",
        sortBy: "created_at",
        direction: "asc",
        page: 3,
      },
      request,
    );
  });

  it("rejects when the backend rejects the request", async () => {
    const request = async () => new Response(null, { status: 503 });

    await expect(fetchNotes(backendUrl, {}, request)).rejects.toThrow(
      "Notes request failed with status 503",
    );
  });

  it("rejects when the backend response is invalid", async () => {
    const request = async () => Response.json({ items: "invalid", total: 1 });

    await expect(fetchNotes(backendUrl, {}, request)).rejects.toThrow(
      "Notes response did not match the API contract",
    );
  });
});

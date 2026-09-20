import { describe, expect, it } from "vitest";

import { setNoteStatus } from "@/data/set-note-status";

const note = {
  id: "1d9f15de-fc3b-4ead-b076-bcaa83fbc630",
  source_text: "Brake pads worn on car 12.",
  title: "Worn brake pads",
  category: "mechanical",
  priority: "high",
  status: "resolved",
  created_at: "2026-09-20T12:00:00Z",
  resolved_at: "2026-09-20T12:30:00Z",
};

describe("setNoteStatus", () => {
  it("updates a note and returns the validated response", async () => {
    const request = async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input.toString()).toBe(`http://localhost:8000/notes/${note.id}`);
      expect(init?.method).toBe("PATCH");
      expect(init?.headers).toEqual({ "Content-Type": "application/json" });
      expect(init?.body).toBe(JSON.stringify({ status: "resolved" }));
      return Response.json(note);
    };

    await expect(
      setNoteStatus("http://localhost:8000", note.id, { status: "resolved" }, request),
    ).resolves.toEqual(note);
  });

  it("rejects a response that does not match the contract", async () => {
    const request = async () => Response.json({ status: "resolved" });

    await expect(
      setNoteStatus("http://localhost:8000", note.id, { status: "resolved" }, request),
    ).rejects.toThrow("Set note status response did not match the API contract");
  });
});

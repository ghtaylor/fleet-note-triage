import { describe, expect, it } from "vitest";

import { CreateNoteError, createNote } from "./create-note";

const createdNote = {
  id: "1d9f15de-fc3b-4ead-b076-bcaa83fbc630",
  source_text: "Brake pads worn on car 12.",
  title: "Worn brake pads",
  category: "mechanical",
  priority: "high",
  status: "open",
  created_at: "2026-09-20T12:00:00Z",
  resolved_at: null,
};

describe("createNote", () => {
  it("submits source text and returns the validated note", async () => {
    const request = async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.headers).toEqual({ "Content-Type": "application/json" });
      expect(init?.body).toBe(JSON.stringify({ source_text: createdNote.source_text }));
      return Response.json(createdNote, { status: 201 });
    };

    await expect(
      createNote("http://localhost:8000", createdNote.source_text, request),
    ).resolves.toEqual(createdNote);
  });

  it("reports unactionable source text", async () => {
    const request = async () =>
      Response.json({ detail: "source_text_not_actionable" }, { status: 422 });

    await expect(createNote("http://localhost:8000", "unclear", request)).rejects.toMatchObject({
      code: "source_text_not_actionable",
    } satisfies Partial<CreateNoteError>);
  });

  it("reports unavailable extraction", async () => {
    const request = async () =>
      Response.json({ detail: "extraction_unavailable" }, { status: 503 });

    await expect(createNote("http://localhost:8000", "Brake issue", request)).rejects.toMatchObject({
      code: "extraction_unavailable",
    } satisfies Partial<CreateNoteError>);
  });

  it("rejects a successful response that does not match the contract", async () => {
    const request = async () => Response.json({ title: "Incomplete" }, { status: 201 });

    await expect(createNote("http://localhost:8000", "Brake issue", request)).rejects.toThrow(
      "Create note response did not match the API contract",
    );
  });
});

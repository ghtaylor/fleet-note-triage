import { describe, expect, it } from "vitest";

import { CreateNoteError, createNote } from "./create-note";

const backendUrl = "https://api.example.test";

function noteRequest(sourceText: string) {
  return { source_text: sourceText };
}

describe("createNote", () => {
  it("reports unactionable source text", async () => {
    const request = async () =>
      Response.json({ detail: "source_text_not_actionable" }, { status: 422 });

    await expect(
      createNote(backendUrl, noteRequest("unclear"), request),
    ).rejects.toMatchObject({
      code: "source_text_not_actionable",
    } satisfies Partial<CreateNoteError>);
  });

  it("reports unavailable extraction", async () => {
    const request = async () =>
      Response.json({ detail: "extraction_unavailable" }, { status: 503 });

    await expect(
      createNote(backendUrl, noteRequest("Brake issue"), request),
    ).rejects.toMatchObject({
      code: "extraction_unavailable",
    } satisfies Partial<CreateNoteError>);
  });

  it("rejects a successful response that does not match the contract", async () => {
    const request = async () => Response.json({ title: "Incomplete" }, { status: 201 });

    await expect(
      createNote(backendUrl, noteRequest("Brake issue"), request),
    ).rejects.toThrow("Create note response did not match the API contract");
  });
});

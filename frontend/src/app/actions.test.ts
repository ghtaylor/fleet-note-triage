import { refresh } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initialNoteSubmissionState } from "@/actions/note-submission";
import { submitNote } from "@/app/actions";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));

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

function submissionData(sourceText: string) {
  const formData = new FormData();
  formData.set("source_text", sourceText);
  return formData;
}

describe("submitNote", () => {
  beforeEach(() => {
    vi.stubEnv("BACKEND_URL", "https://api.example.test");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("rejects whitespace-only source text without calling the backend", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    await expect(submitNote(initialNoteSubmissionState, submissionData("   "))).resolves.toEqual({
      status: "error",
      message: "Enter between 1 and 2,000 characters.",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("returns guidance when source text is not actionable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ detail: "source_text_not_actionable" }, { status: 422 }),
      ),
    );

    await expect(
      submitNote(initialNoteSubmissionState, submissionData("unclear")),
    ).resolves.toEqual({
      status: "error",
      message: "Describe a specific vehicle issue and try again.",
    });
  });

  it("refreshes the dashboard after creating a note", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(createdNote, { status: 201 })));

    await expect(
      submitNote(initialNoteSubmissionState, submissionData(createdNote.source_text)),
    ).resolves.toEqual({ status: "success", message: "Note added." });
    expect(refresh).toHaveBeenCalledOnce();
  });
});

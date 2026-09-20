import { refresh } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initialNoteStatusState } from "@/actions/note-status";
import { initialNoteSubmissionState } from "@/actions/note-submission";
import { changeNoteStatus, submitNote } from "@/app/actions";

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

function statusData(status: string) {
  const formData = new FormData();
  formData.set("note_id", createdNote.id);
  formData.set("status", status);
  return formData;
}

beforeEach(() => {
  vi.stubEnv("BACKEND_URL", "https://api.example.test");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("submitNote", () => {
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

  it("submits the note and refreshes the dashboard", async () => {
    const request = vi.fn<typeof fetch>(async () =>
      Response.json(createdNote, { status: 201 }),
    );
    vi.stubGlobal("fetch", request);

    await expect(
      submitNote(initialNoteSubmissionState, submissionData(createdNote.source_text)),
    ).resolves.toEqual({ status: "success", message: "Note added." });

    expect(request).toHaveBeenCalledOnce();
    const [url, options] = request.mock.calls[0];
    expect(url.toString()).toBe("https://api.example.test/notes");
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_text: createdNote.source_text }),
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});

describe("changeNoteStatus", () => {
  it("confirms a successful resolution and refreshes the dashboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          ...createdNote,
          status: "resolved",
          resolved_at: "2026-09-20T12:30:00Z",
        }),
      ),
    );

    await expect(
      changeNoteStatus(initialNoteStatusState, statusData("resolved")),
    ).resolves.toEqual({ status: "success", message: "Note resolved." });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("rejects invalid status input without calling the backend", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    await expect(changeNoteStatus(initialNoteStatusState, statusData("invalid"))).resolves.toEqual({
      status: "error",
      message: "The note status could not be updated. Try again.",
    });
    expect(request).not.toHaveBeenCalled();
  });
});

"use server";

import { refresh } from "next/cache";

import type { NoteSubmissionState } from "@/actions/note-submission";
import { zSubmitNoteRequest } from "@/api/zod.gen";
import { CreateNoteError, createNote } from "@/data/create-note";

const INVALID_SOURCE_TEXT_MESSAGE = "Enter between 1 and 2,000 characters.";
const UNACTIONABLE_SOURCE_TEXT_MESSAGE = "Describe a specific vehicle issue and try again.";
const EXTRACTION_UNAVAILABLE_MESSAGE =
  "Note extraction is unavailable. Your text is still here; try again shortly.";
const SUBMISSION_FAILED_MESSAGE = "The note could not be submitted. Try again shortly.";

export async function submitNote(
  _previousState: NoteSubmissionState,
  formData: FormData,
): Promise<NoteSubmissionState> {
  const rawSourceText = formData.get("source_text");
  const request = zSubmitNoteRequest.safeParse({
    source_text: typeof rawSourceText === "string" ? rawSourceText.trim() : rawSourceText,
  });

  if (!request.success) {
    return { status: "error", message: INVALID_SOURCE_TEXT_MESSAGE };
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return { status: "error", message: SUBMISSION_FAILED_MESSAGE };
  }

  try {
    await createNote(backendUrl, request.data);
  } catch (error) {
    if (error instanceof CreateNoteError) {
      if (error.code === "source_text_not_actionable") {
        return { status: "error", message: UNACTIONABLE_SOURCE_TEXT_MESSAGE };
      }
      if (error.code === "extraction_unavailable") {
        return { status: "error", message: EXTRACTION_UNAVAILABLE_MESSAGE };
      }
    }

    console.error("Failed to submit fleet note", error);
    return { status: "error", message: SUBMISSION_FAILED_MESSAGE };
  }

  refresh();
  return { status: "success", message: "Note added." };
}

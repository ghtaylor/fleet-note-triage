"use server";

import { refresh } from "next/cache";

import type { NoteStatusState } from "@/actions/note-status";
import type { NoteSubmissionState } from "@/actions/note-submission";
import {
  zPatchNoteNotesNoteIdPatchPath,
  zSetNoteStatusRequest,
  zSubmitNoteRequest,
} from "@/api/zod.gen";
import { CreateNoteError, createNote } from "@/data/create-note";
import { setNoteStatus } from "@/data/set-note-status";

const INVALID_SOURCE_TEXT_MESSAGE = "Enter between 1 and 2,000 characters.";
const UNACTIONABLE_SOURCE_TEXT_MESSAGE = "Describe a specific vehicle issue and try again.";
const EXTRACTION_UNAVAILABLE_MESSAGE =
  "Note extraction is unavailable. Your text is still here; try again shortly.";
const SUBMISSION_FAILED_MESSAGE = "The note could not be submitted. Try again shortly.";
const STATUS_UPDATE_FAILED_MESSAGE = "The note status could not be updated. Try again.";

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

export async function changeNoteStatus(
  _previousState: NoteStatusState,
  formData: FormData,
): Promise<NoteStatusState> {
  const path = zPatchNoteNotesNoteIdPatchPath.safeParse({
    note_id: formData.get("note_id"),
  });
  const body = zSetNoteStatusRequest.safeParse({
    status: formData.get("status"),
  });
  const backendUrl = process.env.BACKEND_URL;

  if (!path.success || !body.success || !backendUrl) {
    return { status: "error", message: STATUS_UPDATE_FAILED_MESSAGE };
  }

  try {
    await setNoteStatus(backendUrl, path.data.note_id, body.data);
  } catch (error) {
    console.error("Failed to update fleet note status", error);
    return { status: "error", message: STATUS_UPDATE_FAILED_MESSAGE };
  }

  refresh();
  return {
    status: "success",
    message: body.data.status === "resolved" ? "Note resolved." : "Note reopened.",
  };
}

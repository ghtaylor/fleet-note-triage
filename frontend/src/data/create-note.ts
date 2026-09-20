import type { NoteResponse, SubmitNoteRequest } from "@/api/types.gen";
import { zErrorResponse, zNoteResponse } from "@/api/zod.gen";

const CREATE_NOTE_TIMEOUT_MS = 10_000;

type CreateNoteErrorCode =
  | "extraction_unavailable"
  | "request_failed"
  | "source_text_not_actionable";

export class CreateNoteError extends Error {
  constructor(readonly code: CreateNoteErrorCode, options?: ErrorOptions) {
    super(`Create note failed: ${code}`, options);
    this.name = "CreateNoteError";
  }
}

export async function createNote(
  backendUrl: string,
  body: SubmitNoteRequest,
  request: typeof fetch = fetch,
): Promise<NoteResponse> {
  let response: Response;
  try {
    response = await request(new URL("/notes", backendUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CREATE_NOTE_TIMEOUT_MS),
    });
  } catch (error) {
    throw new CreateNoteError("request_failed", { cause: error });
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch (error) {
    throw new CreateNoteError("request_failed", { cause: error });
  }

  if (!response.ok) {
    const errorResponse = zErrorResponse.safeParse(responseBody);
    if (
      errorResponse.success &&
      (errorResponse.data.detail === "extraction_unavailable" ||
        errorResponse.data.detail === "source_text_not_actionable")
    ) {
      throw new CreateNoteError(errorResponse.data.detail);
    }
    throw new CreateNoteError("request_failed");
  }

  const result = zNoteResponse.safeParse(responseBody);
  if (!result.success) {
    throw new Error("Create note response did not match the API contract", {
      cause: result.error,
    });
  }

  return result.data;
}

import type { NoteResponse, SetNoteStatusRequest } from "@/api/types.gen";
import { zNoteResponse } from "@/api/zod.gen";

const SET_NOTE_STATUS_TIMEOUT_MS = 5_000;

export async function setNoteStatus(
  backendUrl: string,
  noteId: string,
  body: SetNoteStatusRequest,
  request: typeof fetch = fetch,
): Promise<NoteResponse> {
  let response: Response;
  try {
    response = await request(new URL(`/notes/${encodeURIComponent(noteId)}`, backendUrl), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SET_NOTE_STATUS_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error("Set note status request failed", { cause: error });
  }

  if (!response.ok) {
    throw new Error(`Set note status request failed with status ${response.status}`);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch (error) {
    throw new Error("Set note status response was not valid JSON", { cause: error });
  }

  const result = zNoteResponse.safeParse(responseBody);
  if (!result.success) {
    throw new Error("Set note status response did not match the API contract", {
      cause: result.error,
    });
  }

  return result.data;
}

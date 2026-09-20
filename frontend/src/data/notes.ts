import type { NoteListResponse } from "../api/types.gen";
import { zNoteListResponse } from "../api/zod.gen";

const NOTES_REQUEST_TIMEOUT_MS = 5_000;

export async function fetchNotes(
  backendUrl: string,
  request: typeof fetch = fetch,
): Promise<NoteListResponse> {
  let response: Response;
  try {
    response = await request(new URL("/notes", backendUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(NOTES_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error("Notes request failed", { cause: error });
  }

  if (!response.ok) {
    throw new Error(`Notes request failed with status ${response.status}`);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch (error) {
    throw new Error("Notes response was not valid JSON", { cause: error });
  }

  const result = zNoteListResponse.safeParse(responseBody);
  if (!result.success) {
    throw new Error("Notes response did not match the API contract", { cause: result.error });
  }

  return result.data;
}

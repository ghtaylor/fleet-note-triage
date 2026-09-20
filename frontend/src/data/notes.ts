import type { NoteListResponse } from "@/api/types.gen";
import { zNoteListResponse } from "@/api/zod.gen";
import type { NoteQuery } from "@/data/note-query";

const NOTES_REQUEST_TIMEOUT_MS = 5_000;
export const NOTES_PAGE_SIZE = 10;

export async function fetchNotes(
  backendUrl: string,
  query: Partial<NoteQuery> = {},
  request: typeof fetch = fetch,
): Promise<NoteListResponse> {
  const url = new URL("/notes", backendUrl);
  if (query.category) url.searchParams.set("category", query.category);
  if (query.priority) url.searchParams.set("priority", query.priority);
  if (query.status) url.searchParams.set("status", query.status);
  if (query.sortBy) url.searchParams.set("sort_by", query.sortBy);
  if (query.direction) url.searchParams.set("direction", query.direction);
  const page = query.page ?? 1;
  url.searchParams.set("limit", String(NOTES_PAGE_SIZE));
  url.searchParams.set("offset", String((page - 1) * NOTES_PAGE_SIZE));

  let response: Response;
  try {
    response = await request(url, {
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

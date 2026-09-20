import type {
  NoteCategory,
  NotePriority,
  NoteSortField,
  NoteStatus,
  SortDirection,
} from "@/api/types.gen";
import {
  zNoteCategory,
  zNotePriority,
  zNoteSortField,
  zNoteStatus,
  zSortDirection,
} from "@/api/zod.gen";

export type NoteQuery = {
  category?: NoteCategory;
  priority?: NotePriority;
  status?: NoteStatus;
  sortBy: NoteSortField;
  direction: SortDirection;
  page: number;
};

function parseOptional<T>(result: { success: true; data: T } | { success: false }): T | undefined {
  return result.success ? result.data : undefined;
}

function parsePage(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function createNoteSearchParams(query: NoteQuery) {
  const searchParams = new URLSearchParams();
  if (query.category) searchParams.set("category", query.category);
  if (query.priority) searchParams.set("priority", query.priority);
  if (query.status) searchParams.set("status", query.status);
  if (query.sortBy !== "priority") searchParams.set("sort_by", query.sortBy);
  if (query.direction !== "desc") searchParams.set("direction", query.direction);
  if (query.page > 1) searchParams.set("page", String(query.page));
  return searchParams;
}

export function noteQueryHref(query: NoteQuery) {
  const queryString = createNoteSearchParams(query).toString();
  return queryString ? `/?${queryString}` : "/";
}

export function parseNoteQuery(
  searchParams: Awaited<PageProps<"/">["searchParams"]>,
): NoteQuery {
  return {
    category: parseOptional(zNoteCategory.safeParse(searchParams.category)),
    priority: parseOptional(zNotePriority.safeParse(searchParams.priority)),
    status: parseOptional(zNoteStatus.safeParse(searchParams.status)),
    sortBy: parseOptional(zNoteSortField.safeParse(searchParams.sort_by)) ?? "priority",
    direction: parseOptional(zSortDirection.safeParse(searchParams.direction)) ?? "desc",
    page: parsePage(searchParams.page),
  };
}

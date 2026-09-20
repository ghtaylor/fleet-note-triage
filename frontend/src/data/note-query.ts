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
};

function parseOptional<T>(result: { success: true; data: T } | { success: false }): T | undefined {
  return result.success ? result.data : undefined;
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
  };
}

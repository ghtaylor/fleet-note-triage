"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useTransition } from "react";

import {
  createNoteSearchParams,
  noteQueryHref,
  type NoteQuery,
} from "@/data/note-query";

type QueryParameter = "category" | "priority" | "sort_by" | "direction";

const statusTabs = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: undefined },
] as const;

const selectClassName =
  "min-h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-orange-600 focus:ring-3 focus:ring-orange-600/15 disabled:bg-gray-100";

type SelectFieldProps = {
  label: string;
  name: QueryParameter;
  value: string;
  disabled: boolean;
  onValueChange: (name: QueryParameter, value: string) => void;
  children: ReactNode;
};

function SelectField({
  label,
  name,
  value,
  disabled,
  onValueChange,
  children,
}: SelectFieldProps) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(name, event.target.value)}
        className={selectClassName}
      >
        {children}
      </select>
    </label>
  );
}

function isDefaultValue(name: QueryParameter, value: string) {
  return (name === "sort_by" && value === "priority") || (name === "direction" && value === "desc");
}

export function NoteStatusTabs({ query }: { query: NoteQuery }) {
  return (
    <nav aria-label="Status filters" className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {statusTabs.map((tab) => {
        const isActive = query.status === tab.value;
        return (
          <Link
            key={tab.label}
            href={noteQueryHref({ ...query, status: tab.value, page: 1 })}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "rounded-md px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600",
              isActive
                ? "bg-white text-gray-950 shadow-sm"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function NoteControls({ query }: { query: NoteQuery }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasActiveFilters = Boolean(query.category || query.priority);
  const clearFiltersHref = noteQueryHref({
    ...query,
    category: undefined,
    priority: undefined,
    page: 1,
  });

  function updateQuery(name: QueryParameter, value: string) {
    const searchParams = createNoteSearchParams({ ...query, page: 1 });
    if (!value || isDefaultValue(name, value)) {
      searchParams.delete(name);
    } else {
      searchParams.set(name, value);
    }

    const queryString = searchParams.toString();
    startTransition(() => {
      router.replace(queryString ? `/?${queryString}` : "/", { scroll: false });
    });
  }

  return (
    <section aria-label="Filter and sort notes" aria-busy={isPending}>
      <div className="grid gap-2 border-y border-gray-200 bg-gray-50 px-4 py-3 sm:grid-cols-2 sm:px-5 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <SelectField
          label="Category"
          name="category"
          value={query.category ?? ""}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="">Category: All</option>
          <option value="mechanical">Mechanical</option>
          <option value="electrical">Electrical</option>
          <option value="software">Software</option>
          <option value="safety">Safety</option>
          <option value="other">Other</option>
        </SelectField>
        <SelectField
          label="Priority"
          name="priority"
          value={query.priority ?? ""}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="">Priority: All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </SelectField>
        <SelectField
          label="Sort by"
          name="sort_by"
          value={query.sortBy}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="priority">Sort: Priority</option>
          <option value="created_at">Sort: Created</option>
        </SelectField>
        <SelectField
          label="Direction"
          name="direction"
          value={query.direction ?? "desc"}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="desc">Direction: Descending</option>
          <option value="asc">Direction: Ascending</option>
        </SelectField>
        {hasActiveFilters && (
          <Link
            href={clearFiltersHref}
            scroll={false}
            className="flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:col-span-2 xl:col-span-1"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none">
              <path d="M4 4l8 8m0-8-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
            Clear filters
          </Link>
        )}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {isPending ? "Updating notes…" : ""}
      </p>
    </section>
  );
}

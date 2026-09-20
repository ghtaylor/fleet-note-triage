"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useTransition } from "react";

import type { NoteQuery } from "@/data/note-query";

type QueryParameter = "category" | "priority" | "sort_by" | "direction";

const statusTabs = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: undefined },
] as const;

const selectClassName =
  "min-h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 disabled:bg-gray-100";

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
        defaultValue={value}
        disabled={disabled}
        onChange={(event) => onValueChange(name, event.target.value)}
        className={selectClassName}
      >
        {children}
      </select>
    </label>
  );
}

function createSearchParams(query: NoteQuery) {
  const searchParams = new URLSearchParams();
  if (query.category) searchParams.set("category", query.category);
  if (query.priority) searchParams.set("priority", query.priority);
  if (query.status) searchParams.set("status", query.status);
  if (query.sortBy !== "priority") {
    searchParams.set("sort_by", query.sortBy);
  }
  if (query.direction && query.direction !== "desc") {
    searchParams.set("direction", query.direction);
  }
  return searchParams;
}

function isDefaultValue(name: QueryParameter, value: string) {
  return (name === "sort_by" && value === "priority") || (name === "direction" && value === "desc");
}

function queryHref(query: NoteQuery) {
  const queryString = createSearchParams(query).toString();
  return queryString ? `/?${queryString}` : "/";
}

export function NoteStatusTabs({ query }: { query: NoteQuery }) {
  return (
    <nav aria-label="Status filters" className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {statusTabs.map((tab) => {
        const isActive = query.status === tab.value;
        return (
          <Link
            key={tab.label}
            href={queryHref({ ...query, status: tab.value })}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "rounded-md px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500",
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

  function updateQuery(name: QueryParameter, value: string) {
    const searchParams = createSearchParams(query);
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
      <div className="grid gap-2 border-y border-gray-200 bg-gray-50 px-4 py-3 sm:grid-cols-2 sm:px-5 xl:grid-cols-4">
        <SelectField
          key={`category:${query.category ?? "all"}`}
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
          key={`priority:${query.priority ?? "all"}`}
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
          key={`sort:${query.sortBy}`}
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
          key={`direction:${query.direction ?? "desc"}`}
          label="Direction"
          name="direction"
          value={query.direction ?? "desc"}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="desc">Direction: Descending</option>
          <option value="asc">Direction: Ascending</option>
        </SelectField>
      </div>
      <div className="flex min-h-7 items-center justify-between px-4 sm:px-5">
        <p
          role="status"
          aria-live="polite"
          className={clsx(
            "text-xs text-gray-500 transition-opacity duration-150",
            isPending ? "opacity-100 delay-200" : "opacity-0 delay-0",
          )}
        >
          {isPending ? "Updating notes…" : ""}
        </p>
        <Link
          href="/"
          scroll={false}
          className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-orange-500"
        >
          Clear filters
        </Link>
      </div>
    </section>
  );
}

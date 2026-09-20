"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useTransition } from "react";

import type { NoteQuery } from "@/data/note-query";

type QueryParameter = "category" | "priority" | "status" | "sort_by" | "direction";

const selectClassName =
  "mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:bg-gray-100";

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
    <label className="text-sm font-medium">
      {label}
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
    <section
      aria-labelledby="note-controls-heading"
      aria-busy={isPending}
      className="mb-6 rounded border border-gray-200 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="note-controls-heading" className="font-medium">
          Filter and sort
        </h2>
        <Link
          href="/"
          scroll={false}
          className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Clear
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SelectField
          key={`category:${query.category ?? "all"}`}
          label="Category"
          name="category"
          value={query.category ?? ""}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="">All categories</option>
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
          <option value="">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </SelectField>
        <SelectField
          key={`status:${query.status ?? "all"}`}
          label="Status"
          name="status"
          value={query.status ?? ""}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </SelectField>
        <SelectField
          key={`sort:${query.sortBy}`}
          label="Sort by"
          name="sort_by"
          value={query.sortBy}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="priority">Priority</option>
          <option value="created_at">Created</option>
        </SelectField>
        <SelectField
          key={`direction:${query.direction ?? "desc"}`}
          label="Direction"
          name="direction"
          value={query.direction ?? "desc"}
          disabled={isPending}
          onValueChange={updateQuery}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </SelectField>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-gray-500">
        {isPending ? "Updating notes…" : ""}
      </p>
    </section>
  );
}

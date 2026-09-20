import type { NoteListResponse } from "@/api/types.gen";
import { changeNoteStatus, submitNote } from "@/app/actions";
import { NoteComposer } from "@/components/note-composer";
import { NoteControls, NoteStatusTabs } from "@/components/note-controls";
import { NoteList } from "@/components/note-list";
import { parseNoteQuery, type NoteQuery } from "@/data/note-query";
import { fetchNotes } from "@/data/notes";

async function loadNotes(
  backendUrl: string,
  query: NoteQuery,
): Promise<NoteListResponse | null> {
  try {
    return await fetchNotes(backendUrl, query);
  } catch (error) {
    console.error("Failed to load fleet notes", error);
    return null;
  }
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const query = parseNoteQuery(await searchParams);
  const backendUrl = process.env.BACKEND_URL;
  const notes = backendUrl ? await loadNotes(backendUrl, query) : null;
  const noteList = notes ? (
    <NoteList
      availability="available"
      total={notes.total}
      items={notes.items.map((note) => ({
        id: note.id,
        title: note.title,
        status: note.status,
        sourceText: note.source_text,
        priority: note.priority,
        category: note.category,
        createdAt: note.created_at,
      }))}
      changeStatusAction={changeNoteStatus}
    />
  ) : (
    <NoteList availability="unavailable" />
  );

  return (
    <>
      <header className="flex h-14 items-center border-b-2 border-orange-500 bg-gray-950 px-4 text-white sm:px-7">
        <span className="text-sm font-bold tracking-tight">Fleet Note Triage</span>
      </header>
      <main className="mx-auto max-w-7xl px-3 pt-5 pb-[26rem] sm:px-6 lg:py-7">
        <header className="ui-enter mb-5">
          <h1 className="text-3xl font-bold tracking-tight">Fleet notes</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            Capture technician issues, triage them automatically, and work the most urgent open
            items first.
          </p>
        </header>
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <aside className="ui-enter ui-enter-delay-1 fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [&>form]:max-h-[calc(100dvh-1rem)] [&>form]:overflow-y-auto [&>form]:shadow-[0_-12px_32px_rgb(0_0_0/0.12)] lg:sticky lg:inset-x-auto lg:top-5 lg:bottom-auto lg:p-0 lg:[&>form]:max-h-none lg:[&>form]:overflow-visible lg:[&>form]:shadow-none">
            <NoteComposer submitAction={submitNote} />
          </aside>
          <section
            aria-label="Fleet note dashboard"
            className="ui-enter ui-enter-delay-2 overflow-hidden rounded-xl border border-gray-200 bg-white lg:col-span-2"
          >
            <header className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Notes</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Open issues are shown in priority order by default.
                </p>
              </div>
              <NoteStatusTabs query={query} />
            </header>
            <NoteControls query={query} />
            {noteList}
          </section>
        </div>
      </main>
    </>
  );
}

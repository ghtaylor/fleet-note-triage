import { submitNote } from "@/app/actions";
import { NoteComposer } from "@/components/note-composer";
import { NoteControls } from "@/components/note-controls";
import { NoteList } from "@/components/note-list";
import { parseNoteQuery, type NoteQuery } from "@/data/note-query";
import { fetchNotes } from "@/data/notes";

async function loadNotes(backendUrl: string, query: NoteQuery) {
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
        note: {
          title: note.title,
          status: note.status,
          sourceText: note.source_text,
          priority: note.priority,
          category: note.category,
          createdAt: note.created_at,
        },
      }))}
    />
  ) : (
    <NoteList availability="unavailable" />
  );

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-4 pt-4 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8">
      <header className="mb-6 lg:col-start-2 lg:row-start-1">
        <h1 className="text-2xl font-semibold">Fleet Note Triage</h1>
        <p className="mt-1 text-gray-600">Open and resolved vehicle issues, ordered by urgency.</p>
      </header>
      <div className="pb-6 lg:col-start-2 lg:row-start-2">
        <NoteControls query={query} />
      </div>
      <div className="pb-6 lg:col-start-2 lg:row-start-3">{noteList}</div>
      <aside className="sticky bottom-0 mt-auto bg-white pt-4 pb-4 lg:top-6 lg:bottom-auto lg:col-start-1 lg:row-start-1 lg:row-span-3 lg:mt-0 lg:self-start lg:pt-0 lg:pb-6">
        <NoteComposer submitAction={submitNote} />
      </aside>
    </main>
  );
}

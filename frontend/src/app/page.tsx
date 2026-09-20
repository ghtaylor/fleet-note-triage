import { submitNote } from "@/app/actions";
import { NoteComposer } from "@/components/note-composer";
import { NoteList } from "@/components/note-list";
import { fetchNotes } from "@/data/notes";

async function loadNotes(backendUrl: string) {
  try {
    return await fetchNotes(backendUrl);
  } catch (error) {
    console.error("Failed to load fleet notes", error);
    return null;
  }
}

export default async function Home() {
  const backendUrl = process.env.BACKEND_URL;
  const notes = backendUrl ? await loadNotes(backendUrl) : null;
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
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pt-4 sm:px-6 sm:pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Fleet Note Triage</h1>
        <p className="mt-1 text-gray-600">Open and resolved vehicle issues, ordered by urgency.</p>
      </header>
      <div className="pb-6">{noteList}</div>
      <NoteComposer submitAction={submitNote} />
    </main>
  );
}

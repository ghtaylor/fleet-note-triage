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

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Fleet Note Triage</h1>
        <p className="mt-1 text-gray-600">Open and resolved vehicle issues, ordered by urgency.</p>
      </header>
      <NoteList notes={notes} />
    </main>
  );
}

import { createFileRoute, useSearch } from "@tanstack/react-router";

import { NoteForm } from "@/components/NoteForm";

interface NewNoteSearch {
  year?: string;
  semester?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
}

export const Route = createFileRoute("/_app/notes/new")({
  validateSearch: (search: Record<string, unknown>): NewNoteSearch => ({
    ...(typeof search["year"] === "string" ? { year: search["year"] } : {}),
    ...(typeof search["semester"] === "string" ? { semester: search["semester"] } : {}),
    ...(typeof search["subject"] === "string" ? { subject: search["subject"] } : {}),
    ...(typeof search["chapter"] === "string" ? { chapter: search["chapter"] } : {}),
    ...(typeof search["topic"] === "string" ? { topic: search["topic"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "New Note — BTech Notes" },
      { name: "description", content: "Write a new note with rich text formatting and file attachments." },
      { property: "og:title", content: "New Note — BTech Notes" },
      { property: "og:description", content: "Write a new note with rich formatting and attachments." },
    ],
  }),
  component: NewNotePage,
});

function NewNotePage() {
  const search = useSearch({ from: "/_app/notes/new" });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New note</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Place it in the hierarchy, write it up, and attach any reference material.
        </p>
      </header>
      <NoteForm defaults={search} />
    </div>
  );
}

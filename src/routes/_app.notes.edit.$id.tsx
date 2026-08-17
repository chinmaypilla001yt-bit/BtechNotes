import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { FileQuestion } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { NoteForm } from "@/components/NoteForm";
import { PageSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useNote } from "@/hooks/useData";

export const Route = createFileRoute("/_app/notes/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit Note — BTech Notes" },
      { name: "description", content: "Update the content, hierarchy and attachments of your note." },
      { property: "og:title", content: "Edit Note — BTech Notes" },
      { property: "og:description", content: "Update the content and attachments of your note." },
    ],
  }),
  component: EditNotePage,
});

function EditNotePage() {
  const { id } = useParams({ from: "/_app/notes/edit/$id" });
  const note = useNote(id);

  if (note.isLoading) return <PageSkeleton />;

  if (!note.data) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Note not found"
        description="This note may have been deleted or never existed."
      >
        <Button asChild className="mt-5">
          <Link to="/notes">Back to notes</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit note</h1>
        <p className="mt-1 text-sm text-muted-foreground">Changes are saved to your account only.</p>
      </header>
      <NoteForm note={note.data} />
    </div>
  );
}

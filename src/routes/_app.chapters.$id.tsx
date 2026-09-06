import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, FileText, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { EntityDialog } from "@/components/EntityDialog";
import { PageSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useUid } from "@/hooks/useAuth";
import { useChapters, useInvalidateAll, useNotes } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/_app/chapters/$id")({
  head: () => ({
    meta: [
      { title: "Lesson — BTech Notes" },
      { name: "description", content: "Notes inside this lesson of your curriculum." },
      { property: "og:title", content: "Lesson — BTech Notes" },
      { property: "og:description", content: "Notes inside this lesson of your curriculum." },
    ],
  }),
  component: ChapterDetailPage,
});

function ChapterDetailPage() {
  const { id } = useParams({ from: "/_app/chapters/$id" });
  const uid = useUid();
  const invalidate = useInvalidateAll();
  const chapters = useChapters();
  const notes = useNotes();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  if (chapters.isLoading || notes.isLoading) return <PageSkeleton />;

  const chapter = (chapters.data ?? []).find((c) => c.id === id);
  if (!chapter) {
    return (
      <EmptyState icon={Layers} title="Lesson not found" description="It may have been deleted.">
        <Button asChild className="mt-5"><Link to="/subjects">Back to subjects</Link></Button>
      </EmptyState>
    );
  }

  const chapterNotes = (notes.data ?? [])
    .filter((n) => n.chapterId === id)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title));

  async function moveTopic(noteId: string, direction: -1 | 1) {
    if (!uid || reordering) return;
    const index = chapterNotes.findIndex((note) => note.id === noteId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= chapterNotes.length) return;
    setReordering(noteId);
    try {
      await api.reorderNote(uid, noteId, target);
      await invalidate();
      toast.success(`Topic moved to index ${target + 1}.`);
    } catch (error) {
      toast.error(friendlyError(error, "Could not reorder the topic."));
    } finally {
      setReordering(null);
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/subjects/$id" params={{ id: chapter.subjectId }}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to subject</Link>
      </Button>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{chapter.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{chapterNotes.length} topic{chapterNotes.length === 1 ? "" : "s"}</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Add topic</Button>
      </header>

      {chapterNotes.length === 0 ? (
        <EmptyState icon={FileText} title="No topics yet" description="Add a topic to start building this lesson." actionLabel="Add topic" onAction={() => setCreating(true)} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Use ↑ and ↓ to change the topic index. The same order is used in the PDF table of contents.</p>
          {chapterNotes.map((note, index) => {
            const busy = reordering === note.id;
            return (
              <div key={note.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                <Link to="/notes/$id" params={{ id: note.id }} className="group flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{note.title}</span>
                    <span className="text-xs text-muted-foreground">Topic {index + 1}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={index === 0 || !!reordering} aria-label={`Move ${note.title} up`} onClick={() => moveTopic(note.id, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={index === chapterNotes.length - 1 || !!reordering} aria-label={`Move ${note.title} down`} onClick={() => moveTopic(note.id, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Rename ${note.title}`} onClick={() => setRenaming({ id: note.id, name: note.title })}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" aria-label={`Delete ${note.title}`} onClick={() => setToDelete({ id: note.id, name: note.title })}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            );
          })}
        </div>
      )}

      <EntityDialog open={creating} onOpenChange={setCreating} title="New topic" placeholder="e.g. Binary Search Trees" onSubmit={async (name) => {
        if (!uid) return;
        try {
          const noteId = await api.createNote(uid, { title: name, content: "", plainText: "", yearId: chapter.yearId, yearName: "", semesterId: chapter.semesterId, semesterName: "", subjectId: chapter.subjectId, subjectName: "", chapterId: chapter.id, chapterName: chapter.name, attachments: [] });
          await invalidate();
          toast.success("Topic created.");
          window.location.href = `/notes/${noteId}/edit`;
        } catch (error) { toast.error(friendlyError(error, "Could not create the topic.")); }
      }} />

      <EntityDialog open={renaming !== null} onOpenChange={(open) => setRenaming(open ? renaming : null)} title="Rename topic" submitLabel="Save" initialValue={renaming?.name ?? ""} onSubmit={async (name) => {
        if (!uid || !renaming) return;
        try {
          await api.renameEntity(uid, "notes", renaming.id, name);
          await invalidate();
          toast.success("Topic renamed.");
        } catch (error) { toast.error(friendlyError(error, "Could not rename the topic.")); }
      }} />

      <ConfirmDialog open={toDelete !== null} onOpenChange={(open) => setToDelete(open ? toDelete : null)} title={`Delete "${toDelete?.name}"?`} description="This permanently deletes the topic and its attachments." onConfirm={async () => {
        if (!uid || !toDelete) return;
        try {
          const note = chapterNotes.find((item) => item.id === toDelete.id);
          if (!note) return;
          await api.deleteNote(uid, note);
          await invalidate();
          toast.success("Topic deleted.");
        } catch (error) { toast.error(friendlyError(error, "Could not delete the topic.")); }
      }} />
    </div>
  );
}

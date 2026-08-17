import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, FolderTree, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { EntityDialog } from "@/components/EntityDialog";
import { PageSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useUid } from "@/hooks/useAuth";
import { useChapters, useInvalidateAll, useSubjects, useTopics } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/_app/subjects/$id")({
  head: () => ({
    meta: [
      { title: "Subject — BTech Notes" },
      { name: "description", content: "Chapters and topics inside this subject." },
      { property: "og:title", content: "Subject — BTech Notes" },
      { property: "og:description", content: "Chapters and topics inside this subject." },
    ],
  }),
  component: SubjectDetailPage,
});

function SubjectDetailPage() {
  const { id } = useParams({ from: "/_app/subjects/$id" });
  const uid = useUid();
  const invalidate = useInvalidateAll();
  const subjects = useSubjects();
  const chapters = useChapters();
  const topics = useTopics();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  if (subjects.isLoading || chapters.isLoading) return <PageSkeleton />;

  const subject = (subjects.data ?? []).find((s) => s.id === id);
  if (!subject) {
    return (
      <EmptyState
        icon={FolderTree}
        title="Subject not found"
        description="It may have been deleted."
      >
        <Button asChild className="mt-5">
          <Link to="/subjects">Back to subjects</Link>
        </Button>
      </EmptyState>
    );
  }

  const subjectChapters = (chapters.data ?? []).filter((c) => c.subjectId === id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/subjects">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to subjects
        </Link>
      </Button>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{subject.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {subjectChapters.length} chapter{subjectChapters.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add chapter
        </Button>
      </header>

      {subjectChapters.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No chapters yet"
          description="Break this subject into chapters to keep topics tidy."
          actionLabel="Add chapter"
          onAction={() => setCreating(true)}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {subjectChapters.map((chapter) => {
            const count = (topics.data ?? []).filter((t) => t.chapterId === chapter.id).length;
            return (
              <div
                key={chapter.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <Link
                  to="/chapters/$id"
                  params={{ id: chapter.id }}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{chapter.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {count} topic{count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label={`Rename ${chapter.name}`}
                  onClick={() => setRenaming({ id: chapter.id, name: chapter.name })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  aria-label={`Delete ${chapter.name}`}
                  onClick={() => setToDelete({ id: chapter.id, name: chapter.name })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <EntityDialog
        open={creating}
        onOpenChange={setCreating}
        title="New chapter"
        placeholder="e.g. 01 — Introduction"
        onSubmit={async (name) => {
          if (!uid) return;
          try {
            await api.createEntity(uid, "chapters", {
              name,
              subjectId: subject.id,
              semesterId: subject.semesterId,
              yearId: subject.yearId,
              order: subjectChapters.length + 1,
            });
            await invalidate();
            toast.success("Chapter created.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not create the chapter."));
          }
        }}
      />

      <EntityDialog
        open={renaming !== null}
        onOpenChange={(open) => setRenaming(open ? renaming : null)}
        title="Rename chapter"
        submitLabel="Save"
        initialValue={renaming?.name ?? ""}
        onSubmit={async (name) => {
          if (!uid || !renaming) return;
          try {
            await api.renameEntity(uid, "chapters", renaming.id, name);
            await invalidate();
            toast.success("Chapter renamed.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not rename the chapter."));
          }
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => setToDelete(open ? toDelete : null)}
        title={`Delete "${toDelete?.name}"?`}
        description="All topics, notes and attached files inside this chapter will be permanently deleted."
        onConfirm={async () => {
          if (!uid || !toDelete) return;
          try {
            await api.deleteChapter(uid, toDelete.id);
            await invalidate();
            toast.success("Chapter deleted.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not delete the chapter."));
          }
        }}
      />
    </div>
  );
}

import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, Layers, ListTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { EntityDialog } from "@/components/EntityDialog";
import { PageSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useUid } from "@/hooks/useAuth";
import { useChapters, useInvalidateAll, useNotes, useTopics } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/_app/chapters/$id")({
  head: () => ({
    meta: [
      { title: "Chapter — BTech Notes" },
      { name: "description", content: "Topics inside this chapter of your curriculum." },
      { property: "og:title", content: "Chapter — BTech Notes" },
      { property: "og:description", content: "Topics inside this chapter of your curriculum." },
    ],
  }),
  component: ChapterDetailPage,
});

function ChapterDetailPage() {
  const { id } = useParams({ from: "/_app/chapters/$id" });
  const uid = useUid();
  const invalidate = useInvalidateAll();
  const chapters = useChapters();
  const topics = useTopics();
  const notes = useNotes();

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  if (chapters.isLoading || topics.isLoading) return <PageSkeleton />;

  const chapter = (chapters.data ?? []).find((c) => c.id === id);
  if (!chapter) {
    return (
      <EmptyState icon={Layers} title="Chapter not found" description="It may have been deleted.">
        <Button asChild className="mt-5">
          <Link to="/subjects">Back to subjects</Link>
        </Button>
      </EmptyState>
    );
  }

  const chapterTopics = (topics.data ?? []).filter((t) => t.chapterId === id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/subjects/$id" params={{ id: chapter.subjectId }}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to subject
        </Link>
      </Button>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{chapter.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {chapterTopics.length} topic{chapterTopics.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add topic
        </Button>
      </header>

      {chapterTopics.length === 0 ? (
        <EmptyState
          icon={ListTree}
          title="No topics yet"
          description="Add topics to start writing notes against them."
          actionLabel="Add topic"
          onAction={() => setCreating(true)}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {chapterTopics.map((topic) => {
            const count = (notes.data ?? []).filter((n) => n.topicId === topic.id).length;
            return (
              <div
                key={topic.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <Link
                  to="/topics/$id"
                  params={{ id: topic.id }}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ListTree className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{topic.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {count} note{count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label={`Rename ${topic.name}`}
                  onClick={() => setRenaming({ id: topic.id, name: topic.name })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  aria-label={`Delete ${topic.name}`}
                  onClick={() => setToDelete({ id: topic.id, name: topic.name })}
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
        title="New topic"
        placeholder="e.g. Binary Search Trees"
        onSubmit={async (name) => {
          if (!uid) return;
          try {
            await api.createEntity(uid, "topics", {
              name,
              chapterId: chapter.id,
              subjectId: chapter.subjectId,
              semesterId: chapter.semesterId,
              yearId: chapter.yearId,
            });
            await invalidate();
            toast.success("Topic created.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not create the topic."));
          }
        }}
      />

      <EntityDialog
        open={renaming !== null}
        onOpenChange={(open) => setRenaming(open ? renaming : null)}
        title="Rename topic"
        submitLabel="Save"
        initialValue={renaming?.name ?? ""}
        onSubmit={async (name) => {
          if (!uid || !renaming) return;
          try {
            await api.renameEntity(uid, "topics", renaming.id, name);
            await invalidate();
            toast.success("Topic renamed.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not rename the topic."));
          }
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => setToDelete(open ? toDelete : null)}
        title={`Delete "${toDelete?.name}"?`}
        description="All notes and attached files under this topic will be permanently deleted."
        onConfirm={async () => {
          if (!uid || !toDelete) return;
          try {
            await api.deleteTopic(uid, toDelete.id);
            await invalidate();
            toast.success("Topic deleted.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not delete the topic."));
          }
        }}
      />
    </div>
  );
}

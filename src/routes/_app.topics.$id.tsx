import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowLeft, FileText, ListTree, Plus } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { NoteCard } from "@/components/NoteCard";
import { PageSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useNotes, useTopics } from "@/hooks/useData";

export const Route = createFileRoute("/_app/topics/$id")({
  head: () => ({
    meta: [
      { title: "Topic — BTech Notes" },
      { name: "description", content: "All notes written under this topic." },
      { property: "og:title", content: "Topic — BTech Notes" },
      { property: "og:description", content: "All notes written under this topic." },
    ],
  }),
  component: TopicDetailPage,
});

function TopicDetailPage() {
  const { id } = useParams({ from: "/_app/topics/$id" });
  const topics = useTopics();
  const notes = useNotes();

  if (topics.isLoading || notes.isLoading) return <PageSkeleton />;

  const topic = (topics.data ?? []).find((t) => t.id === id);
  if (!topic) {
    return (
      <EmptyState icon={ListTree} title="Topic not found" description="It may have been deleted.">
        <Button asChild className="mt-5">
          <Link to="/subjects">Back to subjects</Link>
        </Button>
      </EmptyState>
    );
  }

  const topicNotes = (notes.data ?? []).filter((note) => note.topicId === id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/chapters/$id" params={{ id: topic.chapterId }}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to chapter
        </Link>
      </Button>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{topic.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {topicNotes.length} note{topicNotes.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link
            to="/notes/new"
            search={{
              year: topic.yearId,
              semester: topic.semesterId,
              subject: topic.subjectId,
              chapter: topic.chapterId,
              topic: topic.id,
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New note
          </Link>
        </Button>
      </header>

      {topicNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes in this topic"
          description="Write your first note for this topic."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {topicNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}

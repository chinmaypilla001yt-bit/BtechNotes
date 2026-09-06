import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  FolderTree,
  Layers,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";
import { NoteCard } from "@/components/NoteCard";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChapters, useNotes, useSubjects } from "@/hooks/useData";
import { greeting } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BTech Notes" },
      { name: "description", content: "Your BTech notes at a glance: subjects, lessons and recent notes." },
      { property: "og:title", content: "Dashboard — BTech Notes" },
      { property: "og:description", content: "Your BTech notes at a glance." },
    ],
  }),
  component: DashboardPage,
});

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-sm text-muted-foreground">
      <p>
        {now.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      <p className="mt-0.5 text-lg font-medium tabular-nums text-foreground">
        {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
      </p>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const subjects = useSubjects();
  const chapters = useChapters();
  const notes = useNotes();

  const loading = subjects.isLoading || chapters.isLoading || notes.isLoading;
  const firstName = (user?.displayName ?? "there").split(" ")[0];
  const recent = (notes.data ?? []).slice(0, 6);
  const isNew =
    !loading && (subjects.data?.length ?? 0) === 0 && (notes.data?.length ?? 0) === 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's in your repository today.
          </p>
        </div>
        <Clock />
      </header>

      <section aria-label="Statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Total Subjects"
          value={subjects.data?.length ?? 0}
          hint="All years"
          loading={loading}
        />
        <StatCard
          icon={Layers}
          label="Total Lessons"
          value={chapters.data?.length ?? 0}
          hint="Across subjects"
          loading={loading}
        />
        <StatCard
          icon={FileText}
          label="Total Notes"
          value={notes.data?.length ?? 0}
          hint="All time"
          loading={loading}
        />
      </section>

      <section aria-label="Quick actions" className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/notes/new">
            <Plus className="mr-1.5 h-4 w-4" /> New Note
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/subjects">
            <FolderTree className="mr-1.5 h-4 w-4" /> New Subject
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/subjects">
            <Layers className="mr-1.5 h-4 w-4" /> New Lesson
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/notes/new">
            <Upload className="mr-1.5 h-4 w-4" /> Upload File
          </Link>
        </Button>
      </section>

      <section aria-label="Recently created notes" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recently created notes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/notes">View all</Link>
          </Button>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : isNew ? (
          <EmptyState
            icon={Sparkles}
            title="Welcome to BTech Notes 👋"
            description="Organise four years of knowledge in one place. Start by creating your first subject."
          >
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/subjects">Create your first subject</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/notes/new">Create a note</Link>
              </Button>
            </div>
          </EmptyState>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No notes yet."
            description="Start building your knowledge repository."
          >
            <Button asChild className="mt-5">
              <Link to="/notes/new">+ Create Note</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {recent.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, FileText } from "lucide-react";
import { useMemo } from "react";

import { EmptyState } from "@/components/EmptyState";
import { NoteCard } from "@/components/NoteCard";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/hooks/useData";
import { toMillis } from "@/lib/firestore";
import { formatDate } from "@/lib/format";
import type { Note } from "@/lib/types";

export const Route = createFileRoute("/_app/recent")({
  head: () => ({
    meta: [
      { title: "Recent Notes — BTech Notes" },
      { name: "description", content: "The last notes you edited, grouped by day for quick pick-up." },
      { property: "og:title", content: "Recent Notes — BTech Notes" },
      { property: "og:description", content: "The last notes you edited, grouped by day." },
    ],
  }),
  component: RecentPage,
});

function RecentPage() {
  const notes = useNotes();

  const groups = useMemo(() => {
    const sorted = [...(notes.data ?? [])].sort(
      (a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt),
    );
    const map = new Map<string, Note[]>();
    for (const note of sorted.slice(0, 40)) {
      const key = formatDate(note.updatedAt, true) || "Unknown date";
      map.set(key, [...(map.get(key) ?? []), note]);
    }
    return [...map.entries()];
  }, [notes.data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Recent notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your latest edits, newest first.</p>
      </header>

      {notes.isLoading ? (
        <ListSkeleton rows={5} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nothing recent yet"
          description="Notes you create or edit will show up here."
        >
          <Button asChild className="mt-5">
            <Link to="/notes/new">
              <FileText className="mr-1.5 h-4 w-4" /> Create a note
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {groups.map(([day, items]) => (
            <section key={day} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {day}
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

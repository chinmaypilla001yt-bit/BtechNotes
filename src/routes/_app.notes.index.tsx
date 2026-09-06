import { Link, createFileRoute } from "@tanstack/react-router";
import { FileText, LayoutGrid, List, Plus, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { NoteCard } from "@/components/NoteCard";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChapters, useNotes, useSemesters, useSubjects, useYears } from "@/hooks/useData";
import { toMillis } from "@/lib/firestore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notes/")({
  head: () => ({
    meta: [
      { title: "My Notes — BTech Notes" },
      { name: "description", content: "Search, filter and browse every note in your BTech repository." },
      { property: "og:title", content: "My Notes — BTech Notes" },
      { property: "og:description", content: "Search, filter and browse every note in your repository." },
    ],
  }),
  component: NotesPage,
});

const ALL = "all";

function NotesPage() {
  const notes = useNotes();
  const years = useYears();
  const semesters = useSemesters();
  const subjects = useSubjects();
  const chapters = useChapters();

  const [search, setSearch] = useState("");
  const [year, setYear] = useState(ALL);
  const [semester, setSemester] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [chapter, setChapter] = useState(ALL);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"card" | "list">("card");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = (notes.data ?? []).filter((note) => {
      if (year !== ALL && note.yearId !== year) return false;
      if (semester !== ALL && note.semesterId !== semester) return false;
      if (subject !== ALL && note.subjectId !== subject) return false;
      if (chapter !== ALL && note.chapterId !== chapter) return false;
      if (!term) return true;
      return [note.title, note.plainText, note.subjectName, note.chapterName, note.yearName, note.semesterName]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
    result = [...result].sort((a, b) => {
      if (sort === "newest") return toMillis(b.createdAt) - toMillis(a.createdAt);
      if (sort === "oldest") return toMillis(a.createdAt) - toMillis(b.createdAt);
      if (sort === "az") return a.title.localeCompare(b.title);
      return b.title.localeCompare(a.title);
    });
    return result;
  }, [notes.data, search, year, semester, subject, chapter, sort]);

  const filters = [
    { label: "Year", value: year, setValue: setYear, options: years.data ?? [] },
    {
      label: "Semester",
      value: semester,
      setValue: setSemester,
      options: (semesters.data ?? []).filter((s) => year === ALL || s.yearId === year),
    },
    {
      label: "Subject",
      value: subject,
      setValue: setSubject,
      options: (subjects.data ?? []).filter((s) => semester === ALL || s.semesterId === semester),
    },
    {
      label: "Lesson",
      value: chapter,
      setValue: setChapter,
      options: (chapters.data ?? []).filter((c) => subject === ALL || c.subjectId === subject),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notes.data?.length ?? 0} note{(notes.data?.length ?? 0) === 1 ? "" : "s"} in your repository
          </p>
        </div>
        <Button asChild>
          <Link to="/notes/new">
            <Plus className="mr-1.5 h-4 w-4" /> New Note
          </Link>
        </Button>
      </header>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes by title, content, subject or lesson…"
            aria-label="Search notes"
            className="pl-9"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {filters.map((filter) => (
            <Select key={filter.label} value={filter.value} onValueChange={filter.setValue}>
              <SelectTrigger aria-label={`Filter by ${filter.label.toLowerCase()}`}>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All {filter.label.toLowerCase()}s</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          <div className="flex gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label="Sort notes" className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="az">A–Z</SelectItem>
                <SelectItem value="za">Z–A</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              aria-label={view === "card" ? "Switch to list view" : "Switch to card view"}
              title={view === "card" ? "List view" : "Card view"}
              onClick={() => setView(view === "card" ? "list" : "card")}
            >
              {view === "card" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {notes.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (notes.data?.length ?? 0) === 0 ? (
        <EmptyState icon={FileText} title="No notes yet." description="Start building your knowledge repository.">
          <Button asChild className="mt-5"><Link to="/notes/new">+ Create Note</Link></Button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No results found"
          description="Try a different search term or clear your filters."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch(""); setYear(ALL); setSemester(ALL); setSubject(ALL); setChapter(ALL);
          }}
        />
      ) : (
        <div className={cn(view === "card" ? "grid gap-3 lg:grid-cols-2" : "space-y-2")}>
          {filtered.map((note) => <NoteCard key={note.id} note={note} view={view} />)}
        </div>
      )}
    </div>
  );
}

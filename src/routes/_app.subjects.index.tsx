import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, ChevronRight, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { EntityDialog } from "@/components/EntityDialog";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useUid } from "@/hooks/useAuth";
import { useInvalidateAll, useNotes, useSemesters, useSubjects, useYears } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { friendlyError } from "@/lib/format";

export const Route = createFileRoute("/_app/subjects/")({
  head: () => ({
    meta: [
      { title: "Subjects — BTech Notes" },
      { name: "description", content: "Browse your curriculum by year, semester and subject." },
      { property: "og:title", content: "Subjects — BTech Notes" },
      { property: "og:description", content: "Browse your curriculum by year, semester and subject." },
    ],
  }),
  component: SubjectsPage,
});

type DialogState =
  | { mode: "create"; level: "year" }
  | { mode: "create"; level: "semester"; yearId: string }
  | { mode: "create"; level: "subject"; yearId: string; semesterId: string }
  | { mode: "rename"; level: "years" | "semesters" | "subjects"; id: string; name: string }
  | null;

type DeleteState = { level: "year" | "semester" | "subject"; id: string; name: string } | null;

function SubjectsPage() {
  const uid = useUid();
  const invalidate = useInvalidateAll();
  const years = useYears();
  const semesters = useSemesters();
  const subjects = useSubjects();
  const notes = useNotes();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [toDelete, setToDelete] = useState<DeleteState>(null);

  const noteCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of notes.data ?? [])
      map.set(note.subjectId, (map.get(note.subjectId) ?? 0) + 1);
    return map;
  }, [notes.data]);

  const loading = years.isLoading || semesters.isLoading || subjects.isLoading;

  async function submitDialog(name: string) {
    if (!uid || !dialog) return;
    try {
      if (dialog.mode === "rename") {
        await api.renameEntity(uid, dialog.level, dialog.id, name);
        toast.success("Renamed successfully.");
      } else if (dialog.level === "year") {
        await api.createEntity(uid, "years", { name, order: (years.data?.length ?? 0) + 1 });
        toast.success("Year created.");
      } else if (dialog.level === "semester") {
        await api.createEntity(uid, "semesters", { name, yearId: dialog.yearId });
        toast.success("Semester created.");
      } else {
        await api.createEntity(uid, "subjects", {
          name,
          yearId: dialog.yearId,
          semesterId: dialog.semesterId,
        });
        toast.success("Subject created.");
      }
      await invalidate();
    } catch (error) {
      toast.error(friendlyError(error, "Could not save your change."));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Year → Semester → Subject. Open a subject for its chapters and topics.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create", level: "year" })}>
          <Plus className="mr-1.5 h-4 w-4" /> Add year
        </Button>
      </header>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : (years.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No years yet"
          description="Start your curriculum by adding your first academic year."
          actionLabel="Add year"
          onAction={() => setDialog({ mode: "create", level: "year" })}
        />
      ) : (
        <div className="space-y-5">
          {(years.data ?? []).map((year) => {
            const yearSemesters = (semesters.data ?? []).filter((s) => s.yearId === year.id);
            return (
              <section key={year.id} className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold">{year.name}</h2>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ mode: "create", level: "semester", yearId: year.id })}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Semester
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label={`Rename ${year.name}`}
                      onClick={() =>
                        setDialog({ mode: "rename", level: "years", id: year.id, name: year.name })
                      }
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      aria-label={`Delete ${year.name}`}
                      onClick={() => setToDelete({ level: "year", id: year.id, name: year.name })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {yearSemesters.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No semesters in this year yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {yearSemesters.map((semester) => {
                      const semesterSubjects = (subjects.data ?? []).filter(
                        (s) => s.semesterId === semester.id,
                      );
                      return (
                        <div key={semester.id} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {semester.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDialog({
                                    mode: "create",
                                    level: "subject",
                                    yearId: year.id,
                                    semesterId: semester.id,
                                  })
                                }
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" /> Subject
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                aria-label={`Rename ${semester.name}`}
                                onClick={() =>
                                  setDialog({
                                    mode: "rename",
                                    level: "semesters",
                                    id: semester.id,
                                    name: semester.name,
                                  })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                aria-label={`Delete ${semester.name}`}
                                onClick={() =>
                                  setToDelete({
                                    level: "semester",
                                    id: semester.id,
                                    name: semester.name,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {semesterSubjects.length === 0 ? (
                            <p className="py-3 text-sm text-muted-foreground">No subjects yet.</p>
                          ) : (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {semesterSubjects.map((subject) => (
                                <Link
                                  key={subject.id}
                                  to="/subjects/$id"
                                  params={{ id: subject.id }}
                                  className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40"
                                >
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                      {subject.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {noteCount.get(subject.id) ?? 0} note
                                      {(noteCount.get(subject.id) ?? 0) === 1 ? "" : "s"}
                                    </span>
                                  </span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <EntityDialog
        open={dialog !== null}
        onOpenChange={(open) => setDialog(open ? dialog : null)}
        title={
          dialog?.mode === "rename"
            ? "Rename"
            : dialog?.level === "year"
              ? "New year"
              : dialog?.level === "semester"
                ? "New semester"
                : "New subject"
        }
        initialValue={dialog?.mode === "rename" ? dialog.name : ""}
        submitLabel={dialog?.mode === "rename" ? "Save" : "Create"}
        onSubmit={submitDialog}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => setToDelete(open ? toDelete : null)}
        title={`Delete "${toDelete?.name}"?`}
        description={`This permanently deletes everything inside it — semesters, subjects, chapters, topics, notes and attached files. This action cannot be undone.`}
        onConfirm={async () => {
          if (!uid || !toDelete) return;
          try {
            if (toDelete.level === "year") await api.deleteYear(uid, toDelete.id);
            else if (toDelete.level === "semester") await api.deleteSemester(uid, toDelete.id);
            else await api.deleteSubject(uid, toDelete.id);
            await invalidate();
            toast.success("Deleted successfully.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not delete."));
          }
        }}
      />
    </div>
  );
}

import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, Download, FileDown, FolderTree, Layers, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { EntityDialog } from "@/components/EntityDialog";
import { ExportPdfDialog } from "@/components/ExportPdfDialog";
import { PageSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { useUid } from "@/hooks/useAuth";
import { useChapters, useInvalidateAll, useNotes, useSubjects } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { friendlyError } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf/document";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/pdf/options";

export const Route = createFileRoute("/_app/subjects/$id")({
  head: () => ({ meta: [{ title: "Subject — BTech Notes" }, { name: "description", content: "Lessons and notes inside this subject." }, { property: "og:title", content: "Subject — BTech Notes" }, { property: "og:description", content: "Lessons and notes inside this subject." }] }),
  component: SubjectDetailPage,
});

function SubjectDetailPage() {
  const { id } = useParams({ from: "/_app/subjects/$id" });
  const uid = useUid();
  const invalidate = useInvalidateAll();
  const subjects = useSubjects();
  const chapters = useChapters();
  const notes = useNotes();
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);

  if (subjects.isLoading || chapters.isLoading) return <PageSkeleton />;
  const subject = (subjects.data ?? []).find((s) => s.id === id);
  if (!subject) return <EmptyState icon={FolderTree} title="Subject not found" description="It may have been deleted."><Button asChild className="mt-5"><Link to="/subjects">Back to subjects</Link></Button></EmptyState>;

  const subjectChapters = (chapters.data ?? []).filter((c) => c.subjectId === id).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const subjectNotes = (notes.data ?? []).filter((n) => n.subjectId === subject.id);

  async function moveLesson(chapterId: string, direction: -1 | 1) {
    if (!uid || reordering) return;
    const index = subjectChapters.findIndex((c) => c.id === chapterId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= subjectChapters.length) return;
    setReordering(chapterId);
    try {
      await api.reorderChapter(uid, chapterId, target);
      await invalidate();
      toast.success(`Lesson moved to index ${target + 1}.`);
    } catch (error) { toast.error(friendlyError(error, "Could not reorder the lesson.")); }
    finally { setReordering(null); }
  }

  async function downloadCompleteNotes() {
    if (!subjectChapters.length || !subjectNotes.length) { toast.error("There are no notes to download yet."); return; }
    setDownloading(true);
    try {
      await downloadPdf({ title: subject.name, subject, chapters: subjectChapters, notes: subjectNotes }, DEFAULT_EXPORT_OPTIONS);
      toast.success("Complete subject notes downloaded.");
    } catch (error) { toast.error(friendlyError(error, "Could not download the complete notes.")); }
    finally { setDownloading(false); }
  }

  return <div className="space-y-6">
    <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/subjects"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to subjects</Link></Button>
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight">{subject.name}</h1><p className="mt-1 text-sm text-muted-foreground">{subjectChapters.length} lesson{subjectChapters.length === 1 ? "" : "s"} · {subjectNotes.length} note{subjectNotes.length === 1 ? "" : "s"}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={downloadCompleteNotes} disabled={downloading || subjectNotes.length === 0}>{downloading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />} Download Complete Notes</Button>
        <Button variant="outline" onClick={() => setExporting(true)}><FileDown className="mr-1.5 h-4 w-4" /> Custom Export</Button>
        <Button onClick={() => setCreating(true)}><Plus className="mr-1.5 h-4 w-4" /> Add lesson</Button>
      </div>
    </header>

    {subjectChapters.length === 0 ? <EmptyState icon={Layers} title="No lessons yet" description="Break this subject into lessons to keep notes organized." actionLabel="Add lesson" onAction={() => setCreating(true)} /> : <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Use ↑ and ↓ to set the index order. This order is also used in the complete PDF.</p>
      {subjectChapters.map((chapter, index) => {
        const count = subjectNotes.filter((note) => note.chapterId === chapter.id).length;
        const busy = reordering === chapter.id;
        return <div key={chapter.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
          <Link to="/chapters/$id" params={{ id: chapter.id }} className="group flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Layers className="h-4 w-4" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{chapter.name}</span><span className="text-xs text-muted-foreground">{count} note{count === 1 ? "" : "s"}</span></span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={index === 0 || !!reordering} aria-label={`Move ${chapter.name} up`} onClick={() => moveLesson(chapter.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={index === subjectChapters.length - 1 || !!reordering} aria-label={`Move ${chapter.name} down`} onClick={() => moveLesson(chapter.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Rename ${chapter.name}`} onClick={() => setRenaming({ id: chapter.id, name: chapter.name })}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" aria-label={`Delete ${chapter.name}`} onClick={() => setToDelete({ id: chapter.id, name: chapter.name })}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>;
      })}
    </div>}

    <ExportPdfDialog open={exporting} onOpenChange={setExporting} title={subject.name} subject={subject} chapters={subjectChapters} notes={subjectNotes} selectableChapters />
    <EntityDialog open={creating} onOpenChange={setCreating} title="New lesson" placeholder="e.g. 01 — Introduction" onSubmit={async (name) => { if (!uid) return; try { await api.createEntity(uid, "chapters", { name, subjectId: subject.id, semesterId: subject.semesterId, yearId: subject.yearId, order: subjectChapters.length + 1 }); await invalidate(); toast.success("Lesson created."); } catch (error) { toast.error(friendlyError(error, "Could not create the lesson.")); } }} />
    <EntityDialog open={renaming !== null} onOpenChange={(open) => setRenaming(open ? renaming : null)} title="Rename lesson" submitLabel="Save" initialValue={renaming?.name ?? ""} onSubmit={async (name) => { if (!uid || !renaming) return; try { await api.renameEntity(uid, "chapters", renaming.id, name); await invalidate(); toast.success("Lesson renamed."); } catch (error) { toast.error(friendlyError(error, "Could not rename the lesson.")); } }} />
    <ConfirmDialog open={toDelete !== null} onOpenChange={(open) => setToDelete(open ? toDelete : null)} title={`Delete "${toDelete?.name}"?`} description="All notes and attached files inside this lesson will be permanently deleted." onConfirm={async () => { if (!uid || !toDelete) return; try { await api.deleteChapter(uid, toDelete.id); await invalidate(); toast.success("Lesson deleted."); } catch (error) { toast.error(friendlyError(error, "Could not delete the lesson.")); } }} />
  </div>;
}

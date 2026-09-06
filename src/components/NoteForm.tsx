import { useNavigate } from "@tanstack/react-router";
import { Loader2, Paperclip, Plus, Save, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EntityDialog } from "@/components/EntityDialog";
import { FileCard } from "@/components/FileCard";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUid } from "@/hooks/useAuth";
import { useChapters, useInvalidateAll, useSemesters, useSubjects, useYears } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { friendlyError } from "@/lib/format";
import type { Attachment, Note } from "@/lib/types";

type Level = "year" | "semester" | "subject" | "chapter";

interface Props {
  note?: Note;
  defaults?: Partial<Record<Level, string>>;
}

export function NoteForm({ note, defaults }: Props) {
  const uid = useUid();
  const navigate = useNavigate();
  const invalidate = useInvalidateAll();
  const years = useYears();
  const semesters = useSemesters();
  const subjects = useSubjects();
  const chapters = useChapters();

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [plainText, setPlainText] = useState(note?.plainText ?? "");
  const [yearId, setYearId] = useState(note?.yearId ?? defaults?.year ?? "");
  const [semesterId, setSemesterId] = useState(note?.semesterId ?? defaults?.semester ?? "");
  const [subjectId, setSubjectId] = useState(note?.subjectId ?? defaults?.subject ?? "");
  const [chapterId, setChapterId] = useState(note?.chapterId ?? defaults?.chapter ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>(note?.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState<Level | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const semesterOptions = useMemo(() => (semesters.data ?? []).filter((s) => s.yearId === yearId), [semesters.data, yearId]);
  const subjectOptions = useMemo(() => (subjects.data ?? []).filter((s) => s.semesterId === semesterId), [subjects.data, semesterId]);
  const chapterOptions = useMemo(() => (chapters.data ?? []).filter((c) => c.subjectId === subjectId), [chapters.data, subjectId]);

  const nameOf = (list: { id: string; name: string }[] | undefined, id: string) => list?.find((item) => item.id === id)?.name ?? "";

  async function handleCreateEntity(level: Level, name: string) {
    if (!uid) return;
    if (level === "year") {
      const id = await api.createEntity(uid, "years", { name, order: (years.data?.length ?? 0) + 1 });
      await invalidate(); setYearId(id); setSemesterId(""); setSubjectId(""); setChapterId("");
    } else if (level === "semester") {
      const id = await api.createEntity(uid, "semesters", { name, yearId, order: semesterOptions.length + 1 });
      await invalidate(); setSemesterId(id); setSubjectId(""); setChapterId("");
    } else if (level === "subject") {
      const id = await api.createEntity(uid, "subjects", { name, yearId, semesterId });
      await invalidate(); setSubjectId(id); setChapterId("");
    } else {
      const id = await api.createEntity(uid, "chapters", { name, yearId, semesterId, subjectId, order: chapterOptions.length + 1 });
      await invalidate(); setChapterId(id);
    }
    toast.success("Created");
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length || !uid) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const attachment = await api.uploadFile(uid, file, note?.id ?? null);
        setAttachments((prev) => [...prev, attachment]);
      }
      await invalidate(); toast.success("File uploaded successfully.");
    } catch (error) { toast.error(friendlyError(error, "Failed to upload file.")); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function handleSave() {
    if (!uid) return;
    if (!title.trim()) { toast.error("Please add a title for your note."); return; }
    if (!yearId || !semesterId || !subjectId || !chapterId) { toast.error("Choose a year, semester, subject and lesson."); return; }

    const payload = {
      title: title.trim(), content, plainText, yearId, yearName: nameOf(years.data, yearId),
      semesterId, semesterName: nameOf(semesters.data, semesterId), subjectId, subjectName: nameOf(subjects.data, subjectId),
      chapterId, chapterName: nameOf(chapters.data, chapterId), attachments,
    };

    setSaving(true);
    try {
      if (note) { await api.updateNote(uid, note.id, payload); await invalidate(); toast.success("Note updated successfully."); navigate({ to: "/notes/$id", params: { id: note.id } }); }
      else { const id = await api.createNote(uid, payload); await invalidate(); toast.success("Note created successfully."); navigate({ to: "/notes/$id", params: { id } }); }
    } catch (error) { toast.error(friendlyError(error, "Something went wrong while saving your note.")); }
    finally { setSaving(false); }
  }

  const levels: { level: Level; label: string; value: string; setValue: (v: string) => void; options: { id: string; name: string }[]; disabled: boolean; placeholder: string }[] = [
    { level: "year", label: "Year", value: yearId, setValue: (v) => { setYearId(v); setSemesterId(""); setSubjectId(""); setChapterId(""); }, options: years.data ?? [], disabled: false, placeholder: "Select year" },
    { level: "semester", label: "Semester", value: semesterId, setValue: (v) => { setSemesterId(v); setSubjectId(""); setChapterId(""); }, options: semesterOptions, disabled: !yearId, placeholder: "Select semester" },
    { level: "subject", label: "Subject", value: subjectId, setValue: (v) => { setSubjectId(v); setChapterId(""); }, options: subjectOptions, disabled: !semesterId, placeholder: "Select subject" },
    { level: "chapter", label: "Lesson", value: chapterId, setValue: setChapterId, options: chapterOptions, disabled: !subjectId, placeholder: "Select lesson" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2"><Label htmlFor="note-title">Title</Label><Input id="note-title" value={title} placeholder="e.g. Binary Search Trees — traversals" onChange={(event) => setTitle(event.target.value)} className="h-11 text-base" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {levels.map((item) => <div key={item.level} className="space-y-2"><Label htmlFor={`select-${item.level}`}>{item.label}</Label><div className="flex gap-1.5"><Select value={item.value} onValueChange={item.setValue} disabled={item.disabled}><SelectTrigger id={`select-${item.level}`} className="flex-1"><SelectValue placeholder={item.placeholder} /></SelectTrigger><SelectContent>{item.options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="h-9 w-9 shrink-0 p-0" disabled={item.disabled} aria-label={`Add ${item.label.toLowerCase()}`} title={`Add ${item.label.toLowerCase()}`} onClick={() => setCreating(item.level)}><Plus className="h-4 w-4" /></Button></div></div>)}
      </div>
      <div className="space-y-2"><Label>Content</Label><RichTextEditor content={content} onChange={(html, text) => { setContent(html); setPlainText(text); }} /></div>
      <div className="space-y-3"><div className="flex items-center justify-between"><Label className="flex items-center gap-2"><Paperclip className="h-4 w-4" aria-hidden="true" /> Attachments</Label><Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload file</Button><input ref={fileInput} type="file" multiple className="sr-only" onChange={(event) => handleUpload(event.target.files)} /></div>
        {attachments.length ? <div className="space-y-2">{attachments.map((attachment) => <FileCard key={attachment.fileId} name={attachment.name} type={attachment.type} size={attachment.size} url={attachment.url} onDelete={() => setPendingDelete(attachment)} />)}</div> : <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">No attachments yet. PDFs, slides, spreadsheets, images and archives are all supported.</p>}
      </div>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => navigate({ to: "/notes" })} disabled={saving}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{note ? "Save changes" : "Create note"}</Button></div>
      <EntityDialog open={creating !== null} onOpenChange={(open) => setCreating(open ? creating : null)} title={`New ${creating ?? ""}`} placeholder={creating === "year" ? "e.g. Year 1" : creating === "semester" ? "e.g. Semester 1" : creating === "subject" ? "e.g. Data Structures" : "e.g. 01 — Introduction"} onSubmit={async (name) => { if (creating) await handleCreateEntity(creating, name); }} />
      <ConfirmDialog open={pendingDelete !== null} onOpenChange={(open) => setPendingDelete(open ? pendingDelete : null)} title={`Delete "${pendingDelete?.name}"?`} description="This permanently removes the file from storage. This action cannot be undone." onConfirm={async () => { if (!uid || !pendingDelete) return; try { await api.deleteStoredFile(uid, pendingDelete.fileId, pendingDelete.path); setAttachments((prev) => prev.filter((a) => a.fileId !== pendingDelete.fileId)); if (note) { await api.updateNote(uid, note.id, { ...note, attachments: attachments.filter((a) => a.fileId !== pendingDelete.fileId) }); } await invalidate(); toast.success("Attachment deleted."); } catch (error) { toast.error(friendlyError(error, "Failed to delete the attachment.")); } }} />
    </div>
  );
}

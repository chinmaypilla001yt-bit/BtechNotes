import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Search, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { FileCard } from "@/components/FileCard";
import { ListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUid } from "@/hooks/useAuth";
import { useFiles, useInvalidateAll, useNotes } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { formatBytes, formatDate, friendlyError } from "@/lib/format";
import type { StoredFile } from "@/lib/types";

export const Route = createFileRoute("/_app/files")({
  head: () => ({
    meta: [
      { title: "Files — BTech Notes" },
      { name: "description", content: "Every PDF, slide deck and image you have attached to your notes." },
      { property: "og:title", content: "Files — BTech Notes" },
      { property: "og:description", content: "Every PDF, slide deck and image attached to your notes." },
    ],
  }),
  component: FilesPage,
});

function categoryOf(file: StoredFile) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("image/")) return "images";
  if (ext === "pdf") return "pdf";
  if (["ppt", "pptx", "odp"].includes(ext)) return "slides";
  if (["doc", "docx", "txt", "md", "rtf", "odt"].includes(ext)) return "documents";
  return "other";
}

function FilesPage() {
  const uid = useUid();
  const files = useFiles();
  const notes = useNotes();
  const invalidate = useInvalidateAll();
  const fileInput = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<StoredFile | null>(null);

  const noteTitles = useMemo(
    () => new Map((notes.data ?? []).map((note) => [note.id, note.title])),
    [notes.data],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (files.data ?? []).filter((file) => {
      if (category !== "all" && categoryOf(file) !== category) return false;
      return !term || file.name.toLowerCase().includes(term);
    });
  }, [files.data, search, category]);

  const totalSize = (files.data ?? []).reduce((sum, file) => sum + (file.size || 0), 0);

  async function handleUpload(list: FileList | null) {
    if (!list?.length || !uid) return;
    setUploading(true);
    try {
      for (const file of Array.from(list)) await api.uploadFile(uid, file, null);
      await invalidate();
      toast.success("File uploaded successfully.");
    } catch (error) {
      toast.error(friendlyError(error, "Failed to upload file."));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {files.data?.length ?? 0} file{(files.data?.length ?? 0) === 1 ? "" : "s"} ·{" "}
            {formatBytes(totalSize)} stored
          </p>
        </div>
        <Button disabled={uploading} onClick={() => fileInput.current?.click()}>
          <Upload className="mr-1.5 h-4 w-4" /> Upload file
        </Button>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => handleUpload(event.target.files)}
        />
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files by name…"
            aria-label="Search files"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter by file type" className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="images">Images</SelectItem>
            <SelectItem value="slides">Slides</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {files.isLoading ? (
        <ListSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title={files.data?.length ? "No matching files" : "No files uploaded yet"}
          description={
            files.data?.length
              ? "Try a different search term or file type."
              : "Attach PDFs, slides and images to your notes and they'll appear here."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((file) => (
            <FileCard
              key={file.id}
              name={file.name}
              type={file.type}
              size={file.size}
              url={file.url}
              meta={`Uploaded ${formatDate(file.uploadedAt)}`}
              noteId={file.noteId ?? null}
              noteTitle={file.noteId ? (noteTitles.get(file.noteId) ?? null) : null}
              onDelete={() => setPending(file)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => setPending(open ? pending : null)}
        title={`Delete "${pending?.name}"?`}
        description="This permanently removes the file from storage and detaches it from any note."
        onConfirm={async () => {
          if (!uid || !pending) return;
          try {
            const owner = (notes.data ?? []).find((note) =>
              note.attachments?.some((a) => a.fileId === pending.id),
            );
            if (owner) await api.detachFileFromNote(uid, owner, pending.id);
            else await api.deleteStoredFile(uid, pending.id, pending.path);
            await invalidate();
            toast.success("File deleted.");
          } catch (error) {
            toast.error(friendlyError(error, "Failed to delete the file."));
          }
        }}
      />
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import {
  Download,
  ExternalLink,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";

export function fileIconFor(type: string, name: string): LucideIcon {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (type.startsWith("image/")) return FileImage;
  if (["pdf"].includes(ext)) return FileText;
  if (["doc", "docx", "odt", "rtf", "txt", "md"].includes(ext)) return FileText;
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return FileSpreadsheet;
  if (["ppt", "pptx", "odp"].includes(ext)) return Presentation;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  return FileIcon;
}

interface Props {
  name: string;
  type: string;
  size: number;
  url: string;
  meta?: string;
  noteId?: string | null;
  noteTitle?: string | null;
  onDelete?: () => void;
}

export function FileCard({ name, type, size, url, meta, noteId, noteTitle, onDelete }: Props) {
  const Icon = fileIconFor(type, name);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatBytes(size)}
          {meta ? ` · ${meta}` : ""}
          {noteId && noteTitle ? " · " : ""}
          {noteId && noteTitle ? (
            <Link to="/notes/$id" params={{ id: noteId }} className="text-primary hover:underline">
              {noteTitle}
            </Link>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="Open">
          <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${name}`}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download">
          <a href={url} download={name} target="_blank" rel="noreferrer" aria-label={`Download ${name}`}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
        {onDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete ${name}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

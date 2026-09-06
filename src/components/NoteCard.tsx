import { Link } from "@tanstack/react-router";
import { CalendarDays, FileText, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate, stripHtml } from "@/lib/format";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NoteCard({ note, view = "card" }: { note: Note; view?: "card" | "list" }) {
  const excerpt = stripHtml(note.content).slice(0, 160);

  return (
    <Link
      to="/notes/$id"
      params={{ id: note.id }}
      className={cn(
        "block rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-elevated",
        view === "card" ? "p-5" : "px-4 py-3",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-sm font-semibold text-foreground">{note.title}</h3>
            {note.attachments?.length ? (
              <span
                className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                title={`${note.attachments.length} attachment(s)`}
              >
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                {note.attachments.length}
              </span>
            ) : null}
          </div>
          {view === "card" && excerpt ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
          ) : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-normal">
              {note.subjectName}
            </Badge>
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {note.chapterName}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {note.yearName} · {note.semesterName}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Created {formatDate(note.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

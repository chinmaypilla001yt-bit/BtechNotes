import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, FileQuestion, Paperclip, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { FileCard } from "@/components/FileCard";
import { PageSkeleton } from "@/components/Skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUid } from "@/hooks/useAuth";
import { useInvalidateAll, useNote } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { formatDate, friendlyError } from "@/lib/format";

export const Route = createFileRoute("/_app/notes/$id")({
  head: () => ({
    meta: [
      { title: "Note — BTech Notes" },
      { name: "description", content: "Read a note from your BTech knowledge repository." },
      { property: "og:title", content: "Note — BTech Notes" },
      { property: "og:description", content: "Read a note from your BTech knowledge repository." },
    ],
  }),
  component: NoteDetailPage,
});

function NoteDetailPage() {
  const { id } = useParams({ from: "/_app/notes/$id" });
  const note = useNote(id);
  const uid = useUid();
  const invalidate = useInvalidateAll();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  if (note.isLoading) return <PageSkeleton />;

  if (!note.data) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Note not found"
        description="This note may have been deleted or never existed."
      >
        <Button asChild className="mt-5">
          <Link to="/notes">Back to notes</Link>
        </Button>
      </EmptyState>
    );
  }

  const data = note.data;
  const crumbs = [
    data.yearName,
    data.semesterName,
    data.subjectName,
    data.chapterName,
    data.topicName,
  ].filter(Boolean);

  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/notes">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to notes
        </Link>
      </Button>

      <header className="space-y-3 border-b border-border pb-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1.5">
          {crumbs.map((crumb) => (
            <Badge key={crumb} variant="secondary" className="font-normal">
              {crumb}
            </Badge>
          ))}
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Created {formatDate(data.createdAt, true)}
          </span>
          <span>Updated {formatDate(data.updatedAt, true)}</span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" variant="outline">
            <Link to="/notes/edit/$id" params={{ id: data.id }}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete
          </Button>
        </div>
      </header>

      <div
        className="prose-notes"
        // Content is authored by the signed-in owner in the app's own editor.
        dangerouslySetInnerHTML={{ __html: data.content || "<p><em>This note is empty.</em></p>" }}
      />

      {data.attachments?.length ? (
        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Paperclip className="h-4 w-4" aria-hidden="true" /> Attachments ({data.attachments.length})
          </h2>
          <div className="space-y-2">
            {data.attachments.map((attachment) => (
              <FileCard
                key={attachment.fileId}
                name={attachment.name}
                type={attachment.type}
                size={attachment.size}
                url={attachment.url}
                onDelete={async () => {
                  if (!uid) return;
                  try {
                    await api.detachFileFromNote(uid, data, attachment.fileId);
                    await invalidate();
                    toast.success("Attachment deleted.");
                  } catch (error) {
                    toast.error(friendlyError(error, "Failed to delete the attachment."));
                  }
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete "${data.title}"?`}
        description="This will permanently delete the note and its attached files. This action cannot be undone."
        onConfirm={async () => {
          if (!uid) return;
          try {
            await api.deleteNote(uid, data);
            await invalidate();
            toast.success("Note deleted successfully.");
            navigate({ to: "/notes" });
          } catch (error) {
            toast.error(friendlyError(error, "Failed to delete the note."));
          }
        }}
      />
    </article>
  );
}

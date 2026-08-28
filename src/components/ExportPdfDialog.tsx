import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { friendlyError } from "@/lib/format";
import { downloadPdf } from "@/lib/pdf/document";
import {
  DEFAULT_EXPORT_OPTIONS,
  type DocStyle,
  type ExportOptions,
  type FontSize,
  type Orientation,
  type PaperSize,
} from "@/lib/pdf/options";
import type { Chapter, Note, Subject, Topic } from "@/lib/types";

const PREF_KEY = "btech-notes:pdf-prefs";

function loadPrefs(): ExportOptions {
  if (typeof window === "undefined") return DEFAULT_EXPORT_OPTIONS;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    return raw
      ? { ...DEFAULT_EXPORT_OPTIONS, ...(JSON.parse(raw) as Partial<ExportOptions>) }
      : DEFAULT_EXPORT_OPTIONS;
  } catch {
    return DEFAULT_EXPORT_OPTIONS;
  }
}

export interface ExportPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Document title (also used for the filename). */
  title: string;
  subject?: Subject | null;
  chapters: Chapter[];
  topics: Topic[];
  notes: Note[];
  /** Show the chapter picker (subject-level export). */
  selectableChapters?: boolean;
}

const TOGGLES: { key: keyof ExportOptions; label: string }[] = [
  { key: "coverPage", label: "Cover page" },
  { key: "includeToc", label: "Table of contents" },
  { key: "includeChapterNumbers", label: "Number chapters" },
  { key: "includeTopicNumbers", label: "Number topics" },
  { key: "includePageNumbers", label: "Page numbers" },
  { key: "includeSubjectInfo", label: "Subject summary" },
  { key: "includeImages", label: "Images" },
  { key: "includeCode", label: "Code blocks" },
  { key: "includeMath", label: "Equations (LaTeX)" },
];

export function ExportPdfDialog({
  open,
  onOpenChange,
  title,
  subject,
  chapters,
  topics,
  notes,
  selectableChapters = false,
}: ExportPdfDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setOptions(loadPrefs());
      setSelected(chapters.map((c) => c.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const chosenChapters = useMemo(
    () => (selectableChapters ? chapters.filter((c) => selected.includes(c.id)) : chapters),
    [chapters, selected, selectableChapters],
  );

  const noteCount = useMemo(() => {
    if (!chapters.length) return notes.length;
    const ids = new Set(chosenChapters.map((c) => c.id));
    return notes.filter((n) => ids.has(n.chapterId)).length;
  }, [chapters.length, chosenChapters, notes]);

  const set = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  async function handleExport() {
    if (chapters.length && !chosenChapters.length) {
      toast.error("Select at least one chapter.");
      return;
    }
    setBusy(true);
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(options));
      const chapterIds = new Set(chosenChapters.map((c) => c.id));
      await downloadPdf(
        {
          title,
          subject: subject ?? null,
          chapters: chosenChapters,
          topics: chapters.length ? topics.filter((t) => chapterIds.has(t.chapterId)) : topics,
          notes: chapters.length ? notes.filter((n) => chapterIds.has(n.chapterId)) : notes,
        },
        options,
      );
      toast.success("PDF generated.");
      onOpenChange(false);
    } catch (error) {
      toast.error(friendlyError(error, "Could not generate the PDF."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export PDF</DialogTitle>
          <DialogDescription>
            {noteCount} note{noteCount === 1 ? "" : "s"} will be included in “{title}”.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-6">
            {selectableChapters && chapters.length > 0 ? (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Chapters</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelected(
                        selected.length === chapters.length ? [] : chapters.map((c) => c.id),
                      )
                    }
                  >
                    {selected.length === chapters.length ? "Clear all" : "Select all"}
                  </Button>
                </div>
                <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                  {chapters.map((chapter) => (
                    <label key={chapter.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected.includes(chapter.id)}
                        onCheckedChange={(checked) =>
                          setSelected((prev) =>
                            checked ? [...prev, chapter.id] : prev.filter((v) => v !== chapter.id),
                          )
                        }
                      />
                      <span className="truncate">{chapter.name}</span>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Cover details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-student">Student name</Label>
                  <Input
                    id="pdf-student"
                    value={options.studentName}
                    onChange={(e) => set("studentName", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-branch">Branch</Label>
                  <Input
                    id="pdf-branch"
                    value={options.branch}
                    onChange={(e) => set("branch", e.target.value)}
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-university">University / College</Label>
                  <Input
                    id="pdf-university"
                    value={options.university}
                    onChange={(e) => set("university", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pdf-year">Academic year</Label>
                  <Input
                    id="pdf-year"
                    value={options.academicYear}
                    onChange={(e) => set("academicYear", e.target.value)}
                    placeholder="e.g. 2025–26"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Layout</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Style</Label>
                  <Select
                    value={options.style}
                    onValueChange={(v) => set("style", v as DocStyle)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Paper</Label>
                  <Select
                    value={options.paperSize}
                    onValueChange={(v) => set("paperSize", v as PaperSize)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="LETTER">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Orientation</Label>
                  <Select
                    value={options.orientation}
                    onValueChange={(v) => set("orientation", v as Orientation)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Font size</Label>
                  <Select
                    value={options.fontSize}
                    onValueChange={(v) => set("fontSize", v as FontSize)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Include</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {TOGGLES.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(options[key])}
                      onCheckedChange={(checked) =>
                        set(key, Boolean(checked) as ExportOptions[typeof key])
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

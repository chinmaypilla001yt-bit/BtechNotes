/* ------------------------------------------------------------------ *
 * Builds a professional, book-like PDF for a subject / lessons / note
 * using pdfmake. Cover page, table of contents, numbered lessons,
 * running header, footer with page numbers.
 * ------------------------------------------------------------------ */

import type { Chapter, Note, Subject } from "@/lib/types";

import {
  BASE_FONT_SIZE,
  sanitizeFilename,
  type ExportOptions,
  type PaperSize,
} from "./options";
import { htmlToPdfContent, type RenderContext } from "./rich-content";

type Any = Record<string, unknown>;

const ACCENT: Record<ExportOptions["style"], string> = {
  academic: "#1f3a8a",
  minimal: "#111827",
  modern: "#0f766e",
};

const PAGE_WIDTH: Record<PaperSize, number> = { A4: 595.28, LETTER: 612 };

function usableWidth(options: ExportOptions) {
  const w = options.orientation === "landscape" ? 841.89 : PAGE_WIDTH[options.paperSize];
  return w - 100;
}

/**
 * pdfmake 0.3 changed the client-side VFS setup and createPdf API.
 * In particular, createPdf expects an options object internally, so
 * passing no second argument can cause `progressCallback` errors.
 */
async function loadPdfMake() {
  const [{ default: pdfMake }, vfsModule] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);

  const maker = pdfMake as unknown as Any & {
    addVirtualFileSystem?: (vfs: unknown) => void;
    vfs?: unknown;
    fonts?: unknown;
  };
  const mod = vfsModule as unknown as Any;
  const vfs = mod["default"] ?? mod;

  if (typeof maker.addVirtualFileSystem === "function") {
    maker.addVirtualFileSystem(vfs);
  } else {
    // Compatibility fallback for older pdfmake builds.
    const inner = mod["default"] as Any | undefined;
    maker["vfs"] = inner?.["vfs"] ?? mod["vfs"] ?? inner ?? mod;
    maker["fonts"] = {
      Roboto: {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
        italics: "Roboto-Italic.ttf",
        bolditalics: "Roboto-MediumItalic.ttf",
      },
    };
  }

  return maker;
}

export interface ExportPayload {
  /** Document title shown on the cover / header. */
  title: string;
  subject?: Subject | null;
  chapters: Chapter[];
  notes: Note[];
}

function coverPage(payload: ExportPayload, options: ExportOptions, accent: string): Any[] {
  const meta = [
    options.studentName && { text: options.studentName, style: "coverMetaStrong" },
    options.branch && { text: options.branch, style: "coverMeta" },
    options.academicYear && { text: options.academicYear, style: "coverMeta" },
    options.university && { text: options.university, style: "coverMeta" },
  ].filter(Boolean) as Any[];

  return [
    { text: "", margin: [0, 90, 0, 0] },
    {
      canvas: [{ type: "rect", x: 0, y: 0, w: usableWidth(options), h: 4, color: accent }],
      margin: [0, 0, 0, 26],
    },
    { text: "STUDY NOTES", style: "coverKicker", color: accent },
    { text: payload.title, style: "coverTitle" },
    payload.subject
      ? {
          text: [payload.subject.name].filter(Boolean).join(" · "),
          style: "coverSubtitle",
        }
      : {},
    {
      canvas: [{ type: "rect", x: 0, y: 0, w: 120, h: 2, color: accent }],
      margin: [0, 18, 0, 26],
    },
    ...meta,
    {
      text: `Generated ${new Date().toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      style: "coverFoot",
      margin: [0, 40, 0, 0],
    },
    { text: "", pageBreak: "after" },
  ];
}

export async function buildDocDefinition(payload: ExportPayload, options: ExportOptions) {
  const accent = ACCENT[options.style];
  const base = BASE_FONT_SIZE[options.fontSize];
  const ctx: RenderContext = {
    includeCode: options.includeCode,
    includeMath: options.includeMath,
    includeImages: options.includeImages,
    maxWidth: usableWidth(options),
    accent,
  };

  const content: Any[] = [];
  if (options.coverPage) content.push(...coverPage(payload, options, accent));

  if (options.includeToc) {
    content.push({
      toc: {
        title: { text: "Table of contents", style: "h1", margin: [0, 0, 0, 14] },
      },
      pageBreak: "after",
    });
  }

  if (options.includeSubjectInfo && payload.subject) {
    content.push({
      style: "infoBox",
      table: {
        widths: ["auto", "*"],
        body: [
          ["Subject", payload.subject.name],
          ["Lessons", String(payload.chapters.length)],
          ["Notes", String(payload.notes.length)],
        ],
      },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 18],
    });
  }

  let lessonIndex = 0;
  for (const chapter of payload.chapters) {
    lessonIndex += 1;
    const lessonTitle = options.includeChapterNumbers
      ? `Lesson ${lessonIndex} — ${chapter.name}`
      : chapter.name;

    content.push({
      text: lessonTitle,
      style: "h1",
      color: accent,
      tocItem: options.includeToc,
      pageBreak: content.length ? "before" : undefined,
      margin: [0, 0, 0, 4],
    });
    content.push({
      canvas: [{ type: "rect", x: 0, y: 0, w: usableWidth(options), h: 1.5, color: accent }],
      margin: [0, 0, 0, 14],
    });

    const lessonNotes = payload.notes.filter((n) => n.chapterId === chapter.id);

    if (!lessonNotes.length) {
      content.push({ text: "No notes in this lesson yet.", style: "muted" });
    }

    let noteIndex = 0;
    for (const note of lessonNotes) {
      noteIndex += 1;
      const noteTitle = options.includeNoteNumbers
        ? `${lessonIndex}.${noteIndex} ${note.title}`
        : note.title;
      content.push({
        text: noteTitle,
        style: "h2",
        tocItem: options.includeToc,
        tocMargin: [16, 0, 0, 0],
        margin: [0, 12, 0, 6],
      });
      content.push(...(await htmlToPdfContent(note.content, ctx)));
    }
  }

  // Standalone note export (no lessons supplied)
  if (!payload.chapters.length) {
    for (const note of payload.notes) {
      content.push({ text: note.title, style: "h1", color: accent, margin: [0, 0, 0, 10] });
      content.push(...(await htmlToPdfContent(note.content, ctx)));
    }
  }

  const headerText = payload.subject?.name ?? payload.title;

  return {
    pageSize: options.paperSize,
    pageOrientation: options.orientation,
    pageMargins: [50, 60, 50, 55] as [number, number, number, number],
    info: { title: payload.title, author: options.studentName || "BTech Notes" },
    header: (currentPage: number) =>
      currentPage === 1 && options.coverPage
        ? undefined
        : {
            columns: [
              { text: headerText, style: "runningHead" },
              { text: payload.title, style: "runningHead", alignment: "right" },
            ],
            margin: [50, 24, 50, 0],
          },
    footer: (currentPage: number, pageCount: number) =>
      currentPage === 1 && options.coverPage
        ? undefined
        : {
            columns: [
              { text: "BTech Notes", style: "runningFoot" },
              options.includePageNumbers
                ? {
                    text: `${currentPage} / ${pageCount}`,
                    style: "runningFoot",
                    alignment: "right",
                  }
                : { text: "" },
            ],
            margin: [50, 12, 50, 0],
          },
    content,
    defaultStyle: { font: "Roboto", fontSize: base, lineHeight: 1.35, color: "#1f2933" },
    styles: {
      coverKicker: { fontSize: base, bold: true, characterSpacing: 2 },
      coverTitle: { fontSize: base * 2.9, bold: true, margin: [0, 10, 0, 6] },
      coverSubtitle: { fontSize: base * 1.3, color: "#52606d" },
      coverMetaStrong: { fontSize: base * 1.1, bold: true, margin: [0, 0, 0, 3] },
      coverMeta: { fontSize: base, color: "#52606d", margin: [0, 0, 0, 3] },
      coverFoot: { fontSize: base * 0.85, color: "#7b8794" },
      h1: { fontSize: base * 1.75, bold: true },
      h2: { fontSize: base * 1.3, bold: true, color: accent },
      h3: { fontSize: base * 1.1, bold: true },
      para: { margin: [0, 0, 0, 8] },
      muted: { color: "#7b8794", italics: true },
      infoBox: { fontSize: base * 0.95 },
      runningHead: { fontSize: base * 0.75, color: "#7b8794" },
      runningFoot: { fontSize: base * 0.75, color: "#7b8794" },
    },
  } as Any;
}

export async function downloadPdf(payload: ExportPayload, options: ExportOptions) {
  const [maker, docDefinition] = await Promise.all([
    loadPdfMake(),
    buildDocDefinition(payload, options),
  ]);
  const create = maker["createPdf"] as (d: Any, options?: Any) => {
    download: (name?: string) => void;
  };
  // pdfmake 0.3 expects an options object internally. Passing {} avoids
  // the `Cannot read properties of undefined (reading 'progressCallback')`
  // error that occurs when createPdf is called with only the document.
  create(docDefinition, {}).download(`${sanitizeFilename(payload.title)}.pdf`);
}

export type DocStyle = "academic" | "minimal" | "modern";
export type PaperSize = "A4" | "LETTER";
export type Orientation = "portrait" | "landscape";
export type FontSize = "small" | "medium" | "large";
export type ExportScope = "note" | "chapter" | "selected" | "subject";

export interface ExportOptions {
  includeToc: boolean;
  includeChapterNumbers: boolean;
  includeTopicNumbers: boolean;
  includePageNumbers: boolean;
  includeSubjectInfo: boolean;
  includeTags: boolean;
  includeRevisionStatus: boolean;
  includeCode: boolean;
  includeMath: boolean;
  includeImages: boolean;
  coverPage: boolean;
  studentName: string;
  university: string;
  branch: string;
  academicYear: string;
  style: DocStyle;
  paperSize: PaperSize;
  orientation: Orientation;
  fontSize: FontSize;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeToc: true,
  includeChapterNumbers: true,
  includeTopicNumbers: true,
  includePageNumbers: true,
  includeSubjectInfo: true,
  includeTags: false,
  includeRevisionStatus: false,
  includeCode: true,
  includeMath: true,
  includeImages: true,
  coverPage: true,
  studentName: "",
  university: "",
  branch: "",
  academicYear: "",
  style: "academic",
  paperSize: "A4",
  orientation: "portrait",
  fontSize: "medium",
};

/** Persisted subset — cover text fields are per-export, the rest are preferences. */
export type ExportPreferences = Partial<ExportOptions>;

export const BASE_FONT_SIZE: Record<FontSize, number> = {
  small: 9.5,
  medium: 11,
  large: 12.5,
};

export function sanitizeFilename(input: string) {
  return (
    input
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 90) || "BTech_Notes"
  );
}

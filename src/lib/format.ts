import type { Timestamp } from "firebase/firestore";

export function tsToDate(value?: Timestamp | null): Date | null {
  if (!value) return null;
  if (typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate();
  return null;
}

export function formatDate(value?: Timestamp | null, long = false) {
  const date = tsToDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
  });
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function friendlyError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const code = (error as { code?: string })?.code ?? "";
  const message = (error as Error)?.message ?? "";
  if (code.includes("permission-denied")) return "You don't have permission to do that.";
  if (code.includes("unauthenticated")) return "Your session expired. Please sign in again.";
  if (code.includes("unavailable") || code.includes("network")) return "Network problem. Check your connection and try again.";
  if (code.includes("popup-closed-by-user")) return "Sign-in was cancelled.";
  if (code.includes("popup-blocked")) return "Your browser blocked the sign-in popup. Allow popups and try again.";
  if (code.includes("storage/unauthorized")) return "You don't have permission to access that file.";
  if (code.includes("storage/quota-exceeded")) return "Storage quota exceeded.";
  if (message && !message.startsWith("Firebase:")) return message;
  return fallback;
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

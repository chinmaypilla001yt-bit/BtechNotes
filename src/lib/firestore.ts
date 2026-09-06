import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { User } from "firebase/auth";

import { getDb, getFirebaseStorage, MAX_FILE_SIZE } from "./firebase";
import type { Attachment, Chapter, Note, Semester, StoredFile, Subject, Year } from "./types";

const col = (uid: string, name: string) => collection(getDb(), "users", uid, name);
const docRef = (uid: string, name: string, id: string) => doc(getDb(), "users", uid, name, id);
const map = <T,>(snap: QueryDocumentSnapshot<DocumentData>) => ({ id: snap.id, ...snap.data() }) as T;

export async function ensureUserProfile(user: User) {
  const userRef = doc(getDb(), "users", user.uid);
  const snap = await getDoc(userRef);
  const base = { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL, lastLoginAt: serverTimestamp() };
  if (snap.exists()) await updateDoc(userRef, base);
  else await setDoc(userRef, { ...base, createdAt: serverTimestamp() });
}

export async function listYears(uid: string): Promise<Year[]> {
  const snap = await getDocs(col(uid, "years"));
  return snap.docs.map((d) => map<Year>(d)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function listSemesters(uid: string): Promise<Semester[]> {
  const snap = await getDocs(col(uid, "semesters"));
  return snap.docs.map((d) => map<Semester>(d)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function listSubjects(uid: string): Promise<Subject[]> {
  const snap = await getDocs(col(uid, "subjects"));
  return snap.docs.map((d) => map<Subject>(d)).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listChapters(uid: string): Promise<Chapter[]> {
  const snap = await getDocs(col(uid, "chapters"));
  return snap.docs.map((d) => map<Chapter>(d)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function listNotes(uid: string): Promise<Note[]> {
  const snap = await getDocs(col(uid, "notes"));
  return snap.docs.map((d) => map<Note>(d)).sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || toMillis(a.createdAt) - toMillis(b.createdAt));
}

export async function getNote(uid: string, id: string): Promise<Note | null> {
  const snap = await getDoc(docRef(uid, "notes", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Note) : null;
}

export async function listFiles(uid: string): Promise<StoredFile[]> {
  const snap = await getDocs(col(uid, "files"));
  return snap.docs.map((d) => map<StoredFile>(d)).sort((a, b) => toMillis(b.uploadedAt) - toMillis(a.uploadedAt));
}

export const toMillis = (value?: Timestamp | null) => value instanceof Timestamp ? value.toMillis() : 0;

export async function createEntity(uid: string, name: "years" | "semesters" | "subjects" | "chapters", data: Record<string, unknown>) {
  const created = await addDoc(col(uid, name), { ...data, ownerId: uid, createdAt: serverTimestamp() });
  return created.id;
}

export async function renameEntity(uid: string, name: "years" | "semesters" | "subjects" | "chapters", id: string, newName: string) {
  await updateDoc(docRef(uid, name, id), { name: newName });
  const field = ({ years: "yearId", semesters: "semesterId", subjects: "subjectId", chapters: "chapterId" } as const)[name];
  const nameField = field.replace("Id", "Name");
  const notes = await getDocs(query(col(uid, "notes"), where(field, "==", id)));
  await Promise.all(notes.docs.map((d) => updateDoc(d.ref, { [nameField]: newName })));
}

/** Move a lesson to a new index within its subject and keep every lesson's order contiguous. */
export async function reorderChapter(uid: string, chapterId: string, newIndex: number) {
  const chapterSnap = await getDoc(docRef(uid, "chapters", chapterId));
  const subjectId = chapterSnap.data()?.subjectId;
  if (!subjectId) throw new Error("Lesson not found.");
  const snap = await getDocs(query(col(uid, "chapters"), where("subjectId", "==", subjectId)));
  const chapters = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chapter)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  if (currentIndex < 0) throw new Error("Lesson not found.");
  const targetIndex = Math.max(0, Math.min(newIndex, chapters.length - 1));
  if (currentIndex === targetIndex) return;
  const [moved] = chapters.splice(currentIndex, 1);
  chapters.splice(targetIndex, 0, moved);
  await Promise.all(chapters.map((chapter, index) => updateDoc(docRef(uid, "chapters", chapter.id), { order: index + 1 })));
}

/** Move a topic/note to a new index within its lesson and keep every topic index contiguous. */
export async function reorderNote(uid: string, noteId: string, newIndex: number) {
  const noteSnap = await getDoc(docRef(uid, "notes", noteId));
  const chapterId = noteSnap.data()?.chapterId;
  if (!chapterId) throw new Error("Topic not found.");
  const snap = await getDocs(query(col(uid, "notes"), where("chapterId", "==", chapterId)));
  const topicNotes = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Note))
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) || toMillis(a.createdAt) - toMillis(b.createdAt));
  const currentIndex = topicNotes.findIndex((n) => n.id === noteId);
  if (currentIndex < 0) throw new Error("Topic not found.");
  const targetIndex = Math.max(0, Math.min(newIndex, topicNotes.length - 1));
  if (currentIndex === targetIndex && topicNotes.every((n, i) => n.order === i + 1)) return;
  const [moved] = topicNotes.splice(currentIndex, 1);
  topicNotes.splice(targetIndex, 0, moved);
  await Promise.all(topicNotes.map((note, index) => updateDoc(docRef(uid, "notes", note.id), { order: index + 1 })));
}

export interface NoteInput {
  title: string;
  content: string;
  plainText: string;
  yearId: string;
  yearName: string;
  semesterId: string;
  semesterName: string;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  attachments: Attachment[];
}

export async function createNote(uid: string, input: NoteInput) {
  const existing = await getDocs(query(col(uid, "notes"), where("chapterId", "==", input.chapterId)));
  const nextOrder = existing.docs.reduce((max, d) => Math.max(max, Number(d.data().order) || 0), 0) + 1;
  const created = await addDoc(col(uid, "notes"), { ...input, order: nextOrder, ownerId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await Promise.all(input.attachments.map((a) => updateDoc(docRef(uid, "files", a.fileId), { noteId: created.id, noteTitle: input.title })));
  return created.id;
}

export async function updateNote(uid: string, id: string, input: NoteInput) {
  await updateDoc(docRef(uid, "notes", id), { ...input, updatedAt: serverTimestamp() });
  await Promise.all(input.attachments.map((a) => updateDoc(docRef(uid, "files", a.fileId), { noteId: id, noteTitle: input.title })));
}

export async function deleteNote(uid: string, note: Note) {
  await Promise.all((note.attachments || []).map((a) => deleteStoredFile(uid, a.fileId, a.path)));
  await deleteDoc(docRef(uid, "notes", note.id));
}

export async function uploadFile(uid: string, file: File, noteId?: string | null) {
  if (file.size > MAX_FILE_SIZE) throw new Error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — larger than the ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB limit.`);
  const fileDoc = doc(col(uid, "files"));
  const path = `users/${uid}/files/${fileDoc.id}-${file.name}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(storageRef);
  const record = { ownerId: uid, name: file.name, type: file.type || "application/octet-stream", size: file.size, path, url, noteId: noteId ?? null, noteTitle: null, uploadedAt: serverTimestamp() };
  await setDoc(fileDoc, record);
  return { fileId: fileDoc.id, name: file.name, type: record.type, size: file.size, path, url, uploadedAt: Date.now(), ownerId: uid } as Attachment;
}

export async function deleteStoredFile(uid: string, fileId: string, path: string) {
  try { await deleteObject(ref(getFirebaseStorage(), path)); } catch { /* object may already be gone */ }
  await deleteDoc(docRef(uid, "files", fileId)).catch(() => undefined);
}

export async function detachFileFromNote(uid: string, note: Note, fileId: string) {
  const target = (note.attachments || []).find((a) => a.fileId === fileId);
  if (!target) return;
  await deleteStoredFile(uid, fileId, target.path);
  await updateDoc(docRef(uid, "notes", note.id), { attachments: (note.attachments || []).filter((a) => a.fileId !== fileId), updatedAt: serverTimestamp() });
}

async function deleteNotesWhere(uid: string, field: string, id: string) {
  const notes = await getDocs(query(col(uid, "notes"), where(field, "==", id)));
  await Promise.all(notes.docs.map((d) => deleteNote(uid, { id: d.id, ...d.data() } as Note)));
}

async function deleteDocsWhere(uid: string, name: string, field: string, id: string) {
  const snap = await getDocs(query(col(uid, name), where(field, "==", id)));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  return snap.docs.map((d) => d.id);
}

export async function deleteChapter(uid: string, chapterId: string) { await deleteNotesWhere(uid, "chapterId", chapterId); await deleteDoc(docRef(uid, "chapters", chapterId)); }
export async function deleteSubject(uid: string, subjectId: string) { await deleteNotesWhere(uid, "subjectId", subjectId); await deleteDocsWhere(uid, "chapters", "subjectId", subjectId); await deleteDoc(docRef(uid, "subjects", subjectId)); }
export async function deleteSemester(uid: string, semesterId: string) { await deleteNotesWhere(uid, "semesterId", semesterId); await deleteDocsWhere(uid, "chapters", "semesterId", semesterId); await deleteDocsWhere(uid, "subjects", "semesterId", semesterId); await deleteDoc(docRef(uid, "semesters", semesterId)); }
export async function deleteYear(uid: string, yearId: string) { await deleteNotesWhere(uid, "yearId", yearId); await deleteDocsWhere(uid, "chapters", "yearId", yearId); await deleteDocsWhere(uid, "subjects", "yearId", yearId); await deleteDocsWhere(uid, "semesters", "yearId", yearId); await deleteDoc(docRef(uid, "years", yearId)); }

export async function deleteAllUserData(uid: string) {
  const files = await listFiles(uid);
  await Promise.all(files.map((f) => deleteStoredFile(uid, f.id, f.path)));
  for (const name of ["notes", "chapters", "subjects", "semesters", "years", "files"]) {
    const snap = await getDocs(col(uid, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
}

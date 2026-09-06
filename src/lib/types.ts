import type { Timestamp } from "firebase/firestore";

export type Entity = "years" | "semesters" | "subjects" | "chapters";

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
}

export interface Year {
  id: string;
  ownerId: string;
  name: string;
  order: number;
  createdAt?: Timestamp | null;
}

export interface Semester {
  id: string;
  ownerId: string;
  name: string;
  yearId: string;
  order: number;
  createdAt?: Timestamp | null;
}

export interface Subject {
  id: string;
  ownerId: string;
  name: string;
  yearId: string;
  semesterId: string;
  createdAt?: Timestamp | null;
}

export interface Chapter {
  id: string;
  ownerId: string;
  name: string;
  subjectId: string;
  semesterId: string;
  yearId: string;
  order: number;
  createdAt?: Timestamp | null;
}

export interface Attachment {
  fileId: string;
  name: string;
  type: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: number;
  ownerId: string;
}

export interface Note {
  id: string;
  ownerId: string;
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
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface StoredFile {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  size: number;
  path: string;
  url: string;
  noteId: string | null;
  noteTitle: string | null;
  uploadedAt?: Timestamp | null;
}

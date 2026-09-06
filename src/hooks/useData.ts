import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useUid } from "./useAuth";
import * as api from "@/lib/firestore";
import type { Chapter, Note, Semester, StoredFile, Subject, Year } from "@/lib/types";

const keys = {
  years: (uid: string) => ["years", uid],
  semesters: (uid: string) => ["semesters", uid],
  subjects: (uid: string) => ["subjects", uid],
  chapters: (uid: string) => ["chapters", uid],
  notes: (uid: string) => ["notes", uid],
  files: (uid: string) => ["files", uid],
};

function useOwned<T>(name: keyof typeof keys, fn: (uid: string) => Promise<T[]>) {
  const uid = useUid();
  return useQuery({
    queryKey: uid ? keys[name](uid) : [name, "anon"],
    queryFn: () => fn(uid as string),
    enabled: !!uid,
    staleTime: 30_000,
  });
}

export const useYears = () => useOwned<Year>("years", api.listYears);
export const useSemesters = () => useOwned<Semester>("semesters", api.listSemesters);
export const useSubjects = () => useOwned<Subject>("subjects", api.listSubjects);
export const useChapters = () => useOwned<Chapter>("chapters", api.listChapters);
export const useNotes = () => useOwned<Note>("notes", api.listNotes);
export const useFiles = () => useOwned<StoredFile>("files", api.listFiles);

export function useNote(id: string) {
  const uid = useUid();
  return useQuery({
    queryKey: ["note", uid, id],
    queryFn: () => api.getNote(uid as string, id),
    enabled: !!uid && !!id,
  });
}

/** Invalidates every user-scoped cache entry. */
export function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      ["years", "semesters", "subjects", "chapters", "notes", "files", "note"].map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
}

export function useUidRequired() {
  const uid = useUid();
  if (!uid) throw new Error("You must be signed in.");
  return uid;
}

/** Generic mutation helper that refreshes all data afterwards. */
export function useAppMutation<TVars>(fn: (uid: string, vars: TVars) => Promise<unknown>) {
  const uid = useUid();
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (vars: TVars) => {
      if (!uid) throw new Error("You must be signed in.");
      return fn(uid, vars);
    },
    onSuccess: () => invalidate(),
  });
}

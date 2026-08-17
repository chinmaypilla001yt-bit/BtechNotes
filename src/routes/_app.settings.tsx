import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTheme } from "@/components/ThemeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth, useUid } from "@/hooks/useAuth";
import { useChapters, useFiles, useInvalidateAll, useNotes, useSubjects, useTopics } from "@/hooks/useData";
import * as api from "@/lib/firestore";
import { formatBytes, friendlyError } from "@/lib/format";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — BTech Notes" },
      { name: "description", content: "Manage your profile, appearance and account data." },
      { property: "og:title", content: "Settings — BTech Notes" },
      { property: "og:description", content: "Manage your profile, appearance and account data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const uid = useUid();
  const navigate = useNavigate();
  const invalidate = useInvalidateAll();
  const { theme, setTheme } = useTheme();

  const subjects = useSubjects();
  const chapters = useChapters();
  const topics = useTopics();
  const notes = useNotes();
  const files = useFiles();

  const [wiping, setWiping] = useState(false);

  const stats = [
    { label: "Subjects", value: subjects.data?.length ?? 0 },
    { label: "Chapters", value: chapters.data?.length ?? 0 },
    { label: "Topics", value: topics.data?.length ?? 0 },
    { label: "Notes", value: notes.data?.length ?? 0 },
    { label: "Files", value: files.data?.length ?? 0 },
    {
      label: "Storage used",
      value: formatBytes((files.data ?? []).reduce((sum, f) => sum + (f.size || 0), 0)),
    },
  ];

  const themes = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your profile, appearance and data.</p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user?.photoURL ?? undefined} alt="" />
            <AvatarFallback>{(user?.displayName ?? "U").slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.displayName ?? "Student"}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={theme === value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(value)}
            >
              <Icon className="mr-1.5 h-4 w-4" /> {label}
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Your data</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Account</h2>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={async () => {
            await signOut();
            navigate({ to: "/login", replace: true });
          }}
        >
          <LogOut className="mr-1.5 h-4 w-4" /> Sign out
        </Button>
      </section>

      <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Danger zone
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Permanently delete every year, semester, subject, chapter, topic, note and uploaded file in
          your account. This cannot be undone.
        </p>
        <Button variant="destructive" size="sm" className="mt-4" onClick={() => setWiping(true)}>
          Delete all my data
        </Button>
      </section>

      <ConfirmDialog
        open={wiping}
        onOpenChange={setWiping}
        title="Delete all your data?"
        description="Every note, file and curriculum item in your account will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete everything"
        onConfirm={async () => {
          if (!uid) return;
          try {
            await api.deleteAllUserData(uid);
            await invalidate();
            toast.success("All your data has been deleted.");
          } catch (error) {
            toast.error(friendlyError(error, "Could not delete your data."));
          }
        }}
      />
    </div>
  );
}

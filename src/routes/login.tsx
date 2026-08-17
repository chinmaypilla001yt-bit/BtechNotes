import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — BTech Notes" },
      { name: "description", content: "Sign in with Google to open your private BTech notes repository." },
      { property: "og:title", content: "Sign in — BTech Notes" },
      { property: "og:description", content: "Sign in with Google to open your private BTech notes repository." },
    ],
  }),
  component: LoginPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.6 0 9.3-3.9 9.3-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}

function LoginPage() {
  const { user, loading, configured, error, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to BTech Notes</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your private repository for four years of engineering notes — organised by year,
            semester, subject, chapter and topic.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
          {!configured ? (
            <div className="mb-4 flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-left text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">Firebase is not configured yet</p>
                <p className="mt-1 text-muted-foreground">
                  Add your Firebase credentials to a <code>.env</code> file (see{" "}
                  <code>.env.example</code>) and enable Google sign-in, Firestore and Storage in the
                  Firebase console.
                </p>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            className="w-full"
            size="lg"
            disabled={!configured || busy || loading}
            onClick={async () => {
              setBusy(true);
              try {
                await signInWithGoogle();
                navigate({ to: "/dashboard", replace: true });
              } catch {
                /* error surfaced through auth context */
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2 flex items-center">
                <GoogleIcon />
              </span>
            )}
            Continue with Google
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Your notes and files stay private to your account.
          </p>
        </div>
      </div>
    </div>
  );
}

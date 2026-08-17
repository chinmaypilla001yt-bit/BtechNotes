import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2 } from "lucide-react";
import { useEffect } from "react";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  if (loading || (!user && configured)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <GraduationCap className="h-8 w-8 text-primary" aria-hidden="true" />
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your session…
        </span>
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/login", replace: true });
    return null;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

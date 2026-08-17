import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  loading?: boolean;
}

export function StatCard({ icon: Icon, label, value, hint, loading }: Props) {
  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

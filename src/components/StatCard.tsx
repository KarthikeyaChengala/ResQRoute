import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "emergency" | "clear" | "warn";
}) {
  const toneClass = {
    default: "text-foreground",
    emergency: "text-emergency",
    clear: "text-clear",
    warn: "text-warn",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-command">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className={cn("size-4 shrink-0", toneClass)} />}
      </div>
      <p className={cn("mt-2 font-display text-3xl font-bold", toneClass)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

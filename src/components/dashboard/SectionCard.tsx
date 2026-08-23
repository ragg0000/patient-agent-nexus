import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  index,
  title,
  subtitle,
  children,
  className,
}: {
  index: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative pt-5", className)}>
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
        <span className="whitespace-nowrap rounded-md bg-navy px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy-foreground shadow-sm">
          {index}. {title}
        </span>
      </div>
      <div className="h-full rounded-xl border border-border bg-card p-4 pt-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {subtitle ? <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border p-3", className)}>
      {title ? (
        <h4 className="mb-2 text-xs font-semibold text-foreground">{title}</h4>
      ) : null}
      {children}
    </div>
  );
}

export function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "info" | "ok" | "warn" | "urgent" | "purple";
}) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    info: "bg-info-soft text-info",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    urgent: "bg-urgent-soft text-urgent",
    purple: "bg-accent-soft text-accent-strong",
  };
  return (
    <span className={cn("rounded-md px-2 py-1 text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-md border border-border bg-muted px-2.5 py-2 text-[11px] font-medium text-muted-foreground">
      {children}
    </p>
  );
}

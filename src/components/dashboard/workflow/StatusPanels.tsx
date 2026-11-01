import { AlertTriangle, Loader2, RotateCcw, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingPanel({ label = "Loading from backend…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2.5 text-xs text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-info" /> {label}
    </div>
  );
}

export function ErrorPanel({
  title,
  detail,
  onRetry,
  retryLabel = "Retry",
  children,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-urgent/30 bg-urgent-soft px-3 py-2.5 text-xs">
      <p className="flex items-center gap-1.5 font-semibold text-urgent">
        <AlertTriangle className="h-3.5 w-3.5" /> {title}
      </p>
      <p className="mt-1 text-muted-foreground">{detail}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {onRetry ? (
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onRetry}>
            <RotateCcw className="h-3 w-3" /> {retryLabel}
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function DataOriginBadge({ origin, className }: { origin?: string; className?: string }) {
  const offline = /offline|simulated|synthetic/i.test(origin ?? "");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold",
        offline ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok",
        className,
      )}
    >
      <ShieldAlert className="h-3 w-3" />
      {origin ? `Data origin: ${origin}` : "Data origin: backend"}
    </span>
  );
}

export function ProvenanceLegend() {
  const items = [
    { label: "Synthetic source record", tone: "bg-info-soft text-info" },
    { label: "Synthetic historical extension", tone: "bg-warn-soft text-warn" },
    { label: "Current encounter", tone: "bg-ok-soft text-ok" },
    { label: "AI-generated output", tone: "bg-accent-soft text-accent-strong" },
    { label: "Provider-approved output", tone: "bg-muted text-foreground" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i.label} className={cn("rounded-md px-2 py-1 text-[10px] font-medium", i.tone)}>
          {i.label}
        </span>
      ))}
    </div>
  );
}

import { Loader2 } from "lucide-react";
import { STEPS, type StepId, type StepStatus, type EncounterState } from "@/state/encounter-store";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<StepStatus, string> = {
  "not-started": "border-border bg-muted text-muted-foreground",
  loading: "border-info bg-info-soft text-info",
  ready: "border-ok/40 bg-ok-soft text-ok",
  "awaiting-review": "border-warn/40 bg-warn-soft text-warn",
  approved: "border-ok bg-ok text-ok-foreground",
  edited: "border-info bg-info text-info-foreground",
  rejected: "border-urgent bg-urgent-soft text-urgent",
  failed: "border-urgent bg-urgent text-urgent-foreground",
  stale: "border-warn bg-warn text-warn-foreground",
  completed: "border-ok bg-ok text-ok-foreground",
};

const STATUS_LABEL: Record<StepStatus, string> = {
  "not-started": "Not started",
  loading: "Loading",
  ready: "Ready",
  "awaiting-review": "Awaiting review",
  approved: "Approved",
  edited: "Edited",
  rejected: "Rejected",
  failed: "Failed",
  stale: "Stale — re-review required",
  completed: "Completed",
};

export function stepStatusTone(status: StepStatus) {
  return STATUS_TONE[status];
}

export function WorkflowStepper({ state }: { state: EncounterState }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {STEPS.map((step, index) => {
          const status = state.steps[step.id];
          return (
            <button
              key={step.id}
              onClick={() =>
                document.getElementById(`step-${step.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:opacity-90",
                STATUS_TONE[status],
              )}
            >
              {status === "loading" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="font-bold">{index + 1}</span>
              )}
              {step.short}
              <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">
                {status === "approved" || status === "completed" ? "✓" : status === "stale" ? "!" : ""}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 px-1 text-[10px] text-muted-foreground">
        Approval-gated workflow — providers cannot proceed past approval-dependent steps without explicitly approving
        or editing the previous result.
      </p>
    </div>
  );
}

export type { StepId };

import { useState } from "react";
import { ArrowRight, BadgeCheck, Play, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import type { AgentResult, PreConsultation } from "@/lib/backend";
import { agentDisplayName } from "@/lib/backend";
import type { StepStatus } from "@/state/encounter-store";
import { Chip, Panel, SectionCard } from "../SectionCard";
import { LockedState } from "../LockedState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ErrorPanel, LoadingPanel } from "./StatusPanels";
import { cn } from "@/lib/utils";

function toneFor(status: string) {
  const s = status.toLowerCase();
  if (/complet|success|done/.test(s)) return "ok" as const;
  if (/run|progress/.test(s)) return "info" as const;
  if (/warn|flag|review/.test(s)) return "warn" as const;
  if (/fail|error/.test(s)) return "urgent" as const;
  return "muted" as const;
}

function durationLabel(agent: AgentResult) {
  const ms = agent.durationMs ?? 0;
  if (ms > 0) return `${(ms / 1000).toFixed(ms < 1000 ? 2 : 1)}s`;
  return "0ms — Completed instantly using deterministic POC logic";
}

export function AgentsCard({
  patientId,
  running,
  result,
  error,
  onRun,
  onRetry,
  stepStatus,
}: {
  patientId: string | null;
  running: boolean;
  result: PreConsultation | null;
  error: { title: string; detail: string } | null;
  onRun: () => void;
  onRetry: () => void;
  stepStatus: StepStatus;
}) {
  const [open, setOpen] = useState<AgentResult | null>(null);
  const agents = result?.results ?? [];
  const completed = agents.filter((a) => /complet|success|done|warn/i.test(a.status)).length;
  const progress = agents.length ? Math.round((completed / agents.length) * 100) : 0;

  return (
    <SectionCard
      id="step-preconsult"
      index={4}
      title="Pre-Consultation Agent Workflow"
      subtitle="Real backend execution — no timer simulation · click any agent for full trace"
    >
      {!patientId ? (
        <LockedState label="Select a patient to enable the pre-consultation agent workflow" />
      ) : running ? (
        <LoadingPanel label="Running pre-consultation workflow on the backend…" />
      ) : error ? (
        <ErrorPanel
          title={error.title}
          detail={error.detail}
          onRetry={onRetry}
          retryLabel="Retry agent workflow"
        />
      ) : agents.length === 0 ? (
        <div className="space-y-2.5">
          <LockedState label="Pre-consultation analysis has not run yet for this patient" />
          <Button variant="agent" className="w-full" onClick={onRun}>
            <Play className="h-4 w-4" /> Run Pre-Consultation Workflow
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative max-h-[420px] space-y-1 overflow-y-auto pr-1">
            <span className="absolute left-[19px] top-3 bottom-3 w-px bg-border" aria-hidden />
            {agents.map((agent) => {
              const tone = toneFor(agent.status);
              return (
                <button
                  key={agent.id}
                  onClick={() => setOpen(agent)}
                  className="relative flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card",
                      tone === "info" && "border-info text-info",
                      tone === "ok" && "text-ok",
                      tone === "warn" && "text-warn",
                    )}
                  >
                    {tone === "ok" ? (
                      <BadgeCheck className="h-4 w-4" />
                    ) : tone === "warn" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <Timer className={cn("h-4 w-4", tone === "info" && "animate-pulse")} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{agent.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {agent.messages.length ? agent.messages[0] : agentDisplayName(agent.id)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Chip tone={tone}>{agent.status}</Chip>
                    <span className="text-[10px] text-muted-foreground">
                      {agent.durationMs && agent.durationMs > 0
                        ? `${(agent.durationMs / 1000).toFixed(1)}s`
                        : "instant"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Overall Progress</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" className="text-[11px]" onClick={onRun}>
              <RefreshCw className="h-3 w-3" /> Re-run workflow
            </Button>
            {result?.workflowRunId ? <Chip tone="info">Run: {result.workflowRunId}</Chip> : null}
            {result?.executedAt ? (
              <span className="text-[10px] text-muted-foreground">Executed {result.executedAt}</span>
            ) : null}
          </div>

          <Panel title="Handoffs">
            <ul className="space-y-1 text-[11px]">
              {agents.map((a, i) =>
                a.handoffTo ? (
                  <li key={a.id} className="flex items-start gap-1.5">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-info" />
                    <span>
                      <span className="font-medium">{a.name}</span> → {a.handoffTo}
                      {a.requiresProviderReview ? " · provider review required" : ""}
                      {i === agents.length - 1 ? " (end of workflow)" : ""}
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          </Panel>
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {open ? (
            <>
              <SheetHeader>
                <SheetTitle>{open.name}</SheetTitle>
                <SheetDescription>{agentDisplayName(open.id)}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <Chip tone={toneFor(open.status)}>{open.status}</Chip>
                  {open.requiresProviderReview ? <Chip tone="warn">Provider review required</Chip> : null}
                </div>
                <Panel title="Input source">
                  <p className="text-muted-foreground">{open.input ?? "—"}</p>
                </Panel>
                <Panel title="Output">
                  <p className="whitespace-pre-wrap text-muted-foreground">{open.output ?? "—"}</p>
                </Panel>
                <Panel title="Agent messages">
                  {open.messages.length ? (
                    <ul className="list-inside list-disc text-muted-foreground">
                      {open.messages.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No messages returned.</p>
                  )}
                </Panel>
                <Panel title="Execution">
                  <p className="text-muted-foreground">
                    Started: {open.startedAt ?? "—"} · Completed: {open.completedAt ?? "—"}
                  </p>
                  <p className="text-muted-foreground">Duration: {durationLabel(open)}</p>
                </Panel>
                <Panel title="Handoff target">
                  <p className="text-muted-foreground">{open.handoffTo ?? "—"}</p>
                </Panel>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}

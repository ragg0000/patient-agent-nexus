import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarClock,
  CircleHelp,
  ClipboardList,
  FileText,
  Layers,
  ShieldCheck,
  Siren,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { AGENTS, agentIO, agentName, type AgentDef, type AgentStatus } from "@/lib/agents";
import type { AgentRun, Handoff, WorkflowStatus } from "@/lib/useOrchestrator";
import type { Patient } from "@/data/patients";
import { Chip, Panel, SectionCard } from "./SectionCard";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ICONS = {
  context: UserCog,
  fhir: Boxes,
  intake: ClipboardList,
  missing: CircleHelp,
  risk: Siren,
  questions: CircleHelp,
  soap: FileText,
  followup: CalendarClock,
  safety: ShieldCheck,
  composer: Layers,
} as const;

function statusTone(status: AgentStatus) {
  switch (status) {
    case "Completed":
      return "ok" as const;
    case "Running":
      return "info" as const;
    case "Warning":
      return "warn" as const;
    case "Failed":
      return "urgent" as const;
    case "Queued":
      return "purple" as const;
    default:
      return "muted" as const;
  }
}

export function AgentsCard({
  patient,
  runs,
  handoffs,
  progress,
  status,
}: {
  patient: Patient;
  runs: Record<string, AgentRun>;
  handoffs: Handoff[];
  progress: number;
  status: WorkflowStatus;
}) {
  const [open, setOpen] = useState<AgentDef | null>(null);
  const io = open ? agentIO(open, patient) : null;
  const run = open ? runs[open.id] : null;

  return (
    <SectionCard
      index={2}
      title="AI Agents at Work"
      subtitle={`Orchestrator status: ${status} · click any agent for full trace`}
    >
      <div className="relative max-h-[520px] space-y-1 overflow-y-auto pr-1">
        <span className="absolute left-[19px] top-3 bottom-3 w-px bg-border" aria-hidden />
        {AGENTS.map((agent) => {
          const Icon = ICONS[agent.id];
          const r = runs[agent.id];
          return (
            <button
              key={agent.id}
              onClick={() => setOpen(agent)}
              className="relative flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-muted"
            >
              <span
                className={cn(
                  "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card",
                  r.status === "Running" && "border-info text-info",
                  r.status === "Completed" && "text-ok",
                  r.status === "Warning" && "text-warn",
                )}
              >
                <Icon className={cn("h-4 w-4", r.status === "Running" && "animate-pulse")} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{agent.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {agent.description}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Chip tone={statusTone(r.status)}>{r.status}</Chip>
                <span className="text-[10px] text-muted-foreground">
                  {r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : "—"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Overall Progress</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Panel title="Agent Handoffs" className="mt-3 max-h-36 overflow-y-auto">
        {handoffs.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No handoffs yet. Start AI Analysis to run the orchestrator.
          </p>
        ) : (
          <ul className="space-y-1.5 text-[11px]">
            {handoffs
              .slice()
              .reverse()
              .map((h, i) => (
                <li key={`${h.at}-${i}`} className="flex items-start gap-1.5">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-info" />
                  <span>
                    <span className="font-medium">{h.from}</span> → {h.to}: {h.message}{" "}
                    <span className="text-muted-foreground">({h.at})</span>
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Panel>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {open && io && run ? (
            <>
              <SheetHeader>
                <SheetTitle>{open.name}</SheetTitle>
                <SheetDescription>{open.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-xs">
                <Chip tone={statusTone(run.status)}>{run.status}</Chip>
                <Panel title="Responsibility">
                  <p className="text-muted-foreground">{open.responsibility}</p>
                </Panel>
                <Panel title="Input received">
                  <p className="text-muted-foreground">{io.input}</p>
                </Panel>
                <Panel title="Output produced">
                  <p className="text-muted-foreground">{io.output}</p>
                </Panel>
                <Panel title="Context dependencies">
                  <p className="text-muted-foreground">
                    {open.dependsOn.length
                      ? open.dependsOn.map((d) => agentName(d)).join(", ")
                      : "None — entry agent"}
                  </p>
                </Panel>
                <Panel title="Source references">
                  <ul className="list-inside list-disc text-muted-foreground">
                    {io.refs.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </Panel>
                <Panel title="Validation result">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5 text-ok" />
                    {run.validation ?? "Not executed yet"}
                  </p>
                </Panel>
                <Panel title="Handoff recipient">
                  <p className="text-muted-foreground">{agentName(open.handoffTo)}</p>
                </Panel>
                <Panel title="Execution">
                  <p className="text-muted-foreground">
                    Started: {run.startedAt ?? "—"} · Finished: {run.finishedAt ?? "—"} · Duration:{" "}
                    {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                  </p>
                  <p className="text-muted-foreground">
                    Provider: {run.provider ?? "synthetic-deterministic"}
                  </p>
                </Panel>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}

import { ArrowRight, Clock, FileEdit, Search, TimerReset, TriangleAlert, Workflow } from "lucide-react";
import { Chip, Disclaimer, Panel, SectionCard } from "./SectionCard";
import { LockedState } from "./LockedState";

const METRICS = [
  { icon: Clock, label: "Documentation time", from: "42 min", to: "9 min", note: "Simulated POC metric" },
  { icon: Search, label: "Chart review time", from: "18 min", to: "3 min", note: "Simulated POC metric" },
  { icon: TimerReset, label: "Agent processing time", from: "—", to: "10.3 s", note: "Simulated POC metric" },
  {
    icon: TriangleAlert,
    label: "Missing-information detection",
    from: "manual",
    to: "3 gaps flagged",
    note: "Simulated POC metric",
  },
  { icon: FileEdit, label: "Physician edits", from: "—", to: "4 per note", note: "Simulated POC metric" },
  { icon: Workflow, label: "Completed workflows", from: "—", to: "6 synthetic cases", note: "Simulated POC metric" },
];

export function ImpactCard({ ready }: { ready: boolean }) {
  return (
    <SectionCard index={8} title="Workflow Impact" subtitle="Simulated POC metrics — not clinical outcomes">
      {!ready ? (
        <LockedState label="Awaiting Safety Review and Clinical Composer agents" />
      ) : (
        <div className="space-y-2.5">
          <div className="grid gap-2 sm:grid-cols-2">
            {METRICS.map((m) => (
              <Panel key={m.label} className="text-xs">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                  <m.icon className="h-3.5 w-3.5 text-info" />
                  {m.label}
                </p>
                <p className="flex items-center gap-1.5 font-semibold">
                  <span className="text-muted-foreground">{m.from}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-ok">{m.to}</span>
                </p>
                <Chip>{m.note}</Chip>
              </Panel>
            ))}
          </div>
          <Disclaimer>
            Every value above is a simulated POC metric from synthetic data. No real-world clinical or
            operational claim is made.
          </Disclaimer>
        </div>
      )}
    </SectionCard>
  );
}

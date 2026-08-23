import { CalendarDays, HeartPulse, ShieldAlert, TriangleAlert, User } from "lucide-react";
import type { Patient } from "@/data/patients";
import { Chip, Disclaimer, Panel, SectionCard } from "./SectionCard";
import { LockedState } from "./LockedState";

export function ClinicalSummaryCard({ patient, ready }: { patient: Patient; ready: boolean }) {
  const riskTone = patient.risk === "High" ? "urgent" : patient.risk === "Moderate" ? "warn" : "ok";
  return (
    <SectionCard index={3} title="Clinical Summary" subtitle="AI-assembled overview for clinician review">
      {!ready ? (
        <LockedState label="Awaiting Intake / History and Missing Information agents" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Panel className="text-xs">
              <User className="mb-1 h-4 w-4 text-info" />
              <p className="text-muted-foreground">Age / Type</p>
              <p className="font-semibold">
                {patient.age} · {patient.type}
              </p>
            </Panel>
            <Panel className="text-xs">
              <ShieldAlert className="mb-1 h-4 w-4 text-urgent" />
              <p className="text-muted-foreground">Clinician-review risk</p>
              <Chip tone={riskTone}>{patient.risk}</Chip>
            </Panel>
            <Panel className="text-xs">
              <CalendarDays className="mb-1 h-4 w-4 text-info" />
              <p className="text-muted-foreground">Recent visits</p>
              <p className="font-semibold">{patient.recentVisits}</p>
            </Panel>
            <Panel className="text-xs">
              <HeartPulse className="mb-1 h-4 w-4 text-accent-strong" />
              <p className="text-muted-foreground">Active conditions</p>
              <p className="font-semibold">{patient.activeConditions.length}</p>
            </Panel>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Key Clinical Findings">
              <ul className="space-y-1 text-xs text-muted-foreground">
                {patient.findings.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </Panel>
            <Panel title="Abnormal Labs / Vitals">
              <ul className="space-y-1 text-xs">
                {patient.abnormal.map((a) => (
                  <li key={a.label} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">{a.value}</span>
                      <Chip tone={a.flag === "watch" ? "warn" : "urgent"}>{a.flag}</Chip>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Missing Information">
              <ul className="space-y-1 text-xs text-warn">
                {patient.gaps.map((g) => (
                  <li key={g} className="flex items-start gap-1.5">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Source References">
              <ul className="space-y-1 text-xs text-muted-foreground">
                {[...patient.documents, "Structured intake form", "Normalized FHIR resources"].map((d) => (
                  <li key={d}>• {d}</li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Safety Indicators">
            <div className="flex flex-wrap gap-1.5">
              <Chip tone="ok">No autonomous actions taken</Chip>
              <Chip tone="warn">{patient.gaps.length} open documentation gaps</Chip>
              <Chip tone="urgent">Allergy verification required</Chip>
              <Chip tone="purple">Physician approval pending</Chip>
            </div>
          </Panel>

          <Disclaimer>
            AI-assisted summary for clinician review only. Not a confirmed diagnosis or clinical decision.
          </Disclaimer>
        </div>
      )}
    </SectionCard>
  );
}

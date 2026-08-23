import { CheckCircle2, CircleAlert, HelpCircle, Pill, ShieldAlert } from "lucide-react";
import type { Patient } from "@/data/patients";
import { Chip, Disclaimer, Panel, SectionCard } from "./SectionCard";
import { LockedState } from "./LockedState";
import { Button } from "@/components/ui/button";

export function MedicationCard({ patient, ready }: { patient: Patient; ready: boolean }) {
  return (
    <SectionCard
      index={6}
      title="Medication Review"
      subtitle="Verification only — every medication action requires clinician approval"
    >
      {!ready ? (
        <LockedState label="Awaiting Doctor Questions and Safety Review agents" />
      ) : (
        <div className="space-y-2.5">
          <Panel title="Current Medications">
            <div className="flex flex-wrap gap-1.5">
              {patient.medications.map((m) => (
                <Chip key={m} tone="info">
                  <Pill className="mr-1 inline h-3 w-3" />
                  {m}
                </Chip>
              ))}
            </div>
          </Panel>
          <Panel title="Allergy Warnings">
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((a) => (
                <Chip key={a} tone="urgent">
                  <ShieldAlert className="mr-1 inline h-3 w-3" />
                  {a}
                </Chip>
              ))}
            </div>
          </Panel>
          <Panel title="Duplicate & Interaction Checks">
            <ul className="space-y-1.5 text-[11px]">
              {patient.medChecks.map((c) => (
                <li key={c.text} className="flex items-start gap-1.5">
                  {c.kind === "ok" ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
                  ) : c.kind === "warn" ? (
                    <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
                  ) : (
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-urgent" />
                  )}
                  <span className="text-muted-foreground">{c.text}</span>
                </li>
              ))}
              <li className="flex items-start gap-1.5 text-muted-foreground">
                <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
                Interaction review: external interaction service placeholder — clinician verification required.
              </li>
            </ul>
          </Panel>
          <Panel title="Medication Verification Questions">
            <ol className="space-y-1 text-[11px] text-muted-foreground">
              {patient.medQuestions.map((q, i) => (
                <li key={q}>
                  {i + 1}. {q}
                </li>
              ))}
            </ol>
          </Panel>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              Send to clinician for approval
            </Button>
          </div>
          <Disclaimer>
            No medication is started, stopped or changed by the agents. Clinician approval is required
            for every medication-related action.
          </Disclaimer>
        </div>
      )}
    </SectionCard>
  );
}

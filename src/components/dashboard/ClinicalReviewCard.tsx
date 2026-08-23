import { FileSearch, TriangleAlert } from "lucide-react";
import type { Patient } from "@/data/patients";
import { Chip, Disclaimer, Panel, SectionCard } from "./SectionCard";
import { LockedState } from "./LockedState";

const strengthTone = { Strong: "ok", Moderate: "warn", Limited: "muted" } as const;

export function ClinicalReviewCard({ patient, ready }: { patient: Patient; ready: boolean }) {
  return (
    <SectionCard
      index={4}
      title="Clinical Review"
      subtitle="Clinical considerations requiring physician review — no diagnoses issued"
    >
      {!ready ? (
        <LockedState label="Awaiting Risk Review Agent" />
      ) : (
        <div className="space-y-2.5">
          {patient.considerations.map((c) => (
            <Panel key={c.label}>
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <p className="text-xs font-semibold">{c.label}</p>
                <Chip tone={strengthTone[c.strength]}>{c.strength} evidence</Chip>
              </div>
              <ul className="space-y-0.5 text-[11px] text-muted-foreground">
                {c.evidence.map((e) => (
                  <li key={e} className="flex items-start gap-1.5">
                    <FileSearch className="mt-0.5 h-3 w-3 shrink-0 text-info" />
                    {e}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-warn">
                <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                Missing evidence: {c.missing}
              </p>
            </Panel>
          ))}
          <Disclaimer>AI-assisted, not a confirmed diagnosis. Physician review required.</Disclaimer>
        </div>
      )}
    </SectionCard>
  );
}

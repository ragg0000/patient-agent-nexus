import { BookOpen, ExternalLink } from "lucide-react";
import type { Patient } from "@/data/patients";
import { Disclaimer, Panel, SectionCard } from "./SectionCard";
import { LockedState } from "./LockedState";

export function GuidelineCard({ patient, ready }: { patient: Patient; ready: boolean }) {
  return (
    <SectionCard index={5} title="Guideline Context" subtitle="Decision support only — no orders generated">
      {!ready ? (
        <LockedState label="Awaiting Risk Review Agent" />
      ) : (
        <div className="space-y-2.5">
          {patient.guidelines.map((g) => (
            <Panel key={g.title}>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-info">
                <BookOpen className="h-3.5 w-3.5" /> {g.title}
              </p>
              <ol className="space-y-1 text-[11px] text-muted-foreground">
                {g.actions.map((a, i) => (
                  <li key={a} className="flex gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-info-soft text-[10px] font-semibold text-info">
                      {i + 1}
                    </span>
                    {a}
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[11px] text-muted-foreground">Guideline source: {g.source}</p>
              <button className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-info hover:underline">
                View evidence / source links (placeholder) <ExternalLink className="h-3 w-3" />
              </button>
            </Panel>
          ))}
          <Panel title="Recommended clinician review actions">
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              <li>• Confirm guideline applicability for {patient.id}</li>
              <li>• Review missing evidence before any decision</li>
              <li>• Document clinician rationale in the final note</li>
            </ul>
          </Panel>
          <Disclaimer>
            Decision support only. No guideline recommendation is applied automatically.
          </Disclaimer>
        </div>
      )}
    </SectionCard>
  );
}

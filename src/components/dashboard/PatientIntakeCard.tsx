import { AlertTriangle, FileCheck2, Loader2, Sparkles, Upload, User } from "lucide-react";
import { PATIENTS, type Patient } from "@/data/patients";
import { Chip, Panel, SectionCard } from "./SectionCard";
import { Button } from "@/components/ui/button";

export function PatientIntakeCard({
  patient,
  onSelectPatient,
  onStart,
  running,
}: {
  patient: Patient;
  onSelectPatient: (id: string) => void;
  onStart: () => void;
  running: boolean;
}) {
  return (
    <SectionCard index={1} title="Patient Intake" subtitle="Synthetic patient record (TP-001 – TP-006)">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PATIENTS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPatient(p.id)}
            className={
              p.id === patient.id
                ? "rounded-md bg-navy px-2 py-1 text-[11px] font-semibold text-navy-foreground"
                : "rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
            }
          >
            {p.id}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-info-soft text-info">
              <User className="h-6 w-6" />
            </span>
            <div className="text-xs">
              <p className="text-sm font-semibold">{patient.id}</p>
              <p className="text-muted-foreground">
                {patient.age} yrs · {patient.sex}
              </p>
              <p className="text-muted-foreground">{patient.type}</p>
              <p className="text-muted-foreground">{patient.department}</p>
            </div>
          </div>
        </Panel>
        <Panel title="Chief Complaint">
          <p className="text-xs text-muted-foreground">{patient.chiefComplaint}</p>
        </Panel>
        <Panel title="Medical History">
          <div className="flex flex-wrap gap-1.5">
            {patient.history.map((h) => (
              <Chip key={h} tone="info">
                {h}
              </Chip>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {patient.allergies.map((a) => (
              <Chip key={a} tone="urgent">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                {a}
              </Chip>
            ))}
          </div>
        </Panel>
        <Panel title="Vital Signs">
          <dl className="space-y-1 text-xs">
            {patient.vitals.map((v) => (
              <div key={v.label} className="flex justify-between">
                <dt className="text-muted-foreground">{v.label}</dt>
                <dd className={v.abnormal ? "font-semibold text-urgent" : "font-medium"}>{v.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Current Medications">
          <div className="flex flex-wrap gap-1.5">
            {patient.medications.map((m) => (
              <Chip key={m}>{m}</Chip>
            ))}
          </div>
        </Panel>
        <Panel title="Uploaded Documents">
          <ul className="space-y-1 text-xs">
            {patient.documents.map((d) => (
              <li key={d} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FileCheck2 className="h-3.5 w-3.5 text-ok" />
                  {d}
                </span>
                <span className="text-ok">✓</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-1.5 text-[11px] font-medium text-info hover:bg-info-soft"
          >
            <Upload className="h-3.5 w-3.5" /> Upload More (placeholder)
          </button>
        </Panel>
      </div>

      <Button variant="agent" className="mt-3 w-full" onClick={onStart} disabled={running}>
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Orchestrator running…
          </>
        ) : (
          <>
            Start AI Analysis <Sparkles className="h-4 w-4" />
          </>
        )}
      </Button>
    </SectionCard>
  );
}

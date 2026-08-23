import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import type { Patient } from "@/data/patients";
import { Chip, Disclaimer, SectionCard } from "./SectionCard";
import { LockedState } from "./LockedState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Key = "s" | "o" | "a" | "p";

const SECTIONS: { key: Key; label: string; tone: string; badge: string }[] = [
  { key: "s", label: "Subjective", tone: "border-l-info bg-info-soft/60", badge: "bg-info" },
  { key: "o", label: "Objective", tone: "border-l-ok bg-ok-soft/60", badge: "bg-ok" },
  { key: "a", label: "Assessment", tone: "border-l-urgent bg-urgent-soft/60", badge: "bg-urgent" },
  { key: "p", label: "Plan", tone: "border-l-warn bg-warn-soft/60", badge: "bg-warn" },
];

export function SoapCard({ patient, ready }: { patient: Patient; ready: boolean }) {
  const [draft, setDraft] = useState(patient.soap);
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<"Draft" | "Saved draft" | "Approved" | "Rejected" | "Finalized">(
    "Draft",
  );

  useEffect(() => {
    setDraft(patient.soap);
    setEditing(false);
    setState("Draft");
  }, [patient]);

  return (
    <SectionCard index={7} title="SOAP Note" subtitle="AI-generated draft — never pre-approved">
      {!ready ? (
        <LockedState label="Awaiting SOAP Note and Follow-up Planning agents" />
      ) : (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone="purple">AI-generated draft</Chip>
            <Chip tone={state === "Approved" || state === "Finalized" ? "ok" : "warn"}>{state}</Chip>
          </div>
          {SECTIONS.map((s) => (
            <div key={s.key} className={cn("rounded-md border border-border border-l-4 p-2.5", s.tone)}>
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-navy-foreground",
                    s.badge,
                  )}
                >
                  {s.label[0]}
                </span>
                {s.label}
              </p>
              {editing ? (
                <Textarea
                  value={draft[s.key]}
                  onChange={(e) => setDraft({ ...draft, [s.key]: e.target.value })}
                  className="min-h-20 bg-card text-[11px]"
                />
              ) : (
                <p className="text-[11px] leading-relaxed text-muted-foreground">{draft[s.key]}</p>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditing((v) => !v)}>
              <FileText className="h-3.5 w-3.5" /> {editing ? "Stop editing" : "Edit Note"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs"
              onClick={() => {
                setState("Saved draft");
                toast.success("Draft saved (not approved)");
              }}
            >
              Save Draft
            </Button>
            <Button
              size="sm"
              variant="approve"
              className="text-xs"
              onClick={() => {
                setState("Approved");
                toast.success("Note approved by clinician");
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="reject"
              className="text-xs"
              onClick={() => {
                setState("Rejected");
                toast.error("Note rejected — returned to agents");
              }}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="clinical"
              className="text-xs"
              disabled={state !== "Approved"}
              onClick={() => {
                setState("Finalized");
                toast.success("Note finalized");
              }}
            >
              Finalize
            </Button>
            <Button size="sm" variant="agent" className="text-xs" onClick={() => toast("Export placeholder")}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
          <div className="rounded-md border border-border p-2.5">
            <p className="mb-1 text-[11px] font-semibold">Follow-up Plan (draft)</p>
            <ul className="space-y-0.5 text-[11px] text-muted-foreground">
              {patient.followUp.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
          <Disclaimer>
            AI-generated draft. Finalization requires explicit clinician approval — the note is never
            pre-approved.
          </Disclaimer>
        </div>
      )}
    </SectionCard>
  );
}

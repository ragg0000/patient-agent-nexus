import { useEffect } from "react";
import { FileClock, ScrollText } from "lucide-react";
import type { BackendPatient, ClinicalContext } from "@/lib/backend";
import type { StepStatus } from "@/state/encounter-store";
import { useEncounter } from "@/state/encounter-store";
import { Chip, Panel, SectionCard } from "../SectionCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { DataOriginBadge, ErrorPanel, LoadingPanel, ProvenanceLegend } from "./StatusPanels";

export function PatientHistoryCard({
  detail,
  context,
  loading,
  error,
  onRetry,
  rangeLabel,
}: {
  detail: BackendPatient | null;
  context: ClinicalContext | null;
  loading: boolean;
  error: { title: string; detail: string } | null;
  onRetry: () => void;
  rangeLabel: string;
}) {
  const { setStep, logAudit } = useEncounter();
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!detail) return;
    if (loading) setStep("history", "loading");
    else if (error) setStep("history", "failed");
    else if (context) {
      setStep("history", "ready");
      logAudit("Clinical context loaded", { newState: `Range ${rangeLabel}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.patientId, loading, !!error, !!context, rangeLabel]);

  return (
    <SectionCard
      id="step-history"
      index={2}
      title="Patient History & EHR Data"
      subtitle={`Clinical context · ${rangeLabel} · click History drawer for previous visits`}
    >
      {loading ? <LoadingPanel label="Loading clinical context from backend…" /> : null}
      {!loading && error ? (
        <ErrorPanel title={error.title} detail={error.detail} onRetry={onRetry} retryLabel="Retry context load" />
      ) : null}
      {!loading && !error && detail && context ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <DataOriginBadge origin={context.dataOrigin ?? detail.dataOrigin} />
            <Chip tone="purple">
              {context.historicalEncounterCount ?? context.previousVisits.length} historical encounters
            </Chip>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px]"
              onClick={() => setHistoryOpen(true)}
            >
              <FileClock className="h-3 w-3" /> Previous visits
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[11px]"
              onClick={() => setProvenanceOpen(true)}
            >
              <ScrollText className="h-3 w-3" /> Provenance
            </Button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Panel title="Current Visit">
              <p className="text-[11px] text-muted-foreground">{detail.currentVisit ?? detail.visitReason ?? "—"}</p>
            </Panel>
            <Panel title="Active Conditions">
              <div className="flex flex-wrap gap-1.5">
                {context.activeConditions.length ? (
                  context.activeConditions.map((c) => (
                    <Chip key={c} tone="info">
                      {c}
                    </Chip>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground">None recorded</p>
                )}
              </div>
            </Panel>
            <Panel title="Medications & Allergies">
              <div className="flex flex-wrap gap-1.5">
                {context.medications.map((m) => (
                  <Chip key={m}>{m}</Chip>
                ))}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {context.allergies.map((a) => (
                  <Chip key={a} tone="urgent">
                    {a}
                  </Chip>
                ))}
              </div>
            </Panel>
            <Panel title="Vitals">
              <dl className="space-y-1 text-[11px]">
                {(detail.vitals ?? []).length ? (
                  (detail.vitals ?? []).map((v) => (
                    <div key={v.label} className="flex justify-between">
                      <dt className="text-muted-foreground">{v.label}</dt>
                      <dd className={v.abnormal ? "font-semibold text-urgent" : "font-medium"}>{v.value}</dd>
                    </div>
                  ))
                ) : (
                  <dd className="text-muted-foreground">Not provided by backend</dd>
                )}
              </dl>
            </Panel>
            <Panel title="Labs">
              {(detail.labs ?? []).length ? (
                <dl className="space-y-1 text-[11px]">
                  {(detail.labs ?? []).map((l) => (
                    <div key={l.label} className="flex justify-between">
                      <dt className="text-muted-foreground">{l.label}</dt>
                      <dd className={l.flag && /high|abnormal/i.test(l.flag) ? "font-semibold text-urgent" : ""}>
                        {l.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-[11px] text-muted-foreground">No labs in context response</p>
              )}
            </Panel>
            <Panel title="Missing Information Alerts">
              {context.missingInformation.length ? (
                <ul className="space-y-1 text-[11px]">
                  {context.missingInformation.map((g) => (
                    <li key={g} className="flex items-start gap-1.5 text-warn">
                      <span aria-hidden>⚠</span>
                      <span className="text-muted-foreground">{g}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-ok">No missing-information alerts returned</p>
              )}
            </Panel>
          </div>
        </div>
      ) : null}

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Previous visit history</SheetTitle>
            <SheetDescription>Complete previous-visit history from the clinical context response</SheetDescription>
          </SheetHeader>
          <div className="mt-3 space-y-2 text-xs">
            {context?.previousVisits.length ? (
              context.previousVisits.map((v) => (
                <Panel key={v.encounterId} title={`${v.date} · ${v.encounterType ?? "Visit"}`}>
                  <p className="text-[11px] text-muted-foreground">{v.visitReason}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Outcome: {v.outcome ?? "—"}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Origin: {v.dataOrigin ?? "—"}</p>
                </Panel>
              ))
            ) : (
              <p className="text-muted-foreground">No previous visits in context.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={provenanceOpen} onOpenChange={setProvenanceOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Provenance</SheetTitle>
            <SheetDescription>Where each data element came from</SheetDescription>
          </SheetHeader>
          <div className="mt-3 space-y-2 text-xs">
            <ProvenanceLegend />
            <Panel title="Source references">
              <ul className="list-inside list-disc text-muted-foreground">
                {context?.sourceReferences.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Panel>
            <Panel title="Data origin">
              <p className="text-muted-foreground">{context?.dataOrigin ?? detail?.dataOrigin ?? "Backend response"}</p>
            </Panel>
          </div>
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}

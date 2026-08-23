import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CircleDot, RotateCcw } from "lucide-react";
import { PATIENTS } from "@/data/patients";
import { useOrchestrator } from "@/lib/useOrchestrator";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { PatientIntakeCard } from "@/components/dashboard/PatientIntakeCard";
import { AgentsCard } from "@/components/dashboard/AgentsCard";
import { ClinicalSummaryCard } from "@/components/dashboard/ClinicalSummaryCard";
import { ClinicalReviewCard } from "@/components/dashboard/ClinicalReviewCard";
import { GuidelineCard } from "@/components/dashboard/GuidelineCard";
import { MedicationCard } from "@/components/dashboard/MedicationCard";
import { SoapCard } from "@/components/dashboard/SoapCard";
import { ImpactCard } from "@/components/dashboard/ImpactCard";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Health Super Agent — Clinical Agent Dashboard" },
      {
        name: "description",
        content:
          "Agentic clinical decision-support dashboard POC: multi-agent orchestration, clinical summary, SOAP drafting and medication review on synthetic patients TP-001 to TP-006.",
      },
      { property: "og:title", content: "AI Health Super Agent — Clinical Agent Dashboard" },
      {
        property: "og:description",
        content:
          "Multi-agent clinical workflow POC with physician-review guardrails on six synthetic patients.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [nav, setNav] = useState("Dashboard");
  const [patientId, setPatientId] = useState(PATIENTS[0]!.id);
  const patient = useMemo(() => PATIENTS.find((p) => p.id === patientId) ?? PATIENTS[0]!, [patientId]);
  const { runs, handoffs, unlocked, status, progress, start, reset } = useOrchestrator(patient);

  const has = (key: string) => unlocked.includes(key as never);

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
      <AppSidebar active={nav} onSelect={setNav} />
      <main className="min-w-0 flex-1 px-4 pb-8 pt-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold">AI Health Super Agent</h1>
            <p className="text-xs text-muted-foreground">
              Agentic clinical workspace · {patient.id} · {patient.department} · decision support only
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium">
              <CircleDot
                className={
                  status === "Running"
                    ? "h-3.5 w-3.5 animate-pulse text-info"
                    : status === "Awaiting Physician Review"
                      ? "h-3.5 w-3.5 text-warn"
                      : "h-3.5 w-3.5 text-muted-foreground"
                }
              />
              {status}
            </span>
            <Button size="sm" variant="outline" className="text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-3">
          <PatientIntakeCard
            patient={patient}
            onSelectPatient={setPatientId}
            onStart={start}
            running={status === "Running"}
          />
          <AgentsCard
            patient={patient}
            runs={runs}
            handoffs={handoffs}
            progress={progress}
            status={status}
          />
          <ClinicalSummaryCard patient={patient} ready={has("summary")} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3 2xl:grid-cols-5">
          <ClinicalReviewCard patient={patient} ready={has("review")} />
          <GuidelineCard patient={patient} ready={has("guidelines")} />
          <MedicationCard patient={patient} ready={has("medications")} />
          <SoapCard patient={patient} ready={has("soap")} />
          <ImpactCard ready={has("impact")} />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

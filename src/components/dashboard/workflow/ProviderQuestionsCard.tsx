import { useEffect, useState } from "react";
import { CheckCircle2, CircleSlash, MessageCircleQuestion, Plus, RotateCcw } from "lucide-react";
import type { PreConsultation } from "@/lib/backend";
import { useEncounter, type QuestionItem } from "@/state/encounter-store";
import { Chip, Panel, SectionCard } from "../SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LockedState } from "../LockedState";
import { cn } from "@/lib/utils";

export function ProviderQuestionsCard({
  result,
  patientSelected,
}: {
  result: PreConsultation | null;
  patientSelected: boolean;
}) {
  const { state, setQuestions, updateQuestion, addCustomQuestion, logAudit } = useEncounter();
  const [customDraft, setCustomDraft] = useState("");
  const questions = state.questions;

  // Seed the encounter with backend-drafted questions the first time they arrive.
  useEffect(() => {
    if (!patientSelected || !result?.doctorQuestions.length) return;
    if (state.questions.length) return;
    setQuestions(
      result.doctorQuestions.map((text, i) => ({
        id: `q-${result.workflowRunId ?? "run"}-${i}`,
        text,
        status: "unasked" as const,
        response: "",
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.workflowRunId, result?.doctorQuestions.length, patientSelected]);

  return (
    <SectionCard
      id="step-questions"
      index={5}
      title="Suggested Provider Questions"
      subtitle="Drafted by the Doctor Questions Agent — provider records responses during the consultation"
    >
      {!patientSelected ? <LockedState label="Select a patient first" /> : null}
      {patientSelected && !questions.length ? (
        <LockedState label="Run the pre-consultation workflow to receive suggested questions" />
      ) : null}

      {questions.length ? (
        <div className="space-y-2.5">
          {state.summary.stale || state.soap.stale ? (
            <div className="rounded-md border border-warn/40 bg-warn-soft px-3 py-2 text-[11px] font-medium text-warn">
              Re-review required — question responses changed after summary/SOAP generation. Downstream output is
              stale and the encounter cannot be finalized until it is regenerated or re-approved.
            </div>
          ) : null}
          {questions.map((q) => (
            <QuestionRow
              key={q.id}
              question={q}
              onUpdate={(patch) => updateQuestion(q.id, patch)}
            />
          ))}
          <Panel title="Add a custom question">
            <div className="flex gap-1.5">
              <Input
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                placeholder="Type a provider question…"
                className="h-8 bg-card text-[11px]"
              />
              <Button
                size="sm"
                variant="clinical"
                className="h-8 shrink-0 text-[11px]"
                disabled={!customDraft.trim()}
                onClick={() => {
                  addCustomQuestion(customDraft.trim());
                  logAudit("Custom question added", { newState: customDraft.trim() });
                  setCustomDraft("");
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </Panel>
          <p className="text-[10px] text-muted-foreground">
            Changing a response after summary or SOAP generation marks those outputs stale and blocks encounter
            finalization.
          </p>
        </div>
      ) : null}
    </SectionCard>
  );
}

function QuestionRow({
  question,
  onUpdate,
}: {
  question: QuestionItem;
  onUpdate: (patch: Partial<QuestionItem>) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-start gap-1.5 text-[12px] font-medium">
          <MessageCircleQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
          {question.text}
          {question.custom ? <Chip tone="purple">custom</Chip> : null}
        </p>
        <Chip
          tone={
            question.status === "asked" ? "ok" : question.status === "not-applicable" ? "muted" : "warn"
          }
        >
          {question.status === "asked" ? "Asked" : question.status === "not-applicable" ? "N/A" : "Unasked"}
        </Chip>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={question.status === "asked" ? "approve" : "outline"}
          className="h-6 px-2 text-[10px]"
          onClick={() => onUpdate({ status: "asked" })}
        >
          <CheckCircle2 className="h-3 w-3" /> Mark asked
        </Button>
        <Button
          size="sm"
          variant={question.status === "not-applicable" ? "secondary" : "outline"}
          className="h-6 px-2 text-[10px]"
          onClick={() => onUpdate({ status: "not-applicable" })}
        >
          <CircleSlash className="h-3 w-3" /> Not applicable
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px]"
          onClick={() => onUpdate({ status: "unasked", response: "" })}
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>
      <Textarea
        value={question.response}
        onChange={(e) => onUpdate({ response: e.target.value })}
        placeholder="Record the patient response…"
        className={cn("mt-2 min-h-14 bg-card text-[11px]", question.status !== "asked" && "opacity-70")}
      />
    </div>
  );
}

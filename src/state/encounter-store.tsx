/**
 * Encounter-state store: 12-step provider workflow, approval gating,
 * stale tracking and the audit trail. React context + reducer.
 */

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { TimeRange, TranscriptResult } from "@/lib/backend";

export type StepId =
  | "select"
  | "history"
  | "timeline"
  | "preconsult"
  | "questions"
  | "consultation"
  | "transcript"
  | "summary"
  | "soap"
  | "careplan"
  | "completion";

export const STEPS: { id: StepId; label: string; short: string }[] = [
  { id: "select", label: "1. Patient Selection", short: "Patient" },
  { id: "history", label: "2. Patient History & EHR Data", short: "History" },
  { id: "timeline", label: "3. Timeline & Statistical Trends", short: "Timeline" },
  { id: "preconsult", label: "4. Pre-Consultation Agent Analysis", short: "Agents" },
  { id: "questions", label: "5. Suggested Provider Questions", short: "Questions" },
  { id: "consultation", label: "6. Provider-Patient Consultation", short: "Consultation" },
  { id: "transcript", label: "7. Speech-to-Text Transcript Review", short: "Transcript" },
  { id: "summary", label: "8. Consultation Summary Review & Approval", short: "Summary" },
  { id: "soap", label: "9–10. SOAP Generation & Provider Review", short: "SOAP" },
  { id: "careplan", label: "11. Care Plan Review & Approval", short: "Care Plan" },
  { id: "completion", label: "12. Encounter Completion & Audit Trail", short: "Completion" },
];

export type StepStatus =
  | "not-started"
  | "loading"
  | "ready"
  | "awaiting-review"
  | "approved"
  | "edited"
  | "rejected"
  | "failed"
  | "stale"
  | "completed";

export type QuestionItem = {
  id: string;
  text: string;
  status: "unasked" | "asked" | "not-applicable";
  response: string;
  custom?: boolean;
};

export type TranscriptState = TranscriptResult & {
  source: "backend" | "manual" | "none";
  edited: boolean;
  editedText?: string;
};

export type OutputDecision = "pending" | "approved" | "edited" | "rejected";

export type SummaryState = {
  text: string;
  generated: boolean;
  decision: OutputDecision;
  comments: string;
  version: number;
  stale: boolean;
  generatedAt?: string;
  decidedAt?: string;
  workflowStatus?: string;
};

export type SoapState = {
  sections: { s: string; o: string; a: string; p: string };
  generated: boolean;
  generationVersion: number;
  decision: OutputDecision;
  finalized: boolean;
  stale: boolean;
  providerId: string;
  comments: string;
  generatedAt?: string;
  approvedAt?: string;
  safetyValidation: "pending" | "passed" | "failed";
};

export type CarePlanState = {
  draft: Record<string, string>;
  decision: OutputDecision;
  approvedAt?: string;
  comments: string;
};

export type CompletionState = {
  completedAt?: string;
  locked: boolean;
};

export type AuditEvent = {
  eventId: string;
  workflowRunId: string;
  patientId: string | null;
  encounterId: string | null;
  eventType: string;
  actor: string;
  timestamp: string;
  previousState: string;
  newState: string;
  version?: number;
  comments?: string;
};

export type EncounterState = {
  workflowRunId: string;
  patientId: string | null;
  patientName: string | null;
  encounterId: string | null;
  range: TimeRange;
  steps: Record<StepId, StepStatus>;
  questions: QuestionItem[];
  transcript: TranscriptState;
  summary: SummaryState;
  soap: SoapState;
  carePlan: CarePlanState;
  completion: CompletionState;
  audit: AuditEvent[];
};

export const EMPTY_SOAP_SECTIONS = { s: "", o: "", a: "", p: "" };

const initialSteps = (): Record<StepId, StepStatus> =>
  Object.fromEntries(STEPS.map((s) => [s.id, "not-started"])) as Record<StepId, StepStatus>;

const initialState = (): EncounterState => ({
  workflowRunId: "WR-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
  patientId: null,
  patientName: null,
  encounterId: null,
  range: "1y",
  steps: initialSteps(),
  questions: [],
  transcript: { consultationId: "", text: "", segments: [], source: "none", edited: false },
  summary: { text: "", generated: false, decision: "pending", comments: "", version: 0, stale: false },
  soap: {
    sections: { ...EMPTY_SOAP_SECTIONS },
    generated: false,
    generationVersion: 0,
    decision: "pending",
    finalized: false,
    stale: false,
    providerId: "",
    comments: "",
    safetyValidation: "pending",
  },
  carePlan: {
    draft: {
      "Patient instructions": "",
      Monitoring: "",
      "Labs / tests": "",
      Referrals: "",
      "Follow-up timeframe": "",
      "Patient education": "",
      "Medication verification items": "",
    },
    decision: "pending",
    comments: "",
  },
  completion: { locked: false },
  audit: [],
});

/* ------------------------------- actions ------------------------------- */

type Action =
  | { type: "select-patient"; patientId: string; patientName: string }
  | { type: "set-range"; range: TimeRange }
  | { type: "set-step"; step: StepId; status: StepStatus }
  | { type: "new-workflow-run" }
  | { type: "set-questions"; questions: QuestionItem[] }
  | { type: "update-question"; id: string; patch: Partial<QuestionItem> }
  | { type: "add-custom-question"; text: string }
  | { type: "set-transcript"; transcript: TranscriptState }
  | { type: "edit-transcript"; text: string }
  | { type: "set-generated-summary"; text: string; workflowStatus?: string }
  | { type: "summary-decision"; decision: OutputDecision; text?: string; comments: string }
  | { type: "set-soap-draft"; sections: Partial<SoapState["sections"]>; generated: boolean; safetyValidation?: SoapState["safetyValidation"] }
  | { type: "soap-decision"; decision: OutputDecision; providerId: string; comments: string }
  | { type: "finalize-soap" }
  | { type: "mark-stale"; target: "summary" | "soap" }
  | { type: "care-plan-decision"; decision: OutputDecision; draft?: Record<string, string>; comments: string }
  | { type: "complete-encounter"; timestamp: string }
  | { type: "audit"; event: Omit<AuditEvent, "eventId" | "workflowRunId" | "patientId" | "encounterId" | "timestamp" | "actor"> & { actor?: string } };

function auditEvent(state: EncounterState, action: Extract<Action, { type: "audit" }>): AuditEvent {
  const { event } = action;
  return {
    eventId: crypto.randomUUID(),
    workflowRunId: state.workflowRunId,
    patientId: state.patientId,
    encounterId: state.encounterId,
    eventType: event.eventType,
    actor: event.actor ?? "Provider (POC)",
    timestamp: new Date().toISOString(),
    previousState: event.previousState,
    newState: event.newState,
    version: event.version,
    comments: event.comments,
  };
}

function markStale(state: EncounterState, target: "summary" | "soap"): EncounterState {
  const next = { ...state };
  if (target === "summary") {
    if (!state.summary.generated) return state;
    next.summary = { ...state.summary, stale: true, decision: "pending" };
    next.steps = { ...state.steps, summary: "stale" };
  } else {
    if (!state.soap.generated) return state;
    next.soap = { ...state.soap, stale: true, decision: "pending", finalized: false };
    next.steps = { ...state.steps, soap: "stale" };
  }
  return next;
}

function reducer(state: EncounterState, action: Action): EncounterState {
  switch (action.type) {
    case "select-patient": {
      const fresh = initialState();
      return {
        ...fresh,
        patientId: action.patientId,
        patientName: action.patientName,
        encounterId: `ENC-${action.patientId}-${Date.now().toString(36).toUpperCase()}`,
        steps: { ...fresh.steps, select: "ready", history: "loading" },
        audit: [
          auditEvent(fresh, {
            type: "audit",
            eventType: "Patient selected",
            previousState: "No patient selected",
            newState: `Patient ${action.patientId}`,
          }),
        ],
      };
    }
    case "set-range": {
      return {
        ...state,
        range: action.range,
        audit: [
          auditEvent(state, {
            type: "audit",
            eventType: "Timeline range changed",
            previousState: state.range,
            newState: action.range,
          }),
          ...state.audit,
        ],
      };
    }
    case "set-step":
      return { ...state, steps: { ...state.steps, [action.step]: action.status } };
    case "new-workflow-run": {
      const workflowRunId = "WR-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      return { ...state, workflowRunId };
    }
    case "set-questions": {
      const changed =
        state.questions.length > 0 &&
        state.questions.some((q, i) => {
          const next = action.questions[i];
          return !next || next.response !== q.response || next.status !== q.status;
        });
      let next = { ...state, questions: action.questions };
      if (changed) {
        next = markStale(next, "summary");
        next = markStale(next, "soap");
        next = {
          ...next,
          audit: [
            auditEvent(state, {
              type: "audit",
              eventType: "Output marked stale",
              previousState: state.summary.stale ? "stale" : "current",
              newState: "stale",
              comments: "Question responses changed after summary generation",
            }),
            ...next.audit,
          ],
        };
      }
      return next;
    }
    case "update-question": {
      const questions = state.questions.map((q) => (q.id === action.id ? { ...q, ...action.patch } : q));
      return reducer(state, { type: "set-questions", questions });
    }
    case "add-custom-question": {
      const item: QuestionItem = {
        id: crypto.randomUUID(),
        text: action.text,
        status: "unasked",
        response: "",
        custom: true,
      };
      return { ...state, questions: [...state.questions, item] };
    }
    case "set-transcript": {
      let next: EncounterState = {
        ...state,
        transcript: action.transcript,
        steps: { ...state.steps, transcript: action.transcript.source === "none" ? "not-started" : "ready" },
      };
      if (state.summary.generated && action.transcript.edited) next = markStale(next, "summary");
      return next;
    }
    case "edit-transcript": {
      let next: EncounterState = {
        ...state,
        transcript: { ...state.transcript, editedText: action.text, edited: true },
        audit: [
          auditEvent(state, {
            type: "audit",
            eventType: "Transcript edited",
            previousState: "Machine-generated transcript",
            newState: "Provider-edited transcript",
          }),
          ...state.audit,
        ],
      };
      if (state.summary.generated) next = markStale(next, "summary");
      return next;
    }
    case "set-generated-summary":
      return {
        ...state,
        summary: {
          ...state.summary,
          text: action.text,
          generated: true,
          stale: false,
          generatedAt: new Date().toISOString(),
          workflowStatus: action.workflowStatus ?? state.summary.workflowStatus,
        },
        steps: { ...state.steps, summary: "awaiting-review" },
      };
    case "summary-decision": {
      const text = action.text ?? state.summary.text;
      const decision = action.decision;
      const approved = decision === "approved";
      return {
        ...state,
        summary: {
          ...state.summary,
          text,
          decision,
          comments: action.comments,
          version: state.summary.version + 1,
          stale: false,
          decidedAt: new Date().toISOString(),
          workflowStatus: approved ? "ready_for_soap_generation" : state.summary.workflowStatus,
        },
        steps: {
          ...state.steps,
          summary: decision === "rejected" ? "rejected" : approved ? "approved" : "edited",
        },
        audit: [
          auditEvent(state, {
            type: "audit",
            eventType: `Consultation summary ${decision}`,
            previousState: state.summary.decision,
            newState: decision,
            version: state.summary.version + 1,
            comments: action.comments,
          }),
          ...state.audit,
        ],
      };
    }
    case "set-soap-draft":
      return {
        ...state,
        soap: {
          ...state.soap,
          sections: { ...state.soap.sections, ...action.sections },
          generated: action.generated,
          generationVersion: state.soap.generationVersion + 1,
          stale: false,
          generatedAt: action.generated ? new Date().toISOString() : state.soap.generatedAt,
          safetyValidation: action.safetyValidation ?? state.soap.safetyValidation,
        },
      };
    case "soap-decision":
      return {
        ...state,
        soap: {
          ...state.soap,
          decision: action.decision,
          providerId: action.providerId,
          comments: action.comments,
          approvedAt: action.decision === "approved" ? new Date().toISOString() : state.soap.approvedAt,
        },
        steps: {
          ...state.steps,
          soap:
            action.decision === "rejected"
              ? "rejected"
              : action.decision === "approved"
                ? "approved"
                : "edited",
        },
        audit: [
          auditEvent(state, {
            type: "audit",
            eventType: `SOAP note ${action.decision}`,
            previousState: state.soap.decision,
            newState: action.decision,
            version: state.soap.generationVersion,
            comments: action.comments,
          }),
          ...state.audit,
        ],
      };
    case "finalize-soap":
      return {
        ...state,
        soap: { ...state.soap, finalized: true },
        steps: { ...state.steps, soap: "completed" },
        audit: [
          auditEvent(state, {
            type: "audit",
            eventType: "SOAP note finalized",
            previousState: state.soap.decision,
            newState: "finalized",
            version: state.soap.generationVersion,
          }),
          ...state.audit,
        ],
      };
    case "care-plan-decision": {
      const approved = action.decision === "approved";
      return {
        ...state,
        carePlan: {
          draft: action.draft ?? state.carePlan.draft,
          decision: action.decision,
          comments: action.comments,
          approvedAt: approved ? new Date().toISOString() : state.carePlan.approvedAt,
        },
        steps: {
          ...state.steps,
          careplan:
            action.decision === "rejected"
              ? "rejected"
              : approved
                ? "approved"
                : action.decision === "edited"
                  ? "edited"
                  : "awaiting-review",
        },
        audit: [
          auditEvent(state, {
            type: "audit",
            eventType: `Care plan ${action.decision}`,
            previousState: state.carePlan.decision,
            newState: action.decision,
            comments: action.comments,
          }),
          ...state.audit,
        ],
      };
    }
    case "complete-encounter":
      return {
        ...state,
        completion: { completedAt: action.timestamp, locked: true },
        steps: { ...state.steps, completion: "completed" },
        audit: [
          auditEvent(state, {
            type: "audit",
            eventType: "Encounter completed",
            previousState: "Open encounter",
            newState: "Completed (POC simulated EHR update)",
          }),
          ...state.audit,
        ],
      };
    case "audit":
      return { ...state, audit: [auditEvent(state, action), ...state.audit] };
    default:
      return state;
  }
}

/* ------------------------------- context ------------------------------- */

export type EncounterStore = {
  state: EncounterState;
  selectPatient: (patientId: string, patientName: string) => void;
  setRange: (range: TimeRange) => void;
  setStep: (step: StepId, status: StepStatus) => void;
  newWorkflowRun: () => void;
  setQuestions: (questions: QuestionItem[]) => void;
  updateQuestion: (id: string, patch: Partial<QuestionItem>) => void;
  addCustomQuestion: (text: string) => void;
  setTranscript: (transcript: TranscriptState) => void;
  editTranscript: (text: string) => void;
  setGeneratedSummary: (text: string, workflowStatus?: string) => void;
  summaryDecision: (decision: OutputDecision, text: string | undefined, comments: string) => void;
  setSoapDraft: (
    sections: Partial<SoapState["sections"]>,
    generated: boolean,
    safetyValidation?: SoapState["safetyValidation"],
  ) => void;
  soapDecision: (decision: OutputDecision, providerId: string, comments: string) => void;
  finalizeSoap: () => void;
  carePlanDecision: (decision: OutputDecision, draft: Record<string, string> | undefined, comments: string) => void;
  completeEncounter: () => void;
  logAudit: (
    eventType: string,
    details?: { previousState?: string; newState?: string; comments?: string; actor?: string; version?: number },
  ) => void;
};

const EncounterContext = createContext<EncounterStore | null>(null);

export function EncounterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const store = useMemo<EncounterStore>(
    () => ({
      state,
      selectPatient: (patientId, patientName) => dispatch({ type: "select-patient", patientId, patientName }),
      setRange: (range) => dispatch({ type: "set-range", range }),
      setStep: (step, status) => dispatch({ type: "set-step", step, status }),
      newWorkflowRun: () => dispatch({ type: "new-workflow-run" }),
      setQuestions: (questions) => dispatch({ type: "set-questions", questions }),
      updateQuestion: (id, patch) => dispatch({ type: "update-question", id, patch }),
      addCustomQuestion: (text) => dispatch({ type: "add-custom-question", text }),
      setTranscript: (transcript) => dispatch({ type: "set-transcript", transcript }),
      editTranscript: (text) => dispatch({ type: "edit-transcript", text }),
      setGeneratedSummary: (text, workflowStatus) =>
        dispatch({ type: "set-generated-summary", text, workflowStatus }),
      summaryDecision: (decision, text, comments) =>
        dispatch({ type: "summary-decision", decision, text, comments }),
      setSoapDraft: (sections, generated, safetyValidation) =>
        dispatch({ type: "set-soap-draft", sections, generated, safetyValidation }),
      soapDecision: (decision, providerId, comments) =>
        dispatch({ type: "soap-decision", decision, providerId, comments }),
      finalizeSoap: () => dispatch({ type: "finalize-soap" }),
      carePlanDecision: (decision, draft, comments) =>
        dispatch({ type: "care-plan-decision", decision, draft, comments }),
      completeEncounter: () => dispatch({ type: "complete-encounter", timestamp: new Date().toISOString() }),
      logAudit: (eventType, details) =>
        dispatch({
          type: "audit",
          event: {
            eventType,
            previousState: details?.previousState ?? "—",
            newState: details?.newState ?? "—",
            comments: details?.comments,
            actor: details?.actor,
            version: details?.version,
          },
        }),
    }),
    [state],
  );

  return <EncounterContext.Provider value={store}>{children}</EncounterContext.Provider>;
}

export function useEncounter(): EncounterStore {
  const context = useContext(EncounterContext);
  if (!context) throw new Error("useEncounter must be used inside EncounterProvider");
  return context;
}

/** Helper used by the encounter-completion checklist. */
export function encounterPrerequisites(state: EncounterState) {
  const summaryApproved =
    state.summary.generated && (state.summary.decision === "approved" || state.summary.decision === "edited") && !state.summary.stale;
  const soapApproved =
    state.soap.generated && state.soap.decision === "approved" && !state.soap.stale && state.soap.safetyValidation !== "failed";
  const carePlanApproved = state.carePlan.decision === "approved";
  const questionsReviewed =
    state.questions.length > 0 && state.questions.every((q) => q.status !== "unasked");
  const transcriptVerified = state.transcript.source !== "none";
  return [
    { label: "Patient selected", ok: !!state.patientId },
    { label: "Clinical context loaded", ok: state.steps.history === "ready" || state.steps.history === "approved" },
    { label: "Pre-consultation workflow completed", ok: ["ready", "approved", "completed"].includes(state.steps.preconsult) },
    { label: "Questions reviewed", ok: questionsReviewed },
    { label: "Transcript verified", ok: transcriptVerified },
    { label: "Consultation summary approved", ok: summaryApproved },
    { label: "SOAP approved", ok: soapApproved },
    { label: "Care plan approved", ok: carePlanApproved },
    { label: "Safety checks passed", ok: state.soap.safetyValidation !== "failed" },
    { label: "No stale downstream output", ok: !state.summary.stale && !state.soap.stale },
  ];
}

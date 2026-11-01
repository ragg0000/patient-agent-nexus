/**
 * Typed backend API surface + tolerant response normalizers.
 *
 * The FastAPI backend responses are normalized here so the UI can render
 * both live backend data and the offline fallback without branching logic
 * in every component.
 */

import { api } from "@/lib/api-client";

export type TimeRange = "1y" | "5y" | "all";

export const RANGES: { value: TimeRange; label: string }[] = [
  { value: "1y", label: "1 year" },
  { value: "5y", label: "5 years" },
  { value: "all", label: "All available visits" },
];

export type BackendPatient = {
  patientId: string;
  name: string;
  age?: number | undefined;
  patientType?: string | undefined;
  department?: string | undefined;
  visitReason?: string | undefined;
  currentVisit?: string | undefined;
  medicalHistory: string[];
  medications: string[];
  allergies: string[];
  historicalEncounters?: number | undefined;
  expectedAgentBehavior?: unknown;
  vitals?: { label: string; value: string; abnormal?: boolean | undefined }[] | undefined;
  labs?: { label: string; value: string; flag?: string | undefined }[] | undefined;
  missingInformation?: string[] | undefined;
  dataOrigin?: string | undefined;
};

export type VisitSeverity = "routine" | "improved" | "warning" | "urgent" | "treatment-change";

export type TimelineVisit = {
  encounterId: string;
  date: string;
  department?: string | undefined;
  encounterType?: string | undefined;
  visitReason?: string | undefined;
  severity?: VisitSeverity | undefined;
  vitals?: Record<string, string> | undefined;
  labs?: Record<string, string> | undefined;
  carePlan?: string | undefined;
  outcome?: string | undefined;
  dataOrigin?: string | undefined;
};

export type TrendPoint = { date: string; value: number };

export type Analytics = {
  trends: { key: string; label: string; unit?: string | undefined; points: TrendPoint[] }[];
};

export type ClinicalContext = {
  previousVisits: TimelineVisit[];
  activeConditions: string[];
  medications: string[];
  allergies: string[];
  historicalEncounterCount?: number | undefined;
  sourceReferences: string[];
  missingInformation: string[];
  dataOrigin?: string | undefined;
};

export type AgentResult = {
  id: string;
  name: string;
  status: string;
  startedAt?: string | undefined;
  completedAt?: string | undefined;
  durationMs?: number | undefined;
  messages: string[];
  input?: string | undefined;
  output?: string | undefined;
  handoffTo?: string | undefined;
  requiresProviderReview?: boolean | undefined;
};

export type PreConsultation = {
  workflowRunId?: string | undefined;
  range?: TimeRange | undefined;
  executedAt?: string | undefined;
  results: AgentResult[];
  doctorQuestions: string[];
  workflowStatus?: string | undefined;
};

export type TranscriptSegment = {
  start?: string | undefined;
  end?: string | undefined;
  speaker?: string | undefined;
  text: string;
};

export type TranscriptResult = {
  consultationId: string;
  text: string;
  segments: TranscriptSegment[];
  durationSeconds?: number | undefined;
  language?: string | undefined;
  languageProbability?: number | undefined;
  model?: string | undefined;
};

export type VisitComparison = {
  comparisons: {
    field: string;
    previous?: string | undefined;
    current?: string | undefined;
    change?: string | undefined;
  }[];
};

export type SummaryReviewResponse = {
  workflowStatus?: string | undefined;
  summary?: string | undefined;
  consultationId?: string | undefined;
  version?: number | undefined;
  raw: unknown;
};

/* ------------------------------ helpers ------------------------------ */

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function field<T = unknown>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

function strList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function strMap(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const obj = asRecord(value);
  for (const [key, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && typeof v !== "object") out[key] = String(v);
  }
  return out;
}

export const AGENT_NAMES: Record<string, string> = {
  context: "Clinical Context Agent",
  clinical_context: "Clinical Context Agent",
  summary: "Clinical Summary Agent",
  clinical_summary: "Clinical Summary Agent",
  risk: "Risk Review Agent",
  risk_review: "Risk Review Agent",
  questions: "Doctor Questions Agent",
  doctor_questions: "Doctor Questions Agent",
};

export function agentDisplayName(id: string): string {
  const key = id.toLowerCase();
  return AGENT_NAMES[key] ?? AGENT_NAMES[key.replace(/_/g, "")] ?? prettify(id);
}

function prettify(id: string): string {
  const pretty = id
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return /agent/i.test(id) ? pretty : `${pretty} Agent`;
}

const SEVERITIES: VisitSeverity[] = ["routine", "improved", "warning", "urgent", "treatment-change"];

function normalizeSeverity(value: unknown): VisitSeverity | undefined {
  const raw = String(value ?? "").toLowerCase();
  return SEVERITIES.find((s) => raw.includes(s.replace("-", " ")) || raw.includes(s)) ?? undefined;
}

function normalizeDate(value: unknown): string {
  const raw = value instanceof Date ? value.toISOString() : String(value ?? "");
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function listFrom(value: unknown, ...containerKeys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  const obj = asRecord(value);
  for (const key of containerKeys) {
    const inner = obj[key];
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

/* ---------------------------- normalizers ---------------------------- */

export function normalizePatient(raw: unknown): BackendPatient {
  const obj = asRecord(raw);
  const vitalsRaw = field<unknown[]>(obj, "vitals", "observations") ?? [];
  return {
    patientId: String(field(obj, "patientId", "patient_id", "id") ?? ""),
    name: String(field(obj, "name", "patientName", "patient_name") ?? "Synthetic Patient"),
    age: field<number>(obj, "age"),
    patientType: field<string>(obj, "patientType", "patient_type", "type"),
    department: field<string>(obj, "department"),
    visitReason: field<string>(obj, "visitReason", "visit_reason", "chiefComplaint", "chief_complaint"),
    currentVisit: field<string>(obj, "currentVisit", "current_visit"),
    medicalHistory: strList(field(obj, "medicalHistory", "medical_history", "history")),
    medications: strList(field(obj, "medications", "currentMedications", "current_medications")),
    allergies: strList(field(obj, "allergies", "allergyList", "allergy_list")),
    historicalEncounters: field<number>(obj, "historicalEncounters", "historical_encounters"),
    expectedAgentBehavior: field(obj, "expectedAgentBehavior", "expected_agent_behavior"),
    vitals: vitalsRaw.map((v) => {
      const vo = asRecord(v);
      return {
        label: String(field(vo, "label", "name", "type") ?? "Vital"),
        value: String(field(vo, "value", "display", "text") ?? "—"),
        abnormal: Boolean(field(vo, "abnormal", "abnormalFlag", "isAbnormal")),
      };
    }),
    labs: (field<unknown[]>(obj, "labs", "labResults", "lab_results") ?? []).map((v) => {
      const vo = asRecord(v);
      const flag = field<string>(vo, "flag", "status");
      return {
        label: String(field(vo, "label", "name", "test") ?? "Lab"),
        value: String(field(vo, "value", "result", "display") ?? "—"),
        ...(flag !== undefined ? { flag } : {}),
      };
    }),
    missingInformation: strList(field(obj, "missingInformation", "missing_information", "gaps")),
    dataOrigin: field<string>(obj, "dataOrigin", "data_origin", "source"),
  };
}

export function normalizeVisits(raw: unknown): TimelineVisit[] {
  return listFrom(raw, "visits", "timeline", "encounters", "items").map((entry) => {
    const obj = asRecord(entry);
    return {
      encounterId: String(field(obj, "encounterId", "encounter_id", "id") ?? ""),
      date: normalizeDate(field(obj, "date", "encounterDate", "encounter_date", "visitDate")),
      department: field<string>(obj, "department"),
      encounterType: field<string>(obj, "encounterType", "encounter_type", "type"),
      visitReason: field<string>(obj, "visitReason", "visit_reason", "reason"),
      severity: normalizeSeverity(field(obj, "severity", "category", "outcomeCategory")),
      vitals: strMap(field(obj, "vitals", "observations")),
      labs: strMap(field(obj, "labs", "labResults", "lab_results")),
      carePlan: field<string>(obj, "carePlan", "care_plan"),
      outcome: field<string>(obj, "outcome"),
      dataOrigin: field<string>(obj, "dataOrigin", "data_origin", "source"),
    };
  });
}

const TREND_LABELS: { match: RegExp; key: string; label: string; unit?: string | undefined }[] = [
  { match: /systolic|bp.*sys/i, key: "bp-systolic", label: "Blood pressure — systolic", unit: "mmHg" },
  { match: /diastolic|bp.*dia/i, key: "bp-diastolic", label: "Blood pressure — diastolic", unit: "mmHg" },
  { match: /^bp$|blood pressure/i, key: "bp", label: "Blood pressure", unit: "mmHg" },
  { match: /weight/i, key: "weight", label: "Weight", unit: "kg" },
  { match: /bmi/i, key: "bmi", label: "BMI", unit: "kg/m²" },
  { match: /pulse|heart rate|^hr$/i, key: "pulse", label: "Pulse", unit: "bpm" },
  { match: /spo2|oxygen|saturation/i, key: "spo2", label: "SpO2", unit: "%" },
  { match: /hba1c|a1c/i, key: "hba1c", label: "HbA1c", unit: "%" },
  { match: /glucose/i, key: "glucose", label: "Fasting glucose", unit: "mg/dL" },
  { match: /creatinine/i, key: "creatinine", label: "Creatinine", unit: "mg/dL" },
];

export function normalizeAnalytics(raw: unknown): Analytics {
  const seriesRaw = listFrom(raw, "trends", "series", "analytics", "metrics");
  const trends: Analytics["trends"] = [];

  for (const entry of seriesRaw) {
    const obj = asRecord(entry);
    const label = String(field(obj, "label", "name", "metric", "key") ?? "Trend");
    const match = TREND_LABELS.find((t) => t.match.test(label));
    const pointsRaw = listFrom(field(obj, "points", "values", "data", "entries"), "points");
    const points = pointsRaw
      .map((p) => {
        const po = asRecord(p);
        const date = normalizeDate(field(po, "date", "timestamp", "x"));
        const value = Number(field(po, "value", "y"));
        return Number.isFinite(value) && date ? ({ date, value } as TrendPoint) : null;
      })
      .filter((p): p is TrendPoint => p !== null);
    if (points.length) {
      const unit = field<string>(obj, "unit") ?? match?.unit;
      trends.push({
        key: match?.key ?? label.toLowerCase().replace(/\s+/g, "-"),
        label: match?.label ?? label,
        ...(unit !== undefined ? { unit } : {}),
        points,
      });
    }
  }
  return { trends };
}

export function normalizeContext(raw: unknown): ClinicalContext {
  const obj = asRecord(raw);
  return {
    previousVisits: normalizeVisits(field(obj, "previousVisits", "previous_visits", "visits", "history")),
    activeConditions: strList(field(obj, "activeConditions", "active_conditions", "conditions", "problems")),
    medications: strList(field(obj, "medications", "currentMedications", "current_medications")),
    allergies: strList(field(obj, "allergies", "allergyList", "allergy_list")),
    historicalEncounterCount: field<number>(
      obj,
      "historicalEncounterCount",
      "historical_encounter_count",
      "historicalEncounters",
      "historical_encounters",
    ),
    sourceReferences: strList(field(obj, "sourceReferences", "source_references", "sources", "references")),
    missingInformation: strList(field(obj, "missingInformation", "missing_information", "gaps")),
    dataOrigin: field<string>(obj, "dataOrigin", "data_origin", "source"),
  };
}

export function normalizeAgentResults(raw: unknown): AgentResult[] {
  const obj = asRecord(raw);
  const entries = listFrom(field(obj, "results", "agents", "steps"), "results");
  return entries.map((entry, index) => {
    const eo = asRecord(entry);
    const id = String(field(eo, "agentId", "agent_id", "id", "name", "agent") ?? `agent-${index}`);
    const outputRaw = field(eo, "output", "outputData", "output_data", "result");
    const outputText =
      typeof outputRaw === "string"
        ? outputRaw
        : outputRaw
          ? JSON.stringify(outputRaw, null, 2)
          : undefined;
    const messagesRaw = field<unknown[]>(eo, "messages", "logs", "events") ?? [];
    const handoffTo = field<string>(eo, "handoffTo", "handoff_to", "nextAgent", "next_agent", "handoff");
    return {
      id,
      name: String(field(eo, "name", "agentName", "agent_name") ?? agentDisplayName(id)),
      status: String(field(eo, "status", "state") ?? "Completed"),
      startedAt: field<string>(eo, "startedAt", "started_at"),
      completedAt: field<string>(eo, "completedAt", "completed_at", "finishedAt", "finished_at"),
      durationMs: field<number>(eo, "durationMs", "duration_ms", "duration", "elapsedMs"),
      messages: messagesRaw.map((m) =>
        typeof m === "string"
          ? m
          : String(field(asRecord(m), "message", "text", "detail") ?? JSON.stringify(m)),
      ),
      input: field<string>(eo, "input", "inputSource", "input_source", "source"),
      output: outputText,
      handoffTo,
      requiresProviderReview: Boolean(
        field(eo, "requiresProviderReview", "requires_provider_review", "providerReviewRequired"),
      ),
    };
  });
}

export function extractDoctorQuestions(results: AgentResult[]): string[] {
  const questionAgent = results.find((r) => /question/i.test(r.id) || /question/i.test(r.name));
  if (!questionAgent?.output) return [];
  const raw = questionAgent.output;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const obj = asRecord(parsed);
    const questions = field<unknown[]>(obj, "questions", "providerQuestions", "doctor_questions");
    if (Array.isArray(questions)) return questions.map((q) => String(q));
  } catch {
    /* output was plain text — parse lines below */
  }
  return raw
    .split(/\n|(?:\d+\.\s)|•/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 8)
    .slice(0, 12);
}

export function normalizePreConsultation(raw: unknown): PreConsultation {
  const obj = asRecord(raw);
  const results = normalizeAgentResults(obj);
  return {
    workflowRunId: field<string>(obj, "workflowRunId", "workflow_run_id", "runId", "run_id"),
    range: field<TimeRange>(obj, "range"),
    executedAt: field<string>(obj, "executedAt", "executed_at", "createdAt", "created_at"),
    results,
    doctorQuestions: extractDoctorQuestions(results),
    workflowStatus: field<string>(obj, "workflowStatus", "workflow_status", "status"),
  };
}

export function normalizeTranscript(raw: unknown): TranscriptResult {
  const obj = asRecord(raw);
  const inner = asRecord(field(obj, "transcript", "result"));
  const segmentsRaw = listFrom(field(obj, "segments", inner, "segments"), "segments");
  const segments = segmentsRaw.map((s) => {
    const so = asRecord(s);
    return {
      start: field<string>(so, "start", "startTime", "start_time"),
      end: field<string>(so, "end", "endTime", "end_time"),
      speaker: field<string>(so, "speaker", "role"),
      text: String(field(so, "text", "content") ?? ""),
    };
  });
  const text = String(
    field(obj, "text", inner, "text", "transcript") ?? segments.map((s) => s.text).join("\n"),
  );
  return {
    consultationId: String(field(obj, "consultationId", "consultation_id", "id") ?? ""),
    text,
    segments,
    durationSeconds: field<number>(obj, "durationSeconds", "duration_seconds", "duration"),
    language: field<string>(obj, "language"),
    languageProbability: field<number>(obj, "languageProbability", "language_probability"),
    model: field<string>(obj, "model", "transcriptionModel", "transcription_model"),
  };
}

export function normalizeComparison(raw: unknown): VisitComparison {
  const entries = listFrom(raw, "comparison", "comparisons", "changes", "fields");
  return {
    comparisons: entries.map((entry) => {
      const eo = asRecord(entry);
      const previous = field<string>(eo, "previous", "previousValue", "previous_value", "before");
      const current = field<string>(eo, "current", "currentValue", "current_value", "after", "value");
      const change = field<string>(eo, "change", "delta", "trend", "direction");
      return {
        field: String(field(eo, "field", "label", "name", "metric") ?? "—"),
        ...(previous !== undefined ? { previous } : {}),
        ...(current !== undefined ? { current } : {}),
        ...(change !== undefined ? { change } : {}),
      };
    }),
  };
}

/* ----------------------------- endpoints ----------------------------- */

export type SubmitTranscriptInput = {
  patient_id: string;
  encounter_id: string;
  transcript: string;
};

export type SummaryReviewInput = {
  providerId: string;
  decision: "approved" | "edited" | "rejected";
  editedSummary?: string | undefined;
  comments?: string | undefined;
};

export const backendApi = {
  patients: () => api.get<unknown[]>("/patients").then((list) => list.map(normalizePatient)),
  patient: (patientId: string) => api.get<unknown>(`/patients/${patientId}`).then(normalizePatient),
  clinicalContext: (patientId: string, range: TimeRange) =>
    api.get<unknown>(`/patients/${patientId}/clinical-context?range=${range}`).then(normalizeContext),
  timeline: (patientId: string, range: TimeRange) =>
    api.get<unknown>(`/patients/${patientId}/timeline?range=${range}`).then(normalizeVisits),
  analytics: (patientId: string, range: TimeRange) =>
    api.get<unknown>(`/patients/${patientId}/analytics?range=${range}`).then(normalizeAnalytics),
  visit: (patientId: string, encounterId: string) =>
    api.get<unknown>(`/patients/${patientId}/visits/${encounterId}`).then(normalizeVisits),
  visitComparison: (patientId: string, encounterId: string) =>
    api.get<unknown>(`/patients/${patientId}/visits/${encounterId}/comparison`).then(normalizeComparison),
  preConsultation: (patientId: string, range: TimeRange) =>
    api
      .post<unknown>(`/workflows/patients/${patientId}/pre-consultation?range=${range}`, {})
      .then(normalizePreConsultation),
  submitTranscript: (input: SubmitTranscriptInput) =>
    api.post<unknown>("/consultations/transcript", input).then(normalizeTranscript),
  consultation: (consultationId: string) => api.get<unknown>(`/consultations/${consultationId}`),
  summaryReview: (consultationId: string, input: SummaryReviewInput) =>
    api.post<unknown>(`/consultations/${consultationId}/summary-review`, input).then((raw) => {
      const obj = asRecord(raw);
      const summary = field<string>(obj, "summary", "editedSummary", "edited_summary");
      const consultationId = field<string>(obj, "consultationId", "consultation_id");
      const workflowStatus = field<string>(obj, "workflowStatus", "workflow_status", "status");
      const version = field<number>(obj, "version");
      return {
        ...(workflowStatus !== undefined ? { workflowStatus } : {}),
        ...(summary !== undefined ? { summary } : {}),
        ...(consultationId !== undefined ? { consultationId } : {}),
        ...(version !== undefined ? { version } : {}),
        raw,
      } satisfies SummaryReviewResponse;
    }),
  uploadSpeech: (patientId: string, encounterId: string, audio: File) => {
    const form = new FormData();
    form.append("patient_id", patientId);
    form.append("encounter_id", encounterId);
    form.append("audio_file", audio);
    return api.postForm<unknown>("/speech/consultation", form).then(normalizeTranscript);
  },
};

import type { Patient } from "@/data/patients";

export type AgentStatus = "Queued" | "Running" | "Completed" | "Warning" | "Failed" | "Pending";

export type AgentId =
  | "context"
  | "fhir"
  | "intake"
  | "missing"
  | "risk"
  | "questions"
  | "soap"
  | "followup"
  | "safety"
  | "composer";

export type AgentDef = {
  id: AgentId;
  name: string;
  description: string;
  responsibility: string;
  dependsOn: AgentId[];
  handoffTo: AgentId | "Physician Review Queue";
  durationMs: number;
  /** Sections unlocked when this agent completes. */
  unlocks: SectionKey[];
  endStatus: AgentStatus;
};

export type SectionKey =
  | "summary"
  | "review"
  | "guidelines"
  | "medications"
  | "soap"
  | "impact";

export const AGENTS: AgentDef[] = [
  {
    id: "context",
    name: "Patient Context Agent",
    description: "Assembles patient identity, department and encounter context",
    responsibility: "Build the working context envelope for all downstream agents.",
    dependsOn: [],
    handoffTo: "fhir",
    durationMs: 900,
    unlocks: [],
    endStatus: "Completed",
  },
  {
    id: "fhir",
    name: "FHIR Normalization Agent",
    description: "Maps intake fields to normalized FHIR-style resources",
    responsibility: "Normalize demographics, conditions, medications and observations.",
    dependsOn: ["context"],
    handoffTo: "intake",
    durationMs: 1100,
    unlocks: [],
    endStatus: "Completed",
  },
  {
    id: "intake",
    name: "Intake / History Agent",
    description: "Extracts chief complaint, history and vitals narrative",
    responsibility: "Structure subjective and historical content from intake sources.",
    dependsOn: ["fhir"],
    handoffTo: "missing",
    durationMs: 1000,
    unlocks: ["summary"],
    endStatus: "Completed",
  },
  {
    id: "missing",
    name: "Missing Information Agent",
    description: "Detects documentation gaps and unverified fields",
    responsibility: "Flag every gap that blocks safe clinician decision-making.",
    dependsOn: ["intake"],
    handoffTo: "risk",
    durationMs: 950,
    unlocks: ["summary"],
    endStatus: "Warning",
  },
  {
    id: "risk",
    name: "Risk Review Agent",
    description: "Prepares clinician-review risk level and considerations",
    responsibility: "Surface considerations for physician review — never a diagnosis.",
    dependsOn: ["intake", "missing"],
    handoffTo: "questions",
    durationMs: 1200,
    unlocks: ["review", "guidelines"],
    endStatus: "Completed",
  },
  {
    id: "questions",
    name: "Doctor Questions Agent",
    description: "Drafts verification questions for the treating clinician",
    responsibility: "Produce targeted verification questions, including medication checks.",
    dependsOn: ["risk"],
    handoffTo: "soap",
    durationMs: 850,
    unlocks: ["medications"],
    endStatus: "Completed",
  },
  {
    id: "soap",
    name: "SOAP Note Agent",
    description: "Drafts an unapproved four-section clinical note",
    responsibility: "Draft Subjective, Objective, Assessment and Plan sections.",
    dependsOn: ["risk", "questions"],
    handoffTo: "followup",
    durationMs: 1300,
    unlocks: ["soap"],
    endStatus: "Completed",
  },
  {
    id: "followup",
    name: "Follow-up Planning Agent",
    description: "Drafts follow-up and care-plan suggestions",
    responsibility: "Propose follow-up items requiring physician confirmation.",
    dependsOn: ["soap"],
    handoffTo: "safety",
    durationMs: 900,
    unlocks: ["soap"],
    endStatus: "Completed",
  },
  {
    id: "safety",
    name: "Safety Review Agent",
    description: "Validates guardrails, allergies and medication safety",
    responsibility: "Enforce no-autonomous-action guardrails before composition.",
    dependsOn: ["followup", "questions"],
    handoffTo: "composer",
    durationMs: 1050,
    unlocks: ["medications", "impact"],
    endStatus: "Warning",
  },
  {
    id: "composer",
    name: "Clinical Composer Agent",
    description: "Assembles the final clinician-facing review package",
    responsibility: "Compose all outputs into an Awaiting Physician Review package.",
    dependsOn: ["safety"],
    handoffTo: "Physician Review Queue",
    durationMs: 1000,
    unlocks: ["impact"],
    endStatus: "Completed",
  },
];

export function agentName(id: AgentId | "Physician Review Queue") {
  if (id === "Physician Review Queue") return "Physician Review Queue";
  return AGENTS.find((a) => a.id === id)?.name ?? id;
}

export function agentIO(agent: AgentDef, patient: Patient) {
  const io: Record<AgentId, { input: string; output: string; refs: string[] }> = {
    context: {
      input: `Patient record ${patient.id} (${patient.type}, ${patient.department})`,
      output: `Context envelope: ${patient.id}, age ${patient.age}, ${patient.department}`,
      refs: ["Intake form", "Encounter metadata"],
    },
    fhir: {
      input: "Context envelope from Patient Context Agent",
      output: `Normalized resources: Patient, ${patient.activeConditions.length} Condition, ${patient.medications.length} MedicationStatement, ${patient.vitals.length} Observation`,
      refs: ["FHIR R4 field mapping (synthetic)"],
    },
    intake: {
      input: "Normalized FHIR-style resources",
      output: `Chief complaint + ${patient.history.length} history items + ${patient.findings.length} findings`,
      refs: patient.documents,
    },
    missing: {
      input: "Structured intake narrative",
      output: `${patient.gaps.length} documentation gaps detected`,
      refs: ["Completeness ruleset (synthetic)"],
    },
    risk: {
      input: "Intake narrative + detected gaps",
      output: `Clinician-review risk level: ${patient.risk}; ${patient.considerations.length} considerations for review`,
      refs: patient.abnormal.map((a) => `${a.label}: ${a.value}`),
    },
    questions: {
      input: "Risk considerations + medication list",
      output: `${patient.medQuestions.length} verification questions drafted`,
      refs: ["Medication list", "Allergy list"],
    },
    soap: {
      input: "Risk considerations + verification questions",
      output: "Unapproved SOAP draft (4 sections)",
      refs: ["Intake narrative", "Observations"],
    },
    followup: {
      input: "SOAP draft",
      output: `${patient.followUp.length} follow-up suggestions (draft)`,
      refs: ["Care-plan template (synthetic)"],
    },
    safety: {
      input: "SOAP draft + follow-up plan + medication questions",
      output: `${patient.medChecks.length} medication safety checks; no autonomous actions issued`,
      refs: ["Allergy list", "Duplicate-therapy ruleset"],
    },
    composer: {
      input: "All validated agent outputs",
      output: "Clinician review package — status: Awaiting Physician Review",
      refs: ["All upstream agent outputs"],
    },
  };
  return io[agent.id];
}

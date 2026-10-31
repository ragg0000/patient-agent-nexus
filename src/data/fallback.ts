/**
 * Offline fallback data — clearly labeled "Offline simulated data".
 *
 * Used only when the FastAPI backend is unavailable. Never presented as a
 * live backend response. Built from the existing synthetic patients file.
 */

import { PATIENTS, type Patient } from "@/data/patients";
import {
  type Analytics,
  type BackendPatient,
  type ClinicalContext,
  type TimeRange,
  type TimelineVisit,
  type VisitSeverity,
  type VisitComparison,
} from "@/lib/backend";

export const OFFLINE_LABEL = "Offline simulated data";

export function fallbackPatients(): BackendPatient[] {
  return PATIENTS.map((p) => ({
    patientId: p.id,
    name: p.name,
    age: p.age,
    patientType: p.type,
    department: p.department,
    visitReason: p.chiefComplaint,
    currentVisit: p.chiefComplaint,
    medicalHistory: p.history,
    medications: p.medications,
    allergies: p.allergies,
    historicalEncounters: 8,
    vitals: p.vitals,
    missingInformation: p.gaps,
    dataOrigin: OFFLINE_LABEL,
  }));
}

export function fallbackPatient(patientId: string): BackendPatient | undefined {
  return fallbackPatients().find((p) => p.patientId === patientId);
}

/** Map a backend patient to the legacy Patient shape the existing cards use. */
export function legacyView(bp: BackendPatient): Patient {
  const synthetic = PATIENTS.find((p) => p.id === bp.patientId);
  if (synthetic) return synthetic;
  return {
    id: bp.patientId,
    name: bp.name,
    age: bp.age ?? 0,
    sex: "—",
    type: bp.patientType ?? "—",
    department: bp.department ?? "—",
    chiefComplaint: bp.visitReason ?? bp.currentVisit ?? "—",
    history: bp.medicalHistory,
    vitals: bp.vitals ?? [],
    medications: bp.medications,
    allergies: bp.allergies,
    documents: [],
    recentVisits: `${bp.historicalEncounters ?? 0} historical encounters`,
    activeConditions: bp.medicalHistory,
    findings: [],
    abnormal: [],
    gaps: bp.missingInformation ?? [],
    considerations: [],
    guidelines: [],
    medChecks: [],
    medQuestions: [],
    soap: { s: "", o: "", a: "", p: "" },
    followUp: [],
    risk: "Moderate",
  };
}

/* Deterministic seeded generator — no Math.random, safe for SSR/worker. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ENCOUNTER_TYPES = ["Routine review", "Lab review", "Follow-up visit", "Acute review", "Treatment change review"];
const SEVERITY_ORDER: VisitSeverity[] = ["routine", "improved", "warning", "urgent", "treatment-change"];

/** Build a deterministic synthetic visit history for a fallback patient. */
export function fallbackVisits(patientId: string): TimelineVisit[] {
  const base = PATIENTS.find((p) => p.id === patientId);
  const seed = [...patientId].reduce((acc, ch) => acc + ch.charCodeAt(0) * 31, 7);
  const rand = mulberry32(seed);
  const count = 8 + (seed % 5);
  const now = Date.now();
  const visits: TimelineVisit[] = [];

  let t = now;
  for (let i = 0; i < count; i++) {
    t -= (30 + Math.floor(rand() * 90)) * 24 * 3600 * 1000;
    const riskIndex = base?.risk === "High" ? 2 : base?.risk === "Moderate" ? 1 : 0;
    const severity =
      i === 0 ? SEVERITY_ORDER[1] : SEVERITY_ORDER[Math.min(4, riskIndex + Math.floor(rand() * 2))] ?? "routine";
    const drift = (i % 5) - 2;
    visits.push({
      encounterId: `${patientId}-H${String(count - i).padStart(2, "0")}`,
      date: new Date(t).toISOString().slice(0, 10),
      department: base?.department ?? "General",
      encounterType: ENCOUNTER_TYPES[(seed + i) % ENCOUNTER_TYPES.length]!,
      visitReason: i === 0 ? "Most recent historical review" : "Historical synthetic encounter",
      severity,
      vitals: {
        ...(base ? { BP: base.vitals.find((v) => v.label === "BP")?.value ?? "—" } : {}),
        Pulse: `${70 + drift * 3 + (seed % 10)} bpm`,
        SpO2: `${96 + (i % 3)} %`,
        Weight: `${72 + drift * 0.8 + (seed % 7)} kg`,
        BMI: `${31 + drift * 0.2}`,
      },
      labs: {
        HbA1c: `${(7.4 + drift * 0.15).toFixed(1)} %`,
        Creatinine: `${(1.1 + Math.abs(drift) * 0.08).toFixed(2)} mg/dL`,
      },
      carePlan: "Synthetic historical care plan — provider-verified at the time of the visit",
      outcome: severity === "urgent" ? "Escalated for urgent physician review" : "Stable at discharge",
      dataOrigin: `${OFFLINE_LABEL} · synthetic historical extension`,
    });
  }
  return visits.reverse();
}

export function filterVisitsByRange(visits: TimelineVisit[], range: TimeRange): TimelineVisit[] {
  if (range === "all") return visits;
  const years = range === "1y" ? 1 : 5;
  const cutoff = Date.now() - years * 365 * 24 * 3600 * 1000;
  return visits.filter((v) => new Date(v.date).getTime() >= cutoff);
}

function numeric(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

const TREND_SOURCES: { key: string; label: string; unit: string; vital?: RegExp; lab?: RegExp }[] = [
  { key: "bp-systolic", label: "Blood pressure — systolic", unit: "mmHg", vital: /^bp$/i },
  { key: "bp-diastolic", label: "Blood pressure — diastolic", unit: "mmHg", vital: /^bp$/i },
  { key: "pulse", label: "Pulse", unit: "bpm", vital: /pulse|heart rate|^hr$/i },
  { key: "spo2", label: "SpO2", unit: "%", vital: /spo2|sao2|oxygen/i },
  { key: "weight", label: "Weight", unit: "kg", vital: /weight/i },
  { key: "bmi", label: "BMI", unit: "kg/m²", vital: /bmi/i },
  { key: "hba1c", label: "HbA1c", unit: "%", lab: /hba1c|a1c/i },
  { key: "glucose", label: "Fasting glucose", unit: "mg/dL", lab: /glucose/i },
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", lab: /creatinine/i },
];

export function fallbackAnalytics(visits: TimelineVisit[]): Analytics {
  const trends: Analytics["trends"] = [];
  for (const source of TREND_SOURCES) {
    const points: { date: string; value: number }[] = [];
    for (const visit of visits) {
      const vitalKey = source.vital
        ? Object.keys(visit.vitals ?? {}).find((k) => source.vital!.test(k))
        : undefined;
      const labKey = source.lab
        ? Object.keys(visit.labs ?? {}).find((k) => source.lab!.test(k))
        : undefined;
      if (vitalKey) {
        const raw = visit.vitals?.[vitalKey] ?? "";
        if (source.key === "bp-systolic") {
          const parts = raw.split("/");
          const value = numeric(parts[0]);
          if (value !== null) points.push({ date: visit.date, value });
          continue;
        }
        if (source.key === "bp-diastolic") {
          const parts = raw.split("/");
          const value = numeric(parts[1]);
          if (value !== null) points.push({ date: visit.date, value });
          continue;
        }
        const value = numeric(raw);
        if (value !== null) points.push({ date: visit.date, value });
      } else if (labKey) {
        const value = numeric(visit.labs?.[labKey]);
        if (value !== null) points.push({ date: visit.date, value });
      }
    }
    if (points.length >= 2) trends.push({ key: source.key, label: source.label, unit: source.unit, points });
  }
  return { trends };
}

export function fallbackContext(patientId: string, range: TimeRange): ClinicalContext {
  const base = PATIENTS.find((p) => p.id === patientId);
  const all = fallbackVisits(patientId);
  const visits = filterVisitsByRange(all, range);
  return {
    previousVisits: visits,
    activeConditions: base?.activeConditions ?? base?.history ?? [],
    medications: base?.medications ?? [],
    allergies: base?.allergies ?? [],
    historicalEncounterCount: all.length,
    sourceReferences: [...(base?.documents ?? []), `${OFFLINE_LABEL} — synthetic historical extension`],
    missingInformation: base?.gaps ?? [],
    dataOrigin: OFFLINE_LABEL,
  };
}

export function fallbackComparison(patientId: string, encounterId: string): VisitComparison {
  const visits = fallbackVisits(patientId);
  const index = visits.findIndex((v) => v.encounterId === encounterId);
  const current = visits[index];
  const previous = visits[index - 1];
  const comparisons: VisitComparison["comparisons"] = [];
  const vitalKeys = new Set([...Object.keys(current?.vitals ?? {}), ...Object.keys(previous?.vitals ?? {})]);
  for (const key of vitalKeys) {
    const before = previous?.vitals?.[key];
    const after = current?.vitals?.[key];
    if (!before || !after || before === after) {
      comparisons.push({ field: key, previous: before, current: after, change: before === after ? "Unchanged" : undefined });
      continue;
    }
    const pb = numeric(before) ?? 0;
    const pa = numeric(after) ?? 0;
    comparisons.push({
      field: key,
      previous: before,
      current: after,
      change: pa > pb ? "Increased" : pa < pb ? "Decreased" : "Changed",
    });
  }
  const labKeys = new Set([...Object.keys(current?.labs ?? {}), ...Object.keys(previous?.labs ?? {})]);
  for (const key of labKeys) {
    const before = previous?.labs?.[key];
    const after = current?.labs?.[key];
    if (!before || !after) continue;
    const pb = numeric(before) ?? 0;
    const pa = numeric(after) ?? 0;
    comparisons.push({
      field: key,
      previous: before,
      current: after,
      change: pa > pb ? "Increased" : pa < pb ? "Decreased" : "Unchanged",
    });
  }
  return { comparisons };
}

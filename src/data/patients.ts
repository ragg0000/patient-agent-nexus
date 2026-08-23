export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: string;
  type: string;
  department: string;
  chiefComplaint: string;
  history: string[];
  vitals: { label: string; value: string; abnormal?: boolean }[];
  medications: string[];
  allergies: string[];
  documents: string[];
  recentVisits: string;
  activeConditions: string[];
  findings: string[];
  abnormal: { label: string; value: string; flag: "high" | "low" | "watch" }[];
  gaps: string[];
  considerations: {
    label: string;
    strength: "Strong" | "Moderate" | "Limited";
    evidence: string[];
    missing: string;
  }[];
  guidelines: { title: string; source: string; actions: string[] }[];
  medChecks: { kind: "ok" | "warn" | "urgent"; text: string }[];
  medQuestions: string[];
  soap: { s: string; o: string; a: string; p: string };
  followUp: string[];
  risk: "Low" | "Moderate" | "High";
};

export const PATIENTS: Patient[] = [
  {
    id: "TP-001",
    name: "Synthetic Patient TP-001",
    age: 58,
    sex: "Male",
    type: "Outpatient",
    department: "Cardiology",
    chiefComplaint: "Intermittent exertional chest tightness for 3 weeks.",
    history: ["Type 2 Diabetes", "Hypertension", "Hyperlipidemia"],
    vitals: [
      { label: "BP", value: "152/94 mmHg", abnormal: true },
      { label: "HR", value: "96 bpm" },
      { label: "RR", value: "18 /min" },
      { label: "SpO2", value: "96 %" },
      { label: "Temp", value: "98.4 °F" },
    ],
    medications: ["Metformin 500 mg BD", "Losartan 50 mg OD", "Atorvastatin 20 mg OD"],
    allergies: ["No known allergies (unverified)"],
    documents: ["TP-001_labs.pdf", "TP-001_ecg.pdf", "TP-001_med_list.pdf"],
    recentVisits: "2 visits / last 30 days",
    activeConditions: ["T2DM", "Hypertension", "Hyperlipidemia"],
    findings: [
      "Exertional chest tightness, relieved by rest",
      "BP above target on current regimen",
      "LDL above documented goal",
      "No documented stress testing on file",
    ],
    abnormal: [
      { label: "LDL Cholesterol", value: "148 mg/dL", flag: "high" },
      { label: "HbA1c", value: "8.1 %", flag: "high" },
      { label: "Systolic BP", value: "152 mmHg", flag: "high" },
    ],
    gaps: ["Troponin trend not available", "Allergy list unverified", "No prior ECG for comparison"],
    considerations: [
      {
        label: "Stable angina pattern — requires physician review",
        strength: "Moderate",
        evidence: ["Intake: exertional pattern", "Vitals: elevated BP", "Labs: LDL 148 mg/dL"],
        missing: "Stress test / troponin trend not in record",
      },
      {
        label: "Uncontrolled diabetes contributing to risk profile",
        strength: "Strong",
        evidence: ["Labs: HbA1c 8.1 %", "History: T2DM on metformin"],
        missing: "Home glucose log not uploaded",
      },
      {
        label: "Musculoskeletal chest wall pain cannot be excluded",
        strength: "Limited",
        evidence: ["Intake: no radiation documented"],
        missing: "Focused physical exam findings absent",
      },
    ],
    guidelines: [
      {
        title: "Chronic coronary disease evaluation context",
        source: "Guideline source area — placeholder reference set",
        actions: [
          "Clinician to consider risk stratification pathway",
          "Clinician to review antianginal need",
          "Clinician to reassess lipid target",
        ],
      },
    ],
    medChecks: [
      { kind: "ok", text: "No duplicate therapy detected across 3 active medications" },
      { kind: "warn", text: "Statin intensity vs documented LDL goal — clinician review required" },
      { kind: "urgent", text: "Allergy list unverified — confirm before any order" },
    ],
    medQuestions: [
      "Confirm metformin adherence and renal function date.",
      "Confirm whether any OTC NSAIDs are being used.",
      "Verify allergy history with patient directly.",
    ],
    soap: {
      s: "58-year-old synthetic outpatient (TP-001) reports 3 weeks of intermittent exertional chest tightness relieved by rest. No syncope or vomiting documented.",
      o: "BP 152/94 mmHg, HR 96 bpm, RR 18/min, SpO2 96%. HbA1c 8.1%, LDL 148 mg/dL. ECG on file not compared to prior.",
      a: "AI-assisted considerations only, not a confirmed diagnosis: exertional chest pain pattern with uncontrolled cardiometabolic risk factors. Physician review required.",
      p: "Draft only — awaiting physician decisions: risk stratification pathway review, BP and lipid target review, verify allergy list, obtain missing troponin/stress data.",
    },
    followUp: [
      "Physician review within 48 hours (draft suggestion)",
      "Repeat BP measurement at next visit",
      "Collect missing lab trend before follow-up",
    ],
    risk: "High",
  },
  {
    id: "TP-002",
    name: "Synthetic Patient TP-002",
    age: 34,
    sex: "Female",
    type: "Outpatient",
    department: "Endocrinology",
    chiefComplaint: "Fatigue and 6 kg unintentional weight gain over 4 months.",
    history: ["Hypothyroidism", "Iron deficiency anemia"],
    vitals: [
      { label: "BP", value: "118/76 mmHg" },
      { label: "HR", value: "58 bpm", abnormal: true },
      { label: "RR", value: "16 /min" },
      { label: "SpO2", value: "99 %" },
      { label: "Temp", value: "97.6 °F" },
    ],
    medications: ["Levothyroxine 75 mcg OD", "Ferrous sulfate 325 mg OD"],
    allergies: ["Sulfa drugs (rash)"],
    documents: ["TP-002_thyroid_panel.pdf", "TP-002_cbc.pdf"],
    recentVisits: "1 visit / last 30 days",
    activeConditions: ["Hypothyroidism", "Anemia"],
    findings: [
      "Fatigue with bradycardia at rest",
      "TSH above reference range",
      "Ferritin low-normal",
      "Dose timing relative to iron not documented",
    ],
    abnormal: [
      { label: "TSH", value: "9.4 mIU/L", flag: "high" },
      { label: "Ferritin", value: "18 ng/mL", flag: "low" },
      { label: "Heart rate", value: "58 bpm", flag: "watch" },
    ],
    gaps: ["Free T4 not on file", "Adherence history missing", "Weight trend chart incomplete"],
    considerations: [
      {
        label: "Under-replaced hypothyroidism — physician review",
        strength: "Strong",
        evidence: ["Labs: TSH 9.4 mIU/L", "Intake: fatigue, weight gain"],
        missing: "Free T4 value absent",
      },
      {
        label: "Iron absorption interaction affecting levothyroxine",
        strength: "Moderate",
        evidence: ["Medications: levothyroxine + ferrous sulfate"],
        missing: "Administration timing not documented",
      },
    ],
    guidelines: [
      {
        title: "Thyroid replacement monitoring context",
        source: "Guideline source area — placeholder reference set",
        actions: ["Clinician to review dose adequacy", "Clinician to review repeat testing interval"],
      },
    ],
    medChecks: [
      { kind: "warn", text: "Levothyroxine / iron separation interval unverified" },
      { kind: "ok", text: "No duplicate therapy detected" },
      { kind: "urgent", text: "Sulfa allergy documented — confirm before new prescriptions" },
    ],
    medQuestions: [
      "How many hours separate iron and levothyroxine doses?",
      "Any missed doses in the last month?",
    ],
    soap: {
      s: "34-year-old synthetic outpatient (TP-002) reports 4 months of fatigue with 6 kg unintentional weight gain.",
      o: "BP 118/76, HR 58 bpm. TSH 9.4 mIU/L, ferritin 18 ng/mL. Free T4 not available.",
      a: "AI-assisted considerations only: laboratory pattern consistent with inadequate thyroid replacement; interaction risk with oral iron. Physician confirmation required.",
      p: "Draft only: physician to review replacement adequacy, dose separation counselling, obtain free T4, recheck ferritin.",
    },
    followUp: ["Draft: repeat thyroid panel in 6-8 weeks", "Document dose timing at next contact"],
    risk: "Moderate",
  },
  {
    id: "TP-003",
    name: "Synthetic Patient TP-003",
    age: 71,
    sex: "Male",
    type: "Inpatient",
    department: "Nephrology",
    chiefComplaint: "Reduced urine output and lower-limb swelling for 5 days.",
    history: ["CKD stage 3b", "Hypertension", "Gout"],
    vitals: [
      { label: "BP", value: "164/88 mmHg", abnormal: true },
      { label: "HR", value: "88 bpm" },
      { label: "RR", value: "22 /min", abnormal: true },
      { label: "SpO2", value: "93 %", abnormal: true },
      { label: "Temp", value: "98.9 °F" },
    ],
    medications: ["Amlodipine 10 mg OD", "Furosemide 40 mg OD", "Allopurinol 100 mg OD"],
    allergies: ["NSAIDs (renal intolerance)"],
    documents: ["TP-003_renal_panel.pdf", "TP-003_urinalysis.pdf", "TP-003_chest_xray.pdf"],
    recentVisits: "3 visits / last 30 days",
    activeConditions: ["CKD 3b", "Volume overload", "Hypertension"],
    findings: [
      "Oliguria with peripheral edema",
      "Creatinine rising vs baseline",
      "Oxygen saturation trending down",
      "Fluid balance chart incomplete",
    ],
    abnormal: [
      { label: "Creatinine", value: "2.6 mg/dL", flag: "high" },
      { label: "Potassium", value: "5.6 mmol/L", flag: "high" },
      { label: "SpO2", value: "93 %", flag: "low" },
    ],
    gaps: ["Daily weights missing", "Intake/output chart partially blank", "Recent ECG absent"],
    considerations: [
      {
        label: "Acute-on-chronic kidney impairment — urgent physician review",
        strength: "Strong",
        evidence: ["Labs: creatinine 2.6 mg/dL", "Intake: oliguria 5 days"],
        missing: "Baseline creatinine within 3 months not on file",
      },
      {
        label: "Hyperkalaemia requiring clinician verification",
        strength: "Strong",
        evidence: ["Labs: potassium 5.6 mmol/L"],
        missing: "ECG for repolarisation changes not available",
      },
    ],
    guidelines: [
      {
        title: "CKD volume and electrolyte review context",
        source: "Guideline source area — placeholder reference set",
        actions: [
          "Clinician to review fluid status urgently",
          "Clinician to review potassium management pathway",
        ],
      },
    ],
    medChecks: [
      { kind: "urgent", text: "NSAID allergy/intolerance — must be respected in all orders" },
      { kind: "warn", text: "Diuretic dose vs renal function — clinician review required" },
      { kind: "ok", text: "No duplicate antihypertensive class detected" },
    ],
    medQuestions: [
      "Confirm last furosemide dose and response.",
      "Any potassium-containing supplements at home?",
    ],
    soap: {
      s: "71-year-old synthetic inpatient (TP-003) with 5 days of reduced urine output and leg swelling.",
      o: "BP 164/88, RR 22, SpO2 93%. Creatinine 2.6 mg/dL, potassium 5.6 mmol/L.",
      a: "AI-assisted considerations only: acute-on-chronic renal impairment with hyperkalaemia and possible volume overload. Immediate physician review required.",
      p: "Draft only: physician to review volume and electrolyte management, obtain ECG, complete fluid balance charting.",
    },
    followUp: ["Draft: same-day physician review", "Daily weights and strict I/O charting"],
    risk: "High",
  },
  {
    id: "TP-004",
    name: "Synthetic Patient TP-004",
    age: 26,
    sex: "Female",
    type: "Outpatient",
    department: "Pulmonology",
    chiefComplaint: "Night-time cough and wheeze, 3 episodes per week.",
    history: ["Asthma", "Allergic rhinitis"],
    vitals: [
      { label: "BP", value: "112/70 mmHg" },
      { label: "HR", value: "84 bpm" },
      { label: "RR", value: "20 /min" },
      { label: "SpO2", value: "97 %" },
      { label: "PEF", value: "78 % predicted", abnormal: true },
    ],
    medications: ["Budesonide/formoterol inhaler BD", "Salbutamol inhaler PRN", "Cetirizine 10 mg OD"],
    allergies: ["Dust mite (environmental)"],
    documents: ["TP-004_spirometry.pdf", "TP-004_symptom_diary.pdf"],
    recentVisits: "1 visit / last 30 days",
    activeConditions: ["Asthma", "Allergic rhinitis"],
    findings: [
      "Nocturnal symptoms 3x/week",
      "Reliever use above documented baseline",
      "Inhaler technique not assessed in record",
    ],
    abnormal: [{ label: "Peak expiratory flow", value: "78 % predicted", flag: "low" }],
    gaps: ["Inhaler technique assessment missing", "Reliever canister count unknown"],
    considerations: [
      {
        label: "Partly controlled asthma pattern — physician review",
        strength: "Moderate",
        evidence: ["Intake: nocturnal symptoms", "Vitals: PEF 78% predicted"],
        missing: "Formal control questionnaire not completed",
      },
      {
        label: "Adherence or technique issue possible",
        strength: "Limited",
        evidence: ["Medications: controller prescribed BD"],
        missing: "Technique observation absent",
      },
    ],
    guidelines: [
      {
        title: "Asthma control review context",
        source: "Guideline source area — placeholder reference set",
        actions: ["Clinician to review control assessment", "Clinician to review trigger management"],
      },
    ],
    medChecks: [
      { kind: "ok", text: "No duplicate controller therapy detected" },
      { kind: "warn", text: "Reliever overuse pattern flagged for clinician review" },
    ],
    medQuestions: ["How many reliever puffs per week?", "Is a spacer used with the inhaler?"],
    soap: {
      s: "26-year-old synthetic outpatient (TP-004) with night-time cough and wheeze 3 times weekly.",
      o: "SpO2 97%, PEF 78% predicted. Spirometry on file, technique not assessed.",
      a: "AI-assisted considerations only: pattern suggests incomplete asthma control. Physician review required.",
      p: "Draft only: physician to review control status, assess technique/adherence, document trigger plan.",
    },
    followUp: ["Draft: review in 4 weeks with symptom diary", "Technique check at next visit"],
    risk: "Moderate",
  },
  {
    id: "TP-005",
    name: "Synthetic Patient TP-005",
    age: 63,
    sex: "Female",
    type: "Post-discharge",
    department: "Neurology",
    chiefComplaint: "Follow-up after transient right-arm weakness episode.",
    history: ["Atrial fibrillation", "Hypertension", "Osteoarthritis"],
    vitals: [
      { label: "BP", value: "146/86 mmHg", abnormal: true },
      { label: "HR", value: "104 bpm (irregular)", abnormal: true },
      { label: "RR", value: "18 /min" },
      { label: "SpO2", value: "96 %" },
      { label: "Temp", value: "98.2 °F" },
    ],
    medications: ["Apixaban 5 mg BD", "Bisoprolol 5 mg OD", "Paracetamol 500 mg PRN"],
    allergies: ["Penicillin (urticaria)"],
    documents: ["TP-005_discharge_summary.pdf", "TP-005_ct_head.pdf", "TP-005_ecg.pdf"],
    recentVisits: "2 visits / last 30 days",
    activeConditions: ["Atrial fibrillation", "Hypertension"],
    findings: [
      "Transient focal neurological symptoms, resolved",
      "Irregular rate above target",
      "Anticoagulation adherence not documented",
    ],
    abnormal: [
      { label: "Heart rate", value: "104 bpm", flag: "high" },
      { label: "Systolic BP", value: "146 mmHg", flag: "high" },
    ],
    gaps: ["Carotid imaging report missing", "Anticoagulation adherence record absent"],
    considerations: [
      {
        label: "Transient ischaemic event follow-up — physician review",
        strength: "Strong",
        evidence: ["Documents: discharge summary", "History: atrial fibrillation"],
        missing: "Carotid imaging not on file",
      },
      {
        label: "Rate control below target",
        strength: "Moderate",
        evidence: ["Vitals: HR 104 bpm irregular"],
        missing: "Ambulatory rate monitoring absent",
      },
    ],
    guidelines: [
      {
        title: "Secondary prevention review context",
        source: "Guideline source area — placeholder reference set",
        actions: [
          "Clinician to review anticoagulation continuation",
          "Clinician to review rate and BP targets",
        ],
      },
    ],
    medChecks: [
      { kind: "urgent", text: "Penicillin allergy documented — confirm before any antibiotic order" },
      { kind: "warn", text: "Bleeding-risk review required for ongoing anticoagulation" },
      { kind: "ok", text: "No duplicate anticoagulant detected" },
    ],
    medQuestions: ["Any missed apixaban doses since discharge?", "Any bleeding or bruising episodes?"],
    soap: {
      s: "63-year-old synthetic post-discharge patient (TP-005) reviewed after a resolved transient right-arm weakness episode.",
      o: "BP 146/86, HR 104 bpm irregular. CT head and discharge summary on file; carotid imaging missing.",
      a: "AI-assisted considerations only: secondary prevention follow-up with suboptimal rate and BP control. Physician review required.",
      p: "Draft only: physician to review anticoagulation and rate control, request missing imaging, reinforce adherence documentation.",
    },
    followUp: ["Draft: neurology review within 2 weeks", "Obtain carotid imaging report"],
    risk: "High",
  },
  {
    id: "TP-006",
    name: "Synthetic Patient TP-006",
    age: 47,
    sex: "Male",
    type: "Outpatient",
    department: "Gastroenterology",
    chiefComplaint: "Epigastric burning after meals for 2 months.",
    history: ["GERD", "Obesity", "Former smoker"],
    vitals: [
      { label: "BP", value: "128/82 mmHg" },
      { label: "HR", value: "78 bpm" },
      { label: "RR", value: "16 /min" },
      { label: "SpO2", value: "98 %" },
      { label: "BMI", value: "33.1 kg/m²", abnormal: true },
    ],
    medications: ["Pantoprazole 40 mg OD", "Omeprazole 20 mg OD (external prescription)"],
    allergies: ["No known allergies (unverified)"],
    documents: ["TP-006_lft.pdf", "TP-006_ultrasound.pdf"],
    recentVisits: "1 visit / last 30 days",
    activeConditions: ["GERD", "Obesity"],
    findings: [
      "Post-prandial epigastric burning, 2 months",
      "Two proton pump inhibitors active on list",
      "No alarm features documented",
    ],
    abnormal: [
      { label: "BMI", value: "33.1 kg/m²", flag: "high" },
      { label: "ALT", value: "62 U/L", flag: "high" },
    ],
    gaps: ["H. pylori status unknown", "Endoscopy history not documented", "Alarm-feature screen incomplete"],
    considerations: [
      {
        label: "Reflux symptoms with incomplete response — physician review",
        strength: "Moderate",
        evidence: ["Intake: 2 months post-prandial burning", "Medications: PPI already active"],
        missing: "H. pylori testing result absent",
      },
      {
        label: "Raised transaminases needing clinician interpretation",
        strength: "Moderate",
        evidence: ["Labs: ALT 62 U/L", "Vitals: BMI 33.1"],
        missing: "Alcohol and metabolic history incomplete",
      },
    ],
    guidelines: [
      {
        title: "Dyspepsia evaluation context",
        source: "Guideline source area — placeholder reference set",
        actions: ["Clinician to review alarm-feature screening", "Clinician to review acid-suppression plan"],
      },
    ],
    medChecks: [
      { kind: "urgent", text: "Duplicate therapy detected: pantoprazole + omeprazole — clinician action required" },
      { kind: "warn", text: "Allergy list unverified" },
      { kind: "ok", text: "No known interaction flags in current list" },
    ],
    medQuestions: [
      "Which PPI is actually being taken, and at what dose?",
      "Any NSAID or alcohol use to document?",
    ],
    soap: {
      s: "47-year-old synthetic outpatient (TP-006) reports 2 months of post-prandial epigastric burning.",
      o: "BMI 33.1 kg/m², ALT 62 U/L. Two PPIs recorded as active. Ultrasound and LFTs on file.",
      a: "AI-assisted considerations only: reflux symptoms with duplicate acid-suppression entries and mildly raised transaminases. Physician review required.",
      p: "Draft only: physician to reconcile PPI duplication, review alarm features, consider H. pylori status, document metabolic history.",
    },
    followUp: ["Draft: medication reconciliation call within 1 week", "Review labs at next visit"],
    risk: "Moderate",
  },
];

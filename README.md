# Clinical Navigator AI

Use the uploaded AI Health Super Agent dashboard image as the primary visual reference.

Recreate the same information-dense clinical dashboard structure and styling, but use our six synthetic patients and our defined agentic workflow.

LAYOUTCreate a full-width desktop dashboard with a dark navy left sidebar and a white/light-gray clinical workspace.

LEFT SIDEBAR

Include:

- AI HEALTH SUPER AGENT logo/title

- Dashboard

- Patient Intake

- AI Agents

- Clinical Summary

- Clinical Review

- Guidelines

- Medications

- SOAP Note

- Care Plan

- Reports

- Audit Trail

- Settings

TOP ROW

1. PATIENT INTAKE

Display:

- Patient profile

- Patient ID, age, type, department

- Chief complaint

- Medical history

- Vital signs

- Current medications

- Allergies

- Uploaded documents placeholder

- Start AI Analysis button

2. AI AGENTS AT WORK

Show a vertical connected agent timeline.

Agents:

- Patient Context Agent

- FHIR Normalization Agent

- Intake or History Agent

- Missing Information Agent

- Risk Review Agent

- Doctor Questions Agent

- SOAP Note Agent

- Follow-up Planning Agent

- Safety Review Agent

- Clinical Composer Agent

Display:

- Agent icon

- Description

- Queued, Running, Completed, Warning, Failed or Pending status

- Execution duration

- Overall progress bar

- Agent-to-agent handoff messages

3. CLINICAL SUMMARY

Display:

- Age and patient type

- Clinician-review risk level

- Recent visits

- Active conditions

- Key clinical findings

- Abnormal labs or vitals

- Missing information

- Source references

- Safety indicators

LOWER ROW

4. CLINICAL REVIEW

Do not present autonomous or confirmed diagnoses.

Display:

- Clinical considerations requiring physician review

- Supporting source evidence

- Confidence or evidence-strength indicator

- Missing evidence

- “AI-assisted, not a confirmed diagnosis” label

5. GUIDELINE CONTEXT

Display:

- Relevant guideline context placeholders

- Recommended clinician review actions

- Guideline source area

- Evidence/source links

- Clearly mark this as decision support only

6. MEDICATION REVIEW

Display:

- Current medications

- Allergy warnings

- Duplicate-medication checks

- Interaction-review placeholder

- Medication verification questions

- Never autonomously recommend starting, stopping or changing medication

- Require clinician approval for every medication-related action

7. SOAP NOTE

Display four color-coded editable sections:

- Subjective

- Objective

- Assessment

- Plan

Include:

- AI-generated draft label

- Edit Note

- Save Draft

- Approve

- Reject

- Finalize

- Export button

Never pre-approve the note.

8. WORKFLOW IMPACT

Display simulated POC metrics:

- Documentation time

- Chart review time

- Agent processing time

- Missing-information detection

- Physician edits

- Completed workflows

Clearly label every metric as:

“Simulated POC metric”

VISUAL STYLE

- Dark navy sidebar

- Navy section-title tabs

- White cards

- Light-gray page background

- Thin gray borders

- Rounded corners

- Compact spacing

- Blue and purple primary actions

- Green completed status

- Amber warning status

- Red urgent clinician-review status

- Consistent Lucide medical and agent icons

- Minimal shadows

- Desktop-first responsive layout

INTERACTION

When Start AI Analysis is clicked:

1. Start the orchestrator.

2. Animate agents through actual workflow states.

3. Update each section as the relevant agent completes.

4. Show agent handoff messages.

5. Populate summary, gaps, questions, SOAP draft and follow-up plan.

6. Finish in Awaiting Physician Review status.

Each agent card must open a drawer showing:

- Agent responsibility

- Input received

- Output produced

- Context dependencies

- Source references

- Validation result

- Handoff recipient

- Execution timestamp and duration

Use deterministic synthetic outputs first, but preserve the LLMProvider abstraction for later Gemini integration.

Do not use the sample patient information visible in the reference image. Use only TP-001 through TP-006 from the master prompt.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://patient-agent-nexus.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/87e91f89-fe1d-4498-a0ef-89e935d3ade1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

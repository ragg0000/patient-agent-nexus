import { useCallback, useEffect, useRef, useState } from "react";
import { AGENTS, agentName, type AgentId, type AgentStatus, type SectionKey } from "@/lib/agents";
import { activeProvider } from "@/lib/llm-provider";
import type { Patient } from "@/data/patients";

export type AgentRun = {
  status: AgentStatus;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
  validation?: string;
  provider?: string;
};

export type Handoff = { from: string; to: string; message: string; at: string };

export type WorkflowStatus = "Idle" | "Running" | "Awaiting Physician Review";

const idleRuns = () =>
  Object.fromEntries(AGENTS.map((a) => [a.id, { status: "Pending" as AgentStatus }])) as Record<
    AgentId,
    AgentRun
  >;

export function useOrchestrator(patient: Patient) {
  const [runs, setRuns] = useState<Record<AgentId, AgentRun>>(idleRuns);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [unlocked, setUnlocked] = useState<SectionKey[]>([]);
  const [status, setStatus] = useState<WorkflowStatus>("Idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setRuns(idleRuns());
    setHandoffs([]);
    setUnlocked([]);
    setStatus("Idle");
  }, [clearTimers]);

  // Reset when the selected patient changes.
  useEffect(() => {
    reset();
  }, [patient.id, reset]);

  const start = useCallback(() => {
    clearTimers();
    setRuns(
      Object.fromEntries(AGENTS.map((a) => [a.id, { status: "Queued" as AgentStatus }])) as Record<
        AgentId,
        AgentRun
      >,
    );
    setHandoffs([]);
    setUnlocked([]);
    setStatus("Running");

    let offset = 300;
    AGENTS.forEach((agent, index) => {
      const startAt = offset;
      const endAt = offset + agent.durationMs;
      offset = endAt + 200;

      timers.current.push(
        setTimeout(() => {
          setRuns((prev) => ({
            ...prev,
            [agent.id]: {
              ...prev[agent.id],
              status: "Running",
              startedAt: new Date().toLocaleTimeString(),
            },
          }));
          void activeProvider.complete({
            agentId: agent.id,
            patientId: patient.id,
            prompt: agent.responsibility,
            context: { department: patient.department },
          });
        }, startAt),
      );

      timers.current.push(
        setTimeout(() => {
          setRuns((prev) => ({
            ...prev,
            [agent.id]: {
              ...prev[agent.id],
              status: agent.endStatus,
              durationMs: agent.durationMs,
              finishedAt: new Date().toLocaleTimeString(),
              validation:
                agent.endStatus === "Warning"
                  ? "Passed with flags — clinician verification required"
                  : "Passed schema and guardrail validation",
              provider: activeProvider.name,
            },
          }));
          if (agent.unlocks.length) {
            setUnlocked((prev) => Array.from(new Set([...prev, ...agent.unlocks])));
          }
          setHandoffs((prev) => [
            ...prev,
            {
              from: agent.name,
              to: agentName(agent.handoffTo),
              message:
                agent.handoffTo === "Physician Review Queue"
                  ? `Review package for ${patient.id} handed to physician queue — no autonomous actions taken.`
                  : `Handing ${patient.id} context to ${agentName(agent.handoffTo)}.`,
              at: new Date().toLocaleTimeString(),
            },
          ]);
          if (index === AGENTS.length - 1) setStatus("Awaiting Physician Review");
        }, endAt),
      );
    });
  }, [clearTimers, patient.department, patient.id]);

  const completedCount = AGENTS.filter((a) =>
    ["Completed", "Warning", "Failed"].includes(runs[a.id].status),
  ).length;
  const progress = Math.round((completedCount / AGENTS.length) * 100);

  return { runs, handoffs, unlocked, status, progress, start, reset };
}

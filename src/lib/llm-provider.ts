/**
 * LLMProvider abstraction.
 *
 * The dashboard currently runs on a deterministic synthetic provider so the
 * POC is reproducible. A Gemini-backed provider can be added later by
 * implementing the same interface and swapping `activeProvider`.
 */
export type LLMRequest = {
  agentId: string;
  patientId: string;
  prompt: string;
  context: Record<string, unknown>;
};

export type LLMResponse = {
  text: string;
  latencyMs: number;
  provider: string;
};

export interface LLMProvider {
  name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
}

export const deterministicProvider: LLMProvider = {
  name: "synthetic-deterministic",
  async complete(request) {
    // Deterministic: no randomness, no network. Latency derived from agent id.
    const latencyMs = 600 + (request.agentId.length % 5) * 180;
    return {
      text: `[${request.agentId}] deterministic synthetic output for ${request.patientId}`,
      latencyMs,
      provider: deterministicProvider.name,
    };
  },
};

export let activeProvider: LLMProvider = deterministicProvider;

export function setLLMProvider(provider: LLMProvider) {
  activeProvider = provider;
}

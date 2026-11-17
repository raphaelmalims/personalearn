import {
  flushServerPostHog,
  getServerPostHog,
} from "@/lib/posthog-server";

export type AiRuntimeContext = {
  distinctId: string;
  sessionId: string;
  traceName: string;
};

export function aiTelemetry(functionId: string) {
  return {
    functionId,
    recordInputs: true,
    recordOutputs: true,
    includeRuntimeContext: {
      distinctId: true,
      sessionId: true,
      traceName: true,
    },
  };
}

export async function captureAiGeneration(input: {
  distinctId: string;
  traceId: string;
  sessionId: string | null;
  model: string;
  provider: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  output: string;
  latencySeconds: number;
}) {
  try {
    getServerPostHog()?.capture({
      distinctId: input.distinctId,
      event: "$ai_generation",
      properties: {
        $ai_trace_id: input.traceId,
        $ai_session_id: input.sessionId,
        $ai_model: input.model,
        $ai_provider: input.provider,
        $ai_input: input.messages,
        $ai_output_choices: [{ role: "assistant", content: input.output }],
        $ai_latency: input.latencySeconds,
      },
    });
    await flushServerPostHog();
  } catch {
    // Observability must not affect a completed LLM response.
  }
}

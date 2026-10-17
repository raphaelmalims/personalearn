import { APICallError } from "ai";
import * as Sentry from "@sentry/nextjs";
import type { ChatReasoningEffort, ChatThinking } from "@/lib/ai/env";

export type ChatReplyMetrics = {
  modelId: string;
  thinking: ChatThinking;
  effort: ChatReasoningEffort | null;
  reasoningTokens: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  timeToFirstReasoningMs: number | null;
  timeToFirstAnswerMs: number | null;
  totalLatencyMs: number;
};

type UsageLike = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  outputTokenDetails?: { reasoningTokens?: number | null };
  raw?: unknown;
};

/**
 * One structured line per Hub reply. Token counts and timings only —
 * never prompts, keys, or student data.
 */
export function logChatReply(metrics: ChatReplyMetrics) {
  console.info(
    JSON.stringify({
      event: "ai_hub_chat_reply",
      modelId: metrics.modelId,
      thinking: metrics.thinking,
      effort: metrics.effort,
      reasoningTokens: metrics.reasoningTokens,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      timeToFirstReasoningMs: metrics.timeToFirstReasoningMs,
      timeToFirstAnswerMs: metrics.timeToFirstAnswerMs,
      totalLatencyMs: metrics.totalLatencyMs,
    })
  );
}

export function logChatStreamError(error: unknown, modelId: string) {
  const { status, providerErrorCode } = readProviderError(error);
  const payload = {
    event: "ai_hub_chat_stream_error",
    modelId,
    status,
    providerErrorCode,
  };
  console.error(JSON.stringify(payload));
  try {
    Sentry.captureMessage(payload.event, {
      level: "error",
      tags: {
        modelId,
        status: status == null ? "unknown" : String(status),
        providerErrorCode:
          providerErrorCode == null ? "unknown" : String(providerErrorCode),
      },
    });
  } catch {
    // A logging failure must not replace the teacher-facing stream error.
  }
}

export function reasoningTokensFromUsage(usage: UsageLike | undefined): number | null {
  const raw = usage?.raw;
  if (isRecord(raw)) {
    const details = raw.completion_tokens_details;
    if (isRecord(details) && typeof details.reasoning_tokens === "number") {
      return details.reasoning_tokens;
    }
  }
  const mapped = usage?.outputTokenDetails?.reasoningTokens;
  return typeof mapped === "number" ? mapped : null;
}

/** Sum reasoning tokens from every tool step. The last step's raw usage is not the total. */
export function reasoningTokensFromSteps(
  steps: Array<{ usage?: UsageLike }> | undefined
): number | null {
  if (!steps?.length) return null;
  let total = 0;
  let seen = false;
  for (const step of steps) {
    const value = reasoningTokensFromUsage(step.usage);
    if (value == null) continue;
    total += value;
    seen = true;
  }
  return seen ? total : null;
}

export function createChatReplyTimer(now: () => number = Date.now) {
  const startedAt = now();
  let firstReasoningAt: number | null = null;
  let firstAnswerAt: number | null = null;

  return {
    noteChunk(chunk: { type: string }) {
      const at = now();
      if (chunk.type === "reasoning-delta" && firstReasoningAt == null) {
        firstReasoningAt = at;
      }
      if (chunk.type === "text-delta" && firstAnswerAt == null) {
        firstAnswerAt = at;
      }
    },
    reasoningDurationMs(at = now()): number | null {
      if (firstReasoningAt == null) return null;
      const end = firstAnswerAt ?? at;
      return Math.max(0, end - firstReasoningAt);
    },
    metrics(input: {
      modelId: string;
      thinking: ChatThinking;
      effort: ChatReasoningEffort | null;
      usage?: UsageLike;
      steps?: Array<{ usage?: UsageLike }>;
      at?: number;
    }): ChatReplyMetrics {
      const at = input.at ?? now();
      return {
        modelId: input.modelId,
        thinking: input.thinking,
        effort: input.thinking === "enabled" ? input.effort : null,
        reasoningTokens:
          reasoningTokensFromSteps(input.steps) ??
          reasoningTokensFromUsage(input.usage),
        promptTokens: numberOrNull(input.usage?.inputTokens),
        completionTokens: numberOrNull(input.usage?.outputTokens),
        timeToFirstReasoningMs: delta(startedAt, firstReasoningAt),
        timeToFirstAnswerMs: delta(startedAt, firstAnswerAt),
        totalLatencyMs: Math.max(0, at - startedAt),
      };
    },
  };
}

function readProviderError(error: unknown): {
  status: number | null;
  providerErrorCode: string | number | null;
} {
  if (!APICallError.isInstance(error)) {
    return { status: null, providerErrorCode: null };
  }
  let providerErrorCode: string | number | null = null;
  const data = error.data;
  if (isRecord(data) && isRecord(data.error)) {
    const code = data.error.code;
    if (typeof code === "string" || typeof code === "number") {
      providerErrorCode = code;
    }
  }
  return { status: error.statusCode ?? null, providerErrorCode };
}

function delta(start: number, end: number | null): number | null {
  if (end == null) return null;
  return Math.max(0, end - start);
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

import { describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";
import {
  createChatReplyTimer,
  logChatReply,
  logChatStreamError,
  reasoningTokensFromSteps,
  reasoningTokensFromUsage,
} from "./chat-telemetry";

describe("chat telemetry", () => {
  it("logs one reply line with reasoning tokens and timings", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    let clock = 1_000;
    const timer = createChatReplyTimer(() => clock);
    clock = 1_400;
    timer.noteChunk({ type: "reasoning-delta" });
    clock = 2_200;
    timer.noteChunk({ type: "text-delta" });
    clock = 3_000;

    const metrics = timer.metrics({
      modelId: "deepseek-flash",
      thinking: "enabled",
      effort: "low",
      usage: {
        inputTokens: 30,
        outputTokens: 18,
        raw: { completion_tokens_details: { reasoning_tokens: 11 } },
      },
    });

    logChatReply(metrics);
    const line = String(info.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;

    expect(parsed).toEqual({
      event: "ai_hub_chat_reply",
      modelId: "deepseek-flash",
      thinking: "enabled",
      effort: "low",
      reasoningTokens: 11,
      promptTokens: 30,
      completionTokens: 18,
      timeToFirstReasoningMs: 400,
      timeToFirstAnswerMs: 1200,
      totalLatencyMs: 2000,
    });
    expect(line).not.toMatch(/amina|api[_-]?key|sk-/i);
    expect(timer.reasoningDurationMs()).toBe(800);
    info.mockRestore();
  });

  it("sums reasoning tokens across steps instead of keeping the last step", () => {
    let clock = 0;
    const timer = createChatReplyTimer(() => clock);
    clock = 10;
    const metrics = timer.metrics({
      modelId: "deepseek-flash",
      thinking: "enabled",
      effort: "low",
      usage: {
        raw: { completion_tokens_details: { reasoning_tokens: 6 } },
      },
      steps: [
        { usage: { raw: { completion_tokens_details: { reasoning_tokens: 4 } } } },
        { usage: { outputTokenDetails: { reasoningTokens: 6 } } },
      ],
    });

    expect(metrics.reasoningTokens).toBe(10);
    expect(reasoningTokensFromSteps(undefined)).toBeNull();
  });

  it("reads mapped reasoning tokens when raw usage is absent", () => {
    expect(
      reasoningTokensFromUsage({
        outputTokenDetails: { reasoningTokens: 7 },
      })
    ).toBe(7);
  });

  it("logs stream errors without the request body", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new APICallError({
      message: "model not found",
      url: "https://api.deepseek.com/chat/completions",
      requestBodyValues: {
        messages: [{ role: "user", content: "Amina scored 12 on the quiz" }],
      },
      statusCode: 400,
      responseHeaders: undefined,
      responseBody: JSON.stringify({
        error: { code: "invalid_request_error", message: "model not found" },
      }),
      data: { error: { code: "invalid_request_error" } },
      isRetryable: false,
    });

    logChatStreamError(error, "deepseek-chat");
    const line = String(errorSpy.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toEqual({
      event: "ai_hub_chat_stream_error",
      modelId: "deepseek-chat",
      status: 400,
      providerErrorCode: "invalid_request_error",
    });
    expect(line).not.toContain("Amina");
    expect(line).not.toContain("scored");
    errorSpy.mockRestore();
  });
});

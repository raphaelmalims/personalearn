import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_CHAT_PROVIDER,
  DEFAULT_CHAT_REASONING_EFFORT,
  DEFAULT_CHAT_THINKING,
  DEFAULT_VOYAGE_MODEL,
  assertChatConfigured,
  getChatModelId,
  getChatProvider,
  getChatReasoningEffort,
  getChatThinking,
  getDeepSeekProviderOptions,
  getVoyageEmbeddingModel,
  requireChatApiKey,
  requireVoyageApiKey,
} from "./env";

const ENV_KEYS = [
  "VOYAGE_API_KEY",
  "VOYAGE_EMBEDDING_MODEL",
  "DEEPSEEK_API_KEY",
  "XAI_API_KEY",
  "CHAT_PROVIDER",
  "CHAT_MODEL",
  "CHAT_THINKING",
  "CHAT_REASONING_EFFORT",
] as const;

function clearAiEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("ai env", () => {
  afterEach(() => {
    clearAiEnv();
  });

  it("defaults voyage model and chat provider", () => {
    expect(getVoyageEmbeddingModel()).toBe(DEFAULT_VOYAGE_MODEL);
    expect(getChatProvider()).toBe(DEFAULT_CHAT_PROVIDER);
  });

  it("reads VOYAGE_EMBEDDING_MODEL and CHAT_PROVIDER", () => {
    process.env.VOYAGE_EMBEDDING_MODEL = "voyage-3.5";
    process.env.CHAT_PROVIDER = "xai";
    expect(getVoyageEmbeddingModel()).toBe("voyage-3.5");
    expect(getChatProvider()).toBe("xai");
  });

  it("treats grok as xai provider", () => {
    process.env.CHAT_PROVIDER = "grok";
    expect(getChatProvider()).toBe("xai");
  });

  it("throws when voyage key missing", () => {
    expect(() => requireVoyageApiKey()).toThrow(/VOYAGE_API_KEY/);
  });

  it("throws when deepseek key missing", () => {
    expect(() => requireChatApiKey("deepseek")).toThrow(/DEEPSEEK_API_KEY/);
  });

  it("throws when xai key missing", () => {
    expect(() => requireChatApiKey("xai")).toThrow(/XAI_API_KEY/);
  });

  it("assertChatConfigured fails without DEEPSEEK_API_KEY", () => {
    expect(() => assertChatConfigured()).toThrow(/DEEPSEEK_API_KEY/);
  });

  it("defaults the hub model, thinking, and effort", () => {
    expect(getChatModelId()).toBe(DEFAULT_CHAT_MODEL);
    expect(getChatThinking()).toBe(DEFAULT_CHAT_THINKING);
    expect(getChatReasoningEffort()).toBe(DEFAULT_CHAT_REASONING_EFFORT);
    expect(getDeepSeekProviderOptions()).toEqual({
      deepseek: {
        thinking: { type: "enabled" },
        reasoningEffort: "low",
      },
    });
  });

  it("reads CHAT_MODEL, CHAT_THINKING, and CHAT_REASONING_EFFORT", () => {
    process.env.CHAT_MODEL = "deepseek-flash";
    process.env.CHAT_THINKING = "disabled";
    process.env.CHAT_REASONING_EFFORT = "max";
    expect(getChatModelId()).toBe("deepseek-flash");
    expect(getChatThinking()).toBe("disabled");
    expect(getChatReasoningEffort()).toBe("max");
    expect(getDeepSeekProviderOptions()).toEqual({
      deepseek: {
        thinking: { type: "disabled" },
      },
    });
  });

  it("falls back and warns when thinking settings are invalid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    process.env.CHAT_THINKING = "sometimes";
    process.env.CHAT_REASONING_EFFORT = "medium";

    expect(getChatThinking()).toBe(DEFAULT_CHAT_THINKING);
    expect(getChatReasoningEffort()).toBe(DEFAULT_CHAT_REASONING_EFFORT);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls)).not.toContain("sometimes");

    warn.mockRestore();
  });
});

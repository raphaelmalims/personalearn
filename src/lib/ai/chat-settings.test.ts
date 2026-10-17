import { afterEach, describe, expect, it } from "vitest";
import {
  chatSettingsColumns,
  chatSettingsStorageKey,
  readStoredChatChoice,
  requestThinking,
  resolveChatSettings,
  resolveRequestChatSettings,
  writeStoredChatChoice,
  type ChatSettingsChoice,
} from "./chat-settings";

const defaults = {
  modelId: "deepseek-flash",
  thinking: "enabled" as const,
  effort: "low" as const,
};

describe("resolveChatSettings", () => {
  const envKeys = ["CHAT_MODEL", "CHAT_PROVIDER", "CHAT_THINKING", "CHAT_REASONING_EFFORT"];
  const previous = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of envKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    previous.clear();
  });

  function setEnv(key: string, value: string | undefined) {
    if (!previous.has(key)) previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it("accepts deepseek-flash with thinking off and medium effort", () => {
    const settings = resolveChatSettings(
      { modelId: "deepseek-flash", thinking: "disabled", effort: "medium" },
      defaults
    );

    expect(settings).toMatchObject({
      modelId: "deepseek-flash",
      provider: "deepseek",
      label: "DeepSeek Flash",
      thinking: "disabled",
      effort: "medium",
      apiEffort: "high",
    });
    expect(chatSettingsColumns(settings)).toEqual({
      chat_model: "deepseek-flash",
      chat_thinking: "disabled",
      chat_reasoning_effort: "medium",
    });
  });

  it("accepts the xAI chat model and does not send DeepSeek thinking", () => {
    const settings = resolveChatSettings(
      { modelId: "grok-3-mini", thinking: "enabled", effort: "high" },
      defaults
    );

    expect(settings.provider).toBe("xai");
    expect(settings.label).toBe("Grok 3 Mini");
    expect(requestThinking(settings)).toBe("disabled");
  });

  it("falls back to the supplied defaults on bad input", () => {
    const settings = resolveChatSettings(
      { modelId: "gpt-4", thinking: "sometimes", effort: "ultra" },
      { modelId: "grok-3-mini", thinking: "disabled", effort: "max" }
    );

    expect(settings).toMatchObject({
      modelId: "grok-3-mini",
      provider: "xai",
      thinking: "disabled",
      effort: "max",
      apiEffort: "max",
    });
  });

  it("falls back to env defaults when the request omits a choice", () => {
    setEnv("CHAT_PROVIDER", "deepseek");
    setEnv("CHAT_MODEL", "deepseek-v4-flash");
    setEnv("CHAT_THINKING", "disabled");
    setEnv("CHAT_REASONING_EFFORT", "high");

    const settings = resolveRequestChatSettings({
      modelId: "not-a-model",
      thinking: "yes",
      effort: "",
    });

    expect(settings).toMatchObject({
      modelId: "deepseek-v4-flash",
      provider: "deepseek",
      thinking: "disabled",
      effort: "high",
      apiEffort: "high",
    });
  });

  it("persists a choice in storage and reads it back", () => {
    const storage = new Map<string, string>();
    const memory = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    const key = chatSettingsStorageKey("class-1", null);
    const choice: ChatSettingsChoice = {
      modelId: "deepseek-flash",
      thinking: "enabled",
      effort: "medium",
    };

    writeStoredChatChoice(memory, key, choice);
    expect(readStoredChatChoice(memory, key)).toEqual(choice);
    expect(readStoredChatChoice(memory, chatSettingsStorageKey("class-1", "conv-2"))).toBeNull();
    writeStoredChatChoice(memory, key, choice);
    storage.set(key, "{");
    expect(readStoredChatChoice(memory, key)).toBeNull();
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  chatSettingsColumns,
  chatSettingsStorageKey,
  formatAnsweredWith,
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

  it("maps a stored medium effort to high without a schema change", () => {
    const settings = resolveChatSettings(
      { thinking: "disabled", effort: "medium" },
      defaults
    );

    expect(settings).toMatchObject({
      modelId: "deepseek-flash",
      provider: "deepseek",
      label: "DeepSeek Flash",
      thinking: "disabled",
      effort: "high",
      apiEffort: "high",
    });
    expect(chatSettingsColumns(settings)).toEqual({
      chat_model: "deepseek-flash",
      chat_thinking: "disabled",
      chat_reasoning_effort: "high",
    });
  });

  it("ignores a requested model and stays on the DeepSeek default", () => {
    const settings = resolveChatSettings(
      { thinking: "enabled", effort: "high" },
      defaults
    );

    expect(settings.modelId).toBe("deepseek-flash");
    expect(settings.provider).toBe("deepseek");
    expect(requestThinking(settings)).toBe("enabled");
  });

  it("falls back to the supplied defaults on bad input", () => {
    const settings = resolveChatSettings(
      { thinking: "sometimes", effort: "ultra" },
      { modelId: "deepseek-v4-flash", thinking: "disabled", effort: "max" }
    );

    expect(settings).toMatchObject({
      modelId: "deepseek-v4-flash",
      provider: "deepseek",
      thinking: "disabled",
      effort: "max",
      apiEffort: "max",
    });
  });

  it("uses the DeepSeek env model even when the provider env is xAI", () => {
    setEnv("CHAT_PROVIDER", "xai");
    setEnv("CHAT_MODEL", undefined);

    const settings = resolveRequestChatSettings({
      thinking: "enabled",
      effort: "low",
    });

    expect(settings).toMatchObject({
      modelId: "deepseek-flash",
      provider: "deepseek",
      thinking: "enabled",
      effort: "low",
    });
  });

  it("falls back to env defaults when the request omits a choice", () => {
    setEnv("CHAT_PROVIDER", "xai");
    setEnv("CHAT_MODEL", "deepseek-v4-flash");
    setEnv("CHAT_THINKING", "disabled");
    setEnv("CHAT_REASONING_EFFORT", "high");

    const settings = resolveRequestChatSettings({
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

  it("persists a choice in storage and reads medium as high", () => {
    const storage = new Map<string, string>();
    const memory = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    const key = chatSettingsStorageKey("class-1", null);
    const choice: ChatSettingsChoice = {
      thinking: "enabled",
      effort: "high",
    };

    writeStoredChatChoice(memory, key, choice);
    expect(readStoredChatChoice(memory, key)).toEqual(choice);
    expect(readStoredChatChoice(memory, chatSettingsStorageKey("class-1", "conv-2"))).toBeNull();
    storage.set(
      key,
      JSON.stringify({ ...choice, effort: "medium" })
    );
    expect(readStoredChatChoice(memory, key)).toEqual(choice);
    storage.set(key, "{");
    expect(readStoredChatChoice(memory, key)).toBeNull();
  });

  it("shows effort on a reply without the model name", () => {
    expect(
      formatAnsweredWith({
        modelId: "deepseek-flash",
        thinking: "enabled",
        effort: "medium",
      })
    ).toEqual({ label: "High", title: "Thinking · High" });
    expect(
      formatAnsweredWith({
        modelId: "grok-3-mini",
        thinking: "disabled",
        effort: null,
      })
    ).toEqual({ label: "Off", title: "Thinking off" });
    expect(
      formatAnsweredWith({
        modelId: "deepseek-flash",
        thinking: null,
        effort: "low",
      })
    ).toBeNull();
  });
});

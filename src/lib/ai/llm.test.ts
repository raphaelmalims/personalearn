import { afterEach, describe, expect, it } from "vitest";
import { getChatModelForProvider } from "./llm";

const ENV_KEYS = ["DEEPSEEK_API_KEY", "XAI_API_KEY", "CHAT_MODEL"] as const;

function clearEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("llm", () => {
  afterEach(() => {
    clearEnv();
  });

  it("constructs deepseek model when key is set", () => {
    process.env.DEEPSEEK_API_KEY = "ds-key";
    const model = getChatModelForProvider("deepseek");
    expect(model).toBeDefined();
    expect((model as { modelId?: string }).modelId).toBe("deepseek-flash");
  });

  it("reads CHAT_MODEL for the deepseek model id", () => {
    process.env.DEEPSEEK_API_KEY = "ds-key";
    process.env.CHAT_MODEL = "deepseek-v4-flash";
    const model = getChatModelForProvider("deepseek");
    expect((model as { modelId?: string }).modelId).toBe("deepseek-v4-flash");
  });

  it("constructs xai model when key is set", () => {
    process.env.XAI_API_KEY = "xai-key";
    const model = getChatModelForProvider("xai");
    expect(model).toBeDefined();
    expect((model as { modelId?: string }).modelId).toBe("grok-3-mini");
  });
});

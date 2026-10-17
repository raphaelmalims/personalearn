import { afterEach, describe, expect, it, vi } from "vitest";
import type { LanguageModelV4Prompt } from "@ai-sdk/provider";
import { patchDeepSeekChatBody } from "./deepseek-request";
import { getChatModelForProvider } from "./llm";

const priorToolPrompt: LanguageModelV4Prompt = [
  {
    role: "user",
    content: [{ type: "text", text: "List my students" }],
  },
  {
    role: "assistant",
    content: [
      { type: "reasoning", text: "I should call the roster tool." },
      { type: "text", text: "Checking the roster." },
      {
        type: "tool-call",
        toolCallId: "call-1",
        toolName: "list_students",
        input: {},
      },
    ],
  },
  {
    role: "tool",
    content: [
      {
        type: "tool-result",
        toolCallId: "call-1",
        toolName: "list_students",
        output: { type: "text", value: "Amina" },
      },
    ],
  },
  {
    role: "user",
    content: [{ type: "text", text: "Thanks" }],
  },
];

describe("patchDeepSeekChatBody", () => {
  it("sets thinking and effort and drops unsupported thinking-mode params", () => {
    const body = patchDeepSeekChatBody(
      {
        model: "deepseek-flash",
        temperature: 0.7,
        presence_penalty: 0.2,
        frequency_penalty: 0.1,
        top_p: 0.5,
        messages: [{ role: "user", content: "Hi" }],
      },
      { settings: { thinking: "enabled", reasoningEffort: "low" } }
    );

    expect(body.thinking).toEqual({ type: "enabled" });
    expect(body.reasoning_effort).toBe("low");
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("presence_penalty");
    expect(body).not.toHaveProperty("frequency_penalty");
    expect(body).not.toHaveProperty("top_p");
  });

  it("keeps top_p when it is inside 0.95–1", () => {
    const body = patchDeepSeekChatBody(
      { top_p: 0.97, messages: [] },
      { settings: { thinking: "enabled", reasoningEffort: "high" } }
    );
    expect(body.top_p).toBe(0.97);
    expect(body.reasoning_effort).toBe("high");
  });

  it("keeps an explicit disabled flag instead of the env default", () => {
    const body = patchDeepSeekChatBody(
      {
        thinking: { type: "disabled" },
        reasoning_effort: "low",
        messages: [],
      },
      { settings: { thinking: "enabled", reasoningEffort: "max" } }
    );

    expect(body.thinking).toEqual({ type: "disabled" });
    expect(body).not.toHaveProperty("reasoning_effort");
  });

  it("disables thinking without reasoning_content or effort", () => {
    const body = patchDeepSeekChatBody(
      {
        reasoning_effort: "high",
        messages: [
          {
            role: "assistant",
            content: "Answer",
            reasoning_content: "secret chain",
          },
        ],
      },
      {
        settings: { thinking: "disabled", reasoningEffort: "low" },
        prompt: priorToolPrompt,
      }
    );

    expect(body.thinking).toEqual({ type: "disabled" });
    expect(body).not.toHaveProperty("reasoning_effort");
    const assistant = (body.messages as Array<Record<string, unknown>>)[0];
    expect(assistant).not.toHaveProperty("reasoning_content");
  });

  it("puts prior assistant reasoning_content back on tool turns", () => {
    const body = patchDeepSeekChatBody(
      {
        model: "deepseek-flash",
        messages: [
          { role: "user", content: "List my students" },
          {
            role: "assistant",
            content: "Checking the roster.",
            tool_calls: [{ id: "call-1" }],
          },
          { role: "tool", tool_call_id: "call-1", content: "Amina" },
          { role: "user", content: "Thanks" },
        ],
      },
      {
        settings: { thinking: "enabled", reasoningEffort: "low" },
        prompt: priorToolPrompt,
      }
    );

    const assistant = (body.messages as Array<Record<string, unknown>>).find(
      (message) => message.role === "assistant"
    );
    expect(assistant?.reasoning_content).toBe("I should call the roster tool.");
  });
});

describe("deepseek outgoing request", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.CHAT_MODEL;
    delete process.env.CHAT_THINKING;
    delete process.env.CHAT_REASONING_EFFORT;
  });

  it("sends thinking, effort, and prior reasoning_content", async () => {
    process.env.DEEPSEEK_API_KEY = "ds-test-key";
    process.env.CHAT_MODEL = "deepseek-flash";
    process.env.CHAT_THINKING = "enabled";
    process.env.CHAT_REASONING_EFFORT = "low";

    const captured: { body: Record<string, unknown> | null } = { body: null };
    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          id: "cmpl",
          model: "deepseek-flash",
          choices: [
            {
              message: { role: "assistant", content: "ok" },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 4,
            completion_tokens_details: { reasoning_tokens: 2 },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const model = getChatModelForProvider("deepseek") as unknown as {
      doGenerate: (options: {
        prompt: LanguageModelV4Prompt;
        temperature?: number;
        topP?: number;
        presencePenalty?: number;
        frequencyPenalty?: number;
        providerOptions?: Record<string, unknown>;
      }) => Promise<unknown>;
    };
    await model.doGenerate({
      prompt: priorToolPrompt,
      temperature: 0.2,
      topP: 0.2,
      presencePenalty: 0.4,
      frequencyPenalty: 0.4,
      providerOptions: {
        deepseek: {
          thinking: { type: "enabled" },
          reasoningEffort: "low",
        },
      },
    });

    expect(captured.body).not.toBeNull();
    expect(captured.body?.model).toBe("deepseek-flash");
    expect(captured.body?.thinking).toEqual({ type: "enabled" });
    expect(captured.body?.reasoning_effort).toBe("low");
    expect(captured.body).not.toHaveProperty("temperature");
    expect(captured.body).not.toHaveProperty("presence_penalty");
    expect(captured.body).not.toHaveProperty("frequency_penalty");
    expect(captured.body).not.toHaveProperty("top_p");
    const assistant = (captured.body?.messages as Array<Record<string, unknown>>).find(
      (message) => message.role === "assistant"
    );
    expect(assistant?.reasoning_content).toBe("I should call the roster tool.");
    expect(JSON.stringify(captured.body)).not.toContain("ds-test-key");
  });
});

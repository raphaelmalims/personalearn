import type { LanguageModelV4Prompt } from "@ai-sdk/provider";
import {
  getDeepSeekThinkingSettings,
  type ChatReasoningEffort,
  type ChatThinking,
  type DeepSeekThinkingSettings,
} from "@/lib/ai/env";

type ChatBody = Record<string, unknown>;

const EFFORTS = new Set<ChatReasoningEffort>(["low", "high", "max"]);

/**
 * @ai-sdk/deepseek@3.0.2 forwards `thinking` and `reasoningEffort` via
 * provider options, but it only keeps prior-turn `reasoning_content` when the
 * model id contains "deepseek-v4". `deepseek-flash` is a V4 alias, so tool
 * turns would 400. This patches the outgoing JSON body.
 */
export function patchDeepSeekChatBody(
  body: ChatBody,
  options?: {
    settings?: DeepSeekThinkingSettings;
    prompt?: LanguageModelV4Prompt | null;
  }
): ChatBody {
  const settings = options?.settings ?? getDeepSeekThinkingSettings();
  const next: ChatBody = { ...body };
  const thinking = resolveThinking(next.thinking, settings.thinking);
  next.thinking = { type: thinking };

  if (thinking === "disabled") {
    delete next.reasoning_effort;
    next.messages = stripReasoningContent(next.messages);
    return next;
  }

  next.reasoning_effort = resolveEffort(next.reasoning_effort, settings.reasoningEffort);
  delete next.temperature;
  delete next.presence_penalty;
  delete next.frequency_penalty;
  if (!isAllowedTopP(next.top_p)) {
    delete next.top_p;
  }
  next.messages = applyReasoningContent(next.messages, options?.prompt ?? null);
  return next;
}

export function patchDeepSeekFetchInit(
  init: RequestInit | undefined,
  prompt: LanguageModelV4Prompt | null,
  settings?: DeepSeekThinkingSettings
): RequestInit | undefined {
  if (!init?.body || typeof init.body !== "string") {
    return init;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(init.body);
  } catch {
    return init;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return init;
  }

  const patched = patchDeepSeekChatBody(parsed as ChatBody, { settings, prompt });
  return { ...init, body: JSON.stringify(patched) };
}

function resolveThinking(value: unknown, fallback: ChatThinking): ChatThinking {
  if (!value || typeof value !== "object") return fallback;
  const type = (value as { type?: unknown }).type;
  if (type === "enabled" || type === "disabled") return type;
  return fallback;
}

function resolveEffort(value: unknown, fallback: ChatReasoningEffort): ChatReasoningEffort {
  if (value === "medium") return "high";
  if (value === "xhigh") return "max";
  if (typeof value === "string" && EFFORTS.has(value as ChatReasoningEffort)) {
    return value as ChatReasoningEffort;
  }
  return fallback;
}

function isAllowedTopP(value: unknown): value is number {
  return typeof value === "number" && value >= 0.95 && value <= 1;
}

function stripReasoningContent(messages: unknown): unknown {
  if (!Array.isArray(messages)) return messages;
  return messages.map((message) => {
    if (!isRecord(message) || message.role !== "assistant") return message;
    const copy = { ...message };
    delete copy.reasoning_content;
    return copy;
  });
}

function applyReasoningContent(
  messages: unknown,
  prompt: LanguageModelV4Prompt | null
): unknown {
  if (!Array.isArray(messages)) return messages;
  const promptAssistants = (prompt ?? []).filter((message) => message.role === "assistant");
  let assistantIndex = 0;

  return messages.map((message) => {
    if (!isRecord(message) || message.role !== "assistant") return message;
    const source = promptAssistants[assistantIndex];
    assistantIndex += 1;
    const fromPrompt = source ? reasoningText(source.content) : "";
    const existing =
      typeof message.reasoning_content === "string" ? message.reasoning_content : "";
    return {
      ...message,
      reasoning_content: fromPrompt || existing,
    };
  });
}

function reasoningText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => isRecord(part) && part.type === "reasoning")
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

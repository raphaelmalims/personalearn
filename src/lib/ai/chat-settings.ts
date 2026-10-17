import {
  getChatModelId,
  getChatReasoningEffort,
  getChatThinking,
  type ChatProvider,
  type ChatReasoningEffort,
  type ChatThinking,
} from "@/lib/ai/env";

export const XAI_CHAT_MODEL_ID = "grok-3-mini";
export const DEEPSEEK_CHAT_MODEL_ID = "deepseek-flash";

export const PICKER_EFFORTS = ["low", "high"] as const;

export type PickerEffort = (typeof PICKER_EFFORTS)[number];
export type ChatEffortChoice = PickerEffort | "max";

export type ChatSettingsInput = {
  thinking?: unknown;
  effort?: unknown;
};

export type ChatSettingsDefaults = {
  modelId: string;
  thinking: ChatThinking;
  effort: ChatReasoningEffort;
};

export type ResolvedChatSettings = {
  modelId: string;
  provider: ChatProvider;
  label: string;
  thinking: ChatThinking;
  effort: ChatEffortChoice;
  apiEffort: ChatReasoningEffort;
};

export type ChatSettingsChoice = {
  thinking: ChatThinking;
  effort: ChatEffortChoice;
};

const EFFORT_LABELS: Record<ChatEffortChoice, string> = {
  low: "Low",
  high: "High",
  max: "Max",
};

/** Stored "medium" is the same DeepSeek request as high. No schema change. */
export function normalizeStoredEffort(value: unknown): ChatEffortChoice | null {
  if (value === "medium" || value === "high") return "high";
  if (value === "low" || value === "max") return value;
  return null;
}

export const FALLBACK_CHAT_SETTINGS: ResolvedChatSettings = {
  modelId: DEEPSEEK_CHAT_MODEL_ID,
  provider: "deepseek",
  label: "DeepSeek Flash",
  thinking: "enabled",
  effort: "low",
  apiEffort: "low",
};

export function envChatSettingsDefaults(): ChatSettingsDefaults {
  return {
    modelId: getChatModelId(),
    thinking: getChatThinking(),
    effort: getChatReasoningEffort(),
  };
}

/** Validate a composer choice. The model is always the DeepSeek env default. */
export function resolveChatSettings(
  input: ChatSettingsInput | null | undefined,
  defaults: ChatSettingsDefaults = envChatSettingsDefaults()
): ResolvedChatSettings {
  const model = describeDeepSeekModel(defaults.modelId);
  const thinking = resolveThinking(input?.thinking, defaults.thinking);
  const effort = resolveEffortChoice(input?.effort, defaults.effort);
  return {
    modelId: model.id,
    provider: model.provider,
    label: model.label,
    thinking,
    effort,
    apiEffort: effort,
  };
}

export function resolveRequestChatSettings(
  input: ChatSettingsInput | null | undefined
): ResolvedChatSettings {
  return resolveChatSettings(input, envChatSettingsDefaults());
}

/** DeepSeek is the only Hub model that takes thinking params. */
export function requestThinking(settings: ResolvedChatSettings): ChatThinking {
  return settings.provider === "deepseek" ? settings.thinking : "disabled";
}

export function chatSettingsColumns(settings: ResolvedChatSettings) {
  return {
    chat_model: settings.modelId,
    chat_thinking: settings.thinking,
    chat_reasoning_effort: settings.effort,
  };
}

export function effortLabel(effort: string | null | undefined): string | null {
  const normalized = normalizeStoredEffort(effort);
  return normalized ? EFFORT_LABELS[normalized] : null;
}

/** Subtle mode note. Effort only — the model id stays in storage, not in the label. */
export function formatAnsweredWith(meta: {
  modelId: string | null;
  thinking: string | null;
  effort: string | null;
}): { label: string; title: string } | null {
  if (meta.thinking === "enabled") {
    const effort = effortLabel(meta.effort);
    return {
      label: effort ?? "On",
      title: effort ? `Thinking · ${effort}` : "Thinking",
    };
  }
  if (meta.thinking === "disabled") {
    return { label: "Off", title: "Thinking off" };
  }
  return null;
}

export function chatSettingsStorageKey(
  classId: string,
  conversationId: string | null
) {
  return `pl-hub-chat-settings:${classId}:${conversationId ?? "new"}`;
}

export function readStoredChatChoice(
  storage: Pick<Storage, "getItem">,
  key: string
): ChatSettingsChoice | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChatSettingsChoice>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.thinking !== "enabled" && parsed.thinking !== "disabled") {
      return null;
    }
    const effort = normalizeStoredEffort(parsed.effort);
    if (!effort) return null;
    return {
      thinking: parsed.thinking,
      effort,
    };
  } catch {
    return null;
  }
}

export function writeStoredChatChoice(
  storage: Pick<Storage, "setItem">,
  key: string,
  choice: ChatSettingsChoice
) {
  storage.setItem(
    key,
    JSON.stringify({
      thinking: choice.thinking,
      effort: choice.effort,
    })
  );
}

function describeDeepSeekModel(modelId: string) {
  return {
    id: modelId,
    label: modelId === DEEPSEEK_CHAT_MODEL_ID ? "DeepSeek Flash" : modelId,
    provider: "deepseek" as const,
  };
}

function resolveThinking(value: unknown, fallback: ChatThinking): ChatThinking {
  if (value === "enabled" || value === "disabled") return value;
  return fallback;
}

function resolveEffortChoice(
  value: unknown,
  fallback: ChatReasoningEffort
): ChatEffortChoice {
  return normalizeStoredEffort(value) ?? normalizeStoredEffort(fallback) ?? "low";
}

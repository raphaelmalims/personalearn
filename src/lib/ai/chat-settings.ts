import {
  getChatModelId,
  getChatProvider,
  getChatReasoningEffort,
  getChatThinking,
  type ChatProvider,
  type ChatReasoningEffort,
  type ChatThinking,
} from "@/lib/ai/env";

export const XAI_CHAT_MODEL_ID = "grok-3-mini";
export const DEEPSEEK_CHAT_MODEL_ID = "deepseek-flash";

export const CHAT_MODEL_OPTIONS = [
  {
    id: DEEPSEEK_CHAT_MODEL_ID,
    label: "DeepSeek Flash",
    provider: "deepseek",
  },
  {
    id: XAI_CHAT_MODEL_ID,
    label: "Grok 3 Mini",
    provider: "xai",
  },
] as const;

export const PICKER_EFFORTS = ["low", "medium", "high"] as const;

export type PickerEffort = (typeof PICKER_EFFORTS)[number];
export type ChatEffortChoice = PickerEffort | "max";

export type ChatSettingsInput = {
  modelId?: unknown;
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
  modelId: string;
  thinking: ChatThinking;
  effort: ChatEffortChoice;
};

const EFFORT_LABELS: Record<ChatEffortChoice, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  max: "Max",
};

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
    modelId: getChatProvider() === "xai" ? XAI_CHAT_MODEL_ID : getChatModelId(),
    thinking: getChatThinking(),
    effort: getChatReasoningEffort(),
  };
}

/** Validate a composer choice. Unknown values fall back to env defaults. */
export function resolveChatSettings(
  input: ChatSettingsInput | null | undefined,
  defaults: ChatSettingsDefaults = envChatSettingsDefaults()
): ResolvedChatSettings {
  const model = resolveModel(input?.modelId, defaults.modelId);
  const thinking = resolveThinking(input?.thinking, defaults.thinking);
  const effort = resolveEffortChoice(input?.effort, defaults.effort);
  return {
    modelId: model.id,
    provider: model.provider,
    label: model.label,
    thinking,
    effort,
    apiEffort: effort === "medium" ? "high" : effort,
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

export function modelLabel(modelId: string): string {
  return CHAT_MODEL_OPTIONS.find((option) => option.id === modelId)?.label ?? modelId;
}

export function effortLabel(effort: string | null | undefined): string | null {
  if (
    effort === "low" ||
    effort === "medium" ||
    effort === "high" ||
    effort === "max"
  ) {
    return EFFORT_LABELS[effort];
  }
  return null;
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
    if (typeof parsed.modelId !== "string" || parsed.modelId.length === 0) {
      return null;
    }
    if (parsed.thinking !== "enabled" && parsed.thinking !== "disabled") {
      return null;
    }
    if (
      parsed.effort !== "low" &&
      parsed.effort !== "medium" &&
      parsed.effort !== "high" &&
      parsed.effort !== "max"
    ) {
      return null;
    }
    return {
      modelId: parsed.modelId,
      thinking: parsed.thinking,
      effort: parsed.effort,
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
      modelId: choice.modelId,
      thinking: choice.thinking,
      effort: choice.effort,
    })
  );
}

function resolveModel(value: unknown, fallbackId: string) {
  const known = CHAT_MODEL_OPTIONS.find((option) => option.id === value);
  if (known) return known;
  return describeModel(fallbackId);
}

function describeModel(modelId: string) {
  const known = CHAT_MODEL_OPTIONS.find((option) => option.id === modelId);
  if (known) return known;
  const provider: ChatProvider = modelId.startsWith("grok") ? "xai" : "deepseek";
  return { id: modelId, label: modelId, provider };
}

function resolveThinking(value: unknown, fallback: ChatThinking): ChatThinking {
  if (value === "enabled" || value === "disabled") return value;
  return fallback;
}

function resolveEffortChoice(
  value: unknown,
  fallback: ChatReasoningEffort
): ChatEffortChoice {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "max"
  ) {
    return value;
  }
  return fallback;
}

import { createDeepSeek } from "@ai-sdk/deepseek";
import type { LanguageModelV4Prompt } from "@ai-sdk/provider";
import { createXai } from "@ai-sdk/xai";
import { type LanguageModel } from "ai";
import { patchDeepSeekFetchInit } from "@/lib/ai/deepseek-request";
import { XAI_CHAT_MODEL_ID } from "@/lib/ai/chat-settings";
import {
  getChatModelId,
  getChatProvider,
  getDeepSeekThinkingSettings,
  requireChatApiKey,
  type ChatProvider,
  type ChatReasoningEffort,
  type ChatThinking,
  type DeepSeekThinkingSettings,
} from "@/lib/ai/env";

const XAI_VISION_MODEL = "grok-4.3";

export function getActiveChatModelId(provider: ChatProvider = getChatProvider()): string {
  return provider === "xai" ? XAI_CHAT_MODEL_ID : getChatModelId();
}

export function getChatModelForProvider(provider: ChatProvider): LanguageModel {
  const apiKey = requireChatApiKey(provider);

  if (provider === "xai") {
    return createXai({ apiKey })(XAI_CHAT_MODEL_ID);
  }

  return createDeepSeekChatModel(apiKey, getChatModelId());
}

export function getChatModelForSettings(settings: {
  provider: ChatProvider;
  modelId: string;
  thinking: ChatThinking;
  reasoningEffort: ChatReasoningEffort;
}): LanguageModel {
  const apiKey = requireChatApiKey(settings.provider);
  if (settings.provider === "xai") {
    return createXai({ apiKey })(settings.modelId);
  }
  return createDeepSeekChatModel(apiKey, settings.modelId, {
    thinking: settings.thinking,
    reasoningEffort: settings.reasoningEffort,
  });
}

export function getChatModel(): LanguageModel {
  return getChatModelForProvider(getChatProvider());
}

/** Vision-capable model for image text extraction in chat. Uses xAI. */
export function getVisionExtractionModel(): LanguageModel {
  const apiKey = requireChatApiKey("xai");
  return createXai({ apiKey })(XAI_VISION_MODEL);
}

/**
 * DeepSeek chat model whose outgoing body always carries explicit thinking
 * settings and prior-turn reasoning_content. xAI is not wrapped.
 */
function createDeepSeekChatModel(
  apiKey: string,
  modelId: string,
  settings?: DeepSeekThinkingSettings
): LanguageModel {
  let activePrompt: LanguageModelV4Prompt | null = null;
  const thinking = settings ?? getDeepSeekThinkingSettings();
  const model = createDeepSeek({
    apiKey,
    fetch: async (input, init) => {
      const patched = patchDeepSeekFetchInit(init, activePrompt, thinking);
      return fetch(input, patched);
    },
  })(modelId);

  const doGenerate = model.doGenerate.bind(model);
  const doStream = model.doStream.bind(model);

  model.doGenerate = async (options) => {
    activePrompt = options.prompt;
    try {
      return await doGenerate(options);
    } finally {
      activePrompt = null;
    }
  };
  model.doStream = async (options) => {
    activePrompt = options.prompt;
    try {
      return await doStream(options);
    } finally {
      activePrompt = null;
    }
  };

  return model;
}

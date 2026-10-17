"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  CHAT_MODEL_OPTIONS,
  FALLBACK_CHAT_SETTINGS,
  chatSettingsStorageKey,
  readStoredChatChoice,
  resolveChatSettings,
  writeStoredChatChoice,
  type ChatSettingsChoice,
  type ChatSettingsInput,
  type ResolvedChatSettings,
} from "@/lib/ai/chat-settings";
import type { ConversationRow } from "@/lib/ai-hub/conversations";
import { conversationsQueryKey } from "@/lib/hooks/use-conversations";

type ChatSettingsResponse = {
  settings?: ResolvedChatSettings;
  error?: string;
};

async function fetchChatSettings(): Promise<ResolvedChatSettings> {
  const response = await fetch("/api/ai-hub/chat-settings");
  const payload = (await response.json()) as ChatSettingsResponse;
  if (!response.ok || !payload.settings) {
    throw new Error(payload.error ?? "Failed to load chat settings");
  }
  return payload.settings;
}

export function useHubChatSettings(input: {
  classId: string | undefined;
  conversationId: string | null;
  conversation: ConversationRow | null;
}) {
  const queryClient = useQueryClient();
  const defaultsQuery = useQuery({
    queryKey: ["ai-hub-chat-settings"],
    queryFn: fetchChatSettings,
    staleTime: 5 * 60 * 1000,
  });
  const defaults = defaultsQuery.data ?? FALLBACK_CHAT_SETTINGS;
  const [override, setOverride] = useState<ChatSettingsInput | null>(null);

  const dbModel = input.conversation?.chat_model ?? null;
  const dbThinking = input.conversation?.chat_thinking ?? null;
  const dbEffort = input.conversation?.chat_reasoning_effort ?? null;

  useEffect(() => {
    if (!input.classId || typeof window === "undefined") return;
    const key = chatSettingsStorageKey(input.classId, input.conversationId);
    const fromDb =
      dbModel || dbThinking || dbEffort
        ? {
            modelId: dbModel ?? "",
            thinking: dbThinking ?? "",
            effort: dbEffort ?? "",
          }
        : null;
    const fromSession = readStoredChatChoice(window.sessionStorage, key);
    setOverride(fromDb ?? fromSession);
  }, [input.classId, input.conversationId, dbModel, dbThinking, dbEffort]);

  const settings = resolveChatSettings(override, {
    modelId: defaults.modelId,
    thinking: defaults.thinking,
    effort: defaults.effort,
  });
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  function onChange(choice: ChatSettingsChoice) {
    const resolved = resolveChatSettings(choice, {
      modelId: defaults.modelId,
      thinking: defaults.thinking,
      effort: defaults.effort,
    });
    const stored: ChatSettingsChoice = {
      modelId: resolved.modelId,
      thinking: resolved.thinking,
      effort: resolved.effort,
    };
    setOverride(stored);
    if (input.classId && typeof window !== "undefined") {
      writeStoredChatChoice(
        window.sessionStorage,
        chatSettingsStorageKey(input.classId, input.conversationId),
        stored
      );
    }
    if (!input.classId || !input.conversationId) return;

    queryClient.setQueryData<ConversationRow[]>(
      conversationsQueryKey(input.classId),
      (list) =>
        (list ?? []).map((row) =>
          row.id === input.conversationId
            ? {
                ...row,
                chat_model: stored.modelId,
                chat_thinking: stored.thinking,
                chat_reasoning_effort: stored.effort,
              }
            : row
        )
    );

    void fetch(`/api/ai-hub/conversations/${input.conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatModel: stored.modelId,
        chatThinking: stored.thinking,
        chatReasoningEffort: stored.effort,
      }),
    });
  }

  return {
    settings,
    settingsRef,
    models: CHAT_MODEL_OPTIONS,
    onChange,
  };
}

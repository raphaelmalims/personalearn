import type { UIMessage } from "ai";
import {
  getMessageReasoning,
  getMessageText,
  getVisibleDrafts,
  getVisibleEvalSessions,
} from "@/lib/ai-hub/message-content";

export function hasAssistantStreamToken(
  message: Pick<UIMessage, "role" | "parts"> | undefined
): boolean {
  if (!message || message.role !== "assistant") return false;
  if (getMessageReasoning(message).trim()) return true;
  if (getMessageText(message).trim()) return true;
  if (getVisibleDrafts(message).length > 0) return true;
  if (getVisibleEvalSessions(message).length > 0) return true;
  return false;
}

/** Waveform pill until the first reasoning or answer token is on screen. */
export function shouldShowThinkingBubble(
  isGenerating: boolean,
  streamingAssistant: Pick<UIMessage, "role" | "parts"> | undefined
): boolean {
  if (!isGenerating) return false;
  return !hasAssistantStreamToken(streamingAssistant);
}

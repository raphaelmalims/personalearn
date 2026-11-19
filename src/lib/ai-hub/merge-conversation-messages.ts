import type { UIMessage } from "ai";
import { getAssistantDisplayBlocks, getMessageText } from "@/lib/ai-hub/message-content";

function classInsightsKey(message: UIMessage): string | null {
  const block = getAssistantDisplayBlocks(message).find(
    (item) => item.type === "class_insights"
  );
  if (!block || block.type !== "class_insights") return null;
  return block.view.reviewPath || `scripts:${block.view.scriptCount}`;
}

function sameRenderedText(current: UIMessage[], incoming: UIMessage): boolean {
  const text = getMessageText(incoming).replace(/\s+/g, " ").trim();
  if (!text) return false;
  return current.some(
    (message) =>
      message.role === incoming.role &&
      getMessageText(message).replace(/\s+/g, " ").trim() === text
  );
}

/**
 * Append one realtime row to the messages already on screen.
 * The same id, the same class-insights card, or the same visible text is not added again.
 * Plain echoes that arrive while the teacher is still streaming are ignored.
 * A class insights card is not an echo: it is inserted by marking, not by the stream.
 */
export function mergeIncomingConversationMessage(
  current: UIMessage[],
  incoming: UIMessage,
  options?: { streaming?: boolean }
): UIMessage[] {
  if (current.some((message) => message.id === incoming.id)) return current;

  const insightsKey = classInsightsKey(incoming);
  if (insightsKey) {
    const already = current.some(
      (message) => classInsightsKey(message) === insightsKey
    );
    return already ? current : [...current, incoming];
  }

  if (options?.streaming) return current;
  if (sameRenderedText(current, incoming)) return current;
  return [...current, incoming];
}

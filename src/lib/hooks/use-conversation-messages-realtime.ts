"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { toUIMessageFromRow } from "@/lib/ai-hub/message-content";
import type { ConversationMessageRow } from "@/lib/ai-hub/conversations";
import { createClient } from "@/lib/supabase/client";

/**
 * Inserts that land in conversation_messages while this chat is open.
 * RLS on the table limits delivery to the signed-in teacher's conversations.
 * The caller merges and drops rows already on screen.
 */
export function useConversationMessagesRealtime(
  conversationId: string | null,
  onInsert: (message: UIMessage) => void
) {
  const onInsertRef = useRef(onInsert);
  onInsertRef.current = onInsert;

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ConversationMessageRow;
          if (row.role !== "user" && row.role !== "assistant") return;
          onInsertRef.current(
            toUIMessageFromRow({
              id: row.id,
              role: row.role,
              content: row.content,
              tool_calls: row.tool_calls,
              reasoning: row.reasoning,
              reasoning_ms: row.reasoning_ms,
              answer_model: row.answer_model,
              answer_thinking: row.answer_thinking,
              answer_effort: row.answer_effort,
            })
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);
}

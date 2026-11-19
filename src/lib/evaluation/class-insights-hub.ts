import type { SupabaseClient } from "@supabase/supabase-js";
import { appendConversationMessages } from "@/lib/ai-hub/conversations";
import { buildClassInsights } from "@/lib/evaluation/class-insights-build";
import {
  formatClassInsightsChatMessage,
  messageIsForBatch,
  shouldPostClassInsights,
} from "@/lib/evaluation/class-insights-message";

/**
 * After marking finishes, post one assistant message on the Hub conversation
 * that owns the batch. Further rollups do not post again.
 */
export async function publishClassInsightsMessage(
  supabase: SupabaseClient,
  batchId: string
): Promise<void> {
  const { data: batch, error } = await supabase
    .from("evaluation_batches")
    .select("id, conversation_id, status")
    .eq("id", batchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!batch?.conversation_id) return;

  const { data: scripts, error: scriptError } = await supabase
    .from("evaluated_scripts")
    .select("status")
    .eq("batch_id", batchId);

  if (scriptError) throw new Error(scriptError.message);

  const { data: existing, error: existingError } = await supabase
    .from("conversation_messages")
    .select("tool_calls")
    .eq("conversation_id", batch.conversation_id)
    .eq("role", "assistant")
    .ilike("content", "Class insights%");

  if (existingError) throw new Error(existingError.message);

  const alreadyPosted = (existing ?? []).some((row) =>
    messageIsForBatch(row.tool_calls, batchId)
  );
  const statuses = (scripts ?? []).map((script) => script.status as string);
  if (!shouldPostClassInsights({ statuses, alreadyPosted })) return;

  const insights = await buildClassInsights(supabase, batchId);
  await appendConversationMessages(supabase, batch.conversation_id, [
    {
      role: "assistant",
      content: formatClassInsightsChatMessage(insights),
      tool_calls: {
        classInsightsBatchId: batchId,
        evalSessions: [
          {
            batchId,
            conversationId: batch.conversation_id,
            status: batch.status,
          },
        ],
      },
    },
  ]);
}

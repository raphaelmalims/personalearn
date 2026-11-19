import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aggregateQuestionInsights,
  isMarkedScriptStatus,
  type ClassInsightRow,
} from "@/lib/evaluation/class-insights";
import {
  marksFingerprint,
  reuseCachedInsights,
  topicsFromStoredCards,
} from "@/lib/evaluation/class-insights-cache";
import { inferWeakTopics } from "@/lib/evaluation/class-insights-llm";
import {
  formatClassInsightsChatMessage,
  isClassInsightsView,
  messageIsForBatch,
  presentClassInsights,
  type ClassInsightsPayload,
} from "@/lib/evaluation/class-insights-message";

type InsightMessageRow = {
  id: string;
  tool_calls: unknown;
};

/** Shared by the insights route and the Hub message so the two cannot drift. */
export async function buildClassInsights(
  supabase: SupabaseClient,
  batchId: string
): Promise<ClassInsightsPayload> {
  const { data: scripts, error: scriptError } = await supabase
    .from("evaluated_scripts")
    .select("id, status")
    .eq("batch_id", batchId);

  if (scriptError) throw new Error(scriptError.message);

  const markedIds = (scripts ?? [])
    .filter((script) => isMarkedScriptStatus(script.status))
    .map((script) => script.id);

  let rows: ClassInsightRow[] = [];
  if (markedIds.length > 0) {
    const { data: evaluations, error: evalError } = await supabase
      .from("question_evaluations")
      .select(
        "script_id, question_number, section, canonical_key, awarded, max, feedback, explanation"
      )
      .in("script_id", markedIds);

    if (evalError) throw new Error(evalError.message);

    rows = (evaluations ?? []).map((row) => ({
      scriptId: row.script_id,
      questionNumber: row.question_number,
      section: row.section,
      canonicalKey: row.canonical_key,
      awarded: row.awarded,
      max: row.max,
      feedback: row.feedback,
      explanation: row.explanation,
    }));
  }

  const aggregation = aggregateQuestionInsights(rows, markedIds.length);
  const fingerprint = marksFingerprint(markedIds, rows);
  const batch = await readBatchInsight(supabase, batchId);
  const cached = reuseCachedInsights(batch?.class_insights, fingerprint);
  if (cached) {
    await refreshStoredInsightCopy(supabase, batch, batchId, cached);
    return cached;
  }

  const hadPrevious = hasStoredFingerprint(batch?.class_insights);
  const storedCards = hadPrevious
    ? null
    : await storedInsightCards(supabase, batch?.conversation_id, batchId);
  const seeded = storedCards
    ? topicsFromStoredCards(storedCards, aggregation.questions)
    : null;
  const topics = seeded ?? (await inferWeakTopics(aggregation.questions));
  const payload: ClassInsightsPayload = {
    scriptCount: aggregation.scriptCount,
    source: topics && topics.length > 0 ? "llm" : "table",
    questions: aggregation.questions,
    topics: topics ?? [],
  };

  await rememberClassInsights(supabase, batchId, fingerprint, payload);
  await refreshStoredInsightCopy(supabase, batch, batchId, payload);
  return payload;
}

function hasStoredFingerprint(stored: unknown): boolean {
  return (
    !!stored &&
    typeof stored === "object" &&
    typeof (stored as { fingerprint?: unknown }).fingerprint === "string"
  );
}

async function readBatchInsight(
  supabase: SupabaseClient,
  batchId: string
): Promise<{
  class_id: string | null;
  conversation_id: string | null;
  class_insights: unknown;
} | null> {
  const { data, error } = await supabase
    .from("evaluation_batches")
    .select("class_id, conversation_id, class_insights")
    .eq("id", batchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function rememberClassInsights(
  supabase: SupabaseClient,
  batchId: string,
  fingerprint: string,
  payload: ClassInsightsPayload
): Promise<void> {
  const { error } = await supabase
    .from("evaluation_batches")
    .update({
      class_insights: { fingerprint, payload },
    })
    .eq("id", batchId);

  if (error) {
    console.error("Class insights were not saved", error.message);
  }
}

async function storedInsightCards(
  supabase: SupabaseClient,
  conversationId: string | null | undefined,
  batchId: string
) {
  const row = await findInsightMessage(supabase, conversationId, batchId);
  if (!row || !row.tool_calls || typeof row.tool_calls !== "object") return null;
  const view = (row.tool_calls as { classInsights?: unknown }).classInsights;
  if (!isClassInsightsView(view)) return null;
  return view.cards;
}

/**
 * The Hub row is updated in place. A second "Class insights" message is not inserted.
 * Cards that already have learner counts are left alone.
 */
async function refreshStoredInsightCopy(
  supabase: SupabaseClient,
  batch: { class_id: string | null; conversation_id: string | null } | null,
  batchId: string,
  payload: ClassInsightsPayload
): Promise<void> {
  try {
    const row = await findInsightMessage(
      supabase,
      batch?.conversation_id,
      batchId
    );
    if (!row || !row.tool_calls || typeof row.tool_calls !== "object") return;
    const view = (row.tool_calls as { classInsights?: unknown }).classInsights;
    if (!isClassInsightsView(view)) return;
    const counted = view.cards.every(
      (card) =>
        typeof card.struggled === "number" && typeof card.scored === "number"
    );
    if (counted && view.note == null) return;

    const reviewPath = batch?.class_id
      ? `/classes/${batch.class_id}/evaluations/${batchId}`
      : view.reviewPath;
    const nextView = presentClassInsights(payload, reviewPath);
    const { error } = await supabase
      .from("conversation_messages")
      .update({
        content: formatClassInsightsChatMessage(payload),
        tool_calls: {
          ...(row.tool_calls as Record<string, unknown>),
          classInsightsBatchId: batchId,
          classInsights: nextView,
        },
      })
      .eq("id", row.id);

    if (error) console.error("Class insights copy was not refreshed", error.message);
  } catch (error) {
    console.error(
      "Class insights copy was not refreshed",
      error instanceof Error ? error.message : error
    );
  }
}

async function findInsightMessage(
  supabase: SupabaseClient,
  conversationId: string | null | undefined,
  batchId: string
): Promise<InsightMessageRow | null> {
  if (!conversationId) return null;
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("id, tool_calls")
    .eq("conversation_id", conversationId)
    .eq("role", "assistant")
    .ilike("content", "Class insights%");

  if (error) throw new Error(error.message);
  return (
    (data ?? []).find((row) => messageIsForBatch(row.tool_calls, batchId)) ??
    null
  );
}

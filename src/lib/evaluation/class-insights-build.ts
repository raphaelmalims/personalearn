import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aggregateQuestionInsights,
  isMarkedScriptStatus,
  type ClassInsightRow,
} from "@/lib/evaluation/class-insights";
import { inferWeakTopics } from "@/lib/evaluation/class-insights-llm";
import type { ClassInsightsPayload } from "@/lib/evaluation/class-insights-message";

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
  const topics = await inferWeakTopics(aggregation.questions);

  return {
    scriptCount: aggregation.scriptCount,
    source: topics && topics.length > 0 ? "llm" : "table",
    questions: aggregation.questions,
    topics: topics ?? [],
  };
}

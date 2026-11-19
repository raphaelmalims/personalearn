import { NextResponse } from "next/server";
import { requireTeacherClass } from "@/lib/auth/require-teacher-class";
import { requireTeacherEvaluationBatch } from "@/lib/evaluation/batches";
import {
  aggregateQuestionInsights,
  isMarkedScriptStatus,
  type ClassInsightRow,
} from "@/lib/evaluation/class-insights";
import { inferWeakTopics } from "@/lib/evaluation/class-insights-llm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authStatus(message: string) {
  if (message === "Not authenticated") return 401;
  if (
    message === "Class not found" ||
    message === "Evaluation batch not found"
  ) {
    return 403;
  }
  return 500;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await context.params;
    const supabase = await createClient();
    const batch = await requireTeacherEvaluationBatch(supabase, batchId);
    await requireTeacherClass(supabase, batch.class_id);

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
    const source = topics && topics.length > 0 ? "llm" : "table";

    return NextResponse.json({
      scriptCount: aggregation.scriptCount,
      source,
      questions: aggregation.questions,
      topics: topics ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load class insights";
    return NextResponse.json({ error: message }, { status: authStatus(message) });
  }
}

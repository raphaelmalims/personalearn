import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMarkedScriptStatus,
  type ClassInsightRow,
} from "@/lib/evaluation/class-insights";
import {
  fallbackBrief,
  readableAnswer,
  renderClassInsightsMarkdown,
  type ClassInsightsDossier,
  type DossierQuestion,
  type LearnerAnswer,
} from "@/lib/evaluation/class-insights-brief";
import { marksFingerprint, reuseCachedInsights } from "@/lib/evaluation/class-insights-cache";
import { writeClassInsightsBrief } from "@/lib/evaluation/class-insights-llm";
import { loadMarkingSchemeText } from "@/lib/evaluation/load-marking-scheme";
import {
  messageIsForBatch,
  type ClassInsightsPayload,
} from "@/lib/evaluation/class-insights-message";
import { formatQuestionDisplayLabel } from "@/lib/evaluation/question-identity";

type ScriptRow = {
  id: string;
  status: string;
  student_id: string | null;
  read_admission_number: string | null;
};

/** Shared by the insights route and the Hub message so the two cannot drift. */
export async function buildClassInsights(
  supabase: SupabaseClient,
  batchId: string
): Promise<ClassInsightsPayload> {
  const { data: scripts, error: scriptError } = await supabase
    .from("evaluated_scripts")
    .select("id, status, student_id, read_admission_number")
    .eq("batch_id", batchId);

  if (scriptError) throw new Error(scriptError.message);

  const marked = ((scripts ?? []) as ScriptRow[]).filter((script) =>
    isMarkedScriptStatus(script.status)
  );
  const names = await learnerNames(supabase, marked);
  const markedIds = marked.map((script) => script.id);

  const { data: batch, error: batchError } = await supabase
    .from("evaluation_batches")
    .select(
      "class_id, conversation_id, class_insights, marking_scheme_resource_id, assessment_id"
    )
    .eq("id", batchId)
    .maybeSingle();

  if (batchError) throw new Error(batchError.message);

  const conversationPath = batch?.conversation_id
    ? `/ai-hub?conversation=${batch.conversation_id}`
    : null;

  let rows: Array<ClassInsightRow & { studentAnswer: string | null; expectedAnswer: string | null }> =
    [];
  if (markedIds.length > 0) {
    const { data: evaluations, error: evalError } = await supabase
      .from("question_evaluations")
      .select(
        "script_id, question_number, section, canonical_key, awarded, max, feedback, explanation, student_answer, expected_answer"
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
      studentAnswer: row.student_answer,
      expectedAnswer: row.expected_answer,
    }));
  }

  const fingerprint = marksFingerprint(markedIds, rows);
  const cached = reuseCachedInsights(batch?.class_insights, fingerprint);
  if (cached?.markdown) {
    const payload = { ...cached, conversationPath };
    await syncInsightMessage(supabase, batch?.conversation_id, batchId, cached.markdown);
    return payload;
  }

  const dossier = await assembleDossier(supabase, batch, marked, names, rows);
  const generated = await writeClassInsightsBrief(dossier);
  const brief = generated ?? fallbackBrief(dossier);
  const markdown = renderClassInsightsMarkdown(dossier, brief);

  const payload: ClassInsightsPayload = {
    scriptCount: marked.length,
    source: generated ? "llm" : "table",
    headline: brief.headline,
    markdown,
    conversationPath,
    questions: [],
    topics: [],
  };

  const { error: saveError } = await supabase
    .from("evaluation_batches")
    .update({ class_insights: { fingerprint, payload } })
    .eq("id", batchId);
  if (saveError) console.error("Class insights were not saved", saveError.message);

  await syncInsightMessage(supabase, batch?.conversation_id, batchId, markdown);
  return payload;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

async function assembleDossier(
  supabase: SupabaseClient,
  batch: { marking_scheme_resource_id: string | null; assessment_id: string | null } | null,
  marked: ScriptRow[],
  names: Map<string, string>,
  rows: Array<
    ClassInsightRow & { studentAnswer: string | null; expectedAnswer: string | null }
  >
): Promise<ClassInsightsDossier> {
  const schemeText = batch
    ? await loadMarkingSchemeText(supabase, batch)
    : null;
  let assessmentTitle = "";
  if (batch?.assessment_id) {
    const { data } = await supabase
      .from("assessments")
      .select("title")
      .eq("id", batch.assessment_id)
      .maybeSingle();
    assessmentTitle = typeof data?.title === "string" ? data.title : "";
  }

  const learnerOf = new Map(
    marked.map((script) => [script.id, displayName(script, names)])
  );
  const grouped = new Map<string, DossierQuestion>();
  for (const row of rows) {
    const label = formatQuestionDisplayLabel({
      section: row.section,
      questionNumber: row.questionNumber,
    });
    const question = grouped.get(label) ?? {
      label,
      correct: "",
      answers: [],
    };
    const correct = readableAnswer(row.expectedAnswer);
    if (correct && (!question.correct || correct.length > question.correct.length)) {
      question.correct = correct;
    }
    const answer: LearnerAnswer = {
      learner: learnerOf.get(row.scriptId) ?? "Learner",
      awarded: asNumber(row.awarded),
      max: asNumber(row.max),
      answer: readableAnswer(row.studentAnswer),
    };
    question.answers.push(answer);
    grouped.set(label, question);
  }

  const questions = [...grouped.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true })
  );
  const learnerTotals = marked.map((script) => {
    const learner = learnerOf.get(script.id) ?? "Learner";
    const answers = questions.flatMap((question) =>
      question.answers.filter((answer) => answer.learner === learner)
    );
    return {
      learner,
      awarded: answers.reduce((sum, answer) => sum + answer.awarded, 0),
      max: answers.reduce((sum, answer) => sum + answer.max, 0),
    };
  });

  return { assessmentTitle, schemeText, questions, learnerTotals };
}

function displayName(script: ScriptRow, names: Map<string, string>): string {
  if (script.student_id && names.get(script.student_id)) {
    return names.get(script.student_id) as string;
  }
  if (script.read_admission_number?.trim()) {
    return `Learner ${script.read_admission_number.trim()}`;
  }
  return "Learner";
}

async function learnerNames(
  supabase: SupabaseClient,
  scripts: ScriptRow[]
): Promise<Map<string, string>> {
  const ids = [
    ...new Set(scripts.map((script) => script.student_id).filter(Boolean)),
  ] as string[];
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, admission_number")
    .in("id", ids);
  if (error) throw new Error(error.message);
  for (const student of data ?? []) {
    const name =
      (typeof student.full_name === "string" && student.full_name.trim()) ||
      (student.admission_number
        ? `Learner ${student.admission_number}`
        : "Learner");
    names.set(student.id, name);
  }
  return names;
}

async function syncInsightMessage(
  supabase: SupabaseClient,
  conversationId: string | null | undefined,
  batchId: string,
  markdown: string
): Promise<void> {
  if (!conversationId) return;
  try {
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("id, content, tool_calls")
      .eq("conversation_id", conversationId)
      .eq("role", "assistant")
      .ilike("content", "Class insights%");
    if (error) throw new Error(error.message);
    const row = (data ?? []).find((item) =>
      messageIsForBatch(item.tool_calls, batchId)
    );
    if (!row) return;
    if (row.content === markdown) return;
    const { error: updateError } = await supabase
      .from("conversation_messages")
      .update({
        content: markdown,
        tool_calls: { classInsightsBatchId: batchId },
      })
      .eq("id", row.id);
    if (updateError) {
      console.error("Class insights message was not refreshed", updateError.message);
    }
  } catch (error) {
    console.error(
      "Class insights message was not refreshed",
      error instanceof Error ? error.message : error
    );
  }
}

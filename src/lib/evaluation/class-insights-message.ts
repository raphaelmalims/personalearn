import {
  isMarkedScriptStatus,
  type QuestionInsight,
} from "@/lib/evaluation/class-insights";

export type ClassInsightsTopic = {
  title: string;
  questionKeys: string[];
  reteachStep: string;
  nextActivity: string;
};

/** Same payload as GET /api/evaluation-batches/[batchId]/insights. */
export type ClassInsightsPayload = {
  scriptCount: number;
  source: "llm" | "table";
  questions: QuestionInsight[];
  topics: ClassInsightsTopic[];
};

const STILL_MARKING = new Set([
  "uploaded",
  "indexing",
  "evaluating",
  "pending",
  "parsing",
  "queued_draft",
  "drafting",
  "identity_cleared",
]);

export function shouldPostClassInsights(input: {
  statuses: string[];
  alreadyPosted: boolean;
}): boolean {
  if (input.alreadyPosted) return false;
  const marked = input.statuses.filter((status) =>
    isMarkedScriptStatus(status)
  ).length;
  if (marked < 2) return false;
  return !input.statuses.some((status) => STILL_MARKING.has(status));
}

export function messageIsForBatch(
  toolCalls: unknown,
  batchId: string
): boolean {
  if (!toolCalls || typeof toolCalls !== "object") return false;
  return (
    (toolCalls as { classInsightsBatchId?: unknown }).classInsightsBatchId ===
    batchId
  );
}

/**
 * One Hub assistant message. Topics and the table both come from the insights
 * payload, so the chat cannot describe a different set than the panel.
 */
export function formatClassInsightsChatMessage(
  payload: ClassInsightsPayload
): string {
  const countLabel =
    payload.scriptCount === 1 ? "1 script" : `${payload.scriptCount} scripts`;
  const lines = ["Class insights", "", `Based on ${countLabel}.`, ""];

  if (payload.source === "llm" && payload.topics.length > 0) {
    for (const topic of payload.topics.slice(0, 3)) {
      lines.push(`**${topic.title}**`, topic.reteachStep, "");
    }
    lines.push("Inferred from this set. Not a CBC strand alignment.");
  } else if (payload.questions.length === 0) {
    lines.push("No question scores yet for these scripts.");
  } else {
    for (const question of payload.questions) {
      const score =
        question.percentBelowHalf === null
          ? "no score"
          : `${question.percentBelowHalf}% below 50%`;
      const mistake = question.commonMistakes[0]?.text;
      lines.push(
        `**${question.label}** — ${question.learnersMarked} learners, ${score}.${
          mistake ? ` ${mistake}` : ""
        }`
      );
    }
  }

  lines.push("", "Open the review workspace below.");
  return lines.join("\n");
}

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

export type ClassInsightsCardView = {
  title: string;
  percentUnderHalf: number | null;
  questionNumbers: string;
  reteachStep: string;
};

/** The same cards the panel and the Hub message render. */
export type ClassInsightsView = {
  scriptCount: number;
  cards: ClassInsightsCardView[];
  note: string | null;
  reviewPath: string;
};

const FALLBACK_RETEACH = "Talk through this question with one worked example.";

function oneLine(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= 140) return line;
  return `${line.slice(0, 139).trimEnd()}…`;
}

function percentAcross(
  questions: QuestionInsight[],
  keys: string[]
): number | null {
  const matched = questions.filter((question) => keys.includes(question.key));
  const scored = matched.reduce((sum, question) => sum + question.scored, 0);
  if (scored <= 0) return null;
  const below = matched.reduce((sum, question) => sum + question.belowHalf, 0);
  return Math.round((below / scored) * 100);
}

function numbersFor(questions: QuestionInsight[], keys: string[]): string {
  const labels = keys.map(
    (key) => questions.find((question) => question.key === key)?.label ?? key
  );
  return labels.filter(Boolean).join(", ");
}

/**
 * Cards for the panel and the Hub message. Both call this, so they cannot
 * describe a different set.
 */
export function presentClassInsights(
  payload: ClassInsightsPayload,
  reviewPath = ""
): ClassInsightsView {
  if (payload.source === "llm" && payload.topics.length > 0) {
    return {
      scriptCount: payload.scriptCount,
      reviewPath,
      note: "From this set. Not a strand label.",
      cards: payload.topics.slice(0, 3).map((topic) => ({
        title: oneLine(topic.title),
        percentUnderHalf: percentAcross(payload.questions, topic.questionKeys),
        questionNumbers: numbersFor(payload.questions, topic.questionKeys),
        reteachStep: oneLine(topic.reteachStep),
      })),
    };
  }

  const weak = payload.questions
    .filter((question) => (question.percentBelowHalf ?? 0) > 0)
    .slice(0, 3);

  return {
    scriptCount: payload.scriptCount,
    reviewPath,
    note: null,
    cards: weak.map((question) => ({
      title: `Question ${question.label}`,
      percentUnderHalf: question.percentBelowHalf,
      questionNumbers: question.label,
      reteachStep: oneLine(question.commonMistakes[0]?.text ?? FALLBACK_RETEACH),
    })),
  };
}

export function isClassInsightsView(value: unknown): value is ClassInsightsView {
  if (!value || typeof value !== "object") return false;
  const view = value as ClassInsightsView;
  return (
    typeof view.scriptCount === "number" &&
    typeof view.reviewPath === "string" &&
    Array.isArray(view.cards)
  );
}

/**
 * Compact fallback text. The chat renders the card view from tool_calls
 * instead of this paragraph.
 */
export function formatClassInsightsChatMessage(
  payload: ClassInsightsPayload
): string {
  const view = presentClassInsights(payload);
  const countLabel =
    view.scriptCount === 1 ? "1 script" : `${view.scriptCount} scripts`;
  const lines = ["Class insights", "", `Based on ${countLabel}.`, ""];

  if (view.cards.length === 0) {
    lines.push("Nothing stands out on this set.");
  } else {
    for (const card of view.cards) {
      const score =
        card.percentUnderHalf === null
          ? "No score yet"
          : `${card.percentUnderHalf}% under half`;
      lines.push(
        card.title,
        `${score} · Questions ${card.questionNumbers}`,
        card.reteachStep,
        ""
      );
    }
  }

  if (view.note) lines.push(view.note);
  return lines.join("\n").trim();
}

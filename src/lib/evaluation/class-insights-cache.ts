import type { ClassInsightRow, QuestionInsight } from "@/lib/evaluation/class-insights";
import type {
  ClassInsightsPayload,
  ClassInsightsTopic,
} from "@/lib/evaluation/class-insights-message";

export type StoredClassInsights = {
  fingerprint: string;
  payload: ClassInsightsPayload;
};

/**
 * Marks that should invalidate a saved insight. Feedback text is left out so
 * a wording edit does not ask the model for new topic names.
 */
export function marksFingerprint(
  markedIds: string[],
  rows: ClassInsightRow[]
): string {
  const scripts = [...markedIds].sort().join(",");
  const marks = rows
    .map((row) =>
      [
        row.scriptId,
        row.canonicalKey ?? "",
        row.section ?? "",
        row.questionNumber,
        row.awarded ?? "",
        row.max ?? "",
      ].join("\u001f")
    )
    .sort()
    .join("\u001e");
  return `${scripts}\u001d${marks}`;
}

function isTopic(value: unknown): value is ClassInsightsTopic {
  if (!value || typeof value !== "object") return false;
  const topic = value as ClassInsightsTopic;
  return (
    typeof topic.title === "string" &&
    typeof topic.reteachStep === "string" &&
    typeof topic.nextActivity === "string" &&
    Array.isArray(topic.questionKeys)
  );
}

export function isClassInsightsPayload(
  value: unknown
): value is ClassInsightsPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as ClassInsightsPayload;
  return (
    typeof payload.scriptCount === "number" &&
    (payload.source === "llm" || payload.source === "table") &&
    Array.isArray(payload.questions) &&
    Array.isArray(payload.topics) &&
    payload.topics.every(isTopic)
  );
}

/** The saved result for this batch, or null when the marks have moved on. */
export function reuseCachedInsights(
  stored: unknown,
  fingerprint: string
): ClassInsightsPayload | null {
  if (!stored || typeof stored !== "object") return null;
  const record = stored as { fingerprint?: unknown; payload?: unknown };
  if (record.fingerprint !== fingerprint) return null;
  return isClassInsightsPayload(record.payload) ? record.payload : null;
}

type StoredCard = {
  title?: unknown;
  questionNumbers?: unknown;
  reteachStep?: unknown;
};

/**
 * Keep the topic names already shown for this batch. Question labels on the
 * stored cards map back to the current marks. Returns null when a card cannot
 * be matched, so the caller asks the model once.
 */
export function topicsFromStoredCards(
  cards: StoredCard[],
  questions: QuestionInsight[]
): ClassInsightsTopic[] | null {
  if (cards.length === 0) return null;
  const topics: ClassInsightsTopic[] = [];
  for (const card of cards) {
    if (typeof card.title !== "string" || typeof card.reteachStep !== "string") {
      return null;
    }
    const labels =
      typeof card.questionNumbers === "string"
        ? card.questionNumbers
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean)
        : [];
    const questionKeys = questions
      .filter((question) => labels.includes(question.label))
      .map((question) => question.key);
    const title = card.title.trim();
    const reteachStep = card.reteachStep.trim();
    if (!title || !reteachStep || questionKeys.length === 0) return null;
    topics.push({
      title,
      questionKeys,
      reteachStep,
      nextActivity: reteachStep,
    });
  }
  return topics;
}

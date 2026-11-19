import { generateText, Output } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/llm";
import type { QuestionInsight } from "@/lib/evaluation/class-insights";

export const MAX_WEAK_TOPICS = 3;

const topicSchema = z.object({
  topics: z
    .array(
      z.object({
        title: z.string(),
        questionKeys: z.array(z.string()),
        reteachStep: z.string(),
        nextActivity: z.string(),
      })
    )
    .max(MAX_WEAK_TOPICS),
});

export type WeakTopic = {
  title: string;
  questionKeys: string[];
  reteachStep: string;
  nextActivity: string;
};

function oneLine(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function sanitizeWeakTopics(
  raw: z.infer<typeof topicSchema>,
  allowedKeys: Set<string>
): WeakTopic[] {
  const topics: WeakTopic[] = [];
  for (const topic of raw.topics) {
    const questionKeys = [
      ...new Set(topic.questionKeys.map((key) => key.trim())),
    ].filter((key) => allowedKeys.has(key));
    const title = oneLine(topic.title, 80);
    const reteachStep = oneLine(topic.reteachStep, 180);
    const nextActivity = oneLine(topic.nextActivity, 180);
    if (!title || !reteachStep || !nextActivity || questionKeys.length === 0) {
      continue;
    }
    topics.push({ title, questionKeys, reteachStep, nextActivity });
    if (topics.length === MAX_WEAK_TOPICS) break;
  }
  return topics;
}

function promptFor(questions: QuestionInsight[]): string {
  const payload = questions.map((question) => ({
    key: question.key,
    label: question.label,
    learnersMarked: question.learnersMarked,
    percentBelowHalf: question.percentBelowHalf,
    commonMistakes: question.commonMistakes.map((mistake) => mistake.text),
  }));

  return [
    "Group these weak questions into at most 3 topics for the teacher who just marked the class set.",
    "Each topic needs a short title, the question keys it covers, a one-line reteach step, and a one-line next activity.",
    "Topics are inferred only from the marks and mistakes below.",
    "Do not name CBC strands, competencies, or syllabus codes. linked_strand is unset and must not be invented.",
    "Use only the question keys in the data.",
    JSON.stringify(payload),
  ].join("\n");
}

/**
 * LLM grouping of the weakest questions. Returns null when the model call
 * fails or the result cannot be used, so the caller can show the table.
 * Returns an empty list when nothing is under 50% (no call).
 */
export async function inferWeakTopics(
  questions: QuestionInsight[]
): Promise<WeakTopic[] | null> {
  const weak = questions
    .filter((question) => (question.percentBelowHalf ?? 0) > 0)
    .slice(0, 8);
  if (weak.length === 0) return [];

  try {
    const { output } = await generateText({
      model: getChatModel(),
      output: Output.object({
        schema: topicSchema,
        name: "ClassInsights",
        description:
          "Up to three weak topics inferred from class marks, each with a reteach step and a next activity.",
      }),
      prompt: promptFor(weak),
    });
    if (!output) return null;
    const topics = sanitizeWeakTopics(output, new Set(weak.map((q) => q.key)));
    return topics.length > 0 ? topics : null;
  } catch {
    return null;
  }
}

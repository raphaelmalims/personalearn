import { generateText, Output } from "ai";
import { z } from "zod";
import { getChatModelId, getChatProvider } from "@/lib/ai/env";
import { getChatModel, getChatModelForSettings } from "@/lib/ai/llm";
import {
  explainMiss,
  explainTopic,
} from "@/lib/evaluation/class-insights-arithmetic";
import {
  classAverageLine,
  missedQuestionGroups,
  readableAnswer,
  type ClassInsightsBrief,
  type ClassInsightsDossier,
} from "@/lib/evaluation/class-insights-brief";

const briefSchema = z.object({
  headline: z.string(),
  wentWell: z.string(),
  struggled: z
    .array(
      z.object({
        title: z.string(),
        questionLabels: z.array(z.string()),
        misconception: z.string(),
        quotes: z.array(
          z.object({
            learner: z.string(),
            answer: z.string(),
          })
        ),
      })
    )
    .max(4),
  moves: z.array(z.string()).min(2).max(3),
  workedExample: z.string(),
  practice: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .min(2)
    .max(3),
  checkIns: z.array(
    z.object({
      learner: z.string(),
      gap: z.string(),
    })
  ),
});

function oneLine(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function sanitizeClassInsightsBrief(
  raw: z.infer<typeof briefSchema>,
  dossier: ClassInsightsDossier
): ClassInsightsBrief | null {
  const labels = new Set(dossier.questions.map((question) => question.label));
  const learners = new Set(dossier.learnerTotals.map((row) => row.learner));
  const headline = oneLine(raw.headline, 320);
  const wentWell = oneLine(raw.wentWell, 500);
  const workedExample = oneLine(raw.workedExample, 600);
  const moves = raw.moves.map((move) => oneLine(move, 240)).filter(Boolean);
  const practice = raw.practice
    .map((item) => ({
      question: oneLine(item.question, 240),
      answer: oneLine(item.answer, 160),
    }))
    .filter((item) => item.question && item.answer);
  if (!headline || !wentWell || !workedExample || moves.length < 2 || practice.length < 2) {
    return null;
  }

  const struggled = raw.struggled
    .map((topic) => ({
      title: oneLine(topic.title, 80),
      questionLabels: [
        ...new Set(topic.questionLabels.map((label) => label.trim())),
      ].filter((label) => labels.has(label)),
      misconception: oneLine(topic.misconception, 800),
      quotes: topic.quotes
        .filter((quote) => learners.has(quote.learner.trim()))
        .map((quote) => ({
          learner: quote.learner.trim(),
          answer: readableAnswer(quote.answer),
        }))
        .filter((quote) => quote.answer),
    }))
    .filter(
      (topic) => topic.title && topic.misconception && topic.questionLabels.length > 0
    )
    .slice(0, 4);

  const checkIns = raw.checkIns
    .map((row) => ({
      learner: row.learner.trim(),
      gap: oneLine(row.gap, 1200),
    }))
    .filter((row) => learners.has(row.learner) && row.gap);

  return {
    headline,
    wentWell,
    struggled,
    moves: moves.slice(0, 3),
    workedExample,
    practice: practice.slice(0, 3),
    checkIns,
  };
}

function promptFor(dossier: ClassInsightsDossier): string {
  const questions = dossier.questions.map((question) => ({
    label: question.label,
    correct: question.correct,
    answers: question.answers.map((answer) => ({
      learner: answer.learner,
      awarded: answer.awarded,
      max: answer.max,
      answer: answer.answer,
      wrong: answer.max > 0 && answer.awarded < answer.max,
    })),
  }));

  return [
    "You are a sharp head of department talking to a colleague who has just marked this class.",
    "Plain words. Short sentences. Kenyan classroom language where it fits: learners, reteach, the board.",
    "Use only the assessment, the marking scheme, and the answers below.",
    "Do not invent CBC strand codes, competencies, or syllabus codes. If the scheme does not name one, do not add one.",
    "Do not use percentages. Do not write 'under half' or 'strand label'.",
    `The class average is ${classAverageLine(dossier).replace(/\*/g, "")} The headline must not repeat that figure.`,
    "Headline: one sentence on how the class did, what was strong, and what needs reteaching.",
    "What went well: the topics most learners got right, briefly.",
    "Do not state a count. Do not write 'N of M'. Counts are added from the marks. Do not repeat the class average.",
    "The reasons below are fixed from the written working. Use them. Do not call a shown number a misread digit, and do not call a fact error a doubling slip.",
    fixedReasons(dossier),
    "Where they struggled: the topics below are fixed. Write one short teaching sentence for each. Do not quote the learner and do not invent a different sum.",
    "Reteach plan: 2 or 3 concrete moves for the next lesson, one worked example, and 2 or 3 practice questions in the same style as the paper, each with an answer a teacher can put on the board.",
    "Check-ins: one line per learner who missed something, naming their actual gap.",
    "Quote an answer only if that learner wrote it.",
    "If you explain a wrong answer, the sum or product you name must equal the number that learner wrote. Check the arithmetic. If it does not land on their answer, quote the wrong answer and the correct answer and do not guess the slip.",
    dossier.assessmentTitle ? `Assessment: ${dossier.assessmentTitle}` : "",
    dossier.schemeText ? `Marking scheme:\n${dossier.schemeText.slice(0, 6000)}` : "No marking scheme text was stored.",
    JSON.stringify({ learners: dossier.learnerTotals, questions }),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function insightsModel() {
  const provider = getChatProvider();
  if (provider === "deepseek") {
    // Thinking mode drops temperature. Disable it here so the brief stays at 0.
    return getChatModelForSettings({
      provider,
      modelId: getChatModelId(),
      thinking: "disabled",
      reasoningEffort: "low",
    });
  }
  return getChatModel();
}

function fixedReasons(dossier: ClassInsightsDossier): string {
  return missedQuestionGroups(dossier)
    .map((group) => `${group.title}: ${explainTopic(dossier, group.labels)}`)
    .join("\n");
}

async function requestBrief(
  dossier: ClassInsightsDossier,
  correction: string
): Promise<ClassInsightsBrief | null> {
  const { output } = await generateText({
    model: insightsModel(),
    temperature: 0,
    output: Output.object({
      schema: briefSchema,
      name: "ClassInsightsBrief",
      description:
        "A head-of-department brief after marking: headline, strengths, misconceptions with quotes, a reteach plan, and check-ins.",
    }),
    prompt: `${promptFor(dossier)}${correction}`,
  });
  if (!output) return null;
  return sanitizeClassInsightsBrief(output, dossier);
}

function withMarkFacts(
  brief: ClassInsightsBrief,
  dossier: ClassInsightsDossier
): ClassInsightsBrief {
  const struggled = missedQuestionGroups(dossier).map((group) => ({
    title: group.title,
    questionLabels: group.labels,
    misconception: explainTopic(dossier, group.labels),
    quotes: group.labels.flatMap((label) => {
      const question = dossier.questions.find((item) => item.label === label);
      if (!question) return [];
      return question.answers
        .filter((answer) => answer.max > 0 && answer.awarded < answer.max)
        .map((answer) => ({
          learner: answer.learner,
          answer: readableAnswer(answer.answer),
        }));
    }),
  }));
  const checkIns = dossier.learnerTotals.flatMap((row) => {
    const parts = dossier.questions.flatMap((question) => {
      const answer = question.answers.find(
        (item) => item.learner === row.learner && item.max > 0 && item.awarded < item.max
      );
      return answer
        ? [`${question.label}: ${explainMiss(question.correct, answer.answer)}`]
        : [];
    });
    return parts.length > 0 ? [{ learner: row.learner, gap: parts.join(" ") }] : [];
  });
  return { ...brief, struggled, checkIns };
}

/** One call. Counts, groups, and the reason for each miss come from the marks. */
export async function writeClassInsightsBrief(
  dossier: ClassInsightsDossier
): Promise<ClassInsightsBrief | null> {
  if (dossier.questions.length === 0) return null;
  try {
    const brief = await requestBrief(dossier, "");
    if (!brief) return null;
    return withMarkFacts(brief, dossier);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(message.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 400));
    return null;
  }
}

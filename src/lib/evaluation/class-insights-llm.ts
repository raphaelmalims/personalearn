import { generateText, Output } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/llm";
import {
  classAverageLine,
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
      misconception: oneLine(topic.misconception, 400),
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
      gap: oneLine(row.gap, 220),
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
    `The class average is ${classAverageLine(dossier).replace(/\*/g, "")} Use that figure in the headline.`,
    "Headline: one sentence on how the class did, what was strong, and what needs reteaching.",
    "What went well: the topics most learners got right, briefly.",
    "Where they struggled: up to 4 topics, ranked, with the question labels, the misconception you can see in the wrong answers, and exact quotes of those wrong answers.",
    "Reteach plan: 2 or 3 concrete moves for the next lesson, one worked example, and 2 or 3 practice questions in the same style as the paper, each with an answer a teacher can put on the board.",
    "Check-ins: one line per learner who missed something, naming their actual gap.",
    "Quote an answer only if that learner wrote it.",
    dossier.assessmentTitle ? `Assessment: ${dossier.assessmentTitle}` : "",
    dossier.schemeText ? `Marking scheme:\n${dossier.schemeText.slice(0, 6000)}` : "No marking scheme text was stored.",
    JSON.stringify({ learners: dossier.learnerTotals, questions }),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** One grounded call. Null when the model fails, so the caller can use the marks alone. */
export async function writeClassInsightsBrief(
  dossier: ClassInsightsDossier
): Promise<ClassInsightsBrief | null> {
  if (dossier.questions.length === 0) return null;
  try {
    const { output } = await generateText({
      model: getChatModel(),
      output: Output.object({
        schema: briefSchema,
        name: "ClassInsightsBrief",
        description:
          "A head-of-department brief after marking: headline, strengths, misconceptions with quotes, a reteach plan, and check-ins.",
      }),
      prompt: promptFor(dossier),
    });
    if (!output) return null;
    return sanitizeClassInsightsBrief(output, dossier);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error(message.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 400));
    return null;
  }
}

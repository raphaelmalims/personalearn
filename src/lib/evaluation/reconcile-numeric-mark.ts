import type { EvaluateQuestion } from "@/lib/evaluation/evaluate-schema";

function flatten(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flatten).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(flatten).join(" ");
  }
  return "";
}

/** Last number in a transcribed answer, so "38 × 6 = 168" yields 168. */
export function lastWrittenNumber(value: unknown): number | null {
  const matches = flatten(value).match(/-?\d+(?:\.\d+)?/g);
  if (!matches?.length) return null;
  const n = Number(matches[matches.length - 1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * One-mark questions with a single numeric answer are compared in code.
 * The model still reads the handwriting. Method-marked questions (max ≠ 1)
 * and answers with no number are left as the model returned them.
 */
export function reconcileBinaryNumericMark(
  question: EvaluateQuestion
): EvaluateQuestion {
  if (question.max !== 1) return question;
  const student = lastWrittenNumber(question.student_work);
  const expected = lastWrittenNumber(question.correct_reference);
  if (student == null || expected == null) return question;
  if (student === expected) {
    return { ...question, status: "CORRECT", awarded: 1 };
  }
  return { ...question, status: "ATTENTION_NEEDED", awarded: 0 };
}

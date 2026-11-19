import { describe, expect, it } from "vitest";
import { reconcileBinaryNumericMark } from "./reconcile-numeric-mark";
import type { EvaluateQuestion } from "./evaluate-schema";

function question(
  overrides: Partial<EvaluateQuestion>
): EvaluateQuestion {
  return {
    question_number: "3",
    status: "CORRECT",
    awarded: 1,
    max: 1,
    student_work: { expression: "38 × 6 = 168" },
    correct_reference: { expression: "38 × 6 = 228" },
    ...overrides,
  };
}

describe("reconcileBinaryNumericMark", () => {
  it("zeros a one-mark item when the written final does not match the key", () => {
    const row = reconcileBinaryNumericMark(
      question({ status: "CORRECT", awarded: 1 })
    );
    expect(row.status).toBe("ATTENTION_NEEDED");
    expect(row.awarded).toBe(0);
  });

  it("awards the mark when both finals match, even if the model said otherwise", () => {
    const row = reconcileBinaryNumericMark(
      question({
        status: "ATTENTION_NEEDED",
        awarded: 0,
        student_work: { expression: "4 × 9 = 36" },
        correct_reference: { answer: 36 },
      })
    );
    expect(row.status).toBe("CORRECT");
    expect(row.awarded).toBe(1);
  });

  it("keeps the model mark for a method question", () => {
    const row = reconcileBinaryNumericMark(
      question({ max: 3, awarded: 2, status: "ATTENTION_NEEDED" })
    );
    expect(row.awarded).toBe(2);
    expect(row.status).toBe("ATTENTION_NEEDED");
  });

  it("leaves a word-problem row alone when the key has no number", () => {
    const row = reconcileBinaryNumericMark(
      question({
        correct_reference: { answer: "see working" },
        awarded: 0,
        status: "ATTENTION_NEEDED",
      })
    );
    expect(row.awarded).toBe(0);
  });
});

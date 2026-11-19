import { describe, expect, it } from "vitest";
import {
  aggregateQuestionInsights,
  isBelowHalf,
  type ClassInsightRow,
} from "./class-insights";

function row(overrides: Partial<ClassInsightRow> & Pick<ClassInsightRow, "scriptId" | "questionNumber">): ClassInsightRow {
  return {
    section: null,
    canonicalKey: null,
    awarded: null,
    max: null,
    feedback: null,
    explanation: null,
    ...overrides,
  };
}

describe("aggregateQuestionInsights", () => {
  it("counts learners, the share under 50%, and common mistakes", () => {
    const result = aggregateQuestionInsights(
      [
        row({
          scriptId: "s1",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: 2,
          max: 5,
          feedback: "Dropped the denominator",
        }),
        row({
          scriptId: "s2",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: 4,
          max: 5,
          feedback: "Fine",
        }),
        row({
          scriptId: "s3",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: 1,
          max: 5,
          feedback: "dropped the denominator",
        }),
        row({
          scriptId: "s1",
          questionNumber: "2",
          section: "A",
          canonicalKey: "A:2",
          awarded: 5,
          max: 5,
        }),
      ],
      4
    );

    expect(result.scriptCount).toBe(4);
    expect(result.questions.map((question) => question.key)).toEqual([
      "1",
      "A:2",
    ]);

    const fractions = result.questions[0];
    expect(fractions).toMatchObject({
      label: "1",
      learnersMarked: 3,
      scored: 3,
      belowHalf: 2,
      percentBelowHalf: 66.7,
    });
    expect(fractions.commonMistakes).toEqual([
      { text: "Dropped the denominator", count: 2 },
    ]);

    expect(result.questions[1]).toMatchObject({
      label: "A.2",
      learnersMarked: 1,
      belowHalf: 0,
      percentBelowHalf: 0,
      commonMistakes: [],
    });
  });

  it("treats exactly 50% as not below, and skips unscored rows", () => {
    expect(isBelowHalf(2.5, 5)).toBe(false);
    expect(isBelowHalf(2, 5)).toBe(true);
    expect(isBelowHalf(null, 5)).toBe(false);

    const result = aggregateQuestionInsights(
      [
        row({
          scriptId: "s1",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: 2.5,
          max: 5,
          feedback: "Half marks",
        }),
        row({
          scriptId: "s2",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: null,
          max: 5,
          explanation: "No mark yet",
        }),
        row({
          scriptId: "s3",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: 0,
          max: 0,
          feedback: "Ignored",
        }),
      ],
      3
    );

    expect(result.questions[0]).toMatchObject({
      learnersMarked: 3,
      scored: 1,
      belowHalf: 0,
      percentBelowHalf: 0,
      commonMistakes: [],
    });
  });

  it("counts one learner when the same script has two rows", () => {
    const result = aggregateQuestionInsights(
      [
        row({
          scriptId: "s1",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: null,
          max: null,
        }),
        row({
          scriptId: "s1",
          questionNumber: "1",
          canonicalKey: "1",
          awarded: 1,
          max: 4,
          feedback: "Sign error",
        }),
      ],
      2
    );

    expect(result.questions[0]).toMatchObject({
      learnersMarked: 1,
      scored: 1,
      belowHalf: 1,
      percentBelowHalf: 100,
    });
    expect(result.questions[0].commonMistakes).toEqual([
      { text: "Sign error", count: 1 },
    ]);
  });
});

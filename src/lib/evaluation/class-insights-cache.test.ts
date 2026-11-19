import { describe, expect, it } from "vitest";
import type { ClassInsightRow, QuestionInsight } from "./class-insights";
import {
  marksFingerprint,
  reuseCachedInsights,
  topicsFromStoredCards,
} from "./class-insights-cache";
import type { ClassInsightsPayload } from "./class-insights-message";

function row(overrides: Partial<ClassInsightRow>): ClassInsightRow {
  return {
    scriptId: "script-1",
    questionNumber: "4",
    section: "A",
    canonicalKey: "A.4",
    awarded: 1,
    max: 2,
    feedback: null,
    explanation: null,
    ...overrides,
  };
}

const payload: ClassInsightsPayload = {
  scriptCount: 2,
  source: "llm",
  questions: [],
  topics: [
    {
      title: "Basic multiplication facts",
      questionKeys: ["A.4"],
      reteachStep: "Rehearse the facts.",
      nextActivity: "Rehearse the facts.",
    },
  ],
};

describe("marksFingerprint", () => {
  it("ignores row order and changes when a mark changes", () => {
    const first = row({});
    const second = row({ scriptId: "script-2", awarded: 2 });
    expect(marksFingerprint(["b", "a"], [second, first])).toBe(
      marksFingerprint(["a", "b"], [first, second])
    );
    expect(
      marksFingerprint(["a", "b"], [first, row({ scriptId: "script-2", awarded: 0 })])
    ).not.toBe(marksFingerprint(["a", "b"], [first, second]));
  });
});

describe("reuseCachedInsights", () => {
  it("returns the first result only while the fingerprint matches", () => {
    const stored = { fingerprint: "same", payload };
    expect(reuseCachedInsights(stored, "same")?.topics[0]?.title).toBe(
      "Basic multiplication facts"
    );
    expect(reuseCachedInsights(stored, "moved")).toBeNull();
    expect(reuseCachedInsights({ fingerprint: "same", payload: {} }, "same")).toBeNull();
  });
});

describe("topicsFromStoredCards", () => {
  const questions: QuestionInsight[] = [
    {
      key: "A.4",
      label: "A.4",
      learnersMarked: 2,
      scored: 2,
      belowHalf: 1,
      percentBelowHalf: 50,
      commonMistakes: [],
    },
    {
      key: "A.5",
      label: "A.5",
      learnersMarked: 2,
      scored: 2,
      belowHalf: 1,
      percentBelowHalf: 50,
      commonMistakes: [],
    },
  ];

  it("keeps the stored topic names when the question labels still match", () => {
    const topics = topicsFromStoredCards(
      [
        {
          title: "Basic multiplication facts",
          questionNumbers: "A.4, A.5",
          reteachStep: "Rehearse the facts.",
        },
      ],
      questions
    );
    expect(topics).toEqual([
      {
        title: "Basic multiplication facts",
        questionKeys: ["A.4", "A.5"],
        reteachStep: "Rehearse the facts.",
        nextActivity: "Rehearse the facts.",
      },
    ]);
  });

  it("does not invent a topic when a label is gone", () => {
    expect(
      topicsFromStoredCards(
        [
          {
            title: "Basic multiplication facts",
            questionNumbers: "Z.9",
            reteachStep: "Rehearse the facts.",
          },
        ],
        questions
      )
    ).toBeNull();
  });
});

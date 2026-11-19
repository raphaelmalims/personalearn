import { describe, expect, it } from "vitest";
import type { QuestionInsight } from "./class-insights";
import {
  formatClassInsightsChatMessage,
  messageIsForBatch,
  presentClassInsights,
  shouldPostClassInsights,
  type ClassInsightsPayload,
} from "./class-insights-message";

function question(
  overrides: Partial<QuestionInsight> & Pick<QuestionInsight, "key" | "label">
): QuestionInsight {
  return {
    learnersMarked: 2,
    scored: 2,
    belowHalf: 2,
    percentBelowHalf: 100,
    commonMistakes: [],
    ...overrides,
  };
}

const topicsPayload: ClassInsightsPayload = {
  scriptCount: 4,
  source: "llm",
  questions: [question({ key: "1", label: "1" })],
  topics: [
    {
      title: "Fractions",
      questionKeys: ["1"],
      reteachStep: "Redo one fraction with a shared diagram.",
      nextActivity: "Three short fraction items tomorrow.",
    },
    {
      title: "Place value",
      questionKeys: ["2"],
      reteachStep: "Show the tens and ones with counters.",
      nextActivity: "A five-item place-value check.",
    },
  ],
};

describe("presentClassInsights", () => {
  it("turns topics into cards with a share under half and question numbers", () => {
    const view = presentClassInsights(
      {
        ...topicsPayload,
        questions: [
          question({ key: "1", label: "1", scored: 4, belowHalf: 3 }),
          question({ key: "2", label: "2a", scored: 4, belowHalf: 1 }),
        ],
      },
      "/classes/class-1/evaluations/batch-1"
    );
    expect(view.scriptCount).toBe(4);
    expect(view.reviewPath).toBe("/classes/class-1/evaluations/batch-1");
    expect(view.cards[0]).toMatchObject({
      title: "Fractions",
      percentUnderHalf: 75,
      questionNumbers: "1",
      reteachStep: "Redo one fraction with a shared diagram.",
    });
    expect(view.cards[1]?.percentUnderHalf).toBe(25);
    expect(view.note).toContain("Not a strand label");
  });
});

describe("formatClassInsightsChatMessage", () => {
  it("uses the insights topics, one reteach step each, and the script count", () => {
    const text = formatClassInsightsChatMessage(topicsPayload);
    expect(text.startsWith("Class insights")).toBe(true);
    expect(text).toContain("Based on 4 scripts.");
    expect(text).toContain("Fractions");
    expect(text).toContain("Redo one fraction with a shared diagram.");
    expect(text).toContain("Place value");
    expect(text).toContain("Show the tens and ones with counters.");
    expect(text).toContain("Not a strand label.");
    expect(text).not.toContain("linked_strand");
    expect(text).not.toContain("Next:");
  });

  it("falls back to the weakest questions from the same payload", () => {
    const text = formatClassInsightsChatMessage({
      scriptCount: 2,
      source: "table",
      topics: [],
      questions: [
        question({
          key: "1",
          label: "1",
          percentBelowHalf: 50,
          commonMistakes: [{ text: "Dropped the denominator", count: 2 }],
        }),
      ],
    });
    expect(text).toContain("Based on 2 scripts.");
    expect(text).toContain("Question 1");
    expect(text).toContain("50% under half");
    expect(text).toContain("Dropped the denominator");
  });

  it("stays calm when nothing is under half", () => {
    const text = formatClassInsightsChatMessage({
      scriptCount: 3,
      source: "table",
      topics: [],
      questions: [question({ key: "1", label: "1", percentBelowHalf: 0, belowHalf: 0 })],
    });
    expect(text).toContain("Nothing stands out on this set.");
  });
});

describe("shouldPostClassInsights", () => {
  it("posts once marking has finished for two scripts", () => {
    expect(
      shouldPostClassInsights({
        statuses: ["ready", "drafted"],
        alreadyPosted: false,
      })
    ).toBe(true);
    expect(
      shouldPostClassInsights({
        statuses: ["ready", "evaluating"],
        alreadyPosted: false,
      })
    ).toBe(false);
    expect(
      shouldPostClassInsights({
        statuses: ["ready"],
        alreadyPosted: false,
      })
    ).toBe(false);
    expect(
      shouldPostClassInsights({
        statuses: ["signed_off", "signed_off"],
        alreadyPosted: true,
      })
    ).toBe(false);
  });
});

describe("messageIsForBatch", () => {
  it("matches the stored batch id", () => {
    expect(
      messageIsForBatch({ classInsightsBatchId: "batch-1" }, "batch-1")
    ).toBe(true);
    expect(messageIsForBatch({ classInsightsBatchId: "other" }, "batch-1")).toBe(
      false
    );
  });
});

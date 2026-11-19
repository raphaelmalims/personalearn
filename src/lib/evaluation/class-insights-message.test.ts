import { describe, expect, it } from "vitest";
import type { QuestionInsight } from "./class-insights";
import {
  formatClassInsightsChatMessage,
  formatStruggleLine,
  messageIsForBatch,
  presentClassInsights,
  shouldPostClassInsights,
  shouldRefreshClassInsights,
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

describe("formatStruggleLine", () => {
  it("uses a plain count", () => {
    expect(formatStruggleLine({ struggled: 5, scored: 8 })).toBe(
      "5 of 8 learners struggled"
    );
    expect(formatStruggleLine({ struggled: 1, scored: 1 })).toBe(
      "1 of 1 learner struggled"
    );
    expect(formatStruggleLine({ struggled: null, scored: null })).toBe(
      "No score yet"
    );
  });
});

describe("presentClassInsights", () => {
  it("turns topics into cards with learner counts and question numbers", () => {
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
      struggled: 3,
      scored: 4,
      questionNumbers: "1",
      reteachStep: "Redo one fraction with a shared diagram.",
    });
    expect(view.cards[1]).toMatchObject({ struggled: 1, scored: 4 });
    expect(view.note).toBeNull();
    expect(formatStruggleLine(view.cards[0]!)).toBe("3 of 4 learners struggled");
  });
});

describe("formatClassInsightsChatMessage", () => {
  it("uses the insights topics, one reteach step each, and the script count", () => {
    const text = formatClassInsightsChatMessage(topicsPayload);
    expect(text.startsWith("Class insights")).toBe(true);
    expect(text).toContain("Based on 4 scripts.");
    expect(text).toContain("Based on this class set.");
    expect(text).toContain("Fractions");
    expect(text).toContain("2 of 2 learners struggled");
    expect(text).toContain("Redo one fraction with a shared diagram.");
    expect(text).toContain("Place value");
    expect(text).toContain("Show the tens and ones with counters.");
    expect(text).not.toContain("strand");
    expect(text).not.toContain("under half");
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
          scored: 8,
          belowHalf: 5,
          percentBelowHalf: 62.5,
          commonMistakes: [{ text: "Dropped the denominator", count: 2 }],
        }),
      ],
    });
    expect(text).toContain("Based on 2 scripts.");
    expect(text).toContain("Based on this class set.");
    expect(text).toContain("Question 1");
    expect(text).toContain("5 of 8 learners struggled");
    expect(text).toContain("Dropped the denominator");
    expect(text).not.toContain("under half");
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

describe("shouldRefreshClassInsights", () => {
  it("refetches when another script is marked and when marking ends", () => {
    expect(
      shouldRefreshClassInsights({
        previousMarked: 1,
        marked: 2,
        wasStillMarking: true,
        stillMarking: true,
      })
    ).toBe(true);
    expect(
      shouldRefreshClassInsights({
        previousMarked: 2,
        marked: 2,
        wasStillMarking: true,
        stillMarking: false,
      })
    ).toBe(true);
    expect(
      shouldRefreshClassInsights({
        previousMarked: 2,
        marked: 2,
        wasStillMarking: false,
        stillMarking: false,
      })
    ).toBe(false);
    expect(
      shouldRefreshClassInsights({
        previousMarked: 0,
        marked: 1,
        wasStillMarking: true,
        stillMarking: true,
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

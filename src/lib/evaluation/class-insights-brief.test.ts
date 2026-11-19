import { describe, expect, it } from "vitest";
import {
  fallbackBrief,
  missedQuestionGroups,
  readableAnswer,
  renderClassInsightsMarkdown,
  type ClassInsightsBrief,
  type ClassInsightsDossier,
} from "@/lib/evaluation/class-insights-brief";
import { splitCollapsibleMarkdown } from "@/lib/ai-hub/collapsible-markdown";

const dossier: ClassInsightsDossier = {
  assessmentTitle: "Multiplication",
  schemeText: null,
  learnerTotals: [
    { learner: "Learner 2682", awarded: 12, max: 15 },
    { learner: "Learner 6267", awarded: 10, max: 15 },
  ],
  questions: [
    {
      label: "A.1",
      correct: "7 × 8 = 56",
      answers: [
        { learner: "Learner 2682", awarded: 1, max: 1, answer: "7 × 8 = 56" },
        { learner: "Learner 6267", awarded: 1, max: 1, answer: "7 × 8 = 56" },
      ],
    },
    {
      label: "B.3",
      correct: "24 × 3 = 72",
      answers: [
        { learner: "Learner 2682", awarded: 0, max: 1, answer: "24 × 3 = 62" },
        { learner: "Learner 6267", awarded: 0, max: 1, answer: "24 × 3 = 27" },
      ],
    },
  ],
};

describe("renderClassInsightsMarkdown", () => {
  it("uses plain counts, quotes only real wrong answers, and collapses the question list", () => {
    const brief = fallbackBrief(dossier);
    const text = renderClassInsightsMarkdown(dossier, brief);

    expect(text.startsWith("Class insights")).toBe(true);
    expect(text).toContain("Based on this class set.");
    expect(text).toContain("**Class average: 11 of 15.**");
    expect(text).toContain("**2 of 2 learners** missed B.3.");
    expect(text).toContain("Learner 2682 wrote “24 × 3 = 62”.");
    expect(text).toContain("## Reteach plan for the next lesson");
    expect(text).toContain("## Learners to check in with");
    expect(text).toContain(":::collapse Per-question breakdown");
    expect(text).toContain("**2 of 2** got it right.");
    expect(text).not.toContain("under half");
    expect(text).not.toContain("strand");

    const blocks = splitCollapsibleMarkdown(text);
    expect(blocks.some((block) => block.kind === "collapse")).toBe(true);
  });

  it("counts each question when different learners missed them", () => {
    const split: ClassInsightsDossier = {
      ...dossier,
      questions: [
        ...dossier.questions,
        {
          label: "A.4",
          correct: "4 × 9 = 36",
          answers: [
            { learner: "Learner 2682", awarded: 1, max: 1, answer: "4 × 9 = 36" },
            { learner: "Learner 6267", awarded: 0, max: 1, answer: "4 × 9 = 32" },
          ],
        },
        {
          label: "A.5",
          correct: "3 × 15 = 45",
          answers: [
            { learner: "Learner 2682", awarded: 0, max: 1, answer: "3 × 15 = 42" },
            { learner: "Learner 6267", awarded: 1, max: 1, answer: "3 × 15 = 45" },
          ],
        },
      ],
    };
    const brief: ClassInsightsBrief = {
      ...fallbackBrief(split),
      struggled: missedQuestionGroups(split).filter((group) => group.labels[0]?.startsWith("A")),
      practice: [
        { question: "6 × 7", answer: "42" },
        { question: "8 × 4", answer: "32" },
      ],
    };
    brief.struggled = missedQuestionGroups(split)
      .filter((group) => group.labels[0]?.startsWith("A"))
      .map((group) => ({
        title: group.title,
        questionLabels: group.labels,
        misconception: "Keep the fact in mind.",
        quotes: [],
      }));
    const text = renderClassInsightsMarkdown(split, brief);
    expect(text).toContain("**1 of 2 learners** missed A.4.");
    expect(text).toContain("**1 of 2 learners** missed A.5.");
    expect(text).not.toContain("missed A.4, A.5");
    expect(text).toContain("1. 6 × 7 **Answer:** 42\n2. 8 × 4 **Answer:** 32");
  });
});

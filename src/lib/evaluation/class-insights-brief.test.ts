import { describe, expect, it } from "vitest";
import {
  fallbackBrief,
  readableAnswer,
  renderClassInsightsMarkdown,
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
});

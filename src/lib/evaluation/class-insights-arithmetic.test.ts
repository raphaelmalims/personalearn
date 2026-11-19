import { describe, expect, it } from "vitest";
import {
  arithmeticFailures,
  exactWrongRoute,
  explainMiss,
  repairArithmetic,
} from "@/lib/evaluation/class-insights-arithmetic";
import type { ClassInsightsBrief, ClassInsightsDossier } from "@/lib/evaluation/class-insights-brief";

describe("arithmeticFailures", () => {
  it("rejects 180 + 6 as the route to 168", () => {
    const failures = arithmeticFailures(
      "After 30×6=180, they added 6 instead of 8×6=48, so they wrote 168.",
      ["38 × 6 = 168"],
      "38 × 6 = 228"
    );
    expect(failures.some((failure) => failure.includes("186"))).toBe(true);
  });

  it("accepts 120 + 48 as the route to 168", () => {
    expect(
      arithmeticFailures(
        "20×6=120 and 8×6=48, then 120+48=168.",
        ["38 × 6 = 168"],
        "38 × 6 = 228"
      )
    ).toEqual([]);
  });

  it("accepts 360 + 5 as the route to 365", () => {
    expect(
      arithmeticFailures(
        "They added 360 + 5 instead of 360 + 45, so they wrote 365.",
        ["9×45=365"],
        "9×45=405 plants"
      )
    ).toEqual([]);
  });

  it("rejects dropping 400 when the written answer is 3248", () => {
    const failures = arithmeticFailures(
      "They dropped the tens partial product 50×8=400 and wrote 3248.",
      ["451 × 8 = 3248"],
      "451 × 8 = 3608"
    );
    expect(failures.some((failure) => failure.includes("3208"))).toBe(true);
  });

  it("rejects a doubling slip that does not equal 32", () => {
    const failures = arithmeticFailures(
      "4×9 was a doubling slip and they wrote 32.",
      ["4 × 9 = 32"],
      "4 × 9 = 36"
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it("accepts 4×8 instead of 4×9 for 32", () => {
    expect(
      arithmeticFailures(
        "They wrote 32 (4×8 instead of 4×9).",
        ["4 × 9 = 32"],
        "4 × 9 = 36"
      )
    ).toEqual([]);
  });
});

describe("exactWrongRoute", () => {
  it("finds the tens misread on 38 × 6", () => {
    const route = exactWrongRoute("38 × 6 = 228", "38 × 6 = 168");
    expect(route).toContain("28 × 6 = 168");
    expect(route).toContain("20 × 6 instead of 30 × 6");
  });

  it("finds 4 × 8 for 32", () => {
    expect(exactWrongRoute("4 × 9 = 36", "4 × 9 = 32")).toContain("4 × 8 = 32");
  });

  it("finds the unshifted tens on 451 × 8", () => {
    const route = exactWrongRoute("451 × 8 = 3608", "451 × 8 = 3248");
    expect(route).toContain("3248");
    expect(route).toContain("40");
    expect(route).not.toContain("3208");
  });

  it("finds 360 + 5 for 365", () => {
    expect(exactWrongRoute("9×45=405 plants", "9 × 45 = 365")).toContain("365");
  });

  it("does not invent a route for 1795", () => {
    expect(exactWrongRoute("245×7=1715 bottles", "245 × 7 = 1795")).toBeNull();
  });

  it("finds 137 × 6 for 822", () => {
    expect(exactWrongRoute("138×6=828 pages", "138 × 6 = 822")).toContain("137 × 6 = 822");
  });
});

describe("repairArithmetic", () => {
  const dossier: ClassInsightsDossier = {
    assessmentTitle: "Multiplication",
    schemeText: null,
    learnerTotals: [{ learner: "Learner 6267", awarded: 0, max: 2 }],
    questions: [
      {
        label: "A.4",
        correct: "4 × 9 = 36",
        answers: [
          { learner: "Learner 6267", awarded: 0, max: 1, answer: "4 × 9 = 32" },
        ],
      },
      {
        label: "B.3",
        correct: "38 × 6 = 228",
        answers: [
          { learner: "Learner 6267", awarded: 0, max: 1, answer: "38 × 6 = 168" },
        ],
      },
    ],
  };

  it("replaces a check-in whose arithmetic misses the written answer", () => {
    const brief: ClassInsightsBrief = {
      headline: "The class needs another look at place value.",
      wentWell: "The early facts held.",
      struggled: [
        {
          title: "38 × 6",
          questionLabels: ["B.3"],
          misconception: "After 30×6=180, they added 6 and wrote 168.",
          quotes: [{ learner: "Learner 6267", answer: "38 × 6 = 168" }],
        },
      ],
      moves: ["Show each partial on its own line.", "Add the lines together on the board."],
      workedExample: "38 × 6 = 228.",
      practice: [
        { question: "27 × 4", answer: "108" },
        { question: "19 × 3", answer: "57" },
      ],
      checkIns: [
        {
          learner: "Learner 6267",
          gap: "4×9 was a doubling slip and they wrote 32. B3 added 180 + 6 to get 168.",
        },
      ],
    };

    const repaired = repairArithmetic(brief, dossier);
    expect(repaired.struggled[0]?.misconception).toContain(
      "Slip when adding the partial products (180 + 48 = 228)"
    );
    expect(repaired.struggled[0]?.misconception).not.toContain("20 × 6");
    expect(repaired.checkIns[0]?.gap).toContain(
      "4 × 9 written as 32 (that’s 4 × 8; answer 36)"
    );
    expect(repaired.checkIns[0]?.gap).not.toContain("doubling");
    expect(repaired.checkIns[0]?.gap).toContain(
      "Slip when adding the partial products (180 + 48 = 228)"
    );
  });

  it("replaces a vague reason when a sum equal to the written answer is missing", () => {
    const brief: ClassInsightsBrief = {
      headline: "Place value needs another lesson.",
      wentWell: "The early facts held.",
      struggled: [
        {
          title: "38 × 6",
          questionLabels: ["B.3"],
          misconception: "The final answer does not match the working. The answer is 228.",
          quotes: [{ learner: "Learner 6267", answer: "38 × 6 = 168" }],
        },
      ],
      moves: ["Show each partial on its own line.", "Add the lines on the board."],
      workedExample: "38 × 6 = 228.",
      practice: [
        { question: "27 × 4", answer: "108" },
        { question: "19 × 3", answer: "57" },
      ],
      checkIns: [
        { learner: "Learner 6267", gap: "A.4 written 32, correct 36. B.3 written 168, correct 228." },
      ],
    };

    const repaired = repairArithmetic(brief, dossier);
    expect(repaired.struggled[0]?.misconception).toContain("180 + 48 = 228");
    expect(repaired.struggled[0]?.misconception).not.toContain("wrote");
    expect(repaired.checkIns[0]?.gap).toContain("4 × 9 written as 32");
  });

  it("does not call a shown operand a misread digit", () => {
    expect(
      explainMiss("38 × 6 = 228", "38 × 6 = (30×6)+(8×6)=168")
    ).toBe("Slip when adding the partial products (180 + 48 = 228).");
    expect(explainMiss("138 × 6 = 828", "138×6=(100×6)+(30×6)+(8×6)=822")).toBe(
      "Slip when adding the partial products (600 + 180 + 48 = 828)."
    );
    expect(explainMiss("38 × 6 = 228", "28 × 6 = 168")).toContain("20 × 6");
  });
});

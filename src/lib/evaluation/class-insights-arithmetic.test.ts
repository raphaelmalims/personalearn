import { describe, expect, it } from "vitest";
import {
  arithmeticFailures,
  exactWrongRoute,
  explainMiss,
  missSkill,
  reteachFromMarks,
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
    expect(repaired.struggled[0]?.misconception).toContain("3 × 6 was taken as 12");
    expect(repaired.struggled[0]?.misconception).toContain("120");
    expect(repaired.struggled[0]?.misconception).not.toContain("20 × 6");
    expect(repaired.checkIns[0]?.gap).toContain("Focus on");
    expect(repaired.checkIns[0]?.gap).not.toContain("doubling");
    expect(repaired.checkIns[0]?.gap).not.toContain("180 + 6");
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
    expect(repaired.struggled[0]?.misconception).toContain("3 × 6 was taken as 12");
    expect(repaired.checkIns[0]?.gap).toContain("Focus on");
  });

  it("names the partial product on B.3 when 120 + 48 = 168", () => {
    expect(explainMiss("38 × 6 = 228", "38 × 6 = (30×6)+(8×6)=168")).toBe(
      "30 × 6 taken as 120 (should be 180), answer 228"
    );
    expect(explainMiss("38 × 6 = 228", "120 + 48 = 168")).toBe(
      "30 × 6 taken as 120 (should be 180), answer 228"
    );
  });

  it("names the partial product on C.3 when 3200 + 40 + 8 = 3248", () => {
    expect(explainMiss("451 × 8 = 3608", "451 × 8 = (400×8)+(50×8)+(1×8)=3248")).toBe(
      "50 × 8 taken as 40 (should be 400), answer 3608"
    );
    expect(explainMiss("451 × 8 = 3608", "3200 + 40 + 8 = 3248")).toBe(
      "50 × 8 taken as 40 (should be 400), answer 3608"
    );
  });

  it("names the partial product on D.2 when 1400 + 360 + 35 = 1795", () => {
    expect(explainMiss("245 × 7 = 1715 bottles", "245×7=(200×7)+(40×7)+(5×7)=1795")).toBe(
      "40 × 7 taken as 360 (should be 280), answer 1715"
    );
    expect(explainMiss("245 × 7 = 1715 bottles", "1400 + 360 + 35 = 1795")).toBe(
      "40 × 7 taken as 360 (should be 280), answer 1715"
    );
  });

  it("names the partial product on D.3 when 600 + 180 + 42 = 822", () => {
    expect(explainMiss("138 × 6 = 828 pages", "138×6=(100×6)+(30×6)+(8×6)=822")).toBe(
      "8 × 6 taken as 42 (should be 48), answer 828"
    );
    expect(explainMiss("138 × 6 = 828 pages", "600 + 180 + 42 = 822")).toBe(
      "8 × 6 taken as 42 (should be 48), answer 828"
    );
  });

  it("names the partial product on D.1 when 360 + 5 = 365", () => {
    expect(explainMiss("9 × 45 = 405 plants", "9×45=(9×40)+(9×5)=365")).toBe(
      "9 × 5 taken as 5 (should be 45), answer 405"
    );
    expect(explainMiss("9 × 45 = 405 plants", "360 + 5 = 365")).toBe(
      "9 × 5 taken as 5 (should be 45), answer 405"
    );
  });

  it("calls it an adding slip only when the written partials are already right", () => {
    expect(explainMiss("38 × 6 = 228", "180 + 48 = 168")).toBe(
      "Slip when adding the partial products (180 + 48 = 228)."
    );
  });

  it("says check working when no single partial product fits", () => {
    expect(explainMiss("38 × 6 = 228", "38 × 6 = 200")).toBe(
      "answer off by 28, check working"
    );
    expect(explainMiss("38 × 6 = 228", "100 + 40 + 8 = 148")).toBe(
      "answer off by 80, check working"
    );
  });

  it("classifies a dropped zero, a fact with the zero kept, and a copied digit", () => {
    expect(missSkill("451 × 8 = 3608", "3200 + 40 + 8 = 3248")).toBe("place");
    expect(missSkill("9 × 45 = 405", "360 + 5 = 365")).toBe("fact");
    expect(missSkill("38 × 6 = 228", "120 + 48 = 168")).toBe("fact-zero");
    expect(missSkill("245 × 7 = 1715", "1400 + 360 + 35 = 1795")).toBe("fact-zero");
    expect(missSkill("138 × 6 = 828", "600 + 180 + 42 = 822")).toBe("fact");
    expect(missSkill("4 × 9 = 36", "4 × 9 = 32")).toBe("fact");
    expect(missSkill("3 × 15 = 45", "3 × 15 = 42")).toBe("fact");
  });

  it("computes new practice answers and does not reuse the paper questions", () => {
    const lesson: ClassInsightsDossier = {
      assessmentTitle: "Multiplication",
      schemeText: null,
      learnerTotals: [{ learner: "Learner 2682", awarded: 9, max: 15 }],
      questions: [
        {
          label: "B.3",
          correct: "38 × 6 = 228",
          answers: [{ learner: "Learner 2682", awarded: 0, max: 1, answer: "120 + 48 = 168" }],
        },
        {
          label: "C.3",
          correct: "451 × 8 = 3608",
          answers: [{ learner: "Learner 2682", awarded: 0, max: 1, answer: "3200 + 40 + 8 = 3248" }],
        },
        {
          label: "D.1",
          correct: "9 × 45 = 405 plants",
          answers: [{ learner: "Learner 2682", awarded: 0, max: 1, answer: "360 + 5 = 365" }],
        },
        {
          label: "D.2",
          correct: "245 × 7 = 1715 bottles",
          answers: [{ learner: "Learner 2682", awarded: 0, max: 1, answer: "1400 + 360 + 35 = 1795" }],
        },
        {
          label: "D.3",
          correct: "138 × 6 = 828 pages",
          answers: [{ learner: "Learner 2682", awarded: 0, max: 1, answer: "600 + 180 + 42 = 822" }],
        },
      ],
    };
    const practice = reteachFromMarks(lesson).practice;
    const products = practice.map((item) => {
      const factors = item.question.match(/(\d+)\s*×\s*(\d+)/);
      return factors ? Number(factors[1]) * Number(factors[2]) : 240;
    });
    expect(practice.map((item) => item.answer)).toEqual(["420", "282", "2816", "49", "240 pages"]);
    expect(products).toEqual([420, 282, 2816, 49, 240]);
    expect(practice.map((item) => item.question)).not.toContain("38 × 6");
    expect(practice.map((item) => item.question)).not.toContain("451 × 8");
  });
});

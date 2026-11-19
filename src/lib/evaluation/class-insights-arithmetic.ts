import type {
  ClassInsightsBrief,
  ClassInsightsDossier,
} from "@/lib/evaluation/class-insights-brief";

type ParsedExpr = {
  text: string;
  value: number;
  stated: number | null;
};

const EXPRESSION =
  /(?:\d+|\([^()]+\))(?:\s*[×xX*+÷/\-]\s*(?:\d+|\([^()]+\)))+(?:\s*=\s*\d+)?/g;

function resultNumber(answer: string): number | null {
  const nums = answer.match(/\d+/g);
  if (!nums?.length) return null;
  return Number(nums[nums.length - 1]);
}

function unique(values: number[]): number[] {
  return [...new Set(values)];
}

/** Evaluate a sum or product. Null when the text is not plain arithmetic. */
export function evaluateArithmetic(source: string): number | null {
  const normalized = source
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[xX]/g, "*")
    .replace(/\s+/g, "");
  if (!normalized || !/^[\d*+/().-]+$/.test(normalized)) return null;
  try {
    let index = 0;
    const expr = (): number => {
      let left = term();
      while (normalized[index] === "+" || normalized[index] === "-") {
        const op = normalized[index++];
        const right = term();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    };
    const term = (): number => {
      let left = factor();
      while (normalized[index] === "*" || normalized[index] === "/") {
        const op = normalized[index++];
        const right = factor();
        if (op === "/" && right === 0) throw new Error("divide by zero");
        left = op === "*" ? left * right : left / right;
      }
      return left;
    };
    const factor = (): number => {
      if (normalized[index] === "(") {
        index += 1;
        const value = expr();
        if (normalized[index] !== ")") throw new Error("parenthesis");
        index += 1;
        return value;
      }
      const start = index;
      while (index < normalized.length && /[0-9.]/.test(normalized[index])) index += 1;
      if (start === index) throw new Error("number");
      return Number(normalized.slice(start, index));
    };
    const value = expr();
    if (index !== normalized.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function extractExpressions(text: string): ParsedExpr[] {
  const found: ParsedExpr[] = [];
  for (const match of text.matchAll(EXPRESSION)) {
    const raw = match[0];
    const [left, statedText] = raw.split("=").map((part) => part.trim());
    const value = evaluateArithmetic(left);
    if (value === null) continue;
    const stated = statedText ? Number(statedText) : null;
    found.push({
      text: raw.replace(/\s+/g, " ").trim(),
      value,
      stated: stated !== null && Number.isFinite(stated) ? stated : null,
    });
  }
  return found;
}

function withoutQuotes(text: string): string {
  return text
    .replace(/“[^”]*”/g, " ")
    .replace(/"[^"]*"/g, " ")
    .replace(/‘[^’]*’/g, " ");
}

function sentencesOf(text: string): string[] {
  const parts = withoutQuotes(text)
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

function claimAndAlternative(sentence: string): { claim: string; alternative: string } {
  const instead = sentence.match(/instead of\s+([^,.;]+)/i);
  if (!instead) return { claim: sentence, alternative: "" };
  return {
    claim: sentence.replace(instead[0], " "),
    alternative: instead[1] ?? "",
  };
}

/**
 * Reasons that name a sum or product must land on the written wrong answer.
 * A mismatch is a failure message. An explanation with no arithmetic is fine.
 */
export function arithmeticFailures(
  text: string,
  wrongAnswers: string[],
  correctAnswer = ""
): string[] {
  const wrongs = unique(
    wrongAnswers
      .map(resultNumber)
      .filter((value): value is number => value !== null)
  );
  const correct = resultNumber(correctAnswer);
  const failures: string[] = [];

  for (const sentence of sentencesOf(text)) {
    const { claim, alternative } = claimAndAlternative(sentence);
    for (const part of [claim, alternative]) {
      for (const expr of extractExpressions(part)) {
        if (expr.stated !== null && expr.stated !== expr.value) {
          failures.push(`${expr.text} equals ${expr.value}, not ${expr.stated}.`);
        }
      }
    }

    const added = claim.match(/added\s+(\d+)\b(?!\s*[×xX*+÷/])/i);
    if (added) {
      const before = claim.slice(0, added.index ?? 0);
      const prior = before.match(/\d+/g);
      const base = prior ? Number(prior[prior.length - 1]) : null;
      const extra = Number(added[1]);
      if (base !== null && wrongs.length > 0) {
        const sum = base + extra;
        if (!wrongs.includes(sum)) {
          failures.push(
            `${base} + ${extra} is ${sum}, not the written answer ${wrongs.join(" or ")}.`
          );
        }
      }
    }

    const dropped = claim.match(
      /(?:dropped|left out|omitted)\s+(?:[\w]+\s+){0,6}(\d+(?:\s*[×xX*]\s*\d+)?)/i
    );
    if (dropped && correct !== null && wrongs.length > 0) {
      const amount = evaluateArithmetic(dropped[1]) ?? Number(dropped[1]);
      if (Number.isFinite(amount)) {
        const remainder = correct - amount;
        if (!wrongs.includes(remainder)) {
          failures.push(
            `${correct} − ${amount} is ${remainder}, not the written answer ${wrongs.join(" or ")}.`
          );
        }
      }
    }

    const cause =
      /\b(added|dropped|doubl(?:e|ed|ing)|instead of|multiplied)\b/i.test(sentence);
    if (!cause || wrongs.length === 0) continue;
    const routes = [
      ...extractExpressions(claim).map((expr) => expr.value),
      ...(added
        ? (() => {
            const before = claim.slice(0, added.index ?? 0);
            const prior = before.match(/\d+/g);
            return prior ? [Number(prior[prior.length - 1]) + Number(added[1])] : [];
          })()
        : []),
    ];
    if (!routes.some((value) => wrongs.includes(value))) {
      failures.push(
        `No sum or product in that explanation equals the written answer ${wrongs.join(" or ")}.`
      );
    }
  }

  return [...new Set(failures)];
}

function places(value: number): { digit: number; place: number; name: string }[] {
  const text = String(value);
  const names = ["ones", "tens", "hundreds", "thousands"];
  return text.split("").map((char, index) => {
    const power = text.length - 1 - index;
    return {
      digit: Number(char),
      place: Number(char) * 10 ** power,
      name: names[power] ?? "place",
    };
  });
}

function multiplication(correct: string): { left: number; right: number } | null {
  const match = correct.match(/(\d+)\s*[×xX*]\s*(\d+)/);
  if (!match) return null;
  return { left: Number(match[1]), right: Number(match[2]) };
}

function digitChange(
  factor: number,
  other: number,
  wrong: number,
  factorFirst: boolean
): string | null {
  const original = String(factor);
  let best: { edited: number; index: number; distance: number } | null = null;
  for (let index = 0; index < original.length; index += 1) {
    for (let digit = 0; digit <= 9; digit += 1) {
      if (String(digit) === original[index]) continue;
      if (index === 0 && digit === 0) continue;
      const edited = Number(
        original.slice(0, index) + String(digit) + original.slice(index + 1)
      );
      if (edited * other !== wrong) continue;
      const distance = Math.abs(digit - Number(original[index]));
      if (!best || distance < best.distance) best = { edited, index, distance };
    }
  }
  if (!best) return null;
  const shown = factorFirst
    ? `${best.edited} × ${other}`
    : `${other} × ${best.edited}`;
  const place = places(factor)[best.index];
  const newDigit = String(best.edited)[best.index];
  const power = original.length - 1 - best.index;
  const placeSum =
    original.length > 1 && place
      ? ` (${Number(newDigit) * 10 ** power} × ${other} instead of ${place.place} × ${other})`
      : "";
  return `${shown} = ${wrong}. The ${place?.name ?? "digit"} digit was taken as ${newDigit}, not ${place?.digit}${placeSum}.`;
}

function partialChange(factor: number, other: number, wrong: number): string | null {
  if (factor < 10) return null;
  const parts = places(factor);
  const products = parts.map((part) => part.place * other);
  for (let index = 0; index < parts.length; index += 1) {
    const face = parts[index].digit;
    const faceTimes = face * other;
    const replacements = [face, faceTimes];
    for (const replacement of replacements) {
      if (replacement === products[index]) continue;
      const sum = products.reduce(
        (total, value, place) => total + (place === index ? replacement : value),
        0
      );
      if (sum !== wrong) continue;
      const equation = products
        .map((value, place) => (place === index ? replacement : value))
        .join(" + ");
      return `${equation} = ${wrong}. The ${parts[index].name} uses ${replacement}, not ${parts[index].place} × ${other} = ${products[index]}.`;
    }
  }
  return null;
}

function hasToken(text: string, value: number): boolean {
  return new RegExp(`(?<!\\d)${value}(?!\\d)`).test(text);
}

function placeValues(factor: number): number[] {
  const digits = String(Math.abs(factor)).split("");
  return digits.map(
    (digit, index) => Number(digit) * 10 ** (digits.length - 1 - index)
  );
}

function showsPlaceSplit(text: string, factor: number, other: number): boolean {
  if (factor < 10) return false;
  const places = placeValues(factor).filter((place) => place > 0);
  return places.length > 1 && places.every((place) => hasToken(text, place)) && hasToken(text, other);
}

/** A one-digit edit that reproduces the written product, for a times-table fact. */
function factEdit(left: number, right: number, wrong: number): string | null {
  const tryEdit = (factor: number, other: number, factorFirst: boolean): string | null => {
    if (factor > 15) return null;
    const original = String(factor);
    for (let index = 0; index < original.length; index += 1) {
      for (let digit = 0; digit <= 9; digit += 1) {
        if (String(digit) === original[index]) continue;
        if (index === 0 && digit === 0 && original.length > 1) continue;
        const edited = Number(
          original.slice(0, index) + String(digit) + original.slice(index + 1)
        );
        if (edited * other !== wrong) continue;
        return factorFirst ? `${edited} × ${other}` : `${other} × ${edited}`;
      }
    }
    return null;
  };
  return tryEdit(right, left, false) ?? tryEdit(left, right, true);
}

type Step = { a: number; b: number; product: number };

function stepsFor(left: number, right: number): Step[] {
  const splitLeft = placeValues(left).filter((place) => place > 0);
  const splitRight = placeValues(right).filter((place) => place > 0);
  const split = left >= right ? splitLeft : splitRight;
  const other = left >= right ? right : left;
  const bigOnLeft = left >= right;
  if (split.length < 2) return [];
  return split.map((place) => ({
    a: bigOnLeft ? place : other,
    b: bigOnLeft ? other : place,
    product: place * other,
  }));
}

function digitEdits(factor: number): number[] {
  const original = String(factor);
  const edited: number[] = [];
  for (let index = 0; index < original.length; index += 1) {
    for (let digit = 0; digit <= 9; digit += 1) {
      if (String(digit) === original[index]) continue;
      if (index === 0 && digit === 0 && original.length > 1) continue;
      edited.push(Number(original.slice(0, index) + String(digit) + original.slice(index + 1)));
    }
  }
  return edited;
}

function errorClass(step: Step, taken: number): "bare" | "shift" | "digit" | null {
  if (taken === step.product) return null;
  if (taken === step.a || taken === step.b) return "bare";
  if (
    (step.a % 10 === 0 && (step.a / 10) * step.b === taken) ||
    (step.b % 10 === 0 && step.a * (step.b / 10) === taken)
  ) {
    return "shift";
  }
  const digitHit =
    digitEdits(step.a).some((value) => value * step.b === taken) ||
    digitEdits(step.b).some((value) => step.a * value === taken);
  return digitHit ? "digit" : null;
}

type MissCause =
  | { kind: "fact"; text: string }
  | { kind: "partial"; wrong: number; text: string }
  | { kind: "adding"; text: string }
  | { kind: "off"; text: string }
  | { kind: "route"; text: string };

function missCause(correct: string, written: string): MissCause {
  const factors = multiplication(correct);
  const wrong = resultNumber(written);
  const right = factors ? factors.left * factors.right : resultNumber(correct);
  if (!factors || wrong === null || right === null || wrong === right) {
    return { kind: "route", text: `The answer is ${correct}.` };
  }
  const { left, right: other } = factors;
  const writtenFactors = multiplication(written);
  const showsCorrectFactors = hasToken(written, left) && hasToken(written, other);
  if (
    writtenFactors &&
    (writtenFactors.left !== left || writtenFactors.right !== other) &&
    !showsCorrectFactors
  ) {
    return { kind: "route", text: exactWrongRoute(correct, written) ?? `The answer is ${correct}.` };
  }
  const alt = factEdit(left, other, wrong);
  if (alt && Math.max(left, other) <= 15) {
    return {
      kind: "fact",
      text: `${left} × ${other} written as ${wrong} (that’s ${alt}; answer ${right}).`,
    };
  }
  const steps = stepsFor(left, other);
  const products = steps.map((step) => step.product);
  const correctSum = products.reduce((total, value) => total + value, 0);
  if (
    steps.length > 1 &&
    correctSum === right &&
    products.every((product) => hasToken(written, product)) &&
    wrong !== correctSum
  ) {
    return {
      kind: "adding",
      text: `Slip when adding the partial products (${products.join(" + ")} = ${correctSum}).`,
    };
  }
  if (steps.length > 1 && correctSum === right) {
    for (const kind of ["bare", "shift", "digit"] as const) {
      const hits = steps.filter((step) => {
        const taken = wrong - (correctSum - step.product);
        return taken >= 0 && errorClass(step, taken) === kind;
      });
      if (hits.length === 1) {
        const step = hits[0];
        const taken = wrong - (correctSum - step.product);
        return {
          kind: "partial",
          wrong,
          text: `${step.a} × ${step.b} taken as ${taken} (should be ${step.product}), answer ${right}`,
        };
      }
      if (hits.length > 1) break;
    }
  }
  if (steps.length > 1 && wrong !== right) {
    return { kind: "off", text: `answer off by ${Math.abs(right - wrong)}, check working` };
  }
  return { kind: "route", text: exactWrongRoute(correct, written) ?? `The answer is ${correct}.` };
}

/** Explain one wrong answer from the partial products, without naming a learner. */
export function explainMiss(correct: string, written: string): string {
  return missCause(correct, written).text;
}

/** A route that equals the written answer, or null when none is exact. */
export function exactWrongRoute(correct: string, wrong: string): string | null {
  const factors = multiplication(correct);
  const target = resultNumber(wrong);
  if (!factors || target === null) return null;
  if (factors.left * factors.right === target) return null;
  return (
    digitChange(factors.left, factors.right, target, true) ??
    digitChange(factors.right, factors.left, target, false) ??
    partialChange(factors.left, factors.right, target) ??
    partialChange(factors.right, factors.left, target)
  );
}

function explainsResult(text: string, result: number): boolean {
  return extractExpressions(withoutQuotes(text)).some(
    (expr) => expr.value === result || expr.stated === result
  );
}

function routeGaps(
  dossier: ClassInsightsDossier,
  labels: string[],
  text: string,
  learner?: string
): string[] {
  const gaps: string[] = [];
  for (const label of labels) {
    const question = dossier.questions.find((item) => item.label === label);
    if (!question) continue;
    for (const answer of question.answers) {
      if (!(answer.max > 0 && answer.awarded < answer.max)) continue;
      if (learner && answer.learner !== learner) continue;
      if (!exactWrongRoute(question.correct, answer.answer)) continue;
      const target = resultNumber(answer.answer);
      if (target === null || explainsResult(text, target)) continue;
      const gap = `${label} does not show a sum or product equal to ${target}.`;
      if (!gaps.includes(gap)) gaps.push(gap);
    }
  }
  return gaps;
}

function questionWrongAnswers(
  dossier: ClassInsightsDossier,
  labels: string[]
): { wrong: string[]; correct: string } {
  const wrong: string[] = [];
  const correct: string[] = [];
  for (const label of labels) {
    const question = dossier.questions.find((item) => item.label === label);
    if (!question) continue;
    if (question.correct) correct.push(question.correct);
    for (const answer of question.answers) {
      if (answer.max > 0 && answer.awarded < answer.max && answer.answer) {
        wrong.push(answer.answer);
      }
    }
  }
  return { wrong, correct: correct.join("; ") };
}

export function explainTopic(
  dossier: ClassInsightsDossier,
  labels: string[]
): string {
  const lines: string[] = [];
  for (const label of labels) {
    const question = dossier.questions.find((item) => item.label === label);
    if (!question) continue;
    const groups = new Map<string, { cause: MissCause; names: string[] }>();
    for (const answer of question.answers) {
      if (!(answer.max > 0 && answer.awarded < answer.max)) continue;
      const cause = missCause(question.correct, answer.answer);
      const key = `${cause.kind}:${cause.kind === "partial" ? cause.wrong : ""}:${cause.text}`;
      const group = groups.get(key) ?? { cause, names: [] };
      group.names.push(answer.learner);
      groups.set(key, group);
    }
    for (const group of groups.values()) {
      const who = group.names.length === 2 ? "Both learners" : group.names.join(" and ");
      if (group.cause.kind === "partial") {
        lines.push(`${who} wrote ${group.cause.wrong}: ${group.cause.text}.`);
      } else if (group.names.length === 1) {
        lines.push(`${group.names[0]}: ${group.cause.text}`);
      } else {
        lines.push(`${who}: ${group.cause.text}`);
      }
    }
  }
  return lines.join(" ");
}

function lostOnlyTheUnit(correct: string, written: string): boolean {
  const right = resultNumber(correct);
  const wrong = resultNumber(written);
  if (right === null || wrong === null || right !== wrong) return false;
  return /[A-Za-z]/.test(correct) && !/[A-Za-z]/.test(written);
}

/** Reteach lines from the diagnosed misses. No unit reminder unless a unit was the miss. */
export function reteachFromMarks(dossier: ClassInsightsDossier): {
  moves: string[];
  workedExample: string;
  practice: { question: string; answer: string }[];
} {
  const partials: string[] = [];
  const facts: string[] = [];
  let example = "";
  let unit = false;
  for (const question of dossier.questions) {
    for (const answer of question.answers) {
      if (!(answer.max > 0 && answer.awarded < answer.max)) continue;
      if (lostOnlyTheUnit(question.correct, answer.answer)) unit = true;
      const cause = missCause(question.correct, answer.answer);
      if (cause.kind === "partial" && !partials.includes(cause.text)) {
        partials.push(cause.text);
        if (!example) {
          const factors = multiplication(question.correct);
          example = factors
            ? `${factors.left} × ${factors.right}. ${cause.text}.`
            : cause.text;
        }
      }
      if (cause.kind === "fact" && !facts.includes(cause.text)) facts.push(cause.text);
    }
  }
  const moves = [
    partials.length > 0
      ? `Re-teach the partial products that were evaluated wrongly: ${partials.join("; ")}.`
      : "",
    facts.length > 0
      ? `Drill the facts that slipped: ${facts.map((fact) => fact.replace(/\.$/, "")).join("; ")}.`
      : "",
    unit ? "Ask for the unit when the number is already right." : "",
  ].filter(Boolean);
  while (moves.length < 2) {
    moves.push("Put one missed question on the board and mark it with the class.");
  }
  const practice = partials.slice(0, 2).map((text) => {
    const match = text.match(/(\d+) × (\d+) taken as \d+ \(should be (\d+)\)/);
    return match
      ? { question: `${match[1]} × ${match[2]}`, answer: match[3] }
      : { question: "One partial product from the lesson", answer: "Use the board working" };
  });
  if (example) {
    const factors = example.match(/^(\d+) × (\d+)/);
    if (factors && practice.length < 3) {
      practice.push({
        question: `${factors[1]} × ${factors[2]}`,
        answer: String(Number(factors[1]) * Number(factors[2])),
      });
    }
  }
  return {
    moves: moves.slice(0, 3),
    workedExample: example || "Work one missed question to the scheme answer.",
    practice: practice.slice(0, 3),
  };
}

function repairedTopic(
  dossier: ClassInsightsDossier,
  labels: string[]
): string {
  return explainTopic(dossier, labels);
}

function repairedCheckIn(dossier: ClassInsightsDossier, learner: string): string {
  const parts: string[] = [];
  for (const question of dossier.questions) {
    const answer = question.answers.find(
      (row) => row.learner === learner && row.max > 0 && row.awarded < row.max
    );
    if (!answer) continue;
    parts.push(`${question.label}: ${explainMiss(question.correct, answer.answer)}`);
  }
  return parts.join(" ");
}

/** Failures still in the brief, for one retry prompt. */
export function collectArithmeticFailures(
  brief: ClassInsightsBrief,
  dossier: ClassInsightsDossier
): string[] {
  const failures: string[] = [];
  brief.struggled.forEach((topic, index) => {
    const { wrong, correct } = questionWrongAnswers(dossier, topic.questionLabels);
    for (const failure of arithmeticFailures(topic.misconception, wrong, correct)) {
      failures.push(`Struggle ${index + 1} (${topic.questionLabels.join(", ")}): ${failure}`);
    }
    for (const gap of routeGaps(dossier, topic.questionLabels, topic.misconception)) {
      failures.push(`Struggle ${index + 1} (${topic.questionLabels.join(", ")}): ${gap}`);
    }
  });
  brief.checkIns.forEach((row) => {
    const pool = wrongAnswersForLearner(dossier, row.learner);
    for (const failure of arithmeticFailures(row.gap, pool)) {
      failures.push(`${row.learner}: ${failure}`);
    }
    for (const gap of routeGaps(
      dossier,
      dossier.questions.map((question) => question.label),
      row.gap,
      row.learner
    )) {
      failures.push(`${row.learner}: ${gap}`);
    }
  });
  return failures;
}

function wrongAnswersForLearner(dossier: ClassInsightsDossier, learner: string): string[] {
  const answers: string[] = [];
  for (const question of dossier.questions) {
    for (const answer of question.answers) {
      if (answer.learner === learner && answer.max > 0 && answer.awarded < answer.max) {
        answers.push(answer.answer);
      }
    }
  }
  return answers;
}

/** Replace any explanation whose arithmetic does not equal the written answer. */
export function repairArithmetic(
  brief: ClassInsightsBrief,
  dossier: ClassInsightsDossier
): ClassInsightsBrief {
  return {
    ...brief,
    struggled: brief.struggled.map((topic) => {
      const { wrong, correct } = questionWrongAnswers(dossier, topic.questionLabels);
      const failures = [
        ...arithmeticFailures(topic.misconception, wrong, correct),
        ...routeGaps(dossier, topic.questionLabels, topic.misconception),
      ];
      if (failures.length === 0) return topic;
      return {
        ...topic,
        misconception: repairedTopic(dossier, topic.questionLabels),
      };
    }),
    checkIns: brief.checkIns.map((row) => {
      const pool = wrongAnswersForLearner(dossier, row.learner);
      const failures = [
        ...arithmeticFailures(row.gap, pool),
        ...routeGaps(
          dossier,
          dossier.questions.map((question) => question.label),
          row.gap,
          row.learner
        ),
      ];
      if (failures.length === 0) return row;
      return { ...row, gap: repairedCheckIn(dossier, row.learner) };
    }),
  };
}

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

/** Bare sums such as "3200 + 40 + 8", ignoring products written as 50×8. */
function additionTerms(text: string): number[][] {
  const found: number[][] = [];
  for (const match of text.matchAll(/(?<!\d)(\d+(?:\s*\+\s*\d+)+)(?!\d)/g)) {
    found.push(match[1].split("+").map((part) => Number(part.trim())));
  }
  return found;
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

type PartialSkill = "place" | "fact-zero" | "fact";

type MissCause =
  | { kind: "fact"; text: string }
  | { kind: "partial"; wrong: number; text: string; skill: PartialSkill; step: Step; taken: number }
  | { kind: "adding"; text: string }
  | { kind: "off"; text: string }
  | { kind: "route"; text: string };

function trailingScale(factor: number): { core: number; scale: number } | null {
  if (factor % 10 !== 0) return null;
  let core = factor;
  let scale = 1;
  while (core % 10 === 0) {
    core /= 10;
    scale *= 10;
  }
  return { core, scale };
}

/** The zero stayed, and the fact on the other digits is wrong. */
function factWithZero(
  step: Step,
  taken: number
): { core: number; other: number; coreTaken: number; coreRight: number } | null {
  for (const factor of [step.a, step.b]) {
    const scaled = trailingScale(factor);
    if (!scaled || taken % scaled.scale !== 0) continue;
    const other = factor === step.a ? step.b : step.a;
    const coreTaken = taken / scaled.scale;
    const coreRight = scaled.core * other;
    if (coreTaken !== coreRight) {
      return { core: scaled.core, other, coreTaken, coreRight };
    }
  }
  return null;
}

/** Place value only when the written partial is the right one times or divided by 10. */
function partialSkill(step: Step, taken: number): PartialSkill {
  if (taken > 0 && (taken * 10 === step.product || step.product * 10 === taken)) return "place";
  if (factWithZero(step, taken)) return "fact-zero";
  return "fact";
}

function partialCause(step: Step, taken: number, wrong: number, right: number): MissCause {
  return {
    kind: "partial",
    wrong,
    skill: partialSkill(step, taken),
    step,
    taken,
    text: `${step.a} × ${step.b} taken as ${taken} (should be ${step.product}), answer ${right}`,
  };
}

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
    const writtenSum = additionTerms(written).find(
      (terms) => terms.reduce((total, value) => total + value, 0) === wrong
    );
    if (writtenSum) {
      const remaining = [...steps];
      const unmatched: number[] = [];
      for (const term of writtenSum) {
        const index = remaining.findIndex((step) => step.product === term);
        if (index >= 0) remaining.splice(index, 1);
        else unmatched.push(term);
      }
      if (unmatched.length === 1 && remaining.length === 1) {
        return partialCause(remaining[0], unmatched[0], wrong, right);
      }
      return { kind: "off", text: `answer off by ${Math.abs(right - wrong)}, check working` };
    }
    for (const kind of ["bare", "shift", "digit"] as const) {
      const hits = steps.filter((step) => {
        const taken = wrong - (correctSum - step.product);
        return taken >= 0 && errorClass(step, taken) === kind;
      });
      if (hits.length === 1) {
        const step = hits[0];
        const taken = wrong - (correctSum - step.product);
        return partialCause(step, taken, wrong, right);
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

/** place, fact-zero, fact, adding, off, or route. 9 × 5 taken as 5 is fact, not place. */
export function missSkill(correct: string, written: string): string {
  const cause = missCause(correct, written);
  return cause.kind === "partial" ? cause.skill : cause.kind;
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

function teachCause(cause: MissCause): string {
  if (cause.kind === "partial" && cause.skill === "place") {
    const scaled = trailingScale(cause.step.a) ?? trailingScale(cause.step.b);
    const other = scaled && cause.step.a % 10 === 0 ? cause.step.b : cause.step.a;
    const coreLine = scaled
      ? ` ${scaled.core} × ${other} = ${scaled.core * other}, so the partial is ${cause.step.product}.`
      : "";
    return `${cause.step.a} × ${cause.step.b} was taken as ${cause.taken}, which is ${cause.step.product} with the zero dropped.${coreLine}`;
  }
  if (cause.kind === "partial" && cause.skill === "fact-zero") {
    const fact = factWithZero(cause.step, cause.taken);
    if (fact) {
      return `The zero was kept, but the fact was wrong. ${fact.core} × ${fact.other} was taken as ${fact.coreTaken} instead of ${fact.coreRight}, so ${cause.step.a} × ${cause.step.b} became ${cause.taken} instead of ${cause.step.product}.`;
    }
  }
  if (cause.kind === "partial" && (cause.taken === cause.step.a || cause.taken === cause.step.b)) {
    return `${cause.step.a} × ${cause.step.b} was written as ${cause.taken}. That is not a dropped zero, because ${cause.step.product} ÷ 10 is not ${cause.taken}. The digit was copied instead of multiplied.`;
  }
  if (cause.kind === "partial") {
    return `${cause.step.a} × ${cause.step.b} was taken as ${cause.taken}. That is a plain fact slip: the fact is ${cause.step.product}.`;
  }
  if (cause.kind === "fact") return cause.text.replace(/\.$/, "");
  if (cause.kind === "adding") return cause.text.replace(/\.$/, "");
  if (cause.kind === "off") return cause.text;
  return cause.text.replace(/\.$/, "");
}

export function explainTopic(
  dossier: ClassInsightsDossier,
  labels: string[]
): string {
  const lines: string[] = [];
  for (const label of labels) {
    const question = dossier.questions.find((item) => item.label === label);
    if (!question) continue;
    const seen = new Set<string>();
    for (const answer of question.answers) {
      if (!(answer.max > 0 && answer.awarded < answer.max)) continue;
      const line = teachCause(missCause(question.correct, answer.answer));
      if (seen.has(line)) continue;
      seen.add(line);
      lines.push(line.endsWith(".") ? line : `${line}.`);
    }
  }
  return lines.join(" ");
}

type LessonMiss = {
  cause: MissCause;
  left: number;
  right: number;
  learner: string;
};

function lessonMisses(dossier: ClassInsightsDossier): LessonMiss[] {
  const misses: LessonMiss[] = [];
  for (const question of dossier.questions) {
    const factors = multiplication(question.correct);
    for (const answer of question.answers) {
      if (!(answer.max > 0 && answer.awarded < answer.max)) continue;
      if (!factors) continue;
      misses.push({
        cause: missCause(question.correct, answer.answer),
        left: factors.left,
        right: factors.right,
        learner: answer.learner,
      });
    }
  }
  return misses;
}

function tableNumbers(miss: LessonMiss): number[] {
  if (miss.cause.kind === "fact") {
    return [miss.left, miss.right].filter((value) => value <= 12);
  }
  if (miss.cause.kind !== "partial") return [];
  if (miss.cause.skill === "fact-zero") {
    const fact = factWithZero(miss.cause.step, miss.cause.taken);
    return fact ? [fact.core, fact.other].filter((value) => value <= 12) : [];
  }
  if (miss.cause.skill === "fact") {
    return [miss.cause.step.a, miss.cause.step.b].filter((value) => value <= 12);
  }
  return [];
}

function timesPhrase(tables: number[]): string {
  const named = [6, 7, 8, 9].filter((table) => tables.includes(table));
  if (named.length === 0) return "the facts that slipped";
  if (named.length === 1) return `the ${named[0]}-times facts`;
  return `the ${named.slice(0, -1).join("- and ")}- and ${named[named.length - 1]}-times facts`;
}

function zeroStep(step: Step): string {
  const scaled = trailingScale(step.a) ?? trailingScale(step.b);
  if (!scaled) return `${step.a} × ${step.b} = ${step.product}`;
  const other = step.a % 10 === 0 ? step.b : step.a;
  const zeros = scaled.scale === 10 ? "zero" : "zeros";
  return `${step.a} × ${step.b}: ${scaled.core} × ${other} = ${scaled.core * other}, then keep the ${zeros}, so ${step.product}`;
}

function workedModel(left: number, right: number): string {
  const steps = stepsFor(left, right);
  if (steps.length === 0) return `${left} × ${right} = ${left * right}`;
  return [
    `${left} × ${right}`,
    ...steps.map(zeroStep),
    `${steps.map((step) => step.product).join(" + ")} = ${left * right}`,
  ].join("\n");
}

const PRACTICE_BANK: { question: string; left: number; right: number; unit?: string }[] = [
  { question: "60 × 7", left: 60, right: 7 },
  { question: "47 × 6", left: 47, right: 6 },
  { question: "352 × 8", left: 352, right: 8 },
  { question: "7 × 7", left: 7, right: 7 },
  {
    question: "A class reads 40 pages a day for 6 days. How many pages?",
    left: 40,
    right: 6,
    unit: "pages",
  },
];

function paperProducts(dossier: ClassInsightsDossier): Set<string> {
  const pairs = new Set<string>();
  for (const question of dossier.questions) {
    for (const text of [question.correct, ...question.answers.map((answer) => answer.answer)]) {
      const factors = multiplication(text);
      if (!factors) continue;
      pairs.add(`${factors.left}×${factors.right}`);
      pairs.add(`${factors.right}×${factors.left}`);
    }
  }
  return pairs;
}

/** One short focus line for a learner. The question detail stays in the breakdown. */
export function checkInFocus(dossier: ClassInsightsDossier, learner: string): string {
  const misses = lessonMisses(dossier).filter((miss) => miss.learner === learner);
  const tables = [...new Set(misses.flatMap(tableNumbers))].filter((table) => table === 6 || table === 7);
  const place = misses.some((miss) => miss.cause.kind === "partial" && miss.cause.skill === "place");
  const factZero = misses.some(
    (miss) => miss.cause.kind === "partial" && miss.cause.skill === "fact-zero"
  );
  const copied = misses.some(
    (miss) =>
      miss.cause.kind === "partial" &&
      (miss.cause.taken === miss.cause.step.a || miss.cause.taken === miss.cause.step.b)
  );
  const other = misses.find((miss) => miss.cause.kind === "fact");
  const bits = [
    place || factZero ? "the zero in a partial product" : "",
    tables.length > 0 ? timesPhrase(tables) : "",
    copied ? "multiplying the ones digit instead of copying it" : "",
    other ? `${other.left} × ${other.right}` : "",
  ].filter(Boolean);
  if (bits.length === 0) return "Look again at the questions in the breakdown.";
  const focus =
    bits.length === 1
      ? bits[0]
      : `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`;
  return `Focus on ${focus}.`;
}

/** Learners who wrote the same wrong number on several of the same questions. */
export function sharedWrongNote(dossier: ClassInsightsDossier): string | null {
  const shared: string[][] = [];
  for (const question of dossier.questions) {
    const wrong = question.answers.filter((answer) => answer.max > 0 && answer.awarded < answer.max);
    if (wrong.length < 2) continue;
    const numbers = wrong.map((answer) => resultNumber(answer.answer));
    if (numbers.some((value) => value === null)) continue;
    if (new Set(numbers).size !== 1) continue;
    shared.push(wrong.map((answer) => answer.learner));
  }
  if (shared.length < 2) return null;
  const names = shared[0].filter((name) => shared.every((group) => group.includes(name)));
  if (names.length < 2) return null;
  const who = names
    .map((name) => name.replace(/^Learner\s+/i, ""))
    .join(" and ");
  return `${who} gave the same wrong answers on ${shared.length} questions. Worth checking how they worked.`;
}

export function teachingHeadline(dossier: ClassInsightsDossier): string {
  const misses = lessonMisses(dossier);
  const place = misses.some((miss) => miss.cause.kind === "partial" && miss.cause.skill === "place");
  const tables = [...new Set(misses.flatMap(tableNumbers))].filter((table) => table === 6 || table === 7);
  const phrase = timesPhrase(tables);
  if (place && tables.length > 0) {
    return `Most marks were lost inside one partial product: a dropped zero, and ${phrase}. Teach the zero first, then those facts.`;
  }
  if (place) {
    return "Most marks were lost inside one partial product, by dropping a zero. Put the zero back before adding.";
  }
  if (tables.length > 0) {
    return `Most marks were lost inside one partial product, on ${phrase}. Drill the fact, then the partial.`;
  }
  return "Most marks were lost inside one step of the working. Teach that step before setting another paper.";
}

export function teachingWentWell(dossier: ClassInsightsDossier): string {
  const secure = dossier.questions.filter((question) => {
    const scored = question.answers.filter((answer) => answer.max > 0);
    return scored.length > 0 && scored.every((answer) => answer.awarded >= answer.max);
  });
  if (secure.length === 0) return "No question was secure for every learner.";
  const shown = (question: (typeof secure)[number]) => {
    const factors = multiplication(question.correct);
    return factors ? `${factors.left} × ${factors.right}` : question.correct;
  };
  const oneStep = secure.filter((question) => {
    const factors = multiplication(question.correct);
    return factors !== null && Math.max(factors.left, factors.right) <= 15;
  });
  const longer = secure.filter((question) => !oneStep.includes(question));
  const parts: string[] = [];
  if (oneStep.length > 0) {
    parts.push(`One-step facts held, including ${oneStep.slice(0, 3).map(shown).join(", ")}.`);
  }
  if (longer.length > 0) {
    parts.push(
      `Longer multiplication held where the partial products were familiar facts, including ${longer
        .slice(0, 2)
        .map(shown)
        .join(" and ")}.`
    );
  }
  return parts.join(" ");
}

function lostOnlyTheUnit(correct: string, written: string): boolean {
  const right = resultNumber(correct);
  const wrong = resultNumber(written);
  if (right === null || wrong === null || right !== wrong) return false;
  return /[A-Za-z]/.test(correct) && !/[A-Za-z]/.test(written);
}

/** Two or three skill steps, a modelled zero, and new practice. Not a restatement of the misses. */
export function reteachFromMarks(dossier: ClassInsightsDossier): {
  moves: string[];
  workedExample: string;
  practice: { question: string; answer: string }[];
} {
  const misses = lessonMisses(dossier);
  const place = misses.find((miss) => miss.cause.kind === "partial" && miss.cause.skill === "place");
  const factZero = misses.find(
    (miss) => miss.cause.kind === "partial" && miss.cause.skill === "fact-zero"
  );
  const copied = misses.some(
    (miss) =>
      miss.cause.kind === "partial" &&
      (miss.cause.taken === miss.cause.step.a || miss.cause.taken === miss.cause.step.b)
  );
  const tables = [...new Set(misses.flatMap(tableNumbers))].filter((table) => table === 6 || table === 7);
  let unit = false;
  for (const question of dossier.questions) {
    for (const answer of question.answers) {
      if (answer.max > 0 && answer.awarded < answer.max && lostOnlyTheUnit(question.correct, answer.answer)) {
        unit = true;
      }
    }
  }
  const moves = [
    place
      ? "Keep the zero. Multiply the other digits, then put the zero back. Dropping it makes that partial ten times too small."
      : "",
    factZero
      ? `Do the fact first. A zero on the factor keeps a wrong fact wrong, so settle ${timesPhrase(tables)} before writing the partial.`
      : "",
    copied || misses.some((miss) => miss.cause.kind === "fact" || (miss.cause.kind === "partial" && miss.cause.skill === "fact"))
      ? "Repair the plain facts that were one step off, and multiply a ones digit instead of copying it."
      : "",
    unit ? "Ask for the unit when the number is already right." : "",
  ].filter(Boolean);
  while (moves.length < 2) {
    moves.push("Put one missed question on the board and mark the step with the class.");
  }
  const model = place ?? factZero ?? misses.find((miss) => miss.cause.kind === "partial");
  const used = paperProducts(dossier);
  const practice = PRACTICE_BANK.filter(
    (item) => !used.has(`${item.left}×${item.right}`)
  ).map((item) => ({
    question: item.question,
    answer: item.unit ? `${item.left * item.right} ${item.unit}` : String(item.left * item.right),
  }));
  return {
    moves: moves.slice(0, 3),
    workedExample: model
      ? workedModel(model.left, model.right)
      : "Work one missed question to the scheme answer.",
    practice: practice.slice(0, 5),
  };
}

function repairedTopic(
  dossier: ClassInsightsDossier,
  labels: string[]
): string {
  return explainTopic(dossier, labels);
}

function repairedCheckIn(dossier: ClassInsightsDossier, learner: string): string {
  return checkInFocus(dossier, learner);
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

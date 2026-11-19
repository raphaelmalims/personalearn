export type LearnerAnswer = {
  learner: string;
  awarded: number;
  max: number;
  answer: string;
};

export type DossierQuestion = {
  label: string;
  correct: string;
  answers: LearnerAnswer[];
};

export type ClassInsightsDossier = {
  assessmentTitle: string;
  schemeText: string | null;
  questions: DossierQuestion[];
  learnerTotals: { learner: string; awarded: number; max: number }[];
};

export type StruggleTopic = {
  title: string;
  questionLabels: string[];
  misconception: string;
  quotes: { learner: string; answer: string }[];
};

export type ClassInsightsBrief = {
  headline: string;
  wentWell: string;
  struggled: StruggleTopic[];
  moves: string[];
  workedExample: string;
  practice: { question: string; answer: string }[];
  checkIns: { learner: string; gap: string }[];
};

export function readableAnswer(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof parsed.expression === "string" && parsed.expression.trim()) {
        return parsed.expression.trim();
      }
      if (typeof parsed.answer === "string" && parsed.answer.trim()) {
        return parsed.answer.trim();
      }
      if (typeof parsed.answer === "number" && Number.isFinite(parsed.answer)) {
        return String(parsed.answer);
      }
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export function classAverageLine(dossier: ClassInsightsDossier): string {
  const scored = dossier.learnerTotals.filter((row) => row.max > 0);
  if (scored.length === 0) return "**No class average yet.**";
  const sameMax = scored.every((row) => row.max === scored[0].max);
  if (sameMax) {
    const mean = scored.reduce((sum, row) => sum + row.awarded, 0) / scored.length;
    const shown = Number.isInteger(mean) ? String(mean) : mean.toFixed(1);
    return `**Class average: ${shown} of ${scored[0].max}.**`;
  }
  const totals = classTotals(dossier);
  return `**Class total: ${totals.awarded} of ${totals.max}.**`;
}

export function classTotals(dossier: ClassInsightsDossier): {
  awarded: number;
  max: number;
  learnerCount: number;
} {
  const awarded = dossier.learnerTotals.reduce((sum, row) => sum + row.awarded, 0);
  const max = dossier.learnerTotals.reduce((sum, row) => sum + row.max, 0);
  return {
    awarded,
    max,
    learnerCount: dossier.learnerTotals.length,
  };
}

function roster(dossier: ClassInsightsDossier): string[] {
  return dossier.learnerTotals.map((row) => row.learner);
}

function questionByLabel(dossier: ClassInsightsDossier, label: string) {
  return dossier.questions.find((question) => question.label === label);
}

function isWrong(answer: LearnerAnswer): boolean {
  return answer.max > 0 && answer.awarded < answer.max;
}

export function learnersWhoMissed(
  dossier: ClassInsightsDossier,
  labels: string[]
): { missed: number; scored: number } {
  const names = new Set<string>();
  const scored = new Set<string>();
  for (const label of labels) {
    const question = questionByLabel(dossier, label);
    if (!question) continue;
    for (const answer of question.answers) {
      if (answer.max <= 0) continue;
      scored.add(answer.learner);
      if (isWrong(answer)) names.add(answer.learner);
    }
  }
  return { missed: names.size, scored: scored.size };
}

function countLine(missed: number, scored: number): string {
  if (scored <= 0) return "No score yet";
  const noun = scored === 1 ? "learner" : "learners";
  return `${missed} of ${scored} ${noun}`;
}

const SECTION_TITLES: Record<string, string> = {
  A: "Multiplication facts",
  B: "Two-digit multiplication",
  C: "Three-digit multiplication",
  D: "Word problems",
};

/** Missed questions grouped by section. The model does not choose this list. */
export function missedQuestionGroups(
  dossier: ClassInsightsDossier
): { title: string; labels: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const question of dossier.questions) {
    if (!question.answers.some(isWrong)) continue;
    const section = question.label.split(".")[0] || question.label;
    const labels = groups.get(section) ?? [];
    labels.push(question.label);
    groups.set(section, labels);
  }
  return [...groups.entries()].slice(0, 4).map(([section, labels]) => ({
    title: SECTION_TITLES[section] ?? `Section ${section}`,
    labels,
  }));
}

function missedNames(question: DossierQuestion): string[] {
  return question.answers.filter(isWrong).map((answer) => answer.learner).sort();
}

function countLinesFor(
  dossier: ClassInsightsDossier,
  labels: string[]
): string[] {
  const questions = labels
    .map((label) => questionByLabel(dossier, label))
    .filter((question): question is DossierQuestion => question != null);
  if (questions.length === 0) return ["No score yet."];
  const sets = questions.map((question) => missedNames(question).join("\0"));
  const sameMiss = sets.every((set) => set === sets[0]);
  if (sameMiss) {
    const scored = questions[0].answers.filter((answer) => answer.max > 0).length;
    return [
      `**${countLine(missedNames(questions[0]).length, scored)}** missed ${labels.join(", ")}.`,
    ];
  }
  return questions.map((question) => {
    const scored = question.answers.filter((answer) => answer.max > 0).length;
    return `**${countLine(missedNames(question).length, scored)}** missed ${question.label}.`;
  });
}

function cleanProse(text: string): string {
  return text
    .replace(/not a strand label\.?/gi, "")
    .replace(/\d+(?:\.\d+)?%\s*under half/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function groundedQuotes(
  dossier: ClassInsightsDossier,
  topic: StruggleTopic,
  labels: string[]
): { learner: string; answer: string }[] {
  const known = topic.quotes
    .map((quote) => knownQuote(dossier, quote))
    .filter((quote): quote is { learner: string; answer: string } => quote !== null);
  const unique = new Map<string, { learner: string; answer: string }>();
  for (const quote of known) unique.set(`${quote.learner}\0${quote.answer}`, quote);
  if (unique.size > 0) return [...unique.values()].slice(0, 12);
  for (const label of labels) {
    const question = questionByLabel(dossier, label);
    if (!question) continue;
    for (const answer of question.answers) {
      if (!isWrong(answer)) continue;
      const text = readableAnswer(answer.answer);
      if (!text) continue;
      unique.set(`${answer.learner}\0${text}`, { learner: answer.learner, answer: text });
    }
  }
  return [...unique.values()].slice(0, 12);
}

function knownQuote(
  dossier: ClassInsightsDossier,
  quote: { learner: string; answer: string }
): { learner: string; answer: string } | null {
  const answer = quote.answer.trim();
  if (!answer || !roster(dossier).includes(quote.learner)) return null;
  for (const question of dossier.questions) {
    for (const row of question.answers) {
      if (row.learner !== quote.learner || !isWrong(row)) continue;
      const stored = readableAnswer(row.answer).trim();
      if (!stored) continue;
      const same =
        stored === answer ||
        stored.replace(/\s+/g, "") === answer.replace(/\s+/g, "") ||
        (answer.length >= 4 && stored.includes(answer)) ||
        (stored.length >= 4 && answer.includes(stored));
      if (same) return { learner: quote.learner, answer: stored };
    }
  }
  return null;
}

function headlineAfterAverage(headline: string, averageLine: string): string {
  const cleaned = cleanProse(headline);
  const numbers = averageLine.match(/(\d+)\s+of\s+(\d+)/);
  if (!numbers) return cleaned;
  const lead = new RegExp(
    `^(?:the\\s+)?class average(?:\\s+was)?\\s*:?\\s*${numbers[1]}\\s+of\\s+${numbers[2]}\\.?\\s*[;:,.\\u2014\\u2013-]*\\s*`,
    "i"
  );
  const rest = cleaned.replace(lead, "");
  if (!rest || rest === cleaned) return cleaned;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

export function renderClassInsightsMarkdown(
  dossier: ClassInsightsDossier,
  brief: ClassInsightsBrief
): string {
  const average = classAverageLine(dossier);
  const lines = [
    "Class insights",
    "",
    "Based on this class set.",
    "",
    average,
    headlineAfterAverage(brief.headline, average),
    "",
    "## What went well",
    "",
    cleanProse(brief.wentWell) || "Nothing in this set stood out as secure yet.",
    "",
    "## Where learners struggled",
    "",
  ];

  if (brief.struggled.length === 0) {
    lines.push("No question in this set was missed.");
  } else {
    for (const topic of brief.struggled) {
      const labels = topic.questionLabels.filter((label) =>
        questionByLabel(dossier, label)
      );
      lines.push(`### ${cleanProse(topic.title)}`, "");
      for (const count of countLinesFor(dossier, labels)) {
        lines.push(count, "");
      }
      const why = cleanProse(topic.misconception).replace(
        /\b\d+\s+of\s+\d+\s+learners?\b[^.]*\.?/gi,
        ""
      );
      if (why.trim()) lines.push(why.trim(), "");
      const quotes = groundedQuotes(dossier, topic, labels);
      for (const known of quotes) {
        lines.push(`> ${known.learner} wrote “${known.answer}”.`, "");
      }
    }
  }

  lines.push("## Reteach plan for the next lesson", "");
  brief.moves.slice(0, 3).forEach((move, index) => {
    lines.push(`${index + 1}. ${cleanProse(move)}`);
  });
  lines.push("", "**Worked example**", "", cleanProse(brief.workedExample), "");
  lines.push("**Practice for the board**", "");
  brief.practice.slice(0, 3).forEach((item, index) => {
    lines.push(
      `${index + 1}. ${cleanProse(item.question)} **Answer:** ${cleanProse(item.answer)}`
    );
  });
  lines.push("");

  lines.push("## Learners to check in with", "");
  const knownLearners = new Set(roster(dossier));
  const checkIns = brief.checkIns.filter((row) => knownLearners.has(row.learner));
  if (checkIns.length === 0) {
    lines.push("No learner needs a separate check from this set.");
  } else {
    for (const row of checkIns) {
      lines.push(`- **${row.learner}.** ${cleanProse(row.gap)}`);
    }
  }

  lines.push(
    "",
    ":::collapse Per-question breakdown",
    ""
  );
  for (const question of dossier.questions) {
    const scored = question.answers.filter((answer) => answer.max > 0);
    const right = scored.filter((answer) => answer.awarded >= answer.max).length;
    const wrongs = scored.filter(isWrong).map((answer) => readableAnswer(answer.answer));
    const common = mostCommon(wrongs);
    lines.push(`### ${question.label}`);
    if (question.correct) lines.push(`Correct answer: **${question.correct}**.`);
    lines.push(
      `**${right} of ${scored.length || 0}** got it right.${
        common ? ` Common wrong answer: “${common}”.` : ""
      }`,
      ""
    );
  }
  lines.push(":::");

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mostCommon(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) {
    const text = value.trim();
    if (!text) continue;
    counts.set(text, (counts.get(text) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  return ranked[0]?.[0] ?? null;
}

export function fallbackBrief(dossier: ClassInsightsDossier): ClassInsightsBrief {
  const secure = dossier.questions.filter((question) => {
    const scored = question.answers.filter((answer) => answer.max > 0);
    return scored.length > 0 && scored.every((answer) => !isWrong(answer));
  });
  const missed = dossier.questions.filter((question) =>
    question.answers.some(isWrong)
  );
  const totals = classTotals(dossier);
  return {
    headline:
      totals.max > 0
        ? `The class scored ${totals.awarded} of ${totals.max}. ${
            secure.length > 0
              ? `${secure.map((question) => question.label).slice(0, 3).join(", ")} held.`
              : "Little of the paper held."
          } ${
            missed.length > 0
              ? `${missed.map((question) => question.label).slice(0, 3).join(", ")} need another lesson.`
              : "Nothing on this paper needs reteaching."
          }`
        : "These scripts do not have scores yet.",
    wentWell:
      secure.length > 0
        ? `Learners were secure on ${secure.map((question) => question.label).join(", ")}.`
        : "No question was secure for every learner.",
    struggled: missed.slice(0, 4).map((question) => {
      const quote = question.answers.find(isWrong);
      return {
        title: `Question ${question.label}`,
        questionLabels: [question.label],
        misconception: quote
          ? `${quote.learner} did not match the marking scheme on this item.`
          : "The marks do not show a shared mistake.",
        quotes: quote
          ? [{ learner: quote.learner, answer: readableAnswer(quote.answer) }]
          : [],
      };
    }),
    moves: [
      "Put the missed questions on the board and mark one together.",
      "Ask one learner to explain the step that went wrong, using their own written answer.",
      "Leave the practice questions below on the board for the last ten minutes.",
    ],
    workedExample: missed[0]?.correct
      ? `Work ${missed[0].label} to the scheme answer: ${missed[0].correct}.`
      : "Work one missed question to the scheme answer before the practice.",
    practice: missed.slice(0, 3).map((question) => ({
      question: `A fresh item in the same style as ${question.label}.`,
      answer: question.correct || "Use the marking scheme.",
    })),
    checkIns: dossier.learnerTotals
      .map((row) => {
        const gaps = dossier.questions
          .filter((question) =>
            question.answers.some(
              (answer) => answer.learner === row.learner && isWrong(answer)
            )
          )
          .map((question) => question.label);
        return gaps.length > 0
          ? { learner: row.learner, gap: `Look again at ${gaps.join(", ")}.` }
          : null;
      })
      .filter((row): row is { learner: string; gap: string } => row !== null),
  };
}

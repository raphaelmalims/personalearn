import {
  buildCanonicalQuestionKey,
  formatQuestionDisplayLabel,
} from "@/lib/evaluation/question-identity";

/** Scripts that count as marked for class insights. */
export const MARKED_SCRIPT_STATUSES = [
  "ready",
  "drafted",
  "signed_off",
] as const;

export type MarkedScriptStatus = (typeof MARKED_SCRIPT_STATUSES)[number];

/** A question is weak when awarded / max is strictly under this ratio. */
export const WEAK_SCORE_RATIO = 0.5;

const MAX_MISTAKES = 3;
const MISTAKE_CHARS = 180;

export type ClassInsightRow = {
  scriptId: string;
  questionNumber: string;
  section: string | null;
  canonicalKey: string | null;
  awarded: number | null;
  max: number | null;
  feedback: string | null;
  explanation: string | null;
};

export type CommonMistake = {
  text: string;
  count: number;
};

export type QuestionInsight = {
  key: string;
  label: string;
  learnersMarked: number;
  scored: number;
  belowHalf: number;
  /** Share of scored learners under 50%, 0–100, one decimal. Null when none scored. */
  percentBelowHalf: number | null;
  commonMistakes: CommonMistake[];
};

export type ClassInsightsAggregation = {
  scriptCount: number;
  questions: QuestionInsight[];
};

export function isMarkedScriptStatus(
  status: string
): status is MarkedScriptStatus {
  return (MARKED_SCRIPT_STATUSES as readonly string[]).includes(status);
}

function finite(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function scoreRatio(
  awarded: number | null,
  max: number | null
): number | null {
  if (!finite(awarded) || !finite(max) || max <= 0) return null;
  return awarded / max;
}

export function isBelowHalf(
  awarded: number | null,
  max: number | null
): boolean {
  const ratio = scoreRatio(awarded, max);
  return ratio !== null && ratio < WEAK_SCORE_RATIO;
}

export function insightQuestionKey(row: ClassInsightRow): string {
  const canonical = row.canonicalKey?.trim();
  if (canonical) return canonical;
  return (
    buildCanonicalQuestionKey({
      section: row.section,
      questionNumber: row.questionNumber,
    }) ?? row.questionNumber.trim()
  );
}

function insightLabel(row: ClassInsightRow): string {
  return formatQuestionDisplayLabel({
    section: row.section,
    questionNumber: row.questionNumber,
  });
}

function mistakeText(row: ClassInsightRow): string | null {
  const raw = row.feedback?.trim() || row.explanation?.trim() || "";
  const oneLine = raw.replace(/\s+/g, " ").trim();
  if (!oneLine) return null;
  return oneLine.slice(0, MISTAKE_CHARS);
}

type ScriptMark = {
  awarded: number | null;
  max: number | null;
  mistake: string | null;
};

function preferMark(current: ScriptMark, next: ScriptMark): ScriptMark {
  const currentScored = scoreRatio(current.awarded, current.max) !== null;
  const nextScored = scoreRatio(next.awarded, next.max) !== null;
  if (nextScored && !currentScored) return next;
  if (currentScored && !nextScored) return current;
  if (!current.mistake && next.mistake) return next;
  return current;
}

/**
 * Per-question rollup for scripts already limited to ready, drafted, or signed_off.
 * `scriptCount` is the number of those scripts, including ones with no question rows.
 */
export function aggregateQuestionInsights(
  rows: ClassInsightRow[],
  scriptCount: number
): ClassInsightsAggregation {
  const groups = new Map<
    string,
    { label: string; scripts: Map<string, ScriptMark> }
  >();

  for (const row of rows) {
    const key = insightQuestionKey(row);
    if (!key) continue;
    const group = groups.get(key) ?? {
      label: insightLabel(row),
      scripts: new Map<string, ScriptMark>(),
    };
    const next: ScriptMark = {
      awarded: row.awarded,
      max: row.max,
      mistake: mistakeText(row),
    };
    const current = group.scripts.get(row.scriptId);
    group.scripts.set(row.scriptId, current ? preferMark(current, next) : next);
    groups.set(key, group);
  }

  const questions: QuestionInsight[] = [...groups.entries()].map(
    ([key, group]) => {
      let scored = 0;
      let belowHalf = 0;
      const mistakes = new Map<string, { text: string; count: number }>();

      for (const mark of group.scripts.values()) {
        const ratio = scoreRatio(mark.awarded, mark.max);
        if (ratio === null) continue;
        scored += 1;
        if (ratio < WEAK_SCORE_RATIO) {
          belowHalf += 1;
          if (mark.mistake) {
            const fold = mark.mistake.toLowerCase();
            const existing = mistakes.get(fold);
            if (existing) existing.count += 1;
            else mistakes.set(fold, { text: mark.mistake, count: 1 });
          }
        }
      }

      const commonMistakes = [...mistakes.values()]
        .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
        .slice(0, MAX_MISTAKES);

      return {
        key,
        label: group.label,
        learnersMarked: group.scripts.size,
        scored,
        belowHalf,
        percentBelowHalf:
          scored === 0
            ? null
            : Math.round((belowHalf / scored) * 1000) / 10,
        commonMistakes,
      };
    }
  );

  questions.sort((a, b) => {
    const aPct = a.percentBelowHalf ?? -1;
    const bPct = b.percentBelowHalf ?? -1;
    if (bPct !== aPct) return bPct - aPct;
    if (b.belowHalf !== a.belowHalf) return b.belowHalf - a.belowHalf;
    return a.label.localeCompare(b.label);
  });

  return { scriptCount, questions };
}

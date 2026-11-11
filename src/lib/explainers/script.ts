import { z } from "zod";

/** The process-flow template draws at most four steps and at least three. */
export const MIN_EXPLAINER_STEPS = 3;
export const MAX_EXPLAINER_STEPS = 4;

const stepSchema = z.object({
  label: z.string().trim().min(1).max(40),
  caption: z.string().trim().min(1).max(140),
});

export type ExplainerStep = z.infer<typeof stepSchema>;

export type ExplainerScript = {
  title: string;
  steps: ExplainerStep[];
};

export type ExplainerMetrics = {
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
  costUsd: number;
  wallTimeMs: number;
};

export type ExplainerCacheStatus = "miss" | "hit" | "personalised";

function scriptSchema(min: number, max: number) {
  return z.object({
    title: z.string().trim().min(1).max(80),
    steps: z.array(stepSchema).min(min).max(max),
  });
}

/**
 * deepseek-flash list price, USD per 1M tokens.
 * Peak is 01:00–04:00 and 06:00–10:00 UTC on weekdays.
 * https://api-docs.deepseek.com/quick_start/pricing/
 */
const OFF_PEAK = { hit: 0.003, miss: 0.15, out: 0.6 };
const PEAK = { hit: 0.006, miss: 0.3, out: 1.2 };

export function isDeepSeekPeak(at: Date) {
  const day = at.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = at.getUTCHours() * 60 + at.getUTCMinutes();
  const inWindow = (start: number, end: number) => minutes >= start && minutes < end;
  return inWindow(60, 240) || inWindow(360, 600);
}

export function deepseekFlashCostUsd(input: {
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
  at: Date;
}) {
  const rate = isDeepSeekPeak(input.at) ? PEAK : OFF_PEAK;
  const promptTokens = Math.max(0, input.promptTokens);
  const cached = Math.min(Math.max(0, input.cachedPromptTokens), promptTokens);
  const fresh = promptTokens - cached;
  return (
    (cached * rate.hit + fresh * rate.miss + Math.max(0, input.completionTokens) * rate.out) /
    1_000_000
  );
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sw: "Kiswahili",
};

export function languageName(language: string) {
  return LANGUAGE_NAMES[language] ?? language;
}

export function normalizeLanguage(language: string) {
  const value = language.trim().toLowerCase();
  if (value === "english") return "en";
  if (value === "swahili" || value === "kiswahili") return "sw";
  if (!/^[a-z]{2,16}$/.test(value)) {
    throw new Error("Language must be a short name, such as en or sw.");
  }
  return value;
}

export function normalizeGrade(grade: number) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) {
    throw new Error("Grade must be from 1 to 9.");
  }
  return grade;
}

export function parseExplainerScript(
  text: string,
  limits?: { min?: number; max?: number }
): ExplainerScript {
  const min = limits?.min ?? MIN_EXPLAINER_STEPS;
  const max = limits?.max ?? MAX_EXPLAINER_STEPS;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("Explainer script was not JSON.");
  }
  let json: unknown;
  try {
    json = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error("Explainer script was not JSON.");
  }
  const parsed = scriptSchema(min, max).safeParse(json);
  if (!parsed.success) {
    throw new Error("Explainer script did not match the template.");
  }
  return parsed.data;
}

export function templateVariables(script: ExplainerScript) {
  const steps = script.steps.slice(0, MAX_EXPLAINER_STEPS);
  const at = (index: number) => steps[index] ?? { label: "", caption: "" };
  return {
    title: script.title,
    step1: at(0).label,
    step2: at(1).label,
    step3: at(2).label,
    step4: at(3).label,
    cap1: at(0).caption,
    cap2: at(1).caption,
    cap3: at(2).caption,
    cap4: at(3).caption,
  };
}

export function emptyMetrics(modelId: string): ExplainerMetrics {
  return {
    modelId,
    promptTokens: 0,
    completionTokens: 0,
    cachedPromptTokens: 0,
    costUsd: 0,
    wallTimeMs: 0,
  };
}

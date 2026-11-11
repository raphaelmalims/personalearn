import { generateText } from "ai";
import { z } from "zod";
import { getChatProvider, getDeepSeekProviderOptions } from "@/lib/ai/env";
import { getActiveChatModelId, getChatModel } from "@/lib/ai/llm";
import { normalizeTopic, retrieveWaterCycleContext } from "@/lib/explainers/cbc-water-cycle";

const STEP_COUNT = 4;

const scriptSchema = z.object({
  title: z.string().trim().min(1).max(80),
  steps: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        caption: z.string().trim().min(1).max(140),
      })
    )
    .length(STEP_COUNT),
});

export type ExplainerScript = z.infer<typeof scriptSchema>;

export type ExplainerMetrics = {
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
  costUsd: number;
  wallTimeMs: number;
};

export type ExplainerResult = {
  cache: "hit" | "miss";
  topic: string;
  grade: number;
  language: string;
  script: ExplainerScript;
  metrics: ExplainerMetrics;
};

type CacheEntry = {
  script: ExplainerScript;
  modelId: string;
};

export type ExplainerCache = Map<string, CacheEntry>;

const globalCache = globalThis as typeof globalThis & {
  __explainerCache?: ExplainerCache;
};

export function getExplainerCache(): ExplainerCache {
  if (!globalCache.__explainerCache) {
    globalCache.__explainerCache = new Map();
  }
  return globalCache.__explainerCache;
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

export function explainerCacheKey(input: {
  topic: string;
  grade: number;
  language: string;
}) {
  return `${normalizeTopic(input.topic)}|${input.grade}|${normalizeLanguage(input.language)}`;
}

export function parseExplainerScript(text: string): ExplainerScript {
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
  const parsed = scriptSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Explainer script did not match the template.");
  }
  return parsed.data;
}

export function templateVariables(script: ExplainerScript) {
  return {
    title: script.title,
    step1: script.steps[0].label,
    step2: script.steps[1].label,
    step3: script.steps[2].label,
    step4: script.steps[3].label,
    cap1: script.steps[0].caption,
    cap2: script.steps[1].caption,
    cap3: script.steps[2].caption,
    cap4: script.steps[3].caption,
  };
}

type Completion = {
  text: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
};

async function completeWithModel(input: {
  system: string;
  prompt: string;
}): Promise<Completion> {
  const provider = getChatProvider();
  const result = await generateText({
    model: getChatModel(),
    ...(provider === "deepseek"
      ? { providerOptions: getDeepSeekProviderOptions({ thinking: "disabled" }) }
      : {}),
    system: input.system,
    prompt: input.prompt,
  });
  const usage = result.usage;
  const details = usage?.inputTokenDetails;
  return {
    text: result.text,
    modelId: getActiveChatModelId(provider),
    promptTokens: usage?.inputTokens ?? 0,
    completionTokens: usage?.outputTokens ?? 0,
    cachedPromptTokens: details?.cacheReadTokens ?? 0,
  };
}

function roundMs(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function logExplainer(result: ExplainerResult) {
  console.info(
    JSON.stringify({
      event: "explainer_request",
      cache: result.cache,
      topic: result.topic,
      grade: result.grade,
      language: result.language,
      modelId: result.metrics.modelId,
      promptTokens: result.metrics.promptTokens,
      completionTokens: result.metrics.completionTokens,
      cachedPromptTokens: result.metrics.cachedPromptTokens,
      costUsd: result.metrics.costUsd,
      wallTimeMs: result.metrics.wallTimeMs,
    })
  );
}

export async function requestExplainer(
  input: { topic: string; grade: number; language: string },
  deps?: {
    cache?: ExplainerCache;
    now?: () => number;
    at?: Date;
    complete?: (input: { system: string; prompt: string }) => Promise<Completion>;
  }
): Promise<ExplainerResult> {
  const now = deps?.now ?? (() => performance.now());
  const at = deps?.at ?? new Date();
  const cache = deps?.cache ?? getExplainerCache();
  const started = now();
  const topic = normalizeTopic(input.topic);
  const grade = normalizeGrade(input.grade);
  const language = normalizeLanguage(input.language);
  const key = explainerCacheKey({ topic, grade, language });
  const hit = cache.get(key);

  if (hit) {
    const result: ExplainerResult = {
      cache: "hit",
      topic,
      grade,
      language,
      script: hit.script,
      metrics: {
        modelId: hit.modelId,
        promptTokens: 0,
        completionTokens: 0,
        cachedPromptTokens: 0,
        costUsd: 0,
        wallTimeMs: roundMs(now() - started),
      },
    };
    logExplainer(result);
    return result;
  }

  const context = retrieveWaterCycleContext(topic);
  const languageName = LANGUAGE_NAMES[language] ?? language;
  const completion = await (deps?.complete ?? completeWithModel)({
    system: [
      "You fill a four-step process explainer for a Kenyan CBC learner.",
      "Use only the context. Do not add facts, numbers, or steps that the context does not state.",
      `Write the title, labels, and captions in ${languageName} for grade ${grade}.`,
      "Labels are 1 to 3 words. Each caption is one short sentence, at most 12 words.",
      "Keep the four steps in the same order as the context.",
      'Reply with JSON only: {"title":"","steps":[{"label":"","caption":""},{"label":"","caption":""},{"label":"","caption":""},{"label":"","caption":""}]}',
    ].join(" "),
    prompt: `Context:\n${context}\n\nTopic: ${topic}`,
  });

  const script = parseExplainerScript(completion.text);
  cache.set(key, { script, modelId: completion.modelId });
  const result: ExplainerResult = {
    cache: "miss",
    topic,
    grade,
    language,
    script,
    metrics: {
      modelId: completion.modelId,
      promptTokens: completion.promptTokens,
      completionTokens: completion.completionTokens,
      cachedPromptTokens: completion.cachedPromptTokens,
      costUsd: deepseekFlashCostUsd({
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        cachedPromptTokens: completion.cachedPromptTokens,
        at,
      }),
      wallTimeMs: roundMs(now() - started),
    },
  };
  logExplainer(result);
  return result;
}

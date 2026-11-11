import { createHash } from "node:crypto";
import { generateText } from "ai";
import { getChatProvider, getDeepSeekProviderOptions } from "@/lib/ai/env";
import { getActiveChatModelId, getChatModel } from "@/lib/ai/llm";
import type { ExplainerCacheStore } from "@/lib/explainers/cache";
import { normalizeTopic, retrieveWaterCycleContext } from "@/lib/explainers/cbc-water-cycle";
import {
  MAX_EXPLAINER_STEPS,
  deepseekFlashCostUsd,
  emptyMetrics,
  languageName,
  normalizeGrade,
  normalizeLanguage,
  parseExplainerScript,
  type ExplainerCacheStatus,
  type ExplainerMetrics,
  type ExplainerScript,
} from "@/lib/explainers/script";

export {
  deepseekFlashCostUsd,
  isDeepSeekPeak,
  parseExplainerScript,
  templateVariables,
} from "@/lib/explainers/script";

export function explainerCacheKey(input: {
  topic: string;
  grade: number;
  language: string;
}) {
  return `${normalizeTopic(input.topic)}|${input.grade}|${normalizeLanguage(input.language)}`;
}
export type {
  ExplainerCacheStatus,
  ExplainerMetrics,
  ExplainerScript,
} from "@/lib/explainers/script";

export type ExplainerResult = {
  cache: ExplainerCacheStatus;
  topic: string;
  grade: number;
  language: string;
  script: ExplainerScript;
  metrics: ExplainerMetrics;
  base: "hit" | "miss";
  personal: "hit" | "miss" | "skipped";
};

type Completion = {
  text: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
};

export function personalCacheKey(baseKey: string, emphasis: string) {
  const digest = createHash("sha256")
    .update(emphasis.trim().toLowerCase().replace(/\s+/g, " "))
    .digest("hex")
    .slice(0, 16);
  return `${baseKey}|${digest}`;
}

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

function metricsFromCompletion(completion: Completion, at: Date, wallTimeMs: number): ExplainerMetrics {
  return {
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
    wallTimeMs,
  };
}

function addMetrics(left: ExplainerMetrics, right: ExplainerMetrics, at: Date, wallTimeMs: number) {
  const promptTokens = left.promptTokens + right.promptTokens;
  const completionTokens = left.completionTokens + right.completionTokens;
  const cachedPromptTokens = left.cachedPromptTokens + right.cachedPromptTokens;
  return {
    modelId: right.modelId || left.modelId,
    promptTokens,
    completionTokens,
    cachedPromptTokens,
    costUsd: deepseekFlashCostUsd({
      promptTokens,
      completionTokens,
      cachedPromptTokens,
      at,
    }),
    wallTimeMs,
  };
}

function logExplainer(result: ExplainerResult) {
  console.info(
    JSON.stringify({
      event: "explainer_request",
      cache: result.cache,
      base: result.base,
      personal: result.personal,
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
  input: { topic: string; grade: number; language: string; emphasis?: string },
  deps?: {
    cache?: ExplainerCacheStore;
    now?: () => number;
    at?: Date;
    complete?: (input: { system: string; prompt: string }) => Promise<Completion>;
  }
): Promise<ExplainerResult> {
  const now = deps?.now ?? (() => performance.now());
  const at = deps?.at ?? new Date();
  const cache = deps?.cache;
  if (!cache) {
    throw new Error("Explainer cache is not configured.");
  }
  const started = now();
  const topic = normalizeTopic(input.topic);
  const grade = normalizeGrade(input.grade);
  const language = normalizeLanguage(input.language);
  const emphasis = input.emphasis?.trim().replace(/\s+/g, " ") ?? "";
  const key = explainerCacheKey({ topic, grade, language });
  const complete = deps?.complete ?? completeWithModel;

  let base = await cache.get(key);
  let baseStatus: "hit" | "miss" = base ? "hit" : "miss";
  let baseMetrics = emptyMetrics(base?.modelId ?? "");

  if (!base) {
    const context = retrieveWaterCycleContext(topic);
    const completion = await complete({
      system: [
        "You fill a four-step process explainer for a Kenyan CBC learner.",
        "Use only the context. Do not add facts, numbers, or steps that the context does not state.",
        `Write the title, labels, and captions in ${languageName(language)} for grade ${grade}.`,
        "Labels are 1 to 3 words. Each caption is one short sentence, at most 12 words.",
        "Keep the four steps in the same order as the context.",
        'Reply with JSON only: {"title":"","steps":[{"label":"","caption":""},{"label":"","caption":""},{"label":"","caption":""},{"label":"","caption":""}]}',
      ].join(" "),
      prompt: `Context:\n${context}\n\nTopic: ${topic}`,
    });
    const script = parseExplainerScript(completion.text, {
      min: MAX_EXPLAINER_STEPS,
      max: MAX_EXPLAINER_STEPS,
    });
    base = { script, modelId: completion.modelId };
    await cache.set(key, base);
    baseMetrics = metricsFromCompletion(completion, at, roundMs(now() - started));
    baseStatus = "miss";
  }

  if (!emphasis) {
    const result: ExplainerResult = {
      cache: baseStatus,
      base: baseStatus,
      personal: "skipped",
      topic,
      grade,
      language,
      script: base.script,
      metrics:
        baseStatus === "hit"
          ? { ...emptyMetrics(base.modelId), wallTimeMs: roundMs(now() - started) }
          : { ...baseMetrics, wallTimeMs: roundMs(now() - started) },
    };
    logExplainer(result);
    return result;
  }

  const personalKey = personalCacheKey(key, emphasis);
  const cachedPersonal = await cache.get(personalKey);
  if (cachedPersonal) {
    const result: ExplainerResult = {
      cache: "hit",
      base: baseStatus,
      personal: "hit",
      topic,
      grade,
      language,
      script: cachedPersonal.script,
      metrics: { ...emptyMetrics(cachedPersonal.modelId), wallTimeMs: roundMs(now() - started) },
    };
    logExplainer(result);
    return result;
  }

  const personalStarted = now();
  const completion = await complete({
    system: [
      "You adapt a cached water-cycle explainer for one class.",
      "Keep the same facts and the same order. Do not add facts that are not in the base script.",
      `Write in ${languageName(language)} for grade ${grade}.`,
      `Use ${MIN_STEPS_TEXT} steps. The template allows 3 or 4.`,
      "Change examples and emphasis only. Labels are 1 to 3 words. Each caption is one short sentence, at most 12 words.",
      'Reply with JSON only: {"title":"","steps":[{"label":"","caption":""}]}',
    ].join(" "),
    prompt: `Base script:\n${JSON.stringify(base.script)}\n\nNote:\n${emphasis}`,
  });
  const script = parseExplainerScript(completion.text, { min: 3, max: 4 });
  await cache.set(personalKey, { script, modelId: completion.modelId });
  const personalMetrics = metricsFromCompletion(
    completion,
    at,
    roundMs(now() - personalStarted)
  );
  const result: ExplainerResult = {
    cache: baseStatus === "hit" ? "personalised" : "miss",
    base: baseStatus,
    personal: "miss",
    topic,
    grade,
    language,
    script,
    metrics:
      baseStatus === "hit"
        ? { ...personalMetrics, wallTimeMs: roundMs(now() - started) }
        : addMetrics(baseMetrics, personalMetrics, at, roundMs(now() - started)),
  };
  logExplainer(result);
  return result;
}

const MIN_STEPS_TEXT = "3 or 4";

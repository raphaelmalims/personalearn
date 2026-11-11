import { generateText } from "ai";
import { getChatProvider, getDeepSeekProviderOptions } from "@/lib/ai/env";
import { getActiveChatModelId, getChatModel } from "@/lib/ai/llm";
import {
  NO_BLOCK_LINE,
  parseVisualSpec,
  type VisualArtifact,
  type VisualBlock,
  type VisualFallback,
  type VisualSpec,
} from "@/lib/explainers/blocks";
import { canonicalTopic } from "@/lib/explainers/topic-context";
import { writeVisualCache, type VisualCacheStore } from "@/lib/explainers/visual-cache";
import { personalCacheKey } from "@/lib/explainers/request";
import {
  deepseekFlashCostUsd,
  emptyMetrics,
  languageName,
  normalizeGrade,
  normalizeLanguage,
  type ExplainerCacheStatus,
  type ExplainerMetrics,
} from "@/lib/explainers/script";

export type VisualResult = VisualArtifact | VisualFallback;

type Completion = {
  text: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
};

const SHAPE: Record<VisualBlock, string> = {
  "process-flow":
    '{"block":"process-flow","title":"","steps":[{"label":"","caption":""},{"label":"","caption":""},{"label":"","caption":""},{"label":"","caption":""}],"quiz":{"prompt":"","answer":""}}',
  "labelled-diagram":
    '{"block":"labelled-diagram","title":"","parts":[{"id":"part-one","label":"","explanation":"","prompt":"Tap the part that ..."}],"quiz":{"prompt":"","answer":""}}',
  "number-line":
    '{"block":"number-line","title":"","min":-5,"max":5,"points":[{"value":-3,"label":"-3","caption":""},{"value":0,"label":"0","caption":""},{"value":2,"label":"2","caption":""}],"quiz":{"prompt":"","answer":""}}',
  comparison:
    '{"block":"comparison","title":"","columns":["",""],"rows":[{"cells":["",""]},{"cells":["",""]}],"captions":["",""],"quiz":{"prompt":"","answer":""}}',
  timeline:
    '{"block":"timeline","title":"","events":[{"when":"","label":"","caption":""},{"when":"","label":"","caption":""},{"when":"","label":"","caption":""}],"quiz":{"prompt":"","answer":""}}',
};

async function completeWithModel(input: { system: string; prompt: string }): Promise<Completion> {
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
  return {
    text: result.text,
    modelId: getActiveChatModelId(provider),
    promptTokens: usage?.inputTokens ?? 0,
    completionTokens: usage?.outputTokens ?? 0,
    cachedPromptTokens: usage?.inputTokenDetails?.cacheReadTokens ?? 0,
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

export function visualCacheKey(input: {
  block: VisualBlock;
  topic: string;
  grade: number;
  language: string;
}) {
  return `visual|${input.block}|${canonicalTopic(input.topic)}|${input.grade}|${normalizeLanguage(input.language)}`;
}

function fillSystem(block: VisualBlock, grade: number, language: string) {
  return [
    "You fill one reusable visual block for a Kenyan CBC class.",
    "Use only the context. Do not add facts the context does not state.",
    `Write in ${languageName(language)} for grade ${grade}.`,
    "Captions are one short sentence. The quiz asks one check the learner can answer from the block.",
    "Part ids are lowercase words joined by hyphens.",
    `Reply with JSON only: ${SHAPE[block]}`,
  ].join(" ");
}

function logVisual(result: VisualArtifact) {
  console.info(
    JSON.stringify({
      event: "visual_request",
      block: result.block,
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

function artifact(input: {
  cache: ExplainerCacheStatus;
  block: VisualBlock;
  topic: string;
  grade: number;
  language: string;
  spec: VisualSpec;
  metrics: ExplainerMetrics;
}): VisualArtifact {
  return { fit: true, ...input };
}

export async function requestVisual(
  input: {
    block: VisualBlock;
    topic: string;
    grade: number;
    language: string;
    emphasis?: string;
    context: string | null;
  },
  deps?: {
    cache?: VisualCacheStore;
    now?: () => number;
    at?: Date;
    complete?: (input: { system: string; prompt: string }) => Promise<Completion>;
  }
): Promise<VisualResult> {
  const cache = deps?.cache;
  if (!cache) throw new Error("Visual cache is not configured.");
  const context = input.context?.trim() ?? "";
  if (!context) return { fit: false, line: NO_BLOCK_LINE };

  const now = deps?.now ?? (() => performance.now());
  const at = deps?.at ?? new Date();
  const started = now();
  const topic = canonicalTopic(input.topic);
  const grade = normalizeGrade(input.grade);
  const language = normalizeLanguage(input.language);
  const emphasis = input.emphasis?.trim().replace(/\s+/g, " ") ?? "";
  const key = visualCacheKey({ block: input.block, topic, grade, language });
  const complete = deps?.complete ?? completeWithModel;

  let base = await cache.get(key);
  let baseStatus: "hit" | "miss" = base ? "hit" : "miss";
  let baseMetrics = emptyMetrics(base?.modelId ?? "");

  if (!base) {
    const completion = await complete({
      system: fillSystem(input.block, grade, language),
      prompt: `Context:\n${context}\n\nTopic: ${topic}`,
    });
    const spec = parseVisualSpec(completion.text, input.block);
    base = { spec, modelId: completion.modelId };
    await writeVisualCache(cache, key, base);
    baseMetrics = metricsFromCompletion(completion, at, roundMs(now() - started));
    baseStatus = "miss";
  }

  if (!emphasis) {
    const result = artifact({
      cache: baseStatus,
      block: input.block,
      topic,
      grade,
      language,
      spec: base.spec,
      metrics:
        baseStatus === "hit"
          ? { ...emptyMetrics(base.modelId), wallTimeMs: roundMs(now() - started) }
          : { ...baseMetrics, wallTimeMs: roundMs(now() - started) },
    });
    logVisual(result);
    return result;
  }

  const personalKey = personalCacheKey(key, emphasis);
  const cachedPersonal = await cache.get(personalKey);
  if (cachedPersonal) {
    const result = artifact({
      cache: "hit",
      block: input.block,
      topic,
      grade,
      language,
      spec: cachedPersonal.spec,
      metrics: { ...emptyMetrics(cachedPersonal.modelId), wallTimeMs: roundMs(now() - started) },
    });
    logVisual(result);
    return result;
  }

  const personalStarted = now();
  const completion = await complete({
    system: [
      "You adapt a cached visual for one class.",
      "Keep the same block, facts, and order. Do not add facts that are not in the base.",
      `Write in ${languageName(language)} for grade ${grade}.`,
      "Change examples and emphasis only.",
      `Reply with JSON only: ${SHAPE[input.block]}`,
    ].join(" "),
    prompt: `Base:\n${JSON.stringify(base.spec)}\n\nNote:\n${emphasis}`,
  });
  const spec = parseVisualSpec(completion.text, input.block);
  await writeVisualCache(cache, personalKey, { spec, modelId: completion.modelId });
  const personalMetrics = metricsFromCompletion(completion, at, roundMs(now() - personalStarted));
  const result = artifact({
    cache: baseStatus === "hit" ? "personalised" : "miss",
    block: input.block,
    topic,
    grade,
    language,
    spec,
    metrics:
      baseStatus === "hit"
        ? { ...personalMetrics, wallTimeMs: roundMs(now() - started) }
        : addMetrics(baseMetrics, personalMetrics, at, roundMs(now() - started)),
  });
  logVisual(result);
  return result;
}

import { generateText } from "ai";
import { getChatProvider, getDeepSeekProviderOptions } from "@/lib/ai/env";
import { getActiveChatModelId, getChatModel } from "@/lib/ai/llm";
import { retrieveWaterCycleContext } from "@/lib/explainers/cbc-water-cycle";
import {
  deepseekFlashCostUsd,
  emptyMetrics,
  languageName,
} from "@/lib/explainers/script";
import type { DiagramCacheStore } from "@/lib/diagrams/cache";
import {
  DIAGRAM_PART_IDS,
  diagramCacheKey,
  normalizeDiagramRequest,
  parseDiagramContent,
  type DiagramMetrics,
  type DiagramResult,
} from "@/lib/diagrams/content";

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

function metricsFromCompletion(
  completion: Completion,
  at: Date,
  wallTimeMs: number
): DiagramMetrics {
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

function logDiagram(result: DiagramResult) {
  console.info(
    JSON.stringify({
      event: "diagram_request",
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

export async function requestDiagram(
  input: { topic: string; grade: number; language: string },
  deps?: {
    cache?: DiagramCacheStore;
    now?: () => number;
    at?: Date;
    complete?: (input: { system: string; prompt: string }) => Promise<Completion>;
  }
): Promise<DiagramResult> {
  const cache = deps?.cache;
  if (!cache) {
    throw new Error("Diagram cache is not configured.");
  }
  const now = deps?.now ?? (() => performance.now());
  const at = deps?.at ?? new Date();
  const started = now();
  const normalized = normalizeDiagramRequest(input);
  const key = diagramCacheKey(normalized);
  const hit = await cache.get(key);
  if (hit) {
    const result: DiagramResult = {
      cache: "hit",
      ...normalized,
      content: hit.content,
      metrics: { ...emptyMetrics(hit.modelId), wallTimeMs: roundMs(now() - started) },
    };
    logDiagram(result);
    return result;
  }

  const context = retrieveWaterCycleContext(normalized.topic);
  const completion = await (deps?.complete ?? completeWithModel)({
    system: [
      "You fill text for a fixed water-cycle diagram. You do not describe new parts or draw anything.",
      "Use only the context. Do not add facts the context does not state.",
      `Write in ${languageName(normalized.language)} for grade ${normalized.grade}.`,
      `The part ids are exactly ${DIAGRAM_PART_IDS.join(", ")}.`,
      "Each label is 1 to 3 words. Each explanation is one short sentence.",
      'Each prompt starts with "Tap" and asks the learner to find that part without giving the label.',
      'Reply with JSON only: {"title":"","parts":[{"id":"evaporation","label":"","explanation":"","prompt":""},{"id":"condensation","label":"","explanation":"","prompt":""},{"id":"precipitation","label":"","explanation":"","prompt":""},{"id":"collection","label":"","explanation":"","prompt":""}]}',
    ].join(" "),
    prompt: `Context:\n${context}\n\nTopic: ${normalized.topic}`,
  });
  const content = parseDiagramContent(completion.text);
  await cache.set(key, { content, modelId: completion.modelId });
  const result: DiagramResult = {
    cache: "miss",
    ...normalized,
    content,
    metrics: metricsFromCompletion(completion, at, roundMs(now() - started)),
  };
  logDiagram(result);
  return result;
}

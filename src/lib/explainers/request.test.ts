import { describe, expect, it, vi } from "vitest";
import { formatRagContext } from "@/lib/ai/rag";
import { WATER_CYCLE_PASSAGES } from "@/lib/explainers/cbc-water-cycle";
import {
  deepseekFlashCostUsd,
  explainerCacheKey,
  isDeepSeekPeak,
  parseExplainerScript,
  requestExplainer,
  templateVariables,
} from "@/lib/explainers/request";

const script = {
  title: "The water cycle",
  steps: [
    { label: "Evaporation", caption: "The sun turns water into vapour." },
    { label: "Condensation", caption: "Vapour cools and forms clouds." },
    { label: "Precipitation", caption: "Heavy drops fall as rain." },
    { label: "Collection", caption: "Water collects, then rises again." },
  ],
};

describe("explainer request", () => {
  it("formats the water-cycle passages like a RAG context block", () => {
    const context = formatRagContext([...WATER_CYCLE_PASSAGES]);
    expect(context.startsWith("[1] (CBC Science and Technology — Evaporation)")).toBe(
      true
    );
    expect(context).toContain("condensation");
    expect(context).not.toContain("photosynthesis");
  });

  it("caches by topic, grade, and language", () => {
    expect(
      explainerCacheKey({ topic: " The Water Cycle ", grade: 4, language: "English" })
    ).toBe("water cycle|4|en");
    expect(
      explainerCacheKey({ topic: "water cycle", grade: 6, language: "Kiswahili" })
    ).toBe("water cycle|6|sw");
  });

  it("prices a first deepseek-flash call and a cached call at zero", () => {
    const at = new Date("2026-11-11T04:36:00.000Z");
    expect(isDeepSeekPeak(at)).toBe(false);
    expect(isDeepSeekPeak(new Date("2026-11-11T02:00:00.000Z"))).toBe(true);
    const cost = deepseekFlashCostUsd({
      promptTokens: 800,
      completionTokens: 120,
      cachedPromptTokens: 0,
      at,
    });
    expect(cost).toBeCloseTo((800 * 0.15 + 120 * 0.6) / 1_000_000, 10);
    expect(
      deepseekFlashCostUsd({
        promptTokens: 0,
        completionTokens: 0,
        cachedPromptTokens: 0,
        at,
      })
    ).toBe(0);
  });

  it("calls the model once, then serves the same script from cache", async () => {
    const complete = vi.fn(async () => ({
      text: JSON.stringify(script),
      modelId: "deepseek-flash",
      promptTokens: 500,
      completionTokens: 80,
      cachedPromptTokens: 0,
    }));
    let clock = 1_000;
    const now = () => {
      clock += 25;
      return clock;
    };
    const cache = new Map();
    const input = { topic: "water cycle", grade: 4, language: "en" };
    const first = await requestExplainer(input, {
      cache,
      now,
      at: new Date("2026-11-11T04:36:00.000Z"),
      complete,
    });
    const second = await requestExplainer(input, {
      cache,
      now,
      at: new Date("2026-11-11T04:36:00.000Z"),
      complete,
    });

    expect(complete).toHaveBeenCalledTimes(1);
    expect(first.cache).toBe("miss");
    expect(first.metrics.promptTokens).toBe(500);
    expect(first.metrics.completionTokens).toBe(80);
    expect(first.metrics.costUsd).toBeGreaterThan(0);
    expect(first.metrics.wallTimeMs).toBeGreaterThan(0);
    expect(second.cache).toBe("hit");
    expect(second.script).toEqual(first.script);
    expect(second.metrics.promptTokens).toBe(0);
    expect(second.metrics.completionTokens).toBe(0);
    expect(second.metrics.costUsd).toBe(0);
    expect(templateVariables(second.script).step1).toBe("Evaporation");
  });

  it("strips a json fence before reading the script", () => {
    const parsed = parseExplainerScript("```json\n" + JSON.stringify(script) + "\n```");
    expect(parsed.title).toBe("The water cycle");
    expect(parsed.steps).toHaveLength(4);
  });

  it("rejects a topic other than the water cycle", async () => {
    await expect(
      requestExplainer(
        { topic: "photosynthesis", grade: 4, language: "en" },
        { cache: new Map(), complete: vi.fn() }
      )
    ).rejects.toThrow(/water cycle/);
  });
});

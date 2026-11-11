import { describe, expect, it, vi } from "vitest";
import { formatRagContext } from "@/lib/ai/rag";
import { WATER_CYCLE_PASSAGES } from "@/lib/explainers/cbc-water-cycle";
import { memoryExplainerCache } from "@/lib/explainers/cache";
import {
  deepseekFlashCostUsd,
  explainerCacheKey,
  isDeepSeekPeak,
  parseExplainerScript,
  personalCacheKey,
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
    const cache = memoryExplainerCache();
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

  it("personalises a cached base, then serves that layer from cache", async () => {
    const base = vi.fn(async () => ({
      text: JSON.stringify(script),
      modelId: "deepseek-flash",
      promptTokens: 500,
      completionTokens: 80,
      cachedPromptTokens: 0,
    }));
    const tailored = {
      title: "The water cycle",
      steps: script.steps.map((step, index) =>
        index === 3
          ? { label: "Collection", caption: "Rain fills the jerrycan, then rises again." }
          : step
      ),
    };
    const complete = vi.fn(async (input: { prompt: string }) => {
      if (input.prompt.includes("Base script")) {
        return {
          text: JSON.stringify(tailored),
          modelId: "deepseek-flash",
          promptTokens: 120,
          completionTokens: 40,
          cachedPromptTokens: 80,
        };
      }
      return base();
    });
    const cache = memoryExplainerCache();
    const at = new Date("2026-11-11T04:36:00.000Z");
    const input = {
      topic: "water cycle",
      grade: 4,
      language: "en",
      emphasis: "Use a jerrycan at home.",
    };
    const first = await requestExplainer(input, { cache, at, complete });
    const again = await requestExplainer(input, { cache, at, complete });

    expect(first.base).toBe("miss");
    expect(first.personal).toBe("miss");
    expect(first.cache).toBe("miss");
    expect(first.metrics.promptTokens).toBe(620);
    expect(first.metrics.cachedPromptTokens).toBe(80);
    expect(first.script.steps[3]?.caption).toContain("jerrycan");
    expect(again.cache).toBe("hit");
    expect(again.personal).toBe("hit");
    expect(again.metrics.promptTokens).toBe(0);
    expect(again.metrics.costUsd).toBe(0);
    expect(again.script).toEqual(first.script);
    expect(complete).toHaveBeenCalledTimes(2);

    const baseOnly = await requestExplainer(
      { topic: "water cycle", grade: 4, language: "en" },
      { cache, at, complete }
    );
    expect(baseOnly.cache).toBe("hit");
    expect(baseOnly.personal).toBe("skipped");
    expect(baseOnly.script).toEqual(script);
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it("prices only the personal call when the base is already cached", async () => {
    const complete = vi.fn(async (input: { prompt: string }) => ({
      text: JSON.stringify(
        input.prompt.includes("Base script")
          ? {
              ...script,
              steps: script.steps.slice(0, 3),
            }
          : script
      ),
      modelId: "deepseek-flash",
      promptTokens: 100,
      completionTokens: 20,
      cachedPromptTokens: 0,
    }));
    const cache = memoryExplainerCache();
    const at = new Date("2026-11-11T04:36:00.000Z");
    await requestExplainer(
      { topic: "water cycle", grade: 4, language: "en" },
      { cache, at, complete }
    );
    const personalised = await requestExplainer(
      {
        topic: "water cycle",
        grade: 4,
        language: "en",
        emphasis: "Emphasise collection.",
      },
      { cache, at, complete }
    );
    expect(personalised.cache).toBe("personalised");
    expect(personalised.base).toBe("hit");
    expect(personalised.metrics.promptTokens).toBe(100);
    expect(personalised.metrics.completionTokens).toBe(20);
    expect(personalised.script.steps).toHaveLength(3);
    expect(templateVariables(personalised.script).step4).toBe("");
    expect(personalCacheKey("water cycle|4|en", "Emphasise collection.")).toBe(
      personalCacheKey("water cycle|4|en", "  emphasise   collection. ")
    );
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
        { cache: memoryExplainerCache(), complete: vi.fn() }
      )
    ).rejects.toThrow(/water cycle/);
  });
});

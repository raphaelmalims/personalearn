import { describe, expect, it, vi } from "vitest";
import { memoryDiagramCache } from "@/lib/diagrams/cache";
import { diagramCacheKey, parseDiagramContent, SAMPLE_DIAGRAM } from "@/lib/diagrams/content";
import { requestDiagram } from "@/lib/diagrams/request";
import { tallyAnswers } from "@/lib/diagrams/tally";

describe("diagram content", () => {
  it("caches by topic, grade, and language in the explainer cache", () => {
    expect(diagramCacheKey({ topic: " The Water Cycle ", grade: 4, language: "English" })).toBe(
      "diagram|water cycle|4|en"
    );
  });

  it("rejects a script that drops a part", () => {
    const broken = {
      ...SAMPLE_DIAGRAM,
      parts: SAMPLE_DIAGRAM.parts.slice(0, 3),
    };
    expect(() => parseDiagramContent(JSON.stringify(broken))).toThrow(/template/);
  });

  it("calls the model once, then reads the same text from cache", async () => {
    const complete = vi.fn(async () => ({
      text: JSON.stringify(SAMPLE_DIAGRAM),
      modelId: "deepseek-flash",
      promptTokens: 400,
      completionTokens: 90,
      cachedPromptTokens: 0,
    }));
    const cache = memoryDiagramCache();
    const input = { topic: "water cycle", grade: 4, language: "en" };
    const at = new Date("2026-11-11T19:00:00.000Z");
    const first = await requestDiagram(input, { cache, at, complete });
    const second = await requestDiagram(input, { cache, at, complete });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(first.cache).toBe("miss");
    expect(first.metrics.promptTokens).toBe(400);
    expect(first.metrics.costUsd).toBeGreaterThan(0);
    expect(second.cache).toBe("hit");
    expect(second.metrics.promptTokens).toBe(0);
    expect(second.metrics.costUsd).toBe(0);
    expect(second.content).toEqual(first.content);
  });

  it("tallies wrong answers per part", () => {
    expect(
      tallyAnswers(["evaporation", "condensation", "precipitation", "collection"], [
        { partId: "evaporation", mode: "find", correct: false },
        { partId: "evaporation", mode: "find", correct: false },
        { partId: "evaporation", mode: "name", correct: true },
        { partId: "collection", mode: "name", correct: false },
      ])
    ).toEqual([
      { partId: "evaporation", correct: 1, incorrect: 2 },
      { partId: "condensation", correct: 0, incorrect: 0 },
      { partId: "precipitation", correct: 0, incorrect: 0 },
      { partId: "collection", correct: 0, incorrect: 1 },
    ]);
  });
});

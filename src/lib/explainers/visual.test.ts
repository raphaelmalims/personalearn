import { describe, expect, it } from "vitest";
import { NO_BLOCK_LINE, parseVisualSpec } from "@/lib/explainers/blocks";
import { bundledTopicContext } from "@/lib/explainers/topic-context";
import { memoryVisualCache } from "@/lib/explainers/visual-cache";
import { requestVisual } from "@/lib/explainers/visual";

const numberLine = {
  block: "number-line",
  title: "Introduction to Integers",
  min: -3,
  max: 2,
  points: [
    { value: -3, label: "-3", caption: "Negative three is left of zero." },
    { value: 0, label: "0", caption: "Zero sits between the sides." },
    { value: 2, label: "2", caption: "Two is a positive integer." },
  ],
  quiz: { prompt: "Which point is less than zero?", answer: "-3" },
};

describe("visual blocks", () => {
  it("rejects a spec that is not the chosen block", () => {
    expect(() => parseVisualSpec(JSON.stringify(numberLine), "process-flow")).toThrow(
      /did not match/
    );
  });

  it("fills from context once, then reads the cache", async () => {
    const cache = memoryVisualCache();
    let calls = 0;
    const complete = async () => {
      calls += 1;
      return {
        text: JSON.stringify(numberLine),
        modelId: "deepseek-flash",
        promptTokens: 300,
        completionTokens: 80,
        cachedPromptTokens: 0,
      };
    };
    const input = {
      block: "number-line" as const,
      topic: "Introduction to Integers",
      grade: 7,
      language: "en",
      context: bundledTopicContext("integers"),
    };
    const first = await requestVisual(input, { cache, complete });
    const second = await requestVisual(input, { cache, complete });
    expect(first.fit).toBe(true);
    expect(second.fit).toBe(true);
    if (first.fit && second.fit) {
      expect(first.cache).toBe("miss");
      expect(first.metrics.promptTokens).toBe(300);
      expect(second.cache).toBe("hit");
      expect(second.metrics.promptTokens).toBe(0);
      expect(second.metrics.costUsd).toBe(0);
      expect(second.spec).toEqual(first.spec);
    }
    expect(calls).toBe(1);
  });

  it("returns the validated spec when the cache write throws", async () => {
    const result = await requestVisual(
      {
        block: "number-line",
        topic: "Introduction to Integers",
        grade: 7,
        language: "en",
        context: bundledTopicContext("integers"),
      },
      {
        cache: {
          async get() {
            return null;
          },
          async set() {
            throw new Error("Visual cache write failed.");
          },
        },
        complete: async () => ({
          text: JSON.stringify(numberLine),
          modelId: "deepseek-flash",
          promptTokens: 10,
          completionTokens: 10,
          cachedPromptTokens: 0,
        }),
      }
    );
    expect(result.fit).toBe(true);
    if (result.fit) expect(result.spec.title).toBe("Introduction to Integers");
  });

  it("says no block fits when there is no CBC context", async () => {
    const result = await requestVisual(
      {
        block: "timeline",
        topic: "photosynthesis",
        grade: 6,
        language: "en",
        context: null,
      },
      { cache: memoryVisualCache() }
    );
    expect(result).toEqual({ fit: false, line: NO_BLOCK_LINE });
  });
});

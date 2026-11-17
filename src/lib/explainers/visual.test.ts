import { describe, expect, it } from "vitest";
import { parseVisualSpec } from "@/lib/explainers/blocks";
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

  it("fills a scene from the topic when no passage was retrieved", async () => {
    const scene = {
      block: "scene" as const,
      title: "A volcano",
      parts: [
        { id: "vent", label: "Vent", explanation: "Magma rises through the vent.", prompt: "Tap the vent.", x: 48, y: 28 },
        { id: "magma", label: "Magma", explanation: "Hot rock collects under the cone.", prompt: "Tap the magma.", x: 48, y: 72 },
      ],
      arrows: [{ from: "magma", to: "vent" }],
      quiz: { prompt: "Where does magma leave?", answer: "Vent" },
    };
    const result = await requestVisual(
      {
        block: "scene",
        topic: "volcano",
        grade: 6,
        language: "en",
        context: null,
      },
      {
        cache: memoryVisualCache(),
        complete: async () => ({
          text: JSON.stringify(scene),
          modelId: "deepseek-flash",
          promptTokens: 8,
          completionTokens: 8,
          cachedPromptTokens: 0,
        }),
      }
    );
    expect(result.fit).toBe(true);
    if (result.fit) {
      expect(result.spec.block).toBe("scene");
      expect(result.cache).toBe("miss");
    }
  });

  it("rejects model output that is not a valid scene", async () => {
    await expect(
      requestVisual(
        {
          block: "scene",
          topic: "volcano",
          grade: 6,
          language: "en",
          context: "Magma rises.",
        },
        {
          cache: memoryVisualCache(),
          complete: async () => ({
            text: "not a scene",
            modelId: "deepseek-flash",
            promptTokens: 1,
            completionTokens: 1,
            cachedPromptTokens: 0,
          }),
        }
      )
    ).rejects.toThrow(/not JSON/);
  });
});

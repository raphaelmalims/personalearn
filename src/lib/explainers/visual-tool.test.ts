import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NO_BLOCK_LINE } from "@/lib/explainers/blocks";
import { supabaseVisualCache } from "@/lib/explainers/visual-cache";
import { executeVisualise } from "@/lib/explainers/visual-tool";

const mockRequestVisual = vi.fn();

vi.mock("@/lib/explainers/visual", () => ({
  requestVisual: (...args: unknown[]) => mockRequestVisual(...args),
}));

vi.mock("@/lib/explainers/weak-topics", () => ({
  loadWeakTopics: async () => [],
}));

const deps = {
  supabase: {} as SupabaseClient,
  classId: "class-1",
  grade: 4,
};

describe("executeVisualise", () => {
  beforeEach(() => {
    mockRequestVisual.mockReset();
  });

  it("returns the spec when the cache cannot be written", async () => {
    const spec = {
      block: "process-flow" as const,
      title: "The water cycle",
      steps: [
        { label: "Evaporation", caption: "Water rises." },
        { label: "Condensation", caption: "Clouds form." },
        { label: "Precipitation", caption: "Rain falls." },
        { label: "Collection", caption: "Water gathers." },
      ],
      quiz: { prompt: "What falls?", answer: "Rain" },
    };
    mockRequestVisual.mockImplementation(async () => {
      const cache = supabaseVisualCache({
        from() {
          return {
            upsert: async () => ({ error: { message: "relation explainer_cache does not exist" } }),
          };
        },
      } as unknown as SupabaseClient);
      await cache.set("visual|process-flow|water cycle|4|en", {
        spec,
        modelId: "deepseek-flash",
      });
      return {
        fit: true,
        block: "process-flow",
        topic: "water cycle",
        grade: 4,
        language: "en",
        spec,
        cache: "miss",
        metrics: {
          modelId: "deepseek-flash",
          promptTokens: 12,
          completionTokens: 8,
          cachedPromptTokens: 0,
          costUsd: 0,
          wallTimeMs: 1,
        },
      };
    });

    const result = await executeVisualise(deps, { block: "process-flow", topic: "water cycle" });
    expect(result).toMatchObject({ fit: true, spec });
  });

  it("uses the no-fit line only for invalid model output", async () => {
    mockRequestVisual.mockRejectedValue(new Error("Visual spec was not JSON."));
    await expect(
      executeVisualise(deps, { block: "process-flow", topic: "water cycle" })
    ).resolves.toEqual({ fit: false, line: NO_BLOCK_LINE });

    mockRequestVisual.mockRejectedValue(new Error("Visual cache write failed."));
    await expect(
      executeVisualise(deps, { block: "process-flow", topic: "water cycle" })
    ).rejects.toThrow(/cache write/);
  });
});

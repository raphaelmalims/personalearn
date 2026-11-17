import { describe, expect, it } from "vitest";
import { supabaseExplainerCache } from "@/lib/explainers/cache";

const script = {
  title: "The water cycle",
  steps: [
    { label: "Evaporation", caption: "The sun turns water into vapour." },
    { label: "Condensation", caption: "Vapour cools and forms clouds." },
    { label: "Precipitation", caption: "Heavy drops fall as rain." },
    { label: "Collection", caption: "Water collects, then rises again." },
  ],
};

function fakeSupabase() {
  const rows = new Map<string, { script: unknown; model_id: string }>();
  return {
    from(table: string) {
      if (table !== "explainer_cache") throw new Error(table);
      return {
        select() {
          return {
            eq(_column: string, key: string) {
              return {
                maybeSingle: async () => ({ data: rows.get(key) ?? null, error: null }),
              };
            },
          };
        },
        upsert: async (row: { cache_key: string; script: unknown; model_id: string }) => {
          rows.set(row.cache_key, { script: row.script, model_id: row.model_id });
          return { error: null };
        },
      };
    },
  };
}

describe("supabase explainer cache", () => {
  it("reads back a script after a write", async () => {
    const cache = supabaseExplainerCache(fakeSupabase() as never);
    expect(await cache.get("water cycle|4|en")).toBeNull();
    await cache.set("water cycle|4|en", { script, modelId: "deepseek-flash" });
    await expect(cache.get("water cycle|4|en")).resolves.toEqual({
      script,
      modelId: "deepseek-flash",
    });
  });
});

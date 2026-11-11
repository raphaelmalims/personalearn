import type { SupabaseClient } from "@supabase/supabase-js";
import { visualSpecFromUnknown, type VisualSpec } from "@/lib/explainers/blocks";

export type VisualCacheEntry = {
  spec: VisualSpec;
  modelId: string;
};

export type VisualCacheStore = {
  get(key: string): Promise<VisualCacheEntry | null>;
  set(key: string, entry: VisualCacheEntry): Promise<void>;
};

export function memoryVisualCache(): VisualCacheStore {
  const rows = new Map<string, VisualCacheEntry>();
  return {
    async get(key) {
      return rows.get(key) ?? null;
    },
    async set(key, entry) {
      rows.set(key, entry);
    },
  };
}

type CacheRow = {
  script: unknown;
  model_id: string;
};

/** Same `explainer_cache` table. Keys start with `visual|`. */
export function supabaseVisualCache(supabase: SupabaseClient): VisualCacheStore {
  return {
    async get(key) {
      const { data, error } = await supabase
        .from("explainer_cache")
        .select("script, model_id")
        .eq("cache_key", key)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as CacheRow;
      try {
        return { spec: visualSpecFromUnknown(row.script), modelId: row.model_id };
      } catch {
        return null;
      }
    },
    async set(key, entry) {
      const { error } = await supabase.from("explainer_cache").upsert({
        cache_key: key,
        script: entry.spec,
        model_id: entry.modelId,
      });
      if (error) throw new Error("Visual cache write failed.");
    },
  };
}

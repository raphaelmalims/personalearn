import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseExplainerScript,
  type ExplainerScript,
} from "@/lib/explainers/script";

export type ExplainerCacheEntry = {
  script: ExplainerScript;
  modelId: string;
};

export type ExplainerCacheStore = {
  get(key: string): Promise<ExplainerCacheEntry | null>;
  set(key: string, entry: ExplainerCacheEntry): Promise<void>;
};

export function memoryExplainerCache(): ExplainerCacheStore {
  const rows = new Map<string, ExplainerCacheEntry>();
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

/** Shared base and personal scripts. Survives a serverless restart. */
export function supabaseExplainerCache(supabase: SupabaseClient): ExplainerCacheStore {
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
        return {
          script: parseExplainerScript(JSON.stringify(row.script)),
          modelId: row.model_id,
        };
      } catch {
        return null;
      }
    },
    async set(key, entry) {
      const { error } = await supabase.from("explainer_cache").upsert({
        cache_key: key,
        script: entry.script,
        model_id: entry.modelId,
      });
      if (error) {
        throw new Error("Explainer cache write failed.");
      }
    },
  };
}

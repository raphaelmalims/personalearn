import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDiagramContent, type DiagramContent } from "@/lib/diagrams/content";

export type DiagramCacheEntry = {
  content: DiagramContent;
  modelId: string;
};

export type DiagramCacheStore = {
  get(key: string): Promise<DiagramCacheEntry | null>;
  set(key: string, entry: DiagramCacheEntry): Promise<void>;
};

export function memoryDiagramCache(): DiagramCacheStore {
  const rows = new Map<string, DiagramCacheEntry>();
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

/** Same `explainer_cache` table as the explainer. Keys are prefixed with `diagram|`. */
export function supabaseDiagramCache(supabase: SupabaseClient): DiagramCacheStore {
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
          content: parseDiagramContent(JSON.stringify(row.script)),
          modelId: row.model_id,
        };
      } catch {
        return null;
      }
    },
    async set(key, entry) {
      const { error } = await supabase.from("explainer_cache").upsert({
        cache_key: key,
        script: entry.content,
        model_id: entry.modelId,
      });
      if (error) {
        throw new Error("Diagram cache write failed.");
      }
    },
  };
}

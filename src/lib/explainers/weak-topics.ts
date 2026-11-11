import type { SupabaseClient } from "@supabase/supabase-js";

/** Strand names the class has not mastered, strongest need first. */
export async function loadWeakTopics(
  supabase: SupabaseClient,
  classId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("competency_progress")
      .select("strand, status")
      .eq("class_id", classId)
      .in("status", ["not_yet", "developing"])
      .limit(40);
    if (error || !Array.isArray(data)) return [];

    const rank = new Map<string, number>();
    for (const row of data) {
      const strand = typeof row.strand === "string" ? row.strand.trim() : "";
      if (!strand) continue;
      const weight = row.status === "not_yet" ? 2 : 1;
      rank.set(strand, (rank.get(strand) ?? 0) + weight);
    }

    return [...rank.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([strand]) => strand);
  } catch {
    return [];
  }
}

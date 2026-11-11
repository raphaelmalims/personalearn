import type { SupabaseClient } from "@supabase/supabase-js";
import { retrieveClassContext } from "@/lib/ai/rag";
import {
  NO_BLOCK_LINE,
  isVisualBlock,
  type VisualBlock,
} from "@/lib/explainers/blocks";
import { buildEmphasis } from "@/lib/explainers/personalise";
import { bundledTopicContext, canonicalTopic } from "@/lib/explainers/topic-context";
import { requestVisual } from "@/lib/explainers/visual";
import { supabaseVisualCache } from "@/lib/explainers/visual-cache";
import { loadWeakTopics } from "@/lib/explainers/weak-topics";
import { normalizeGrade, normalizeLanguage } from "@/lib/explainers/script";

export async function executeVisualise(
  deps: {
    supabase: SupabaseClient;
    classId: string;
    grade: number;
  },
  input: {
    block: string;
    topic: string;
    grade?: number;
    language?: string;
    note?: string;
  }
) {
  if (!isVisualBlock(input.block)) {
    return { fit: false as const, line: NO_BLOCK_LINE };
  }
  const topic = input.topic.trim();
  if (!topic) return { fit: false as const, line: NO_BLOCK_LINE };

  let grade = deps.grade;
  if (input.grade !== undefined) {
    try {
      grade = normalizeGrade(input.grade);
    } catch {
      return { fit: false as const, line: NO_BLOCK_LINE };
    }
  }
  let language = "en";
  if (input.language) {
    try {
      language = normalizeLanguage(input.language);
    } catch {
      language = "en";
    }
  }

  const context = await loadContext(deps, input.block, topic);
  const weakTopics = await loadWeakTopics(deps.supabase, deps.classId);
  const emphasis = buildEmphasis({
    weakTopics,
    message: input.note?.trim() || "",
  });

  try {
    return await requestVisual(
      {
        block: input.block,
        topic,
        grade,
        language,
        emphasis,
        context,
      },
      { cache: supabaseVisualCache(deps.supabase) }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Visual failed";
    const invalid = /not JSON|did not match the block/i.test(message);
    console.info(
      JSON.stringify({
        event: "visual_request",
        fit: invalid ? false : "error",
        block: input.block,
        topic: canonicalTopic(topic),
        message,
      })
    );
    if (invalid) return { fit: false as const, line: NO_BLOCK_LINE };
    throw error;
  }
}

async function loadContext(
  deps: { supabase: SupabaseClient; classId: string },
  block: VisualBlock,
  topic: string
) {
  const canonical = canonicalTopic(topic);
  if (canonical === "water cycle" && block === "process-flow") {
    return bundledTopicContext(canonical);
  }
  if (canonical !== "water cycle") {
    try {
      const fromClass = await retrieveClassContext(
        deps.supabase,
        deps.classId,
        `${topic} ${block}`
      );
      if (fromClass) return fromClass;
    } catch {
      // Class search needs embeddings. The bundled pack still covers the proof topics.
    }
  }
  return bundledTopicContext(topic);
}

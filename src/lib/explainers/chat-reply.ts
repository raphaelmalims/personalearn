import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appendConversationMessages } from "@/lib/ai-hub/conversations";
import { supabaseExplainerCache } from "@/lib/explainers/cache";
import type { ExplainerArtifact } from "@/lib/explainers/artifact";
import { languageFromRequest } from "@/lib/explainers/intent";
import { buildEmphasis } from "@/lib/explainers/personalise";
import { requestExplainer, type ExplainerResult } from "@/lib/explainers/request";
import { loadWeakTopics } from "@/lib/explainers/weak-topics";

export function explainerArtifact(result: ExplainerResult): ExplainerArtifact {
  return {
    topic: result.topic,
    grade: result.grade,
    language: result.language,
    title: result.script.title,
    steps: result.script.steps,
    cache: result.cache,
    metrics: result.metrics,
  };
}

export function explainerReplyText(result: ExplainerResult) {
  const language = result.language === "sw" ? "Kiswahili" : "English";
  return `Here is ${result.script.title} for grade ${result.grade} in ${language}.`;
}

export async function replyWithExplainer(input: {
  supabase: SupabaseClient;
  classId: string;
  conversationId: string;
  message: string;
  grade: number;
}) {
  const weakTopics = await loadWeakTopics(input.supabase, input.classId);
  const emphasis = buildEmphasis({
    weakTopics,
    message: input.message,
  });
  const result = await requestExplainer(
    {
      topic: "water cycle",
      grade: input.grade,
      language: languageFromRequest(input.message),
      emphasis,
    },
    { cache: supabaseExplainerCache(input.supabase) }
  );
  const artifact = explainerArtifact(result);
  const text = explainerReplyText(result);

  await appendConversationMessages(input.supabase, input.conversationId, [
    {
      role: "assistant",
      content: text,
      tool_calls: { explainer: artifact },
    },
  ]);

  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });
      writer.write({ type: "text-start", id: "explainer-text" });
      writer.write({ type: "text-delta", id: "explainer-text", delta: text });
      writer.write({ type: "text-end", id: "explainer-text" });
      writer.write({
        type: "data-explainer",
        id: "explainer",
        data: artifact,
      });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish", finishReason: "stop" });
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: { "X-Conversation-Id": input.conversationId },
  });
}

import {
  appendConversationMessages,
  countConversationMessages,
  createConversation,
  getConversationWithMessages,
  getLatestUserMessageText,
  requireConversationAccess,
  truncateConversationFromIndex,
  updateConversationChatSettings,
  updateConversationTitle,
} from "@/lib/ai-hub/conversations";
import { createAgentTools } from "@/lib/ai-hub/agent-tools";
import {
  buildClassAssistantSystemPrompt,
  getClassContext,
} from "@/lib/ai-hub/class-context";
import { generateConversationTitle } from "@/lib/ai-hub/conversation-title";
import { generateAiConversationTitle } from "@/lib/ai-hub/generate-conversation-title";
import { materializeAttachmentText } from "@/lib/ai-hub/chat-attachments-server";
import {
  getAssistantPersistContent,
  getMessageReasoning,
  getMessageText,
  getVisibleDrafts,
  getVisibleEvalSessions,
} from "@/lib/ai-hub/message-content";
import {
  chatSettingsColumns,
  requestThinking,
  resolveRequestChatSettings,
} from "@/lib/ai/chat-settings";
import { getChatModelForSettings } from "@/lib/ai/llm";
import {
  assertChatConfigured,
  getDeepSeekProviderOptions,
} from "@/lib/ai/env";
import {
  createChatReplyTimer,
  logChatReply,
  logChatStreamError,
} from "@/lib/ai/chat-telemetry";
import { requireTeacherClass } from "@/lib/auth/require-teacher-class";
import { createClient } from "@/lib/supabase/server";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { mapApiError } from "@/lib/ai-hub/api-errors";

const bodySchema = z.object({
  classId: z.string().uuid(),
  conversationId: z.string().uuid().optional().nullable(),
  messages: z.array(z.custom<UIMessage>()),
  id: z.string().optional(),
  trigger: z.string().optional(),
  messageId: z.string().optional(),
  truncateFromMessageIndex: z.number().int().min(0).optional(),
  chatThinking: z.string().max(20).optional(),
  chatReasoningEffort: z.string().max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { classId, conversationId, truncateFromMessageIndex } = parsed.data;
    const messages = await materializeAttachmentText(parsed.data.messages);
    const user = await requireTeacherClass(supabase, classId);
    assertChatConfigured();
    const settings = resolveRequestChatSettings({
      thinking: parsed.data.chatThinking,
      effort: parsed.data.chatReasoningEffort,
    });
    const thinking = requestThinking(settings);
    const classContext = await getClassContext(supabase, classId);
    const systemPrompt = buildClassAssistantSystemPrompt(classContext);

    let activeConversationId = conversationId ?? null;

    if (activeConversationId) {
      const conversation = await requireConversationAccess(
        supabase,
        activeConversationId,
        user.id
      );

      if (conversation.class_id !== classId) {
        throw new Error("Conversation not found");
      }

      if (truncateFromMessageIndex !== undefined) {
        await truncateConversationFromIndex(
          supabase,
          activeConversationId,
          user.id,
          truncateFromMessageIndex
        );
      }

      await updateConversationChatSettings(
        supabase,
        activeConversationId,
        chatSettingsColumns(settings)
      );
    } else {
      const latestUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === "user");
      const titleSource = latestUserMessage
        ? getMessageText(latestUserMessage)
        : "New conversation";
      const conversation = await createConversation(supabase, {
        classId,
        teacherId: user.id,
        title: generateConversationTitle(titleSource),
        chatModel: settings.modelId,
        chatThinking: settings.thinking,
        chatReasoningEffort: settings.effort,
      });
      activeConversationId = conversation.id;
    }

    const { messages: persistedMessages } = await getConversationWithMessages(
      supabase,
      activeConversationId,
      user.id
    );
    const persistedUserText = getLatestUserMessageText(persistedMessages);
    const latestUserText = getLatestUserMessageText(messages);

    if (latestUserText && latestUserText !== persistedUserText) {
      await appendConversationMessages(supabase, activeConversationId, [
        {
          role: "user",
          content: latestUserText,
        },
      ]);
    }

    const tools = createAgentTools({
      supabase,
      classId,
      teacherId: user.id,
      classContext,
      conversationId: activeConversationId,
    });

    const effort = settings.apiEffort;
    const modelId = settings.modelId;
    const timer = createChatReplyTimer();

    const result = streamText({
      model: getChatModelForSettings({
        provider: settings.provider,
        modelId,
        thinking,
        reasoningEffort: effort,
      }),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5),
      experimental_transform: smoothStream({ delayInMs: null, chunking: "word" }),
      ...(settings.provider === "deepseek"
        ? {
            providerOptions: getDeepSeekProviderOptions({
              thinking,
              reasoningEffort: effort,
            }),
          }
        : {}),
      onChunk: ({ chunk }) => {
        timer.noteChunk(chunk);
      },
      onEnd: ({ usage, steps }) => {
        logChatReply(
          timer.metrics({
            modelId,
            thinking,
            effort,
            usage,
            steps,
          })
        );
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "X-Conversation-Id": activeConversationId,
      },
      ...(settings.provider === "deepseek"
        ? { sendReasoning: thinking === "enabled" }
        : {}),
      messageMetadata: ({ part }) => {
        if (part.type !== "finish") return undefined;
        const reasoningMs =
          thinking === "enabled" ? timer.reasoningDurationMs() : null;
        return {
          ...(reasoningMs == null ? {} : { reasoningMs }),
          modelId,
          thinking,
          effort: thinking === "enabled" ? settings.effort : null,
        };
      },
      onEnd: async ({ responseMessage, isAborted }) => {
        if (isAborted) {
          return;
        }

        const persistContent = getAssistantPersistContent(responseMessage);
        const drafts = getVisibleDrafts(responseMessage);
        const evalSessions = getVisibleEvalSessions(responseMessage);
        const reasoning =
          thinking === "enabled" ? getMessageReasoning(responseMessage).trim() : "";
        if (
          !persistContent &&
          drafts.length === 0 &&
          evalSessions.length === 0 &&
          !reasoning
        ) {
          return;
        }

        await appendConversationMessages(supabase, activeConversationId!, [
          {
            role: "assistant",
            content:
              persistContent ||
              evalSessions
                .map((session) =>
                  session.assessmentTitle
                    ? `Evaluation session · ${session.assessmentTitle}`
                    : "Evaluation session started."
                )
                .join("\n") ||
              "Done.",
            tool_calls:
              drafts.length > 0 || evalSessions.length > 0
                ? {
                    ...(drafts.length > 0 ? { drafts } : {}),
                    ...(evalSessions.length > 0 ? { evalSessions } : {}),
                  }
                : null,
            reasoning: reasoning || null,
            reasoning_ms: reasoning ? timer.reasoningDurationMs() : null,
            answer_model: modelId,
            answer_thinking: thinking,
            answer_effort: thinking === "enabled" ? settings.effort : null,
          },
        ]);

        const messageCount = await countConversationMessages(
          supabase,
          activeConversationId!
        );

        if (messageCount === 2 && latestUserText) {
          const title = await generateAiConversationTitle(
            latestUserText,
            persistContent
          );
          await updateConversationTitle(supabase, activeConversationId!, title);
        }
      },
      onError: (error) => {
        logChatStreamError(error, modelId);
        const message = error instanceof Error ? error.message : "";
        if (
          /Missing (DEEPSEEK|XAI)_API_KEY/i.test(message) ||
          /CHAT_PROVIDER/i.test(message)
        ) {
          return message;
        }
        return "The assistant could not respond. Please try again.";
      },
    });
  } catch (error) {
    const { message, status } = mapApiError(error);
    return Response.json({ error: message }, { status });
  }
}

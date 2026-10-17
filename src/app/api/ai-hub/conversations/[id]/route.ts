import { NextResponse } from "next/server";
import { z } from "zod";
import { mapApiError } from "@/lib/ai-hub/api-errors";
import {
  chatSettingsColumns,
  resolveRequestChatSettings,
} from "@/lib/ai/chat-settings";
import {
  deleteConversation,
  getConversationWithMessages,
  truncateConversationFromIndex,
  updateConversationChatSettings,
} from "@/lib/ai-hub/conversations";
import { requireTeacherClass } from "@/lib/auth/require-teacher-class";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z
  .object({
    fromMessageIndex: z.number().int().min(0).optional(),
    chatModel: z.string().max(80).optional(),
    chatThinking: z.string().max(20).optional(),
    chatReasoningEffort: z.string().max(20).optional(),
  })
  .refine(
    (value) =>
      value.fromMessageIndex !== undefined ||
      value.chatModel !== undefined ||
      value.chatThinking !== undefined ||
      value.chatReasoningEffort !== undefined,
    { message: "Invalid request body" }
  );

export async function GET(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    const { conversation, messages } = await getConversationWithMessages(
      supabase,
      id,
      user.id
    );

    await requireTeacherClass(supabase, conversation.class_id);

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    const { message, status } = mapApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    await deleteConversation(supabase, id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = mapApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Not authenticated");
    }

    const json = await request.json();
    const parsed = patchSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { conversation } = await getConversationWithMessages(supabase, id, user.id);
    await requireTeacherClass(supabase, conversation.class_id);

    if (parsed.data.fromMessageIndex !== undefined) {
      await truncateConversationFromIndex(
        supabase,
        id,
        user.id,
        parsed.data.fromMessageIndex
      );
    }

    const hasChatChoice =
      parsed.data.chatModel !== undefined ||
      parsed.data.chatThinking !== undefined ||
      parsed.data.chatReasoningEffort !== undefined;

    if (hasChatChoice) {
      const settings = resolveRequestChatSettings({
        modelId: parsed.data.chatModel ?? conversation.chat_model,
        thinking: parsed.data.chatThinking ?? conversation.chat_thinking,
        effort: parsed.data.chatReasoningEffort ?? conversation.chat_reasoning_effort,
      });
      await updateConversationChatSettings(
        supabase,
        id,
        chatSettingsColumns(settings)
      );
      return NextResponse.json({ success: true, chatSettings: settings });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = mapApiError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

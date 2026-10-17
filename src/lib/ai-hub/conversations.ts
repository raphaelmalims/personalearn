import type { SupabaseClient } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import { getMessageText, toUIMessageFromRow } from "@/lib/ai-hub/message-content";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type ConversationRow = {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  chat_model?: string | null;
  chat_thinking?: string | null;
  chat_reasoning_effort?: string | null;
};

export type ConversationMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_calls: unknown | null;
  reasoning: string | null;
  reasoning_ms: number | null;
  answer_model?: string | null;
  answer_thinking?: string | null;
  answer_effort?: string | null;
  created_at: string;
};

export async function listConversationsForClass(
  supabase: SupabaseClient,
  classId: string
): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("class_id", classId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Conversation lookup failed: ${error.message}`);
  }

  return (data ?? []) as ConversationRow[];
}

export async function requireConversationAccess(
  supabase: SupabaseClient,
  conversationId: string,
  teacherId: string
): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Conversation not found");
  }

  return data as ConversationRow;
}

export async function getConversationWithMessages(
  supabase: SupabaseClient,
  conversationId: string,
  teacherId: string
): Promise<{ conversation: ConversationRow; messages: UIMessage[] }> {
  const conversation = await requireConversationAccess(
    supabase,
    conversationId,
    teacherId
  );

  const { data, error } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Message lookup failed: ${error.message}`);
  }

  const rows = ((data ?? []) as ConversationMessageRow[])
    .filter((row) => row.role === "user" || row.role === "assistant");

  const messages = rows.map((row) =>
    toUIMessageFromRow({
      id: row.id,
      role: row.role,
      content: row.content,
      tool_calls: row.tool_calls,
      reasoning: row.reasoning,
      reasoning_ms: row.reasoning_ms,
      answer_model: row.answer_model,
      answer_thinking: row.answer_thinking,
      answer_effort: row.answer_effort,
    })
  );

  return { conversation, messages };
}

export async function createConversation(
  supabase: SupabaseClient,
  input: {
    classId: string;
    teacherId: string;
    title: string;
    chatModel?: string | null;
    chatThinking?: string | null;
    chatReasoningEffort?: string | null;
  }
): Promise<ConversationRow> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      class_id: input.classId,
      teacher_id: input.teacherId,
      title: input.title,
      ...(input.chatModel !== undefined ? { chat_model: input.chatModel } : {}),
      ...(input.chatThinking !== undefined
        ? { chat_thinking: input.chatThinking }
        : {}),
      ...(input.chatReasoningEffort !== undefined
        ? { chat_reasoning_effort: input.chatReasoningEffort }
        : {}),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Conversation create failed: ${error?.message ?? "unknown"}`);
  }

  return data as ConversationRow;
}

export async function touchConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Conversation update failed: ${error.message}`);
  }
}

export async function updateConversationChatSettings(
  supabase: SupabaseClient,
  conversationId: string,
  settings: {
    chat_model: string;
    chat_thinking: string;
    chat_reasoning_effort: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({
      chat_model: settings.chat_model,
      chat_thinking: settings.chat_thinking,
      chat_reasoning_effort: settings.chat_reasoning_effort,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Conversation settings update failed: ${error.message}`);
  }
}

export async function updateConversationTitle(
  supabase: SupabaseClient,
  conversationId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Conversation title update failed: ${error.message}`);
  }
}

export async function countConversationMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("conversation_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  if (error) {
    throw new Error(`Message count failed: ${error.message}`);
  }

  return count ?? 0;
}

export async function deleteConversation(
  supabase: SupabaseClient,
  conversationId: string,
  teacherId: string
): Promise<void> {
  await requireConversationAccess(supabase, conversationId, teacherId);

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Conversation delete failed: ${error.message}`);
  }
}

export async function truncateConversationFromIndex(
  supabase: SupabaseClient,
  conversationId: string,
  teacherId: string,
  fromMessageIndex: number
): Promise<void> {
  await requireConversationAccess(supabase, conversationId, teacherId);

  const { data, error } = await supabase
    .from("conversation_messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Message lookup failed: ${error.message}`);
  }

  const rows = data ?? [];
  if (fromMessageIndex >= rows.length) {
    return;
  }

  const idsToDelete = rows.slice(fromMessageIndex).map((row) => row.id);

  const { error: deleteError } = await supabase
    .from("conversation_messages")
    .delete()
    .in("id", idsToDelete);

  if (deleteError) {
    throw new Error(`Message truncate failed: ${deleteError.message}`);
  }

  await touchConversation(supabase, conversationId);
}

export async function appendConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  messages: Array<{
    id?: string;
    role: "user" | "assistant" | "tool";
    content: string;
    tool_calls?: unknown | null;
    reasoning?: string | null;
    reasoning_ms?: number | null;
    answer_model?: string | null;
    answer_thinking?: string | null;
    answer_effort?: string | null;
  }>
): Promise<ConversationMessageRow[]> {
  if (messages.length === 0) {
    return [];
  }

  const rows = messages.map((message) => ({
    ...(message.id && isUuid(message.id) ? { id: message.id } : {}),
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    tool_calls: message.tool_calls ?? null,
    ...(message.reasoning !== undefined ? { reasoning: message.reasoning } : {}),
    ...(message.reasoning_ms !== undefined
      ? { reasoning_ms: message.reasoning_ms }
      : {}),
    ...(message.answer_model !== undefined
      ? { answer_model: message.answer_model }
      : {}),
    ...(message.answer_thinking !== undefined
      ? { answer_thinking: message.answer_thinking }
      : {}),
    ...(message.answer_effort !== undefined
      ? { answer_effort: message.answer_effort }
      : {}),
  }));

  const { data, error } = await supabase
    .from("conversation_messages")
    .insert(rows)
    .select("*");

  if (error) {
    throw new Error(`Message insert failed: ${error.message}`);
  }

  await touchConversation(supabase, conversationId);
  return (data ?? []) as ConversationMessageRow[];
}

export function getLatestUserMessageText(messages: UIMessage[]): string {
  const latest = [...messages].reverse().find((message) => message.role === "user");
  return latest ? getMessageText(latest).trim() : "";
}

export function findNewPersistableMessages(
  uiMessages: UIMessage[],
  persistedIds: Set<string>
): UIMessage[] {
  return uiMessages.filter((message) => {
    if (persistedIds.has(message.id)) {
      return false;
    }

    const text = getMessageText(message).trim();
    return text.length > 0 && (message.role === "user" || message.role === "assistant");
  });
}

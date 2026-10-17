-- Per-conversation Hub model/thinking choice, and the model that answered each reply.
-- Nullable so existing threads keep using CHAT_MODEL / CHAT_THINKING / CHAT_REASONING_EFFORT.

alter table public.conversations
  add column if not exists chat_model text,
  add column if not exists chat_thinking text,
  add column if not exists chat_reasoning_effort text;

alter table public.conversation_messages
  add column if not exists answer_model text,
  add column if not exists answer_thinking text,
  add column if not exists answer_effort text;

comment on column public.conversations.chat_model is
  'Hub composer model id. Null uses CHAT_MODEL / CHAT_PROVIDER.';
comment on column public.conversations.chat_thinking is
  'enabled or disabled. Null uses CHAT_THINKING.';
comment on column public.conversations.chat_reasoning_effort is
  'low, medium, high, or max. Null uses CHAT_REASONING_EFFORT.';
comment on column public.conversation_messages.answer_model is
  'Model id that produced this assistant reply.';
comment on column public.conversation_messages.answer_thinking is
  'Whether thinking was on for this reply.';
comment on column public.conversation_messages.answer_effort is
  'Picker effort for this reply when thinking was on.';

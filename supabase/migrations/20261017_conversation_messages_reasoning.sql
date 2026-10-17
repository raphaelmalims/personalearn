-- PSL-127: persist Hub assistant reasoning for the Thinking panel
-- and the required reasoning_content round-trip on tool turns.
-- Display and API replay only. RLS is unchanged (existing conversation policies).

ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS reasoning TEXT,
  ADD COLUMN IF NOT EXISTS reasoning_ms INTEGER;

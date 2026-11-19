-- PSL-41: an open Hub chat hears new messages for its conversation.
-- Realtime still obeys "Teachers can manage messages for their conversations",
-- so a teacher only receives rows for conversations in their own classes.
-- Apply this on production before the live chat can update without a reload.
-- Do not apply it from the app deploy; it is a database publication change.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversation_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
  END IF;
END $$;

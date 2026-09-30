-- PSL-121: durable Hub eval sessions belong to a conversation.
ALTER TABLE public.evaluation_batches
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_evaluation_batches_conversation_id
  ON public.evaluation_batches(conversation_id)
  WHERE conversation_id IS NOT NULL;

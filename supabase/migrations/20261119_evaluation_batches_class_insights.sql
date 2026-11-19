-- PSL-41: keep the first class insights result until the marks change.
ALTER TABLE public.evaluation_batches
  ADD COLUMN IF NOT EXISTS class_insights jsonb;

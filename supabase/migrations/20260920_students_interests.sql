-- PSL-117: typed interests/passions for evening-agent personalization.
-- Nullable free-text (comma tags or a short sentence). Not a taxonomy.
-- Do not store this in metadata JSON. RLS unchanged.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS interests TEXT;

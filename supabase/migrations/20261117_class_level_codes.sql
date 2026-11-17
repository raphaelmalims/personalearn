-- classes.grade_level stores a level code, not a bare number.
-- Grade 1, Form 1, and PP1 are g1, f1, and pp1.
-- Existing integer grades 1–9 become g1–g9 and still mean Grade 1–9.
-- Display labels live in the app (src/lib/classes/level.ts), not in this column.

ALTER TABLE public.classes
  DROP CONSTRAINT classes_grade_level_check;

ALTER TABLE public.classes
  ALTER COLUMN grade_level TYPE text
  USING (
    CASE grade_level
      WHEN 1 THEN 'g1'
      WHEN 2 THEN 'g2'
      WHEN 3 THEN 'g3'
      WHEN 4 THEN 'g4'
      WHEN 5 THEN 'g5'
      WHEN 6 THEN 'g6'
      WHEN 7 THEN 'g7'
      WHEN 8 THEN 'g8'
      WHEN 9 THEN 'g9'
    END
  );

ALTER TABLE public.classes
  ALTER COLUMN grade_level SET NOT NULL;

ALTER TABLE public.classes
  ADD CONSTRAINT classes_grade_level_check
  CHECK (
    grade_level IN (
      'pp1', 'pp2',
      'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10', 'g11', 'g12',
      'f1', 'f2', 'f3', 'f4'
    )
  );

COMMENT ON COLUMN public.classes.grade_level IS
  'Level code: pp1, pp2, g1–g12, f1–f4. Not a bare grade number.';

/**
 * Stored class level. The `classes.grade_level` column holds one of these
 * codes. A bare number is never stored: Grade 1, Form 1, and PP1 are g1, f1,
 * and pp1. Display labels are separate from the stored value.
 *
 * Existing integer grades 1–9 migrate to g1–g9. See
 * supabase/migrations/20261117_class_level_codes.sql.
 */

export const CLASS_LEVELS = [
  { code: "pp1", label: "PP1" },
  { code: "pp2", label: "PP2" },
  { code: "g1", label: "Grade 1" },
  { code: "g2", label: "Grade 2" },
  { code: "g3", label: "Grade 3" },
  { code: "g4", label: "Grade 4" },
  { code: "g5", label: "Grade 5" },
  { code: "g6", label: "Grade 6" },
  { code: "g7", label: "Grade 7" },
  { code: "g8", label: "Grade 8" },
  { code: "g9", label: "Grade 9" },
  { code: "g10", label: "Grade 10" },
  { code: "g11", label: "Grade 11" },
  { code: "g12", label: "Grade 12" },
  { code: "f1", label: "Form 1" },
  { code: "f2", label: "Form 2" },
  { code: "f3", label: "Form 3" },
  { code: "f4", label: "Form 4" },
] as const;

export type ClassLevelCode = (typeof CLASS_LEVELS)[number]["code"];

export const CLASS_LEVEL_CODES = CLASS_LEVELS.map((level) => level.code) as [
  ClassLevelCode,
  ...ClassLevelCode[],
];

const LABELS: Record<ClassLevelCode, string> = Object.fromEntries(
  CLASS_LEVELS.map((level) => [level.code, level.label])
) as Record<ClassLevelCode, string>;

const CODE_SET = new Set<string>(CLASS_LEVEL_CODES);

export function isClassLevelCode(value: unknown): value is ClassLevelCode {
  return typeof value === "string" && CODE_SET.has(value);
}

/** Integer grades 1–9 from the old column become g1–g9. */
export function legacyIntegerGradeToCode(grade: number): ClassLevelCode | null {
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) return null;
  const code = `g${grade}`;
  return isClassLevelCode(code) ? code : null;
}

/**
 * Accept a stored code, or a leftover integer / digit string from local
 * state written before the migration. Writes still go through the enum.
 */
export function coerceClassLevel(value: unknown): ClassLevelCode | null {
  if (isClassLevelCode(value)) return value;
  if (typeof value === "number") return legacyIntegerGradeToCode(value);
  if (typeof value === "string" && /^[1-9]$/.test(value)) {
    return legacyIntegerGradeToCode(Number(value));
  }
  return null;
}

export function classLevelLabel(value: unknown): string {
  const code = coerceClassLevel(value);
  return code ? LABELS[code] : "";
}

export type ClassCurriculum = "CBC" | "8-4-4 (KCSE)";

/** PP and Grade use CBC. Form uses 8-4-4 (KCSE). */
export function curriculumForLevel(value: unknown): ClassCurriculum | null {
  const code = coerceClassLevel(value);
  if (!code) return null;
  return code.startsWith("f") ? "8-4-4 (KCSE)" : "CBC";
}

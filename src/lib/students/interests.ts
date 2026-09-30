/** Max length for teacher-written interests / passions (short text or comma tags). */
export const STUDENT_INTERESTS_MAX_LENGTH = 500;

/** Trim; empty string becomes null so the column stays nullable. */
export function normalizeStudentInterests(
  value: string | null | undefined
): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, STUDENT_INTERESTS_MAX_LENGTH);
}

/** Roster/profile empty state — never surface raw metadata. */
export function studentInterestsDisplay(
  interests: string | null | undefined
): string {
  return interests?.trim() || "No interests yet";
}

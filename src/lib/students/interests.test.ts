import { describe, expect, it } from "vitest";
import {
  STUDENT_INTERESTS_MAX_LENGTH,
  normalizeStudentInterests,
} from "./interests";

describe("normalizeStudentInterests", () => {
  it("returns null for empty or whitespace", () => {
    expect(normalizeStudentInterests(null)).toBeNull();
    expect(normalizeStudentInterests(undefined)).toBeNull();
    expect(normalizeStudentInterests("")).toBeNull();
    expect(normalizeStudentInterests("   ")).toBeNull();
  });

  it("trims teacher-written tags", () => {
    expect(normalizeStudentInterests("  football, choir  ")).toBe(
      "football, choir"
    );
  });

  it("caps at the short-text max", () => {
    const long = "a".repeat(STUDENT_INTERESTS_MAX_LENGTH + 20);
    expect(normalizeStudentInterests(long)?.length).toBe(
      STUDENT_INTERESTS_MAX_LENGTH
    );
  });
});

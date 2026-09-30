import { describe, expect, it } from "vitest";
import {
  STUDENT_INTERESTS_MAX_LENGTH,
  normalizeStudentInterests,
  studentInterestsDisplay,
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

describe("studentInterestsDisplay", () => {
  it("uses an empty state when interests are missing", () => {
    expect(studentInterestsDisplay(null)).toBe("No interests yet");
    expect(studentInterestsDisplay("  ")).toBe("No interests yet");
  });

  it("returns trimmed teacher text", () => {
    expect(studentInterestsDisplay(" football ")).toBe("football");
  });
});

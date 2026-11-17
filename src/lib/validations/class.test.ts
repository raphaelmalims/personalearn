import { describe, expect, it } from "vitest";
import { classSchema, studentSchema } from "./class";

describe("classSchema", () => {
  const validClass = {
    name: "Grade 5 Mathematics",
    grade_level: "g5",
    subject: "Mathematics",
    term: 2,
    academic_year: "2026",
    section: "A",
  };

  it("accepts valid class data", () => {
    expect(classSchema.safeParse(validClass).success).toBe(true);
  });

  it("accepts PP, senior grade, and form codes", () => {
    for (const grade_level of ["pp1", "pp2", "g12", "f1", "f4"]) {
      expect(classSchema.safeParse({ ...validClass, grade_level }).success).toBe(
        true
      );
    }
  });

  it("rejects a bare grade number", () => {
    expect(classSchema.safeParse({ ...validClass, grade_level: 1 }).success).toBe(
      false
    );
    expect(classSchema.safeParse({ ...validClass, grade_level: "1" }).success).toBe(
      false
    );
  });

  it("rejects invalid terms", () => {
    expect(classSchema.safeParse({ ...validClass, term: 4 }).success).toBe(false);
  });
});

describe("studentSchema", () => {
  it("accepts valid student data", () => {
    const result = studentSchema.safeParse({
      full_name: "Jane Doe",
      admission_number: "ADM001",
      gender: "Female",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty student names", () => {
    const result = studentSchema.safeParse({
      full_name: "J",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid gender values", () => {
    const result = studentSchema.safeParse({
      full_name: "Jane Doe",
      gender: "Other",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional interests text", () => {
    const result = studentSchema.safeParse({
      full_name: "Jane Doe",
      interests: "football, choir",
    });
    expect(result.success).toBe(true);
  });

  it("rejects interests longer than 500 characters", () => {
    const result = studentSchema.safeParse({
      full_name: "Jane Doe",
      interests: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

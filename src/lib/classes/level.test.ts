import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLASS_LEVELS,
  classLevelLabel,
  coerceClassLevel,
  curriculumForLevel,
  isClassLevelCode,
  legacyIntegerGradeToCode,
} from "./level";

describe("class levels", () => {
  it("lists PP, then Grade 1–12, then Form 1–4 with unique codes", () => {
    expect(CLASS_LEVELS.map((level) => level.label)).toEqual([
      "PP1",
      "PP2",
      ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
      "Form 1",
      "Form 2",
      "Form 3",
      "Form 4",
    ]);
    const codes = CLASS_LEVELS.map((level) => level.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain("g1");
    expect(codes).toContain("f1");
    expect(codes).toContain("pp1");
    expect(isClassLevelCode("1")).toBe(false);
  });

  it("maps old integer grades 1–9 onto Grade codes and rejects everything else", () => {
    for (let grade = 1; grade <= 9; grade += 1) {
      const code = legacyIntegerGradeToCode(grade);
      expect(code).toBe(`g${grade}`);
      expect(classLevelLabel(code)).toBe(`Grade ${grade}`);
    }
    expect(legacyIntegerGradeToCode(0)).toBeNull();
    expect(legacyIntegerGradeToCode(10)).toBeNull();
    expect(coerceClassLevel(5)).toBe("g5");
    expect(coerceClassLevel("5")).toBe("g5");
    expect(coerceClassLevel("f1")).toBe("f1");
  });

  it("picks CBC for PP and Grade, and 8-4-4 for Form", () => {
    expect(curriculumForLevel("pp2")).toBe("CBC");
    expect(curriculumForLevel("g12")).toBe("CBC");
    expect(curriculumForLevel("f4")).toBe("8-4-4 (KCSE)");
    expect(curriculumForLevel(1)).toBe("CBC");
  });

  it("migration maps each old grade with the same code the app uses", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20261117_class_level_codes.sql"),
      "utf8"
    );
    for (let grade = 1; grade <= 9; grade += 1) {
      expect(sql).toContain(`WHEN ${grade} THEN '${legacyIntegerGradeToCode(grade)}'`);
    }
    expect(sql).toContain("'pp1'");
    expect(sql).toContain("'g12'");
    expect(sql).toContain("'f4'");
    expect(sql).not.toMatch(/BETWEEN 1 AND 9/);
  });
});

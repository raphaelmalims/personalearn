import { describe, expect, it } from "vitest";
import { buildClassAssistantSystemPrompt } from "./class-context";

describe("buildClassAssistantSystemPrompt", () => {
  it("includes class details and tells the model not to ask for them", () => {
    const prompt = buildClassAssistantSystemPrompt({
      id: "class-1",
      name: "7 East",
      subject: "Mathematics",
      grade_level: "g7",
      term: 2,
      section: "East",
      academic_year: "2026",
    });

    expect(prompt).toContain("7 East");
    expect(prompt).toContain("Mathematics");
    expect(prompt).toContain("Level: Grade 7");
    expect(prompt).toContain("Curriculum: CBC");
    expect(prompt).toContain("You are a CBC teaching assistant");
    expect(prompt).toContain("Never ask which class");
    expect(prompt).toContain("search_class_resources");
    expect(prompt).toContain("generate_teaching_image");
    expect(prompt).toContain("list_students");
    expect(prompt).toContain("query_class_performance");
    expect(prompt).toContain("draftId");
    expect(prompt).toContain("save_resource");
    expect(prompt).toContain("start_evaluation_batch");
    expect(prompt).toContain("saved assignment");
    expect(prompt).toContain("never ask them to pick");
    expect(prompt).toContain("revise further");
    expect(prompt).toContain("explicitly confirms");
    expect(prompt).toContain("$...$");
    expect(prompt).toContain("$$...$$");
    expect(prompt).toContain("Never show database ids");
    expect(prompt).toContain("interests/passions");
    expect(prompt).toContain("never show UUIDs");
    expect(prompt).not.toContain("8-4-4");
  });

  it("uses CBC for pre-primary and 8-4-4 for form", () => {
    const base = {
      id: "class-1",
      name: "7 East",
      subject: "Mathematics",
      term: 2,
      section: null,
      academic_year: "2026",
    };

    const pp = buildClassAssistantSystemPrompt({
      ...base,
      grade_level: "pp1",
    });
    expect(pp).toContain("You are a CBC teaching assistant");
    expect(pp).toContain("Level: PP1");
    expect(pp).toContain("Curriculum: CBC");

    const form = buildClassAssistantSystemPrompt({
      ...base,
      name: "Form 1",
      grade_level: "f1",
    });
    expect(form).toContain("You are an 8-4-4 (KCSE) teaching assistant");
    expect(form).toContain("Level: Form 1");
    expect(form).toContain("Curriculum: 8-4-4 (KCSE)");
    expect(form).not.toContain("CBC");
  });
});

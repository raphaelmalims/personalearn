import { describe, expect, it } from "vitest";
import { resolveNamedTarget } from "./resolve-eval-target";

const items = [
  { id: "a", title: "CAT 2 Algebra" },
  { id: "b", title: "End of Term exam" },
];

describe("resolveNamedTarget", () => {
  it("uses the only item when the class has one assignment", () => {
    const result = resolveNamedTarget(
      [{ id: "a", title: "CAT 2 Algebra" }],
      "please grade these"
    );
    expect(result).toEqual({
      ok: true,
      item: { id: "a", title: "CAT 2 Algebra" },
    });
  });

  it("matches a unique title fragment", () => {
    const result = resolveNamedTarget(items, "grade CAT 2");
    expect(result).toEqual({ ok: true, item: items[0] });
  });

  it("asks for clarification when several assignments match", () => {
    const result = resolveNamedTarget(items, "evaluate these scripts");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("ambiguous");
      expect(result.reason === "ambiguous" && result.candidates).toHaveLength(2);
    }
  });

  it("returns none when the library is empty", () => {
    expect(resolveNamedTarget([], "CAT 2")).toEqual({
      ok: false,
      reason: "none",
    });
  });
});

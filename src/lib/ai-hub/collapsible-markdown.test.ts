import { describe, expect, it } from "vitest";
import { splitCollapsibleMarkdown } from "@/lib/ai-hub/collapsible-markdown";

describe("splitCollapsibleMarkdown", () => {
  it("keeps the brief open and the question list collapsed", () => {
    const blocks = splitCollapsibleMarkdown(
      [
        "Class insights",
        "",
        "**Class average: 22 of 30.**",
        "",
        ":::collapse Per-question breakdown",
        "### A.1",
        "Correct answer: **56**.",
        ":::",
      ].join("\n")
    );

    expect(blocks.map((block) => block.kind)).toEqual(["markdown", "collapse"]);
    expect(blocks[1]).toMatchObject({
      title: "Per-question breakdown",
      body: "### A.1\nCorrect answer: **56**.",
    });
  });
});

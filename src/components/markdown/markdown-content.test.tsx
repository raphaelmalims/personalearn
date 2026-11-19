import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarkdownContent } from "@/components/markdown/markdown-content";

afterEach(() => {
  cleanup();
});

describe("MarkdownContent collapsible sections", () => {
  it("renders a disclosure the teacher can open", () => {
    render(
      <MarkdownContent
        content={[
          "Class insights",
          "",
          ":::collapse Per-question breakdown",
          "### A.1",
          "Correct answer: **56**.",
          ":::",
        ].join("\n")}
      />
    );

    const details = screen.getByText("Per-question breakdown").closest("details");
    expect(details).toBeTruthy();
    expect(details?.querySelector("summary")).toBeTruthy();
    expect(screen.getByText("A.1")).toBeTruthy();
  });
});

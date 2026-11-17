import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { VisualStage } from "@/components/explainers/visual-stage";
import type { VisualArtifact } from "@/lib/explainers/blocks";

const artifact: VisualArtifact = {
  fit: true,
  block: "number-line",
  topic: "introduction to integers",
  grade: 7,
  language: "en",
  cache: "hit",
  metrics: {
    modelId: "deepseek-flash",
    promptTokens: 0,
    completionTokens: 0,
    cachedPromptTokens: 0,
    costUsd: 0,
    wallTimeMs: 1,
  },
  spec: {
    block: "number-line",
    title: "Introduction to Integers",
    min: -3,
    max: 2,
    points: [
      { value: -3, label: "-3", caption: "Negative three is left of zero." },
      { value: 0, label: "0", caption: "Zero sits in the middle." },
      { value: 2, label: "2", caption: "Two is greater than zero." },
    ],
    quiz: { prompt: "Which point is less than zero?", answer: "-3" },
  },
};

describe("visual stage", () => {
  it("puts the numbers on the line and clears quiz feedback on the next prompt", async () => {
    const user = userEvent.setup();
    render(<VisualStage artifact={artifact} playKey="test" />);
    const line = screen.getByRole("img", { name: "Introduction to Integers" });
    const negative = screen.getByRole("button", { name: "-3" });
    expect(line.parentElement).toContainElement(negative);
    expect(screen.queryByRole("button", { name: "Show answer" })).not.toBeInTheDocument();

    await user.click(negative);
    expect(screen.getByText("Which point is less than zero?")).toBeInTheDocument();
    expect(screen.getByText(/Right\. Negative three is left of zero/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(screen.queryByText(/Right\./)).not.toBeInTheDocument();
    expect(screen.queryByText("Which point is less than zero?")).not.toBeInTheDocument();
    expect(screen.getByText("Two is greater than zero.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volume" })).toBeInTheDocument();
  });
});

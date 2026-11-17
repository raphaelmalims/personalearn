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

  it("draws a labelled scene and clears feedback on the next tap", async () => {
    const user = userEvent.setup();
    const volcano: VisualArtifact = {
      ...artifact,
      block: "scene",
      topic: "volcano",
      spec: {
        block: "scene",
        title: "A volcano",
        parts: [
          { id: "vent", label: "Vent", explanation: "Magma leaves through the vent.", prompt: "Tap the opening.", x: 50, y: 28 },
          { id: "magma", label: "Magma chamber", explanation: "Hot rock collects here.", prompt: "Tap the chamber.", x: 50, y: 72 },
          { id: "ash", label: "Ash cloud", explanation: "Ash rises above the cone.", prompt: "Tap the cloud.", x: 78, y: 22 },
        ],
        arrows: [
          { from: "magma", to: "vent" },
          { from: "vent", to: "ash" },
        ],
        imagePath: "scenes/6/en/volcano.png",
        quiz: { prompt: "Where does magma leave the cone?", answer: "Vent" },
      },
    };
    render(<VisualStage artifact={volcano} playKey="volcano" />);
    const vent = screen.getByRole("button", { name: "Vent" });
    expect(vent).toHaveStyle({ left: "50%", top: "28%" });
    expect(screen.getByRole("img", { name: "A volcano" })).toHaveAttribute("src", "/api/explainers/scenes?path=scenes%2F6%2Fen%2Fvolcano.png");
    expect(screen.queryByRole("button", { name: "Find it" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vent" }));
    expect(screen.getByText("Where does magma leave the cone?")).toBeInTheDocument();
    expect(screen.getByText(/Right\. Vent\./)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ash cloud" }));
    expect(screen.queryByText(/Right\./)).not.toBeInTheDocument();
    expect(screen.getByText(/Ash rises above the cone/)).toBeInTheDocument();
  });
});

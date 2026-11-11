import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

const waterDiagram: VisualArtifact = {
  ...artifact,
  block: "labelled-diagram",
  topic: "water cycle",
  grade: 4,
  spec: {
    block: "labelled-diagram",
    title: "The water cycle",
    parts: [
      { id: "evaporation", label: "Evaporation", explanation: "Water rises.", prompt: "Tap the rising vapour." },
      { id: "condensation", label: "Condensation", explanation: "Clouds form.", prompt: "Tap the cloud." },
      { id: "precipitation", label: "Precipitation", explanation: "Rain falls.", prompt: "Tap the rain." },
      { id: "collection", label: "Collection", explanation: "Water gathers.", prompt: "Tap the lake." },
    ],
    quiz: { prompt: "Where does rain go?", answer: "Collection" },
  },
};

describe("visual stage", () => {
  it("shows a number-line point and the quiz answer", async () => {
    const user = userEvent.setup();
    render(<VisualStage artifact={artifact} playKey="test" />);
    await user.click(screen.getByRole("button", { name: "-3" }));
    expect(screen.getByText(/left of zero/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show answer" }));
    expect(screen.getAllByRole("button", { name: "-3" })).toHaveLength(2);
    expect(screen.getByText("Which point is less than zero?")).toBeInTheDocument();
  });

  it("maps whatever the model wrote onto the water-cycle studio and shows the tally", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        tally: [
          { partId: "evaporation", correct: 1, incorrect: 2 },
          { partId: "condensation", correct: 0, incorrect: 0 },
          { partId: "precipitation", correct: 0, incorrect: 0 },
          { partId: "collection", correct: 0, incorrect: 0 },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const oddIds: VisualArtifact = {
      ...waterDiagram,
      spec: {
        ...waterDiagram.spec,
        block: "labelled-diagram",
        parts: [
          { id: "sun-heat", label: "Sun", explanation: "Water turns into vapour.", prompt: "Tap the heat." },
          { id: "clouds", label: "Clouds", explanation: "Droplets gather.", prompt: "Tap the cloud." },
          { id: "raindrops", label: "Rain", explanation: "Water falls.", prompt: "Tap the rain." },
          { id: "lake", label: "Lake", explanation: "Water gathers.", prompt: "Tap the lake." },
        ],
      },
    };
    render(<VisualStage artifact={oddIds} playKey="water" />);
    expect(screen.getByRole("button", { name: "Find it" })).toBeInTheDocument();
    expect(await screen.findByText(/evaporation: 2 wrong, 1 right/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

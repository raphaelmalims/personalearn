import { describe, expect, it } from "vitest";
import { toWaterCycleDiagram } from "@/lib/diagrams/water-cycle-parts";
import type { VisualSpec } from "@/lib/explainers/blocks";

const spec: VisualSpec = {
  block: "labelled-diagram",
  title: "The water cycle",
  parts: [
    { id: "sun-heat", label: "Sun", explanation: "Water turns into vapour.", prompt: "Tap the heat." },
    { id: "clouds", label: "Clouds", explanation: "Droplets gather.", prompt: "Tap the cloud." },
    { id: "raindrops", label: "Rain", explanation: "Water falls.", prompt: "Tap the rain." },
    { id: "lake", label: "Lake", explanation: "Water gathers.", prompt: "Tap the lake." },
  ],
  quiz: { prompt: "Where does rain go?", answer: "The lake" },
};

describe("water cycle part ids", () => {
  it("maps a labelled water-cycle diagram onto the studio ids", () => {
    const content = toWaterCycleDiagram("The water cycle", spec);
    expect(content?.parts.map((part) => part.id)).toEqual([
      "evaporation",
      "condensation",
      "precipitation",
      "collection",
    ]);
    expect(content?.parts[0]?.label).toBe("Sun");
    expect(content?.parts[3]?.label).toBe("Lake");
  });

  it("leaves a different topic on its own ids", () => {
    expect(toWaterCycleDiagram("flower", spec)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { acceptPartLocations, illustrationPrompt, isSceneObjectPath, sceneObjectPath } from "@/lib/explainers/scene-image";
import type { VisualSpec } from "@/lib/explainers/blocks";

const spec: Extract<VisualSpec, { block: "scene" }> = {
  block: "scene",
  title: "A volcano",
  parts: [
    { id: "vent", label: "Vent", explanation: "Magma leaves here.", prompt: "Tap the vent.", x: 10, y: 10 },
    { id: "magma", label: "Magma", explanation: "Hot rock collects here.", prompt: "Tap the magma.", x: 20, y: 20 },
  ],
  arrows: [],
  quiz: { prompt: "Where does magma leave?", answer: "Vent" },
};

describe("scene pictures", () => {
  it("accepts separated points and rejects a pile", () => {
    expect(acceptPartLocations(["vent", "magma"], [
      { id: "vent", x: 40, y: 20 },
      { id: "magma", x: 40, y: 70 },
    ])?.map((point) => point.id)).toEqual(["vent", "magma"]);
    expect(acceptPartLocations(["vent", "magma"], [
      { id: "vent", x: 40, y: 40 },
      { id: "magma", x: 42, y: 41 },
    ])).toBeNull();
  });

  it("names one stored object per topic, grade, and language", () => {
    expect(sceneObjectPath({ topic: "A Volcano", grade: 6, language: "en" })).toBe("scenes/6/en/a-volcano.png");
    expect(isSceneObjectPath("scenes/6/en/volcano.png")).toBe(true);
    expect(isSceneObjectPath("scenes/../secret.png")).toBe(false);
  });

  it("asks for labels and arrows that a phone can read", () => {
    expect(illustrationPrompt(spec, 6)).toMatch(/readable on a phone/);
    expect(illustrationPrompt(spec, 6)).toMatch(/Vent/);
  });
});

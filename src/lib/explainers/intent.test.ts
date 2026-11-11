import { describe, expect, it } from "vitest";
import { isExplainerRequest, languageFromRequest } from "@/lib/explainers/intent";
import { buildEmphasis } from "@/lib/explainers/personalise";
import { pickNarrationVoice } from "@/lib/explainers/narration";

describe("explainer chat intent", () => {
  it("matches an explain or show-me request for the water cycle", () => {
    expect(isExplainerRequest("Show me the water cycle")).toBe(true);
    expect(isExplainerRequest("Can you explain the water cycle?")).toBe(true);
    expect(isExplainerRequest("Explain photosynthesis")).toBe(false);
    expect(isExplainerRequest("Show me the quiz")).toBe(false);
  });

  it("uses Kiswahili only when the teacher asks for it", () => {
    expect(languageFromRequest("Explain the water cycle in Kiswahili")).toBe("sw");
    expect(languageFromRequest("Show me the water cycle")).toBe("en");
  });

  it("builds emphasis from weak topics and a local note", () => {
    expect(
      buildEmphasis({
        weakTopics: ["Collection", "Collection", "Precipitation"],
        message: "Show me the water cycle using a jerrycan at home",
      })
    ).toBe("Emphasise Collection, Precipitation. Use this local example: using a jerrycan at home.");
    expect(
      buildEmphasis({ weakTopics: [], message: "Explain the water cycle" })
    ).toBe("");
  });

  it("falls back to captions when the language has no voice", () => {
    const voices = [
      { lang: "en-US", name: "Samantha" },
      { lang: "en-GB", name: "Daniel" },
    ];
    expect(pickNarrationVoice(voices, "en")?.lang).toBe("en-US");
    expect(pickNarrationVoice(voices, "sw")).toBeNull();
  });
});

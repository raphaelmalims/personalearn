import { beforeEach, describe, expect, it, vi } from "vitest";
import { replyWithExplainer } from "@/lib/explainers/chat-reply";

const mockRequestExplainer = vi.fn();
const mockAppend = vi.fn();
const mockWeakTopics = vi.fn();

vi.mock("@/lib/explainers/request", () => ({
  requestExplainer: (...args: unknown[]) => mockRequestExplainer(...args),
}));

vi.mock("@/lib/explainers/weak-topics", () => ({
  loadWeakTopics: (...args: unknown[]) => mockWeakTopics(...args),
}));

vi.mock("@/lib/ai-hub/conversations", () => ({
  appendConversationMessages: (...args: unknown[]) => mockAppend(...args),
}));

vi.mock("@/lib/explainers/cache", () => ({
  supabaseExplainerCache: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
}));

const script = {
  title: "The water cycle",
  steps: [
    { label: "Evaporation", caption: "The sun turns water into vapour." },
    { label: "Condensation", caption: "Vapour cools and forms clouds." },
    { label: "Precipitation", caption: "Heavy drops fall as rain." },
    { label: "Collection", caption: "Water collects, then rises again." },
  ],
};

describe("replyWithExplainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAppend.mockResolvedValue([]);
    mockWeakTopics.mockResolvedValue(["Collection"]);
    mockRequestExplainer.mockResolvedValue({
      cache: "personalised",
      base: "hit",
      personal: "miss",
      topic: "water cycle",
      grade: 4,
      language: "en",
      script,
      metrics: {
        modelId: "deepseek-flash",
        promptTokens: 90,
        completionTokens: 30,
        cachedPromptTokens: 40,
        costUsd: 0.00003,
        wallTimeMs: 400,
      },
    });
  });

  it("persists the player payload and streams it to the Hub", async () => {
    const response = await replyWithExplainer({
      supabase: {} as never,
      classId: "class-1",
      conversationId: "conv-1",
      message: "Show me the water cycle using a jerrycan",
      grade: 4,
    });
    const body = await response.text();

    expect(response.headers.get("X-Conversation-Id")).toBe("conv-1");
    expect(body).toContain("Here is The water cycle for grade 4 in English.");
    expect(body).toContain("data-explainer");
    expect(mockRequestExplainer).toHaveBeenCalledWith(
      expect.objectContaining({
        grade: 4,
        language: "en",
        emphasis: expect.stringContaining("Collection"),
      }),
      expect.any(Object)
    );
    expect(mockAppend).toHaveBeenCalledWith(
      expect.anything(),
      "conv-1",
      [
        expect.objectContaining({
          role: "assistant",
          tool_calls: expect.objectContaining({
            explainer: expect.objectContaining({ title: "The water cycle" }),
          }),
        }),
      ]
    );
  });
});

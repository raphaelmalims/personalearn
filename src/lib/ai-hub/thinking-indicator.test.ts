import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { shouldShowThinkingBubble } from "./thinking-indicator";

function assistant(parts: UIMessage["parts"]): UIMessage {
  return { id: "a", role: "assistant", parts };
}

describe("shouldShowThinkingBubble", () => {
  it("shows the pill while generating before any token", () => {
    expect(shouldShowThinkingBubble(true, undefined)).toBe(true);
    expect(
      shouldShowThinkingBubble(true, assistant([{ type: "text", text: "" }]))
    ).toBe(true);
  });

  it("hides the pill once reasoning or an answer token is visible", () => {
    expect(
      shouldShowThinkingBubble(
        true,
        assistant([{ type: "reasoning", text: "Checking the scheme." }])
      )
    ).toBe(false);
    expect(
      shouldShowThinkingBubble(true, assistant([{ type: "text", text: "Here" }]))
    ).toBe(false);
  });

  it("hides the pill when generation has finished", () => {
    expect(
      shouldShowThinkingBubble(
        false,
        assistant([{ type: "reasoning", text: "Done thinking." }])
      )
    ).toBe(false);
  });
});

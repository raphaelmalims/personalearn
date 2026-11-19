import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { toUIMessageFromRow } from "@/lib/ai-hub/message-content";
import { mergeIncomingConversationMessage } from "@/lib/ai-hub/merge-conversation-messages";

function textMessage(id: string, role: "user" | "assistant", text: string): UIMessage {
  return { id, role, parts: [{ type: "text", text }] };
}

const insights = toUIMessageFromRow({
  id: "insights-1",
  role: "assistant",
  content: "Class insights\n\nBased on 4 scripts.",
  tool_calls: {
    classInsightsBatchId: "batch-1",
    classInsights: {
      scriptCount: 4,
      reviewPath: "/classes/class-1/evaluations/batch-1",
      note: null,
      cards: [
        {
          title: "Fractions",
          struggled: 3,
          scored: 4,
          questionNumbers: "1",
          reteachStep: "Shade one shared diagram.",
        },
      ],
    },
  },
});

describe("mergeIncomingConversationMessage", () => {
  it("appends a new message and ignores an id already on screen", () => {
    const current = [textMessage("user-1", "user", "Mark these scripts")];
    const added = mergeIncomingConversationMessage(current, insights);
    expect(added.map((message) => message.id)).toEqual(["user-1", "insights-1"]);

    const again = mergeIncomingConversationMessage(added, insights);
    expect(again).toBe(added);
  });

  it("replaces the same class insights card when the stored counts arrive", () => {
    const legacy = toUIMessageFromRow({
      id: "insights-1",
      role: "assistant",
      content: "Class insights\n\nBased on 4 scripts.\n\n50% under half",
      tool_calls: {
        classInsightsBatchId: "batch-1",
        classInsights: {
          scriptCount: 4,
          reviewPath: "/classes/class-1/evaluations/batch-1",
          note: "From this set. Not a strand label.",
          cards: [
            {
              title: "Fractions",
              percentUnderHalf: 50,
              questionNumbers: "1",
              reteachStep: "Shade one shared diagram.",
            },
          ],
        },
      },
    });
    const replaced = mergeIncomingConversationMessage([legacy], insights);
    expect(replaced).toHaveLength(1);
    expect(replaced[0]).toBe(insights);
  });

  it("does not add a second class insights card for the same review", () => {
    const duplicate = toUIMessageFromRow({
      id: "insights-2",
      role: "assistant",
      content: "Class insights\n\nBased on 4 scripts.",
      tool_calls: {
        classInsights: {
          scriptCount: 4,
          reviewPath: "/classes/class-1/evaluations/batch-1",
          note: null,
          cards: [],
        },
      },
    });
    const current = mergeIncomingConversationMessage([], insights);
    expect(mergeIncomingConversationMessage(current, duplicate)).toBe(current);
  });

  it("does not repeat a message the teacher already sees", () => {
    const current = [textMessage("local-user", "user", "Hello class")];
    const echo = textMessage("db-user", "user", "Hello class");
    expect(mergeIncomingConversationMessage(current, echo)).toBe(current);
  });

  it("keeps a class insights card that arrives during a stream", () => {
    const current = [textMessage("assistant-local", "assistant", "I started marking.")];
    const merged = mergeIncomingConversationMessage(current, insights, {
      streaming: true,
    });
    expect(merged.map((message) => message.id)).toEqual([
      "assistant-local",
      "insights-1",
    ]);

    const echo = textMessage("db-assistant", "assistant", "I started marking.");
    expect(
      mergeIncomingConversationMessage(current, echo, { streaming: true })
    ).toBe(current);
  });
});

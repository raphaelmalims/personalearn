import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockRequireTeacherClass = vi.fn();
const mockRequireConversationAccess = vi.fn();
const mockGetConversationWithMessages = vi.fn();
const mockCreateConversation = vi.fn();
const mockAppendConversationMessages = vi.fn();
const mockTruncateConversationFromIndex = vi.fn();
const mockUpdateConversationChatSettings = vi.fn();
const mockStreamText = vi.fn();
const mockToUIMessageStreamResponse = vi.fn();
const mockGetChatModelForSettings = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({})),
}));

vi.mock("@/lib/auth/require-teacher-class", () => ({
  requireTeacherClass: (...args: unknown[]) => mockRequireTeacherClass(...args),
}));

vi.mock("@/lib/ai-hub/conversations", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai-hub/conversations")>(
    "@/lib/ai-hub/conversations"
  );
  return {
    ...actual,
    appendConversationMessages: (...args: unknown[]) =>
      mockAppendConversationMessages(...args),
    createConversation: (...args: unknown[]) => mockCreateConversation(...args),
    getConversationWithMessages: (...args: unknown[]) =>
      mockGetConversationWithMessages(...args),
    requireConversationAccess: (...args: unknown[]) =>
      mockRequireConversationAccess(...args),
    truncateConversationFromIndex: (...args: unknown[]) =>
      mockTruncateConversationFromIndex(...args),
    updateConversationChatSettings: (...args: unknown[]) =>
      mockUpdateConversationChatSettings(...args),
  };
});

vi.mock("@/lib/ai-hub/class-context", () => ({
  getClassContext: vi.fn(async () => ({
    id: "11111111-1111-4111-8111-111111111111",
    name: "Grade 7 Maths",
    subject: "Mathematics",
    grade_level: 7,
    term: 1,
    section: null,
    academic_year: "2026",
  })),
  buildClassAssistantSystemPrompt: vi.fn(() => "mock system prompt"),
}));

vi.mock("@/lib/ai-hub/generate-conversation-title", () => ({
  generateAiConversationTitle: vi.fn(async () => "Fractions quiz"),
}));

vi.mock("@/lib/ai/llm", () => ({
  getChatModel: vi.fn(() => ({ modelId: "mock" })),
  getActiveChatModelId: vi.fn(() => "deepseek-flash"),
  getChatModelForSettings: (settings: unknown) =>
    mockGetChatModelForSettings(settings),
}));

vi.mock("@/lib/ai/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/env")>(
    "@/lib/ai/env"
  );
  return {
    ...actual,
    assertChatConfigured: vi.fn(),
  };
});

const mockCreateAgentTools = vi.fn(() => ({
  search_class_resources: { description: "search" },
  generate_learning_resource: { description: "generate" },
  list_students: { description: "list" },
  save_resource: { description: "save" },
}));

vi.mock("@/lib/ai-hub/agent-tools", () => ({
  createAgentTools: (...args: unknown[]) =>
    (mockCreateAgentTools as (...inner: unknown[]) => unknown)(...args),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return {
    ...actual,
    streamText: (...args: unknown[]) => mockStreamText(...args),
  };
});

describe("POST /api/ai-hub/chat", () => {
  const classId = "11111111-1111-4111-8111-111111111111";
  const conversationId = "22222222-2222-4222-8222-222222222222";

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireTeacherClass.mockResolvedValue({ id: "teacher-1" });
    mockGetConversationWithMessages.mockResolvedValue({ messages: [] });
    mockAppendConversationMessages.mockResolvedValue([]);
    mockTruncateConversationFromIndex.mockResolvedValue(undefined);
    mockUpdateConversationChatSettings.mockResolvedValue(undefined);
    mockGetChatModelForSettings.mockReturnValue({ modelId: "mock" });
    mockToUIMessageStreamResponse.mockReturnValue(
      new Response("stream", {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      })
    );
    mockStreamText.mockReturnValue({
      toUIMessageStreamResponse: mockToUIMessageStreamResponse,
    });
  });

  it("streams a response for an owned class conversation", async () => {
    mockRequireConversationAccess.mockResolvedValue({
      id: conversationId,
      class_id: classId,
    });

    const response = await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          conversationId,
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: expect.objectContaining({
          search_class_resources: expect.any(Object),
          generate_learning_resource: expect.any(Object),
          list_students: expect.any(Object),
          save_resource: expect.any(Object),
        }),
        stopWhen: expect.any(Function),
      })
    );
    expect(mockCreateAgentTools).toHaveBeenCalledWith(
      expect.objectContaining({
        classId,
        conversationId,
      })
    );
    expect(mockAppendConversationMessages).toHaveBeenCalledWith(
      {},
      conversationId,
      expect.arrayContaining([
        expect.objectContaining({ role: "user", content: "Hello" }),
      ])
    );
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          deepseek: {
            thinking: { type: "enabled" },
            reasoningEffort: "low",
          },
        },
      })
    );
  });

  it("logs provider stream errors and still returns the generic message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockRequireConversationAccess.mockResolvedValue({
      id: conversationId,
      class_id: classId,
    });

    await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          conversationId,
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        }),
      })
    );

    const streamOptions = mockToUIMessageStreamResponse.mock.calls[0]?.[0] as {
      onError: (error: unknown) => string;
    };
    const teacherMessage = streamOptions.onError(
      Object.assign(new Error("model not found"), {
        statusCode: 400,
        data: { error: { code: "model_not_found" } },
      })
    );

    expect(teacherMessage).toBe(
      "The assistant could not respond. Please try again."
    );
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain("deepseek-flash");
    expect(String(errorSpy.mock.calls[0]?.[0])).not.toContain("Hello");
    errorSpy.mockRestore();
  });

  it("truncates the conversation when editing a prior message", async () => {
    mockRequireConversationAccess.mockResolvedValue({
      id: conversationId,
      class_id: classId,
    });

    await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          conversationId,
          truncateFromMessageIndex: 1,
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [{ type: "text", text: "First" }],
            },
            {
              id: "user-2",
              role: "user",
              parts: [{ type: "text", text: "Edited second" }],
            },
          ],
        }),
      })
    );

    expect(mockTruncateConversationFromIndex).toHaveBeenCalledWith(
      {},
      conversationId,
      "teacher-1",
      1
    );
  });

  it("returns 403 when the teacher does not own the class", async () => {
    mockRequireTeacherClass.mockRejectedValue(new Error("Class not found"));

    const response = await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          messages: [],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Class not found");
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it("materializes attached file text before streaming", async () => {
    mockRequireConversationAccess.mockResolvedValue({
      id: conversationId,
      class_id: classId,
    });

    const attached = "Week 3 fractions";
    const url = `data:text/plain;base64,${btoa(attached)}`;

    const response = await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          conversationId,
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [
                { type: "text", text: "Summarize this" },
                {
                  type: "file",
                  mediaType: "text/plain",
                  filename: "notes.txt",
                  url,
                },
              ],
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    const streamArgs = mockStreamText.mock.calls[0]?.[0] as {
      messages: unknown;
    };
    const serialized = JSON.stringify(streamArgs.messages);
    expect(serialized).toContain("Week 3 fractions");
    expect(serialized).not.toContain('"type":"file"');
    expect(mockAppendConversationMessages).toHaveBeenCalledWith(
      {},
      conversationId,
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: expect.stringContaining("Week 3 fractions"),
        }),
      ])
    );
  });

  it("returns 500 when chat API key is missing", async () => {
    const { assertChatConfigured } = await import("@/lib/ai/env");
    vi.mocked(assertChatConfigured).mockImplementationOnce(() => {
      throw new Error("Missing DEEPSEEK_API_KEY for AI Hub chat.");
    });

    const response = await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toMatch(/DEEPSEEK_API_KEY/);
    expect(mockStreamText).not.toHaveBeenCalled();
  });

  it("falls back to env defaults when the picker payload is invalid", async () => {
    mockRequireConversationAccess.mockResolvedValue({
      id: conversationId,
      class_id: classId,
    });

    const response = await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          conversationId,
          chatModel: "gpt-4",
          chatThinking: "sometimes",
          chatReasoningEffort: "ultra",
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        onEnd: expect.any(Function),
        providerOptions: {
          deepseek: {
            thinking: { type: "enabled" },
            reasoningEffort: "low",
          },
        },
      })
    );
    const streamArgs = mockStreamText.mock.calls.at(-1)?.[0] as {
      onFinish?: unknown;
    };
    expect(streamArgs.onFinish).toBeUndefined();
    expect(mockUpdateConversationChatSettings).toHaveBeenCalledWith(
      {},
      conversationId,
      {
        chat_model: "deepseek-flash",
        chat_thinking: "enabled",
        chat_reasoning_effort: "low",
      }
    );
  });

  it("stores medium effort and sends DeepSeek high", async () => {
    mockRequireConversationAccess.mockResolvedValue({
      id: conversationId,
      class_id: classId,
    });

    await POST(
      new Request("http://localhost/api/ai-hub/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          conversationId,
          chatModel: "deepseek-flash",
          chatThinking: "enabled",
          chatReasoningEffort: "medium",
          messages: [
            {
              id: "user-1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        }),
      })
    );

    expect(mockGetChatModelForSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "deepseek",
        modelId: "deepseek-flash",
        thinking: "enabled",
        reasoningEffort: "high",
      })
    );
    expect(mockUpdateConversationChatSettings).toHaveBeenCalledWith(
      {},
      conversationId,
      expect.objectContaining({
        chat_reasoning_effort: "medium",
      })
    );
  });
});

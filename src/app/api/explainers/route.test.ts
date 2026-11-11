import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockGetUser = vi.fn();
const mockRequestExplainer = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: () => mockGetUser() },
  })),
}));

vi.mock("@/lib/explainers/cache", () => ({
  supabaseExplainerCache: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/lib/explainers/request", () => ({
  requestExplainer: (...args: unknown[]) => mockRequestExplainer(...args),
}));

describe("POST /api/explainers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out caller before any model call", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(
      new Request("http://localhost/api/explainers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grade: 4, language: "en" }),
      })
    );
    expect(response.status).toBe(401);
    expect(mockRequestExplainer).not.toHaveBeenCalled();
  });

  it("fills an explainer for a signed-in teacher", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "teacher-1" } } });
    mockRequestExplainer.mockResolvedValue({
      cache: "miss",
      topic: "water cycle",
      grade: 4,
      language: "en",
      script: { title: "The water cycle", steps: [] },
      metrics: {
        modelId: "deepseek-flash",
        promptTokens: 10,
        completionTokens: 4,
        cachedPromptTokens: 0,
        costUsd: 0.000001,
        wallTimeMs: 12,
      },
    });
    const response = await POST(
      new Request("http://localhost/api/explainers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grade: 4, language: "en" }),
      })
    );
    expect(response.status).toBe(200);
    expect(mockRequestExplainer).toHaveBeenCalledWith(
      expect.objectContaining({ topic: "water cycle", grade: 4, language: "en" }),
      expect.any(Object)
    );
  });
});

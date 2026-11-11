import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockGetUser = vi.fn();
const mockRequestDiagram = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: () => mockGetUser() },
  })),
}));

vi.mock("@/lib/diagrams/cache", () => ({
  supabaseDiagramCache: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/lib/diagrams/request", () => ({
  requestDiagram: (...args: unknown[]) => mockRequestDiagram(...args),
}));

describe("POST /api/diagrams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a signed-out caller before any model call", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(
      new Request("http://localhost/api/diagrams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grade: 4, language: "en" }),
      })
    );
    expect(response.status).toBe(401);
    expect(mockRequestDiagram).not.toHaveBeenCalled();
  });
});

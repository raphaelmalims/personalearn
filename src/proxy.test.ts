import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const from = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser },
    from,
  })),
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseEnv: () => ({
    url: "https://test.supabase.co",
    anonKey: "test-anon-key",
  }),
}));

import { proxy } from "./proxy";

function createRequest(pathname: string) {
  return new NextRequest(new URL(`http://localhost:3000${pathname}`));
}

function mockUnauthenticated() {
  getUser.mockResolvedValue({ data: { user: null } });
}

function mockAuthenticatedUser(userId = "teacher-1") {
  getUser.mockResolvedValue({
    data: { user: { id: userId, email: "teacher@school.ke" } },
  });
}

function mockClassCount(count: number) {
  const activeEq = vi.fn().mockResolvedValue({ count });
  const teacherEq = vi.fn().mockReturnValue({ eq: activeEq });
  const select = vi.fn().mockReturnValue({ eq: teacherEq });
  from.mockReturnValue({ select });
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users from dashboard to login", async () => {
    mockUnauthenticated();

    const response = await proxy(createRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectTo=%2Fdashboard"
    );
  });

  it("redirects unauthenticated users from the AI Hub landing to login", async () => {
    mockUnauthenticated();

    const response = await proxy(createRequest("/ai-hub"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectTo=%2Fai-hub"
    );
  });

  it("redirects unauthenticated users from onboarding to login", async () => {
    mockUnauthenticated();

    const response = await proxy(createRequest("/onboarding"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectTo=%2Fonboarding"
    );
  });

  it("allows unauthenticated users to visit the login page", async () => {
    mockUnauthenticated();

    const response = await proxy(createRequest("/login"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects authenticated users without classes from dashboard to onboarding", async () => {
    mockAuthenticatedUser();
    mockClassCount(0);

    const response = await proxy(createRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/onboarding"
    );
  });

  it("redirects authenticated users without classes from the AI Hub to onboarding", async () => {
    mockAuthenticatedUser();
    mockClassCount(0);

    const response = await proxy(createRequest("/ai-hub"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/onboarding"
    );
  });

  it("redirects authenticated users with classes away from onboarding to the AI Hub", async () => {
    mockAuthenticatedUser();
    mockClassCount(2);

    const response = await proxy(createRequest("/onboarding"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/ai-hub"
    );
  });

  it("redirects authenticated users on login to onboarding when they have no classes", async () => {
    mockAuthenticatedUser();
    mockClassCount(0);

    const response = await proxy(createRequest("/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/onboarding"
    );
  });

  it("redirects authenticated users on login to the AI Hub when they have classes", async () => {
    mockAuthenticatedUser();
    mockClassCount(1);

    const response = await proxy(createRequest("/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/ai-hub"
    );
  });

  it("lets authenticated teachers through leftover dashboard URLs so the page can replace history", async () => {
    mockAuthenticatedUser();
    mockClassCount(1);

    const dashboard = await proxy(createRequest("/dashboard"));
    expect(dashboard.status).toBe(200);
    expect(dashboard.headers.get("location")).toBeNull();

    const nested = await proxy(createRequest("/dashboard/anything"));
    expect(nested.status).toBe(200);
    expect(nested.headers.get("location")).toBeNull();
  });

  it("does not HTTP-redirect /classes (client replace owns Hub history)", async () => {
    mockAuthenticatedUser();
    mockClassCount(1);

    const response = await proxy(createRequest("/classes"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows authenticated users with classes to reach the AI Hub", async () => {
    mockAuthenticatedUser();
    mockClassCount(1);

    const response = await proxy(createRequest("/ai-hub"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("skips class lookup on public routes for authenticated users", async () => {
    mockAuthenticatedUser();

    const response = await proxy(createRequest("/"));

    expect(response.status).toBe(200);
    expect(from).not.toHaveBeenCalled();
  });

  it("forwards OAuth code on public routes to auth callback", async () => {
    const response = await proxy(
      createRequest("/?code=oauth-code&next=%2Fonboarding")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/callback?code=oauth-code&next=%2Fonboarding"
    );
  });

  it("forwards OAuth code on site root with default next path", async () => {
    const response = await proxy(createRequest("/?code=oauth-code"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/callback?code=oauth-code&next=%2Fai-hub"
    );
  });

  it("does not forward OAuth code on non-root routes", async () => {
    mockUnauthenticated();

    const response = await proxy(createRequest("/login?code=oauth-code"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});

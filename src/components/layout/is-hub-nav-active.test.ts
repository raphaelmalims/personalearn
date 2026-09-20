import { describe, expect, it } from "vitest";
import { isHubNavActive } from "./is-hub-nav-active";

describe("isHubNavActive", () => {
  it("is active on Hub and Hub query-shaped pathnames", () => {
    expect(isHubNavActive("/ai-hub")).toBe(true);
    expect(isHubNavActive("/ai-hub/")).toBe(true);
  });

  it("is active on nested class workspaces", () => {
    expect(isHubNavActive("/classes/c1/resources/r1")).toBe(true);
    expect(isHubNavActive("/classes/c1/evaluations/b1")).toBe(true);
    expect(
      isHubNavActive("/classes/c1/assessments/a1/review/s1")
    ).toBe(true);
  });

  it("is active on class shim URLs (they immediately replace to Hub)", () => {
    expect(isHubNavActive("/classes")).toBe(true);
    expect(isHubNavActive("/classes/c1")).toBe(true);
  });

  it("is not active on marketing, auth, or leftover dashboard URLs", () => {
    expect(isHubNavActive("/")).toBe(false);
    expect(isHubNavActive("/login")).toBe(false);
    expect(isHubNavActive("/onboarding")).toBe(false);
    expect(isHubNavActive("/dashboard")).toBe(false);
    expect(isHubNavActive("/dashboard/old")).toBe(false);
  });
});

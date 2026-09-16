import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  clampAuthCookieOptions,
  isSupabaseAuthCookieName,
} from "./session-policy";

describe("session-policy", () => {
  it("detects supabase auth cookie names", () => {
    expect(isSupabaseAuthCookieName("sb-abc-auth-token")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-abc-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookieName("other")).toBe(false);
  });

  it("clamps oversized auth cookie maxAge", () => {
    const clamped = clampAuthCookieOptions("sb-x-auth-token", {
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
    expect(clamped.maxAge).toBe(SESSION_COOKIE_MAX_AGE_SECONDS);
  });

  it("fills missing maxAge on auth cookies", () => {
    const clamped = clampAuthCookieOptions("sb-x-auth-token", { path: "/" });
    expect(clamped.maxAge).toBe(SESSION_COOKIE_MAX_AGE_SECONDS);
  });

  it("leaves non-auth cookies alone", () => {
    const opts = { path: "/", maxAge: 999999 };
    expect(clampAuthCookieOptions("theme", opts)).toEqual(opts);
  });
});

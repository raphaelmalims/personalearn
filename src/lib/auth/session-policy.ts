/**
 * Session policy for PersonaLearn (PSL-111).
 *
 * Supabase issues JWTs + refresh tokens. Default project JWT expiry is often
 * long, and browser cookies can outlive a shared-device session. We:
 * 1. Cap auth cookie maxAge in app cookie writers (defense in depth).
 * 2. Sign out with scope "global" so refresh tokens are revoked server-side.
 * 3. Document dashboard JWT / rotation settings that must match ACCESS_TOKEN_TTL.
 *
 * Dashboard (dev + prod Supabase projects):
 * - Authentication → Settings → JWT expiry: 3600 seconds (1 hour)
 * - Enable refresh token rotation (and reuse interval ~10s)
 */
import type { CookieOptions } from "@supabase/ssr";

/** Access JWT lifetime we expect from Supabase (seconds). */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Absolute upper bound for auth cookies on this device.
 * Refresh tokens may be shorter; we never allow cookies longer than this.
 */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && name.includes("auth-token");
}

/** Clamp cookie options used when writing Supabase auth cookies. */
export function clampAuthCookieOptions(
  name: string,
  options: CookieOptions
): CookieOptions {
  if (!isSupabaseAuthCookieName(name)) {
    return options;
  }

  const current = options.maxAge;
  if (typeof current === "number" && current > SESSION_COOKIE_MAX_AGE_SECONDS) {
    return { ...options, maxAge: SESSION_COOKIE_MAX_AGE_SECONDS };
  }

  if (current === undefined || current === null) {
    return { ...options, maxAge: SESSION_COOKIE_MAX_AGE_SECONDS };
  }

  return options;
}

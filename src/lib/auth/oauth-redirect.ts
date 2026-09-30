import { getPostLoginPath } from "@/lib/auth/post-login-path";

/** OAuth callback URL for the current app origin (must match Supabase redirect allowlist). */
export function buildOAuthCallbackUrl(redirectPath: string, origin: string) {
  const base = origin.replace(/\/$/, "");
  const path = redirectPath.startsWith("/") ? redirectPath : getPostLoginPath(true);
  return `${base}/auth/callback?next=${encodeURIComponent(path)}`;
}

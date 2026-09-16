import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clampAuthCookieOptions } from "@/lib/auth/session-policy";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Server sign-out (PSL-111): revoke refresh tokens globally and clear auth cookies.
 * Prefer POST from the client SignOutButton.
 */
export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const loginUrl = `${origin}/login`;
  const response = NextResponse.redirect(loginUrl, { status: 303 });
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const clamped = clampAuthCookieOptions(name, options);
          try {
            cookieStore.set(name, value, clamped);
          } catch {
            // Ignore when the store is read-only; response.cookies still clears.
          }
          response.cookies.set(name, value, clamped);
        });
      },
    },
  });

  await supabase.auth.signOut({ scope: "global" });

  // Belt-and-suspenders: expire any remaining sb-*-auth-token cookies.
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
      });
    }
  }

  return response;
}

export async function GET(request: Request) {
  return POST(request);
}

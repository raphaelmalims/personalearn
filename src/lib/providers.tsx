"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const posthogEnabled = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST
);

function identifyUser(user: {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}) {
  const fullName = user.user_metadata.full_name;

  posthog.identify(user.id, {
    email: user.email,
    name: typeof fullName === "string" ? fullName : undefined,
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const identifiedUserId = useRef<string | null>(null);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    if (!posthogEnabled) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        identifiedUserId.current = null;
        posthog.reset();
        return;
      }

      if (
        (event !== "INITIAL_SESSION" && event !== "SIGNED_IN") ||
        !session?.user ||
        identifiedUserId.current === session.user.id
      ) {
        return;
      }

      if (identifiedUserId.current) {
        posthog.reset();
      }

      identifyUser(session.user);
      identifiedUserId.current = session.user.id;
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}

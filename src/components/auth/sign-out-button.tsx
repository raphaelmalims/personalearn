"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useActiveClassStore } from "@/lib/store/active-class";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  variant = "menu",
}: {
  className?: string;
  variant?: "menu" | "hero";
}) {
  const router = useRouter();
  const clearActiveClass = useActiveClassStore((state) => state.clearActiveClass);

  async function handleSignOut() {
    clearActiveClass();

    // Prefer server route so cookies clear on the response and refresh tokens
    // are revoked globally (PSL-111). Fall back to client global signOut.
    try {
      const res = await fetch("/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        redirect: "manual",
      });
      if (res.type === "opaqueredirect" || res.status === 0 || (res.status >= 300 && res.status < 400)) {
        window.location.assign("/login");
        return;
      }
      if (res.ok) {
        window.location.assign("/login");
        return;
      }
    } catch {
      // Fall through to client sign-out.
    }

    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
    router.refresh();
  }

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className={cn(buttonVariants({ variant: "hero", size: "sm" }), className)}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    );
  }

  return (
    <DropdownMenuItem onClick={handleSignOut} className={cn("gap-1.5", className)}>
      <LogOut className="h-4 w-4 shrink-0" />
      Sign out
    </DropdownMenuItem>
  );
}

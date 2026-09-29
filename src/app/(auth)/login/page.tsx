import Link from "next/link";
import { Suspense } from "react";
import { LogoLockup } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import { HeroBackdrop } from "@/components/layout/hero-backdrop";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <HeroBackdrop />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="text-white transition-opacity hover:opacity-90">
          <LogoLockup />
        </Link>
        <ThemeToggle variant="hero" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-4">
        <div className="surface-1 w-full max-w-md rounded-lg p-6 sm:p-8">
          <Suspense
            fallback={
              <p className="text-center text-sm text-muted-foreground">Loading…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

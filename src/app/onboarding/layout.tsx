import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="text-foreground transition-opacity hover:opacity-80">
          <LogoLockup />
        </Link>
        <div className="flex items-center gap-2">
          <SignOutButton variant="header" />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-12 pt-2">
        {children}
      </main>
    </div>
  );
}

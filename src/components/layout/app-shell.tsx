"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { cn } from "@/lib/utils";
import { LogoMark, LogoWordmark } from "@/components/brand/logo";
import { ClassSelector } from "@/components/classes/class-selector";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { isHubNavActive } from "@/components/layout/is-hub-nav-active";

const navItems = [
  { href: "/ai-hub", label: "AI Hub", icon: WandSparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHub = pathname.startsWith("/ai-hub");
  const [railExpanded, setRailExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (moreRef.current?.contains(target)) return;
      if ((event.target as HTMLElement | null)?.closest?.("[data-pl-dropdown-panel]")) {
        return;
      }
      setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-background md:flex print:block print:bg-white">
      {/* Desktop left rail — fixed width; only the center nav cube expands */}
      <aside className="sticky top-0 z-40 hidden h-screen w-[4.5rem] shrink-0 flex-col items-center py-3 md:flex print:hidden">
        <Link
          href="/ai-hub"
          title="PersonaLearn"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <LogoMark className="h-4 w-4" />
        </Link>

        {/* Vertically centered nav cube — expands right over content on hover */}
        <div className="relative flex min-h-0 w-full flex-1 items-center">
          <nav
            className={cn(
              "absolute left-2 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-1 overflow-hidden rounded-3xl bg-card/95 p-2 shadow-lg backdrop-blur-xl transition-[width] duration-200",
              railExpanded ? "w-52" : "w-14"
            )}
            onMouseEnter={() => setRailExpanded(true)}
            onMouseLeave={() => setRailExpanded(false)}
          >
            <div
              className={cn(
                "mb-1 transition-opacity",
                railExpanded
                  ? "opacity-100"
                  : "pointer-events-none h-0 overflow-hidden opacity-0"
              )}
            >
              <ClassSelector />
            </div>

            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isHubNavActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-2xl px-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span
                    className={cn(
                      "truncate transition-opacity",
                      railExpanded ? "opacity-100" : "sr-only opacity-0"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            title="More"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
              moreOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Menu className="h-5 w-5" />
          </button>
          {moreOpen ? (
            <div className="absolute bottom-0 left-full z-50 ml-2 w-40 rounded-2xl bg-card/95 p-1 shadow-lg backdrop-blur-xl">
              <ThemeToggle
                label="Appearance"
                className="h-8 w-8 shrink-0"
                menuClassName="-left-1 -right-1 w-auto"
              />
              <div className="my-0.5 h-px bg-border/60" />
              <SignOutButton className="gap-1.5 px-2 py-1.5" />
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col print:min-h-0">
        {isHub ? null : (
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden print:hidden">
          <Link
            href="/ai-hub"
            className="inline-flex items-center gap-2 font-display text-sm font-semibold"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LogoMark className="h-4 w-4" />
            </span>
            <LogoWordmark className="text-sm" />
          </Link>
          <div className="flex items-center gap-2">
            <ClassSelector />
            <ThemeToggle />
          </div>
        </header>
        )}

        <main
          className={cn(
            "mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8 print:max-w-none print:px-0 print:py-0",
            isHub && "max-md:flex max-md:h-dvh max-md:max-w-none max-md:flex-col max-md:px-0 max-md:py-0"
          )}
        >
          <ViewTransition>
            {children}
          </ViewTransition>
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoLockup } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { landingCtaLabels } from "@/components/landing/cta";
import { buttonVariants } from "@/components/ui/button-variants";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { LandingCtas } from "@/lib/auth/post-login-path";
import { cn } from "@/lib/utils";

function MenuGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" strokeLinecap="round" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  );
}

const anchors = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#trust", label: "CBC" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav({ ctas }: { ctas: LandingCtas }) {
  const [open, setOpen] = useState(false);
  const labels = landingCtaLabels(ctas);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="text-foreground" aria-label="PersonaLearn home">
          <LogoLockup />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Page">
          {anchors.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex h-11 items-center rounded-full px-3 text-small text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {ctas.signedIn ? (
            <>
              <Link
                href={ctas.headerHref}
                className={cn(buttonVariants({ variant: "primary", size: "sm" }), "hidden sm:inline-flex")}
              >
                {labels.header}
              </Link>
              <SignOutButton variant="header" />
            </>
          ) : (
            <Link
              href={ctas.headerHref}
              className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
            >
              {labels.header}
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseGlyph /> : <MenuGlyph />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="landing-menu"
          className="border-t border-border px-4 py-3 lg:hidden"
          aria-label="Page"
        >
          <ul className="mx-auto flex max-w-6xl flex-col">
            {anchors.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="flex h-11 items-center text-body text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

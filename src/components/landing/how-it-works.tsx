"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadGlyph() {
  return <Glyph d="M10 13.5V4.5M6.5 8 10 4.5 13.5 8M4.5 15.5h11" />;
}

function ChatGlyph() {
  return <Glyph d="M4 5.5h12v7H8l-4 3v-3V5.5Z" />;
}

function MarkGlyph() {
  return <Glyph d="M5 15.5l1.2-4.2L13.8 3.7a1.2 1.2 0 0 1 1.7 0l.8.8a1.2 1.2 0 0 1 0 1.7L8.7 14.3 5 15.5Z" />;
}

const steps = [
  {
    glyph: UploadGlyph,
    title: "Upload the scheme",
    body: "Add the scheme of work for the term. The Hub reads it before it answers, so the week you ask about is the week you planned.",
  },
  {
    glyph: ChatGlyph,
    title: "Ask the Hub",
    body: "Ask about a competency, a learner, or next Tuesday’s lesson. The reply stays inside this class — the roster, the scheme, and nothing borrowed from another one.",
  },
  {
    glyph: MarkGlyph,
    title: "Grade the scripts",
    body: "Send in the papers. Marked scripts come back per student, in the same chat, for you to review before anything is final.",
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const nodes = itemRefs.current.filter((node): node is HTMLLIElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = nodes.indexOf(visible.target as HTMLLIElement);
        if (index >= 0) setActive(index);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.25, 0.6] }
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-border px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-caption uppercase tracking-widest text-text-tertiary">How it works</p>
          <h2 className="mt-3 text-h1 font-semibold text-balance">
            Three steps. The same class the whole way.
          </h2>
          <p className="mt-4 max-w-md text-body text-muted-foreground">
            Scheme, question, and marked script stay in one conversation. You do not switch tools to finish the week.
          </p>
        </div>
        <ol className="space-y-4">
          {steps.map((step, index) => {
            const current = index === active;
            const StepGlyph = step.glyph;
            return (
              <li
                key={step.title}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                className={cn(
                  "rounded-lg border px-5 py-6 transition-colors duration-[var(--duration-base)] ease-[var(--ease-standard)] sm:px-6",
                  current
                    ? "border-foreground/30 bg-surface-2"
                    : "border-border bg-surface-1"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border">
                    <StepGlyph />
                  </span>
                  <p className="text-caption uppercase tracking-widest text-text-tertiary">
                    0{index + 1}
                  </p>
                </div>
                <h3 className="mt-4 text-h3 font-semibold">{step.title}</h3>
                <p className="mt-2 max-w-xl text-small leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

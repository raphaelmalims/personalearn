"use client";

import { Brain, ChevronRight } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { cn } from "@/lib/utils";

type ThoughtProcessProps = {
  reasoning: string;
  isStreaming?: boolean;
  hasResponseContent?: boolean;
  reasoningMs?: number | null;
  answerLabel?: string | null;
  answerTitle?: string | null;
};

export function formatThoughtDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  return `Thought for ${seconds}s`;
}

export function formatThoughtLabel(reasoningMs: number | null | undefined): string {
  if (reasoningMs == null || !Number.isFinite(reasoningMs)) return "Thought";
  return formatThoughtDuration(reasoningMs);
}

export function ThoughtProcess({
  reasoning,
  isStreaming = false,
  hasResponseContent = false,
  reasoningMs = null,
  answerLabel = null,
  answerTitle = null,
}: ThoughtProcessProps) {
  const text = reasoning.trim();
  const isActivelyThinking = isStreaming && !hasResponseContent && text.length > 0;
  const panelId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(isActivelyThinking);
  const [measuredMs, setMeasuredMs] = useState<number | null>(reasoningMs);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    if (reasoningMs != null) {
      setMeasuredMs(reasoningMs);
    }
  }, [reasoningMs]);

  useEffect(() => {
    if (isActivelyThinking) {
      if (startedAtRef.current == null) {
        startedAtRef.current = Date.now();
      }
      setIsOpen(true);
      return;
    }
    if (startedAtRef.current == null) return;
    setMeasuredMs((current) => current ?? Date.now() - startedAtRef.current!);
    setIsOpen(false);
    startedAtRef.current = null;
  }, [isActivelyThinking]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || !isOpen) {
      setShowFade(false);
      return;
    }
    if (isActivelyThinking) {
      node.scrollTop = node.scrollHeight;
    }
    setShowFade(node.scrollHeight > node.clientHeight + 8);
  }, [isOpen, isActivelyThinking, text]);

  if (!text) {
    return null;
  }

  const header = isActivelyThinking
    ? "Thinking"
    : formatThoughtLabel(measuredMs ?? reasoningMs);

  return (
    <div className="text-sm text-muted-foreground">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex max-w-full items-center gap-1.5 rounded-md py-1 text-left text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {isActivelyThinking ? (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none"
            aria-hidden
          />
        ) : (
          <Brain className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
        )}
        <span
          className={cn(
            isActivelyThinking &&
              "bg-[length:200%_100%] bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text text-transparent motion-safe:animate-[shimmer_1.8s_linear_infinite] motion-reduce:animate-none"
          )}
        >
          {header}
        </span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] motion-reduce:transition-none",
            isOpen && "rotate-90"
          )}
          aria-hidden
        />
        {!isActivelyThinking && answerLabel ? (
          <span className="truncate" title={answerTitle ?? undefined}>
            · {answerLabel}
          </span>
        ) : null}
      </button>

      <div
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-[var(--duration-base)] ease-[var(--ease-standard)] motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "relative mt-1 rounded-lg border-l-2 border-primary/40 bg-primary/5",
              isActivelyThinking &&
                "motion-safe:animate-[fadeIn_var(--duration-base)_var(--ease-standard)] motion-reduce:animate-none"
            )}
          >
            <div
              id={panelId}
              ref={scrollRef}
              role="region"
              aria-label="Thinking"
              aria-hidden={!isOpen}
              inert={isOpen ? undefined : true}
              className="max-h-40 overflow-y-auto px-3 py-2 text-sm leading-relaxed text-muted-foreground"
              style={
                showFade
                  ? {
                      maskImage: isActivelyThinking
                        ? "linear-gradient(to bottom, transparent, black 1.25rem)"
                        : "linear-gradient(to bottom, transparent, black 1.25rem, black calc(100% - 1.25rem), transparent)",
                      WebkitMaskImage: isActivelyThinking
                        ? "linear-gradient(to bottom, transparent, black 1.25rem)"
                        : "linear-gradient(to bottom, transparent, black 1.25rem, black calc(100% - 1.25rem), transparent)",
                    }
                  : undefined
              }
            >
              <MarkdownContent content={text} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ThoughtProcessProps = {
  reasoning: string;
  isStreaming?: boolean;
  hasResponseContent?: boolean;
  reasoningMs?: number | null;
};

export function formatThoughtDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  return `Thought for ${seconds}s`;
}

export function ThoughtProcess({
  reasoning,
  isStreaming = false,
  hasResponseContent = false,
  reasoningMs = null,
}: ThoughtProcessProps) {
  const text = reasoning.trim();
  const isActivelyThinking = isStreaming && !hasResponseContent && text.length > 0;
  const panelId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(isActivelyThinking);
  const [measuredMs, setMeasuredMs] = useState<number | null>(reasoningMs);

  useEffect(() => {
    if (reasoningMs != null) {
      setMeasuredMs(reasoningMs);
    }
  }, [reasoningMs]);

  useEffect(() => {
    if (!isActivelyThinking) return;
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
    }
    setIsOpen(true);
  }, [isActivelyThinking]);

  useEffect(() => {
    if (isActivelyThinking || startedAtRef.current == null) return;
    setMeasuredMs((current) => current ?? Date.now() - startedAtRef.current!);
    setIsOpen(false);
    startedAtRef.current = null;
  }, [isActivelyThinking]);

  useEffect(() => {
    if (!isOpen || !isActivelyThinking) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [isOpen, isActivelyThinking, text]);

  if (!text) {
    return null;
  }

  const durationMs = measuredMs ?? reasoningMs;
  const header = isActivelyThinking
    ? "Thinking…"
    : formatThoughtDuration(durationMs ?? 1000);

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/40 text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="flex items-center gap-1.5">
          <Sparkles
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-primary",
              isActivelyThinking && "animate-pulse motion-reduce:animate-none"
            )}
          />
          <span>{header}</span>
        </span>
        <span className="flex items-center gap-1 text-[0.7rem] text-muted-foreground/80">
          <span>{isOpen ? "Hide" : "Show"}</span>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-label="Thinking"
        aria-hidden={!isOpen}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            ref={scrollRef}
            className="max-h-60 overflow-y-auto border-t border-border/60 bg-background/50 px-3 py-2.5 font-mono text-[0.8rem] leading-relaxed whitespace-pre-wrap text-muted-foreground"
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

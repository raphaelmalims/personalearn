"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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

  useEffect(() => {
    if (!isOpen || !isActivelyThinking) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [isOpen, isActivelyThinking, text]);

  if (!text) {
    return null;
  }

  const header = isActivelyThinking
    ? "Thinking…"
    : formatThoughtLabel(measuredMs ?? reasoningMs);

  return (
    <div className="text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex max-w-full items-center gap-1 rounded-md py-1 text-left text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span
          className={cn(
            isActivelyThinking && "animate-pulse motion-reduce:animate-none"
          )}
        >
          {header}
        </span>
        {isActivelyThinking ? null : (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform motion-reduce:transition-none",
              isOpen && "rotate-90"
            )}
            aria-hidden
          />
        )}
        {!isActivelyThinking && answerLabel ? (
          <span className="truncate text-muted-foreground" title={answerTitle ?? undefined}>
            · {answerLabel}
          </span>
        ) : null}
      </button>

      <div
        id={panelId}
        ref={scrollRef}
        role="region"
        aria-label="Thinking"
        aria-hidden={!isOpen}
        inert={isOpen ? undefined : true}
        className={cn(
          "max-h-40 overflow-y-auto pr-1 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground",
          isOpen ? "mt-1" : "hidden"
        )}
      >
        {text}
      </div>
    </div>
  );
}

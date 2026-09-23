"use client";

import { cn } from "@/lib/utils";
import type { ReviewMarkerKind } from "@/lib/evaluation/page-images";
import type { QuestionEvaluationStatus } from "@/types/database";

const LABELS: Record<ReviewMarkerKind, string> = {
  correct: "✓",
  incorrect: "✗",
  partial: "~",
  unknown: "?",
};

export function ReviewMarkerBadge({
  kind,
  status,
  className,
}: {
  kind: ReviewMarkerKind;
  status?: QuestionEvaluationStatus;
  className?: string;
}) {
  const estimate = status === "ai_estimate";
  return (
    <span
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-base font-semibold shadow-sm",
        kind === "correct" &&
          !estimate &&
          "border-success/40 bg-success/15 text-success",
        kind === "incorrect" &&
          !estimate &&
          "border-destructive/40 bg-destructive/15 text-destructive",
        kind === "partial" &&
          !estimate &&
          "border-warning/40 bg-warning/15 text-warning",
        (kind === "unknown" || estimate) &&
          "border-warning/50 bg-warning/20 text-warning",
        className
      )}
      title={
        estimate
          ? `AI estimate · ${kind}`
          : kind === "correct"
            ? "Full marks"
            : kind === "incorrect"
              ? "No marks"
              : kind === "partial"
                ? "Partial marks"
                : "Marks unknown"
      }
    >
      {LABELS[kind]}
    </span>
  );
}

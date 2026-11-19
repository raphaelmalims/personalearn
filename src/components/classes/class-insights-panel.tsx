"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { useClassInsights } from "@/lib/hooks/use-evaluation";
import {
  formatStruggleLine,
  presentClassInsights,
  type ClassInsightsCardView,
  type ClassInsightsView,
} from "@/lib/evaluation/class-insights-message";

type ClassInsightsPanelProps = {
  batchId: string;
  markedCount: number;
};

export function ClassInsightsPanel({
  batchId,
  markedCount,
}: ClassInsightsPanelProps) {
  const enabled = markedCount >= 2;
  const { data, isLoading, error } = useClassInsights(batchId, enabled);

  if (!enabled) return null;

  const scriptCount = data?.scriptCount ?? markedCount;
  const view = data ? presentClassInsights(data) : null;

  return (
    <section
      aria-label="Class insights"
      className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4 sm:py-4"
    >
      <p className="text-caption text-muted-foreground">Class insights</p>
      <h2 className="text-base font-semibold tracking-tight">
        Based on {scriptCount} {scriptCount === 1 ? "script" : "scripts"}
      </h2>
      <p className="text-caption text-muted-foreground">Based on this class set</p>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <p className="mt-3 text-sm text-muted-foreground">
          These insights did not load. You can still review each script.
        </p>
      ) : view && view.cards.length > 0 ? (
        <>
          <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {view.cards.map((card) => (
              <InsightCard key={`${card.title}-${card.questionNumbers}`} card={card} />
            ))}
          </ul>
        </>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

export function ClassInsightsChatCard({ view }: { view: ClassInsightsView }) {
  const countLabel =
    view.scriptCount === 1 ? "1 script" : `${view.scriptCount} scripts`;

  return (
    <section
      aria-label="Class insights"
      className="max-w-md rounded-xl border border-border bg-card px-3 py-3"
    >
      <p className="text-caption text-muted-foreground">Class insights</p>
      <h3 className="text-sm font-semibold tracking-tight">
        Based on {countLabel}
      </h3>
      <p className="text-caption text-muted-foreground">Based on this class set</p>
      {view.cards.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {view.cards.map((card) => (
            <InsightCard
              key={`${card.title}-${card.questionNumbers}`}
              card={card}
              compact
            />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing stands out on this set.
        </p>
      )}
      {view.reviewPath ? (
        <Link
          href={view.reviewPath}
          className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-3`}
        >
          Open class insights
        </Link>
      ) : null}
    </section>
  );
}

function InsightCard({
  card,
  compact = false,
}: {
  card: ClassInsightsCardView;
  compact?: boolean;
}) {
  const score = formatStruggleLine(card);

  return (
    <li className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium">{card.title}</p>
        <p className="text-caption text-muted-foreground">{score}</p>
      </div>
      {card.questionNumbers ? (
        <p className="mt-1 text-caption text-muted-foreground">
          Questions {card.questionNumbers}
        </p>
      ) : null}
      <p className={`text-sm leading-snug ${compact ? "mt-1" : "mt-2"}`}>
        {card.reteachStep}
      </p>
    </li>
  );
}

function LoadingState() {
  return (
    <div className="mt-3 space-y-2" aria-busy="true">
      <p className="text-sm text-muted-foreground">Reading the marked scripts.</p>
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

function EmptyState() {
  return (
    <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
      Nothing stands out on this set.
    </p>
  );
}

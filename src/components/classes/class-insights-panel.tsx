"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useClassInsights } from "@/lib/hooks/use-evaluation";

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
  const showTopics = data?.source === "llm" && (data.topics?.length ?? 0) > 0;

  return (
    <section
      aria-label="Class insights"
      className="rounded-xl border border-border bg-card px-3 py-3 sm:px-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold tracking-tight">Class insights</h2>
        <p className="text-xs text-muted-foreground">
          Based on {scriptCount} {scriptCount === 1 ? "script" : "scripts"}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="mt-3 text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Could not load class insights"}
        </p>
      ) : showTopics && data ? (
        <>
          <ul className="mt-3 space-y-2">
            {data.topics.map((topic) => (
              <li
                key={topic.title}
                className="rounded-lg border border-border/80 px-3 py-2"
              >
                <p className="text-sm font-medium">{topic.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {topic.questionKeys
                    .map(
                      (key) =>
                        data.questions.find((question) => question.key === key)
                          ?.label ?? key
                    )
                    .join(" · ")}
                </p>
                <p className="mt-2 text-sm leading-snug">{topic.reteachStep}</p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                  Next: {topic.nextActivity}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            Inferred from this set. Not a CBC strand alignment.
          </p>
        </>
      ) : (
        <QuestionTable questions={data?.questions ?? []} />
      )}
    </section>
  );
}

function QuestionTable({
  questions,
}: {
  questions: {
    key: string;
    label: string;
    learnersMarked: number;
    percentBelowHalf: number | null;
    commonMistakes: { text: string; count: number }[];
  }[];
}) {
  if (questions.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        No question scores yet for these scripts.
      </p>
    );
  }

  return (
    <ul className="mt-3 max-h-80 space-y-2 overflow-auto">
      {questions.map((question) => (
        <li
          key={question.key}
          className="rounded-lg border border-border/80 px-3 py-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-medium">{question.label}</p>
            <p className="text-xs text-muted-foreground">
              {question.learnersMarked}{" "}
              {question.learnersMarked === 1 ? "learner" : "learners"}
              {" · "}
              {question.percentBelowHalf === null
                ? "no score"
                : `${question.percentBelowHalf}% below 50%`}
            </p>
          </div>
          {question.commonMistakes.length > 0 ? (
            <ul className="mt-1 space-y-1">
              {question.commonMistakes.map((mistake) => (
                <li
                  key={mistake.text}
                  className="text-xs leading-snug text-muted-foreground"
                >
                  {mistake.text}
                  {mistake.count > 1 ? ` (${mistake.count})` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

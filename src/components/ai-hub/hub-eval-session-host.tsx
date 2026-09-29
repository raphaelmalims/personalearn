"use client";

import { useQuery } from "@tanstack/react-query";
import { IdentityReviewPanel } from "@/components/classes/identity-review-panel";
import {
  EvalReviewWorkspace,
  SplitPaneScriptReview,
} from "@/components/classes/eval-review-workspace";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useHubEvalSessionStore } from "@/lib/store/hub-eval-session";
import { useActiveClassStore } from "@/lib/store/active-class";
import { cn } from "@/lib/utils";
import type { ScriptReviewDto } from "@/lib/evaluation/identity";
import type { Assessment } from "@/types/database";

type ReviewSibling = {
  id: string;
  student_name: string | null;
  read_admission_number: string | null;
  status: string;
};

async function fetchScriptReview(
  classId: string,
  assessmentId: string,
  scriptId: string
) {
  const response = await fetch(
    `/api/classes/${encodeURIComponent(classId)}/assessments/${encodeURIComponent(assessmentId)}/review/${encodeURIComponent(scriptId)}`
  );
  const payload = (await response.json()) as {
    script?: ScriptReviewDto;
    batchId?: string;
    assessment?: Assessment | null;
    siblings?: ReviewSibling[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load review");
  }
  return payload;
}

export function HubEvalSessionHost() {
  const expanded = useHubEvalSessionStore((s) => s.expanded);
  const view = useHubEvalSessionStore((s) => s.view);
  const classId = useHubEvalSessionStore((s) => s.classId);
  const batchId = useHubEvalSessionStore((s) => s.batchId);
  const assessmentId = useHubEvalSessionStore((s) => s.assessmentId);
  const scriptId = useHubEvalSessionStore((s) => s.scriptId);
  const collapse = useHubEvalSessionStore((s) => s.collapse);
  const openScript = useHubEvalSessionStore((s) => s.openScript);
  const backToQueue = useHubEvalSessionStore((s) => s.backToQueue);
  const activeClass = useActiveClassStore((s) => s.activeClass);
  const isMobile = useIsMobile();

  if (!expanded || !classId || !batchId) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-background",
        isMobile ? "fixed inset-0 z-50 h-dvh" : "absolute inset-0 z-20"
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="truncate text-sm font-medium">Evaluation workspace</p>
        <Button type="button" size="sm" variant="secondary" onClick={collapse}>
          Collapse
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {view === "script" && assessmentId && scriptId ? (
          <HubScriptPane
            classId={classId}
            assessmentId={assessmentId}
            scriptId={scriptId}
            onBack={backToQueue}
            onNavigateSibling={(id) => openScript(id, assessmentId)}
          />
        ) : (
          <div className="space-y-4">
            <IdentityReviewPanel classId={classId} batchId={batchId} />
            <EvalReviewWorkspace
              classId={classId}
              batchId={batchId}
              classLabel={activeClass?.name ?? "Class"}
              classSubject={activeClass?.subject ?? "General"}
              compact
              onOpenScript={({ scriptId: nextScript, assessmentId: nextAssess }) =>
                openScript(nextScript, nextAssess)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function HubScriptPane({
  classId,
  assessmentId,
  scriptId,
  onBack,
  onNavigateSibling,
}: {
  classId: string;
  assessmentId: string;
  scriptId: string;
  onBack: () => void;
  onNavigateSibling: (scriptId: string) => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["script-review", classId, assessmentId, scriptId],
    queryFn: () => fetchScriptReview(classId, assessmentId, scriptId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !data?.script || !data.batchId) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Review not available"}
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={onBack}>
          Back to queue
        </Button>
      </div>
    );
  }

  const strand = data.assessment?.linked_strand?.trim() || "General";
  const subStrand = data.assessment?.linked_sub_strand ?? null;

  return (
    <SplitPaneScriptReview
      script={data.script}
      classId={classId}
      batchId={data.batchId}
      assessmentId={assessmentId}
      strand={strand}
      subStrand={subStrand}
      siblings={data.siblings ?? []}
      onNavigateSibling={onNavigateSibling}
      onBack={onBack}
    />
  );
}

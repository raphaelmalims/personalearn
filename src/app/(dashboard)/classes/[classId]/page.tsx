"use client";

import { Suspense, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { WandSparkles } from "lucide-react";
import { resolveClassDeepLinkTarget } from "@/lib/classes/class-deep-link";
import { useClasses } from "@/lib/hooks/use-classes";
import { useAssessments } from "@/lib/hooks/use-evaluation";
import { useActiveClassStore } from "@/lib/store/active-class";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassEditDialog } from "@/components/classes/class-edit-dialog";
import { ClassMetaReveal } from "@/components/classes/class-meta-reveal";
import { ClassEvaluationsSection } from "@/components/classes/class-evaluations-section";
import { ClassDetailSkeleton } from "@/components/classes/class-detail-skeleton";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  return (
    <Suspense fallback={<ClassDetailSkeleton />}>
      <ClassDetailContent params={params} />
    </Suspense>
  );
}

function ClassDetailContent({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Capture once so clearing the URL does not re-trigger the deep-link jump.
  const [pendingAssessmentId, setPendingAssessmentId] = useState<string | null>(
    () => searchParams.get("assessment")
  );
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(
    () => searchParams.get("resource")
  );
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: assessments, isLoading: assessmentsLoading } =
    useAssessments(classId);
  const setActiveClass = useActiveClassStore((state) => state.setActiveClass);
  const cls = classes?.find((c) => c.id === classId);

  const clearDeepLinkParams = useCallback(() => {
    setPendingAssessmentId(null);
    setPendingResourceId(null);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ["assessment", "resource"] as const) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (!changed) return;
    const next = url.pathname + (url.search ? url.search : "");
    window.history.replaceState(window.history.state, "", next);
  }, []);

  useEffect(() => {
    if (!pendingAssessmentId && !pendingResourceId) return;

    const target = resolveClassDeepLinkTarget({
      classId,
      resourceId: pendingResourceId,
      assessmentId: pendingAssessmentId,
      assessments,
      assessmentsLoading,
    });

    if (target.status === "waiting") return;

    clearDeepLinkParams();
    if (target.status === "redirect") {
      router.replace(target.href);
    }
  }, [
    assessments,
    assessmentsLoading,
    classId,
    clearDeepLinkParams,
    pendingAssessmentId,
    pendingResourceId,
    router,
  ]);

  useEffect(() => {
    if (!cls) return;
    setActiveClass({
      id: cls.id,
      name: cls.name,
      grade_level: cls.grade_level,
      subject: cls.subject,
      section: cls.section,
      term: cls.term,
    });
  }, [cls, setActiveClass]);

  if (classesLoading && !cls) {
    return <ClassDetailSkeleton />;
  }

  if (!cls && classes) {
    return (
      <p className="text-center text-muted-foreground">
        Class not found.{" "}
        <Link href="/classes" className="text-primary hover:underline">
          Go to classes
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Classes", href: "/classes" },
          { label: cls?.name ?? "Class" },
        ]}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        {cls ? (
          <ClassMetaReveal cls={cls} action={<ClassEditDialog cls={cls} />} />
        ) : (
          <>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="mt-2 h-4 w-72" />
          </>
        )}
        <Link
          href="/ai-hub"
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <WandSparkles className="h-4 w-4" />
          Open in Hub
        </Link>
        <p className="text-xs text-muted-foreground">
          Resources and students now live in the Hub class panel.
        </p>
      </div>

      <ClassEvaluationsSection classId={classId} />
    </div>
  );
}

"use client";

import { Suspense, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveClassIdShimNavigation } from "@/lib/classes/class-deep-link";
import { useClasses } from "@/lib/hooks/use-classes";
import { useAssessments } from "@/lib/hooks/use-evaluation";
import { useActiveClassStore } from "@/lib/store/active-class";
import { ClassDetailSkeleton } from "@/components/classes/class-detail-skeleton";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  return (
    <Suspense fallback={<ClassDetailSkeleton />}>
      <ClassDetailRedirect params={params} />
    </Suspense>
  );
}

function ClassDetailRedirect({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resourceId = searchParams.get("resource");
  const assessmentId = searchParams.get("assessment");
  const { data: classes } = useClasses();
  const { data: assessments, isLoading: assessmentsLoading } =
    useAssessments(classId);
  const setActiveClass = useActiveClassStore((state) => state.setActiveClass);
  const cls = classes?.find((c) => c.id === classId);

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

  useEffect(() => {
    const target = resolveClassIdShimNavigation({
      classId,
      resourceId,
      assessmentId,
      assessments,
      assessmentsLoading,
    });

    if (target.status === "waiting") return;
    router.replace(target.href);
  }, [
    assessmentId,
    assessments,
    assessmentsLoading,
    classId,
    resourceId,
    router,
  ]);

  return <ClassDetailSkeleton />;
}

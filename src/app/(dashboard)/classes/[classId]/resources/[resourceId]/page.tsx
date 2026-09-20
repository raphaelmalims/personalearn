"use client";

import { use, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ClassDetailSkeleton } from "@/components/classes/class-detail-skeleton";
import { useClasses } from "@/lib/hooks/use-classes";
import { prefetchResourceDetail } from "@/lib/hooks/use-resources";
import { useActiveClassStore } from "@/lib/store/active-class";
import { useHubResourceSessionStore } from "@/lib/store/hub-resource-session";

export default function ClassResourcePage({
  params,
}: {
  params: Promise<{ classId: string; resourceId: string }>;
}) {
  const { classId, resourceId } = use(params);
  return (
    <HubResourceDeepLink classId={classId} resourceId={resourceId} />
  );
}

/** Thin wrapper: old resource URLs `replace` into the Hub reader. */
export function HubResourceDeepLink({
  classId,
  resourceId,
}: {
  classId: string;
  resourceId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: classes } = useClasses();
  const setActiveClass = useActiveClassStore((state) => state.setActiveClass);
  const cls = classes?.find((row) => row.id === classId);

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
    void prefetchResourceDetail(queryClient, resourceId);
    useHubResourceSessionStore.getState().openResource({ classId, resourceId });
    router.replace("/ai-hub");
  }, [classId, queryClient, resourceId, router]);

  return <ClassDetailSkeleton />;
}

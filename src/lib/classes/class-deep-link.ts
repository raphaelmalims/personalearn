import type { Assessment } from "@/types/database";

type ClassDeepLinkInput = {
  classId: string;
  /** `?resource=` on /classes/[classId]. */
  resourceId: string | null;
  /** `?assessment=` on /classes/[classId] (Home / competency cube links). */
  assessmentId: string | null;
  assessments: Pick<Assessment, "id" | "resource_id">[] | undefined;
  assessmentsLoading: boolean;
};

type ClassDeepLinkTarget =
  /** Nothing to resolve yet — keep the query params. */
  | { status: "waiting" }
  /** Consume the params and stay on the class page. */
  | { status: "stay" }
  /** Consume the params and navigate to the resource route. */
  | { status: "redirect"; href: string };

/**
 * Resources moved to the Hub class panel in PSL-114, so the class page no
 * longer opens them inline — both deep links resolve to the resource route.
 */
export function resolveClassDeepLinkTarget({
  classId,
  resourceId,
  assessmentId,
  assessments,
  assessmentsLoading,
}: ClassDeepLinkInput): ClassDeepLinkTarget {
  if (resourceId) {
    return {
      status: "redirect",
      href: `/classes/${classId}/resources/${resourceId}`,
    };
  }

  if (!assessmentId) {
    return { status: "stay" };
  }

  if (assessmentsLoading || !assessments) {
    return { status: "waiting" };
  }

  const assessment = assessments.find((row) => row.id === assessmentId);
  if (!assessment?.resource_id) {
    return { status: "stay" };
  }

  return {
    status: "redirect",
    href: `/classes/${classId}/resources/${assessment.resource_id}`,
  };
}

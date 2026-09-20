import type { Assessment } from "@/types/database";

type ClassDeepLinkInput = {
  classId: string;
  /** `?resource=` on /classes/[classId]. */
  resourceId: string | null;
  /** `?assessment=` leftover deep-link on `/classes/[classId]`. */
  assessmentId: string | null;
  assessments: Pick<Assessment, "id" | "resource_id">[] | undefined;
  assessmentsLoading: boolean;
};

type ClassDeepLinkTarget =
  /** Nothing to resolve yet — keep the query params. */
  | { status: "waiting" }
  /** No resource target — caller should send the teacher to the Hub. */
  | { status: "stay" }
  /** Consume the params and navigate to the resource route. */
  | { status: "redirect"; href: string };

export type ClassIdShimNavigation =
  | { status: "waiting" }
  | { method: "replace"; href: string };

/**
 * `/classes/[classId]` is only a redirect shim (PSL-114). Resource and
 * assessment query params resolve to the resource route; otherwise the
 * caller sends the teacher to the Hub.
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

/** Always `replace` so `/classes/[id]` never sits in history. */
export function resolveClassIdShimNavigation(
  input: ClassDeepLinkInput
): ClassIdShimNavigation {
  const target = resolveClassDeepLinkTarget(input);
  if (target.status === "waiting") {
    return { status: "waiting" };
  }
  if (target.status === "redirect") {
    return { method: "replace", href: target.href };
  }
  return { method: "replace", href: "/ai-hub" };
}

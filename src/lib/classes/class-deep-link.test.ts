import { describe, expect, it } from "vitest";
import { resolveClassDeepLinkTarget } from "./class-deep-link";

const classId = "class-1";

describe("resolveClassDeepLinkTarget", () => {
  it("sends ?resource= straight to the resource route", () => {
    expect(
      resolveClassDeepLinkTarget({
        classId,
        resourceId: "resource-9",
        assessmentId: null,
        assessments: undefined,
        assessmentsLoading: true,
      })
    ).toEqual({
      status: "redirect",
      href: "/classes/class-1/resources/resource-9",
    });
  });

  it("waits for assessments before resolving ?assessment=", () => {
    expect(
      resolveClassDeepLinkTarget({
        classId,
        resourceId: null,
        assessmentId: "assessment-1",
        assessments: undefined,
        assessmentsLoading: true,
      })
    ).toEqual({ status: "waiting" });
  });

  it("follows the assessment's linked resource", () => {
    expect(
      resolveClassDeepLinkTarget({
        classId,
        resourceId: null,
        assessmentId: "assessment-1",
        assessments: [{ id: "assessment-1", resource_id: "resource-3" }],
        assessmentsLoading: false,
      })
    ).toEqual({
      status: "redirect",
      href: "/classes/class-1/resources/resource-3",
    });
  });

  it("stays on the class page when the assessment has no linked resource", () => {
    expect(
      resolveClassDeepLinkTarget({
        classId,
        resourceId: null,
        assessmentId: "assessment-1",
        assessments: [{ id: "assessment-1", resource_id: null }],
        assessmentsLoading: false,
      })
    ).toEqual({ status: "stay" });
  });

  it("stays on the class page for an unknown assessment", () => {
    expect(
      resolveClassDeepLinkTarget({
        classId,
        resourceId: null,
        assessmentId: "missing",
        assessments: [{ id: "assessment-1", resource_id: "resource-3" }],
        assessmentsLoading: false,
      })
    ).toEqual({ status: "stay" });
  });

  it("stays on the class page when there is no deep link", () => {
    expect(
      resolveClassDeepLinkTarget({
        classId,
        resourceId: null,
        assessmentId: null,
        assessments: [],
        assessmentsLoading: false,
      })
    ).toEqual({ status: "stay" });
  });
});

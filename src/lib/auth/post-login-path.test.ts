import { describe, expect, it } from "vitest";
import { getLandingCtas, getPostLoginPath } from "./post-login-path";

describe("getPostLoginPath", () => {
  it("returns onboarding when the teacher has no classes", () => {
    expect(getPostLoginPath(false)).toBe("/onboarding");
  });

  it("returns the AI Hub when the teacher has classes", () => {
    expect(getPostLoginPath(true)).toBe("/ai-hub");
  });
});

describe("getLandingCtas", () => {
  it("keeps public login links and points the secondary CTA at the Hub when signed out", () => {
    expect(getLandingCtas(false, false)).toEqual({
      signedIn: false,
      headerHref: "/login",
      headerLabel: "Sign in",
      primaryHref: "/login",
      secondaryHref: "/ai-hub",
      footerHref: "/login",
    });
  });

  it("sends signed-in teachers with no class to onboarding", () => {
    expect(getLandingCtas(true, false)).toEqual({
      signedIn: true,
      headerHref: "/onboarding",
      headerLabel: "Create class",
      primaryHref: "/onboarding",
      secondaryHref: "/onboarding",
      footerHref: "/onboarding",
    });
  });

  it("sends signed-in teachers with classes to the AI Hub", () => {
    expect(getLandingCtas(true, true)).toEqual({
      signedIn: true,
      headerHref: "/ai-hub",
      headerLabel: "Open AI Hub",
      primaryHref: "/ai-hub",
      secondaryHref: "/ai-hub",
      footerHref: "/ai-hub",
    });
  });
});

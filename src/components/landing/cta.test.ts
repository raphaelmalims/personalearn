import { describe, expect, it } from "vitest";
import { getLandingCtas } from "@/lib/auth/post-login-path";
import { landingCtaLabels } from "./cta";

describe("landingCtaLabels", () => {
  it("keeps a public primary and a Hub secondary when signed out", () => {
    const ctas = getLandingCtas(false, false);
    expect(landingCtaLabels(ctas)).toEqual({
      header: "Sign in",
      primary: "Get started",
      secondary: "See the Hub",
      footer: "Start teaching",
      showSecondary: true,
    });
    expect(ctas.primaryHref).toBe("/login");
    expect(ctas.secondaryHref).toBe("/ai-hub");
  });

  it("follows the signed-in destination from getLandingCtas", () => {
    const withClass = getLandingCtas(true, true);
    expect(landingCtaLabels(withClass).primary).toBe("Open AI Hub");
    expect(landingCtaLabels(withClass).showSecondary).toBe(false);
    expect(withClass.primaryHref).toBe("/ai-hub");

    const noClass = getLandingCtas(true, false);
    expect(landingCtaLabels(noClass).header).toBe("Create class");
    expect(noClass.footerHref).toBe("/onboarding");
  });
});

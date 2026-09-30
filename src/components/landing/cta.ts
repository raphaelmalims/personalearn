import type { LandingCtas } from "@/lib/auth/post-login-path";

export type LandingCtaLabels = {
  header: string;
  primary: string;
  secondary: string;
  footer: string;
  /** Signed-in teachers have one destination, so the hero keeps a single CTA. */
  showSecondary: boolean;
};

/** Visible labels for the landing. Href values stay on `getLandingCtas`. */
export function landingCtaLabels(ctas: LandingCtas): LandingCtaLabels {
  if (!ctas.signedIn) {
    return {
      header: ctas.headerLabel,
      primary: "Get started",
      secondary: "See the Hub",
      footer: "Start teaching",
      showSecondary: true,
    };
  }

  return {
    header: ctas.headerLabel,
    primary: ctas.headerLabel,
    secondary: ctas.headerLabel,
    footer: ctas.headerLabel,
    showSecondary: false,
  };
}

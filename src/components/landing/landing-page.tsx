import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingNav } from "@/components/landing/landing-nav";
import {
  CapabilityStrip,
  FaqSection,
  FeatureBento,
  FinalCta,
  LandingFooter,
  LandingHero,
  TrustSection,
} from "@/components/landing/landing-sections";
import type { LandingCtas } from "@/lib/auth/post-login-path";

export function LandingPage({ ctas }: { ctas: LandingCtas }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNav ctas={ctas} />
      <main>
        <LandingHero ctas={ctas} />
        <CapabilityStrip />
        <HowItWorks />
        <FeatureBento />
        <TrustSection />
        <FaqSection />
        <FinalCta ctas={ctas} />
      </main>
      <LandingFooter ctas={ctas} />
    </div>
  );
}

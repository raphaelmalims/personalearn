import { Suspense } from "react";
import { AiHubChat } from "@/components/ai-hub/ai-hub-chat";
import { WelcomeTour } from "@/components/onboarding/welcome-tour";

export default function AiHubPage() {
  return (
    <>
      {/* Hub is the post-auth landing (PSL-114), so the first-run tour lives here. */}
      <WelcomeTour />
      <div className="flex h-dvh min-h-0 flex-1 flex-col md:-mx-6 md:mb-[-2rem] md:h-[calc(100dvh-4rem)] md:min-h-[32rem] md:px-6">
        <div className="min-h-0 flex-1">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Loading AI Hub…</p>
            }
          >
            <AiHubChat />
          </Suspense>
        </div>
      </div>
    </>
  );
}

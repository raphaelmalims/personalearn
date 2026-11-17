import { PostHog } from "posthog-node";

let posthog: PostHog | null | undefined;
let missingConfigurationWarned = false;

export function getServerPostHog(): PostHog | null {
  if (posthog !== undefined) return posthog;

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!projectToken || !host) {
    if (process.env.NODE_ENV !== "production" && !missingConfigurationWarned) {
      missingConfigurationWarned = true;
      const missingVariable = projectToken
        ? "NEXT_PUBLIC_POSTHOG_HOST"
        : "NEXT_PUBLIC_POSTHOG_KEY";
      console.warn(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
      );
    }
    posthog = null;
    return posthog;
  }

  posthog = new PostHog(projectToken, {
    host,
    privacyMode: false,
    flushAt: 1,
    flushInterval: 0,
    requestTimeout: 2000,
    fetchRetryCount: 0,
  });
  return posthog;
}

export async function flushServerPostHog() {
  await posthog?.flush().catch(() => {});
}

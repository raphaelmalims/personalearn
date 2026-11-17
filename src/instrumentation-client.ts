// This file configures the initialization of Sentry and PostHog on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { getClientSentryOptions } from "@/lib/sentry/config";

const options = getClientSentryOptions();
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (options) {
  Sentry.init({
    ...options,
    integrations: [Sentry.replayIntegration()],
  });
}

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    tracing_headers: [window.location.hostname],
    defaults: "2026-08-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  const missingVariable = posthogKey
    ? "NEXT_PUBLIC_POSTHOG_HOST"
    : "NEXT_PUBLIC_POSTHOG_KEY";

  console.error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

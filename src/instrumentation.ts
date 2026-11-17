import * as Sentry from "@sentry/nextjs";

type AiSpanProcessor = {
  forceFlush(): Promise<void>;
};

type PostHogLogRecord = {
  body: string;
  severityText: "ERROR" | "INFO";
  attributes: Record<string, boolean | number | string | undefined>;
};

type PostHogLogger = {
  emit(record: PostHogLogRecord): void;
};

type PostHogLoggerProvider = {
  forceFlush(): Promise<void>;
  getLogger(name: string): PostHogLogger;
};

let posthogSpanProcessor: AiSpanProcessor | null = null;
let posthogLoggerProvider: PostHogLoggerProvider | null = null;
let posthogLogger: PostHogLogger | null = null;
let aiObservabilityStarted = false;
let posthogLogsStarted = false;

async function registerAiObservability() {
  if (aiObservabilityStarted) return;
  aiObservabilityStarted = true;

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!projectToken || !host) {
    if (process.env.NODE_ENV !== "production") {
      const missingVariable = projectToken
        ? "NEXT_PUBLIC_POSTHOG_HOST"
        : "NEXT_PUBLIC_POSTHOG_KEY";
      console.warn(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
      );
    }
    return;
  }

  const [
    { OpenTelemetry },
    { NodeSDK },
    { resourceFromAttributes },
    { PostHogSpanProcessor },
    { registerTelemetry },
  ] = await Promise.all([
    import("@ai-sdk/otel"),
    import("@opentelemetry/sdk-node"),
    import("@opentelemetry/resources"),
    import("@posthog/ai/otel"),
    import("ai"),
  ]);

  const spanProcessor = new PostHogSpanProcessor({ projectToken, host });
  posthogSpanProcessor = spanProcessor;
  new NodeSDK({
    resource: resourceFromAttributes({ "service.name": "personalearn" }),
    spanProcessors: [spanProcessor],
  }).start();

  const telemetry = new OpenTelemetry({
    enrichSpan: ({ runtimeContext }) => ({
      "posthog.distinct_id":
        typeof runtimeContext?.distinctId === "string"
          ? runtimeContext.distinctId
          : undefined,
      $ai_session_id:
        typeof runtimeContext?.sessionId === "string"
          ? runtimeContext.sessionId
          : undefined,
      $ai_trace_name:
        typeof runtimeContext?.traceName === "string"
          ? runtimeContext.traceName
          : undefined,
    }),
  });
  registerTelemetry(
    telemetry as unknown as Parameters<typeof registerTelemetry>[0]
  );
}

async function registerPostHogLogs() {
  if (posthogLogsStarted) return;
  posthogLogsStarted = true;

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!projectToken || !host) return;

  const [
    { BatchLogRecordProcessor, LoggerProvider },
    { OTLPLogExporter },
    { resourceFromAttributes },
  ] = await Promise.all([
    import("@opentelemetry/sdk-logs"),
    import("@opentelemetry/exporter-logs-otlp-http"),
    import("@opentelemetry/resources"),
  ]);

  posthogLoggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "personalearn" }),
    processors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `${host.replace(/\/$/, "")}/i/v1/logs`,
          headers: {
            Authorization: `Bearer ${projectToken}`,
            "Content-Type": "application/json",
          },
        })
      ),
    ],
  });
  posthogLogger = posthogLoggerProvider.getLogger("personalearn.posthog");
}

export function emitPostHogLog(record: PostHogLogRecord) {
  posthogLogger?.emit(record);
}

export async function flushAiObservability() {
  if (posthogSpanProcessor) {
    await posthogSpanProcessor.forceFlush().catch(() => {});
  }
}

export async function flushPostHogLogs() {
  if (posthogLoggerProvider) {
    await posthogLoggerProvider.forceFlush().catch(() => {});
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    await registerAiObservability();
    await registerPostHogLogs();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

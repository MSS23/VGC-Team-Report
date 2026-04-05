import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";

// Lazy-init: created inside register() when env vars are guaranteed available
export let loggerProvider: LoggerProvider;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (token) {
      loggerProvider = new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "vgc-team-report" }),
        processors: [
          new BatchLogRecordProcessor(
            new OTLPLogExporter({
              url: `https://eu.i.posthog.com/i/v1/logs?token=${token}`,
              headers: {
                "Content-Type": "application/json",
              },
            })
          ),
        ],
      });
      logs.setGlobalLoggerProvider(loggerProvider);
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

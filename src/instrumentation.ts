import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";

export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ "service.name": "vgc-team-report" }),
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: `https://eu.i.posthog.com/i/v1/logs?token=${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}`,
        headers: {
          "Content-Type": "application/json",
        },
      })
    ),
  ],
});

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    logs.setGlobalLoggerProvider(loggerProvider);
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

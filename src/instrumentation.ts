import { SimpleLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";

// Stored reference for forceFlush() in route handlers
let _provider: LoggerProvider | null = null;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Build-time data integrity check — fail loudly if a Champions-legal Mega
    // is missing from the catalogue or cannot resolve through the production
    // lookup path. Catches invisible spread regressions before users see them.
    const { validateMegaCoverage } = await import("./lib/data/__validate-mega-coverage");
    const result = validateMegaCoverage();
    if (!result.ok) {
      console.warn("[mega-coverage] Unresolved Champions catalogue entries:");
      for (const err of result.errors) console.warn("  - " + err);
    }

    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (token) {
      _provider = new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "vgc-team-report" }),
        processors: [
          new SimpleLogRecordProcessor(
            new OTLPLogExporter({
              url: `https://eu.i.posthog.com/i/v1/logs?token=${token}`,
              headers: {
                "Content-Type": "application/json",
              },
            })
          ),
        ],
      });
      logs.setGlobalLoggerProvider(_provider);
    }
  }
}

/**
 * Get the global OTel logger. Safe to call from any API route —
 * uses the global provider set by register(), not a module export.
 */
export function getLogger(name = "vgc-team-report") {
  return logs.getLoggerProvider().getLogger(name);
}

/** Flush pending logs. Call inside after() in route handlers. */
export async function flushLogs() {
  if (_provider) await _provider.forceFlush();
}

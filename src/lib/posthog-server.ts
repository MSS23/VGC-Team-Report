import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
      host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      flushAt: 1, // Flush immediately in serverless
      flushInterval: 0,
    });
  }

  return posthogClient;
}

/**
 * Fire-and-forget server-side event capture.
 * Safe to call without awaiting — silently no-ops if PostHog is unconfigured.
 *
 * IMPORTANT (serverless): `capture()` only enqueues the event. On serverless
 * the function can freeze/exit before the queue is flushed to PostHog, dropping
 * events. Terminal request paths MUST flush after responding — schedule
 * `flushServerEvents()` inside `next/server`'s `after()`:
 *
 *   import { after } from "next/server";
 *   captureServerEvent(id, "event", { ... });
 *   after(() => flushServerEvents());
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const ph = getPostHogServer();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
}

/**
 * Flush any queued server-side events to PostHog. Intended to be run inside
 * `next/server`'s `after()` so the flush completes after the response is sent
 * without blocking it. Resolves (and never throws) if PostHog is unconfigured.
 */
export async function flushServerEvents(): Promise<void> {
  const ph = getPostHogServer();
  if (!ph) return;
  try {
    await ph.flush();
  } catch (e) {
    console.warn("PostHog flush failed:", e);
  }
}

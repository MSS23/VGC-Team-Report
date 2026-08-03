import { PostHog } from "posthog-node";
import { after } from "next/server";

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
 * Serverless flush is handled automatically: `capture()` only enqueues, and on
 * serverless the function can freeze before the queue reaches PostHog. This
 * function schedules `flushServerEvents()` in `next/server`'s `after()` for you,
 * so every call site is covered without extra boilerplate. (Falls back silently
 * when invoked outside a request scope, e.g. scripts or tests.)
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const ph = getPostHogServer();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  // Serverless flush guarantee (finding 4.3): capture() only enqueues, and the
  // fire-and-forget flush can be cut short when the lambda freezes. Schedule a
  // flush in after() so the invocation stays alive until the network flush
  // resolves — after the response is sent, so it never blocks the request.
  try {
    after(() => flushServerEvents());
  } catch {
    // after() throws when called outside a request scope (scripts, tests).
    // capture() with flushAt:1 already attempts a flush there; nothing to do.
  }
}

/**
 * Flush any queued server-side events to PostHog. Intended to be run inside
 * `next/server`'s `after()` so the flush completes after the response is sent
 * without blocking it. Resolves (and never throws) if PostHog is unconfigured.
 */
async function flushServerEvents(): Promise<void> {
  const ph = getPostHogServer();
  if (!ph) return;
  try {
    await ph.flush();
  } catch (e) {
    console.warn("PostHog flush failed:", e);
  }
}

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

# PostHog Insights Pull

## Status: NOT AVAILABLE THIS RUN

`.env.local` is not present in this sandbox environment — no POSTHOG_API_KEY or POSTHOG_PROJECT_ID available.

Cannot fetch:
- $exception events
- $rageclick / $deadclick events
- Funnel drop-off data
- Top-visited routes

## Recommendation

Existing Linear tickets already capture historical PostHog signals (VGC-117 view-transitions, VGC-118 SW update, VGC-119 ChunkLoadError, VGC-110 test) — all closed.
Subagents should NOT pause for PostHog data this run; they should rely on static analysis + repo signals only.

If running locally with credentials, re-run with .env.local populated to enrich.

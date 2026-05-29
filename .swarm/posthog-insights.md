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
# PostHog Insights — 22 May 2026

**Status:** SKIPPED — `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not present in the swarm environment.

The container is a fresh clone without a populated `.env.local`, and the orchestrator runtime did not surface PostHog credentials. Per the orchestrator spec ("If credentials are missing or the API returns errors, log the failure to `.swarm/posthog-insights.md` and continue — do not abort the run."), the swarm proceeds without PostHog telemetry tonight.

**Downstream effect:** Wave 1 subagents R3, R5, C4, C5 will run without PostHog cross-referencing. Wave 2 ticket triage will not include `posthog-signal` elevation.

**Follow-up:** File a Linear ticket so future swarm runs can pull PostHog data — see Step 6 ticket-filing pass.

# PostHog Insights — 22 May 2026

**Status:** SKIPPED — `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not present in the swarm environment.

The container is a fresh clone without a populated `.env.local`, and the orchestrator runtime did not surface PostHog credentials. Per the orchestrator spec ("If credentials are missing or the API returns errors, log the failure to `.swarm/posthog-insights.md` and continue — do not abort the run."), the swarm proceeds without PostHog telemetry tonight.

**Downstream effect:** Wave 1 subagents R3, R5, C4, C5 will run without PostHog cross-referencing. Wave 2 ticket triage will not include `posthog-signal` elevation.

**Follow-up:** File a Linear ticket so future swarm runs can pull PostHog data — see Step 6 ticket-filing pass.

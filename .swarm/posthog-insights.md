# PostHog Insights — 2026-06-01

## Status: SKIPPED

`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not present in the swarm environment
(no `.env.local` mounted in the workspace). The PostHog API pull described in Step 1
of the orchestrator prompt cannot be executed, so this report is empty.

## Gap → human action

To enable PostHog-driven prioritisation on future runs, ensure the secrets exposed to
the overnight runner include:

- `POSTHOG_API_KEY` (Personal API key with `query` and `read` scopes)
- `POSTHOG_PROJECT_ID` (numeric project ID)

The runner will then pull top exception events, rage-click hotspots, funnel drop-offs,
and most-visited routes, and forward them as conflict-risk + priority signals to the
Wave 1 audits and Wave 2 ticket triage.

## Impact on this run

Wave 1 audits (R3, R5, C4, C5) will operate without PostHog cross-referencing. They are
instructed to flag anything they would otherwise validate against telemetry, so the
human can review whether the unverified suspicions look plausible.

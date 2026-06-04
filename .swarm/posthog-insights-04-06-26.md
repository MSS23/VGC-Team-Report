# PostHog Insights Pull — 2026-06-04

## Status: SKIPPED — credentials unavailable

`.env.local` is missing in this session container. `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not exposed via the process environment either.

Per the swarm protocol Step 1 fallback: log the failure and continue — do not abort the run.

## Impact on this run
- Wave 1 subagents R3, R5, C4, C5 will not receive PostHog cross-reference data.
- Step 6 PostHog-derived Linear ticket filing is skipped.
- Discord embed `PostHog signals acted on` field will read `N/A — credentials missing`.

## Persistent gap
Same issue logged across last several nightly runs (see .swarm/posthog-insights.md). Likely a container provisioning gap — `.env.local` is gitignored and not being injected into swarm containers.

## Recommendation for human
Restore `.env.local` in the swarm container, or surface `POSTHOG_API_KEY` + `POSTHOG_PROJECT_ID` via the runtime env.

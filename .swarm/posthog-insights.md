# PostHog Data Pull — 2026-06-06

## Status: SKIPPED — credentials unavailable

The remote execution environment does not have `POSTHOG_API_KEY` or `POSTHOG_PROJECT_ID`
exposed (no `.env.local` mounted into the container). The swarm cannot reach the PostHog
REST API for this run.

## Impact

- R3, R5, C4, C5 subagents will receive an empty signal from PostHog and rely on static
  analysis + Reddit/Twitter sentiment instead.
- Any tickets that would have been filed under the `posthog-signal` label are deferred.

## Recommendation for the human

Either:
1. Add `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` to the Codespace environment so future
   swarm runs can pull telemetry, OR
2. Schedule a one-off `npm run posthog:export` (if such a script exists) and commit the
   anonymised summary to a known location so the swarm can read it from disk.


# PostHog Insights — Swarm Run 13-05-26

## Status: CREDENTIALS NOT AVAILABLE

No `.env.local` file found in the repository. POSTHOG_API_KEY and POSTHOG_PROJECT_ID
are not accessible in this environment. PostHog API calls were skipped.

## Impact on Wave 1/2
- R3, R5, C4, C5 agents will work without PostHog data correlation.
- L0 triage will prioritise based on Linear ticket priority and labels.
- No PostHog-sourced bug tickets will be filed.
- No funnel/rage-click/error data is available for this run.

## Recommendation
Store POSTHOG_API_KEY and POSTHOG_PROJECT_ID in the GitHub Actions secrets or
Vercel environment so future swarm runs can pull this data automatically.

# PostHog Insights — 2026-06-02

## Status: SKIPPED — credentials unavailable

`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not present in this container's environment (no `.env.local` file mounted, no env vars exported). PostHog data pull skipped per spec ("If credentials are missing or the API returns errors, log the failure to `.swarm/posthog-insights.md` and continue — do not abort the run.").

## Implication

Wave 1 subagents R3, R5, C4, C5 will operate without PostHog cross-reference. They will still surface high-leverage findings from code analysis + web research.

## Recommended human action

If real-time PostHog signal-driven prioritization is desired for future swarm runs, ensure the remote execution environment template includes `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` as injected env vars (Vercel project env vars can be mirrored into the Claude Code environment via the environment configuration screen).

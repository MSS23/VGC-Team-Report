# PostHog Insights — 2026-06-08

## Status: UNAVAILABLE
`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not set in this fresh ephemeral container.

No insights pulled this run. All Wave 1 subagents that would normally cross-reference PostHog data fall back to static analysis only.

## Action required (human)
Restore `.env.local` (or set the relevant env vars in the swarm runner) so future nightly runs can pull:
- Top error events (`$exception`)
- Rage-click / dead-click events
- Funnel drop-offs
- Top routes by session count

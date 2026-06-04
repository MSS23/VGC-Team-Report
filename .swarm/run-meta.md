# Swarm Run Meta — 2026-06-04
- Branch: swarm-nightly-2026-06-04
- Source branch: main (1a30839)
- Constraints discovered:
  - .env.local MISSING → LINEAR_API_KEY, DISCORD_BUILDS_WEBHOOK, POSTHOG_API_KEY all unavailable
  - Linear MCP requires OAuth (user asleep) — cannot query/comment/file tickets
  - Discord webhook URL unavailable — will save payload to .swarm/discord-failed.md per protocol
  - PostHog API unreachable — .swarm/posthog-insights.md will document the failure
- GitHub MCP available → PR creation works
- WebSearch/WebFetch available → competitor/SEO research works

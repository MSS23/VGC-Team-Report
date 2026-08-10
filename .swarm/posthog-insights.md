# PostHog Data Pull — 2026-08-10 — SKIPPED (credentials absent)

`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not present in this swarm
container's environment, and the container's egress proxy blocks
`app.posthog.com` regardless (see below). Both the credential gap and the
egress gap are already tracked:

- **VGC-220** (P3) `[INFRA] Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in swarm container`
- **VGC-255** (P1) `[INFRA] Swarm container egress policy blocks every external data source`

Consequence for this run:
- No error-event, rage-click, funnel, top-route, or survey data was available.
- No `posthog-signal` tickets could be filed.
- R3 / R5 / C4 / C5 ran without the PostHog cross-reference they normally get.
- Ticket prioritisation fell back to Linear priority + age + static analysis.

## Egress verification (also blocks all Wave 1 web research)

Tested at run start, both via raw `curl` and via the WebFetch tool:

| Target | Result |
|---|---|
| `https://www.reddit.com/r/VGC.json` | blocked |
| `https://pikalytics.com` | blocked |
| `https://pokepaste.es` | blocked |
| `https://vgc-team-report.vercel.app` | blocked |
| `https://pokemonvgcteamreport.com` | blocked (`EGRESS_BLOCKED`) |

Only `registry.npmjs.org`, `api.linear.app`, `api.github.com` and
`discord.com` are reachable. This is why Wave 1 dropped the seven web-research
agents (R1-R5, R6-live, R7) this run — they would each have returned an empty
report while consuming a dispatch slot. Those slots were reallocated to Wave 2
ticket implementation, which serves GOAL A directly.

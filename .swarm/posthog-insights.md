# PostHog pull — run 2026-11-23: NOT AVAILABLE

`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are both unset in this container.
Per CLAUDE.md, a missing integration is skipped for the whole run and not retried.

No PostHog data was pulled, so this run acted on **no** PostHog signal:
no error-event tickets, no rage-click tickets, no funnel-drop-off prioritisation.
Already ticketed as **VGC-220** (`[INFRA] Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL
in swarm container`), so no duplicate was filed.

Also unavailable, same reason: `VERCEL_TOKEN` (so no Vercel MCP env-var check and no
webhook invocation logs — see `.swarm/webhook-investigation.md`).
Available this run: `LINEAR_API_KEY` ✅, `DISCORD_BUILDS_WEBHOOK` ✅, `GITHUB_TOKEN` ✅.

# Swarm Run Meta

- Date: 2026-06-05 (UK)
- Branch: swarm-nightly-2026-06-05
- Branch existed before run: no
- Existing PR for this branch: none
- Started: $(date)

## Credentials availability
- Linear API: UNAVAILABLE (no .env.local, no env var, MCP requires interactive OAuth)
- Discord webhook: UNAVAILABLE (no DISCORD_BUILDS_WEBHOOK in env)
- PostHog API: UNAVAILABLE (no POSTHOG_API_KEY in env)
- GitHub MCP: AVAILABLE (used for repo ops)
- Vercel MCP: not loaded (will check via ToolSearch as needed)

## Adaptation
- Linear ticket triage delegated to research-driven feature work (no live board read)
- Linear ticket comments/creation queued to .swarm/linear-pending.md for human action
- Discord notification will fall through to .swarm/discord-failed.md
- PostHog signal cross-referencing skipped — no live data

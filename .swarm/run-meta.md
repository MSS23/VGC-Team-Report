# Swarm Run Meta — 2026-06-01

- Branch: `swarm-nightly-2026-06-01`
- Cut from: `origin/main` at SHA `1a30839` (Merge swarm-nightly PRs #48/#49 + repair corrupted main)
- Branch creation time (UK): 2026-06-01
- Existing remote branch: NO (fresh)
- Existing open PR for this branch: NO
- Operator: Claude (overnight swarm orchestrator)

## Step 0B sync state
- Behind origin/main: 0
- Ahead origin/main: 0
- Conflicts resolved during pre-flight: NONE
- Conflict-risk file list size: 175 (last 7 days on main)

## Environment constraints (recorded up-front)
- `.env.local` NOT present in workspace → `LINEAR_API_KEY`, `DISCORD_BUILDS_WEBHOOK`, `POSTHOG_API_KEY` unavailable to shell scripts.
- Linear MCP requires OAuth flow — cannot complete unattended overnight. Linear comments/state transitions cannot be performed from this run; new-ticket filings will be saved as drafts under `.swarm/drafts/linear-tickets-to-file.md` for the human.
- Discord webhook URL not present in env → notification will be saved to `.swarm/discord-failed.md` for the human to dispatch manually.
- PostHog credentials not in env → PostHog insight pull skipped, `.swarm/posthog-insights.md` records the skip and explains the gap.
- GitHub MCP available (scoped to `mss23/vgc-team-report`) — PR creation goes through it.

These constraints are documented in the PR body so the human knows what to verify and what to action.

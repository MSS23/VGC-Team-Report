# Swarm run — 03 Aug 2026

## Branch
- **Designated branch (harness-mandated): `claude/loving-sagan-t7immy`**
- The stored routine specifies `swarm-nightly-YYYY-MM-DD`. This session's harness
  instruction explicitly designates `claude/loving-sagan-t7immy` and forbids pushing
  to any other branch. The harness (session-level, more specific) wins. Both satisfy
  the hard guardrail: NEVER push to main.
- REMOTE_EXISTS = 1 (origin/claude/loving-sagan-t7immy exists, 0 commits ahead of main)
  → **published history: merge-only, never rebase, never force-push.**
- HEAD == origin/main at run start (0 ahead / 0 behind). Clean tree.

## Integration preflight
- ✅ LINEAR_API_KEY present (Linear GraphQL API via .claude/scripts/linear.sh)
- ✅ DISCORD_BUILDS_WEBHOOK present
- ❌ Linear MCP server: requires OAuth, non-interactive session → using REST/GraphQL instead
- ❌ POSTHOG_API_KEY / POSTHOG_PROJECT_ID: NOT SET in container → PostHog pull SKIPPED
      for the whole run (per CLAUDE.md: do not retry missing integrations).
      Already tracked by VGC-220.
- ❌ `gh` CLI not installed → PR creation via GitHub MCP tools.
- ❌ Vercel MCP not connected → env-var inspection not possible this run.

## Board snapshot at run start
85 open issues: 65 Backlog, 13 Todo, 6 In Review, 1 Duplicate.

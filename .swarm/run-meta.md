# Swarm run meta — 14 Sep 2026

## Branch decision (DEVIATION — read this)
The stored swarm prompt specifies `swarm-nightly-$(date +%Y-%m-%d)`.
The session harness designates `claude/loving-sagan-8ryraw` and states pushing
elsewhere is forbidden without explicit permission.

Resolved in favour of the harness branch. Justification:
- Every prior nightly run in this repo used the `claude/loving-sagan-*` pattern
  (PRs #72, #74, #75, #76, #77) — the harness branch IS the established convention.
- The 24 `swarm-nightly-*` refs on origin are older/abandoned.
- Both satisfy the real guardrail: never push to `main`.

BRANCH=claude/loving-sagan-8ryraw
REMOTE_EXISTS=1 (harness-created; history published -> MERGE ONLY, never rebase)
Base: exactly at origin/main (ahead 0, behind 0) at run start.

## Preflight
- Linear API (GraphQL, direct): OK — viewer resolves to Manraj Sidhu
- Linear MCP: UNAVAILABLE (needs OAuth, non-interactive session) -> using direct API
- Discord webhook: OK — resolves to channel 1487202217298493493 "VGC Team Report Build"
- PostHog: POSTHOG_API_KEY / POSTHOG_PROJECT_ID MISSING -> Step 1 data pull SKIPPED for whole run
- Vercel MCP / VERCEL_TOKEN: UNAVAILABLE -> cannot read env vars or invocation logs
- GITHUB_TOKEN is a proxy placeholder; GitHub ops go through MCP tools (no gh CLI)
- Baseline gate at run start: tsc PASS, next build PASS

## Board state at run start (108 open issues)
- In Review: 32   <- STALE, from 5 unmerged draft PRs
- Backlog:   62   (46 auto-research, 24 no-claude)
- Todo:      13
- Bugs outside In Review: 0
- In Progress: 0

## Systemic finding
5 open draft PRs (#72, #74, #75, #76, #77) dating back to 03-08-26 are unmerged.
The 32 In Review tickets belong to them. The board is not stalled on implementation
throughput — it is stalled on the human merge step. Surfaced in PR body + Discord.

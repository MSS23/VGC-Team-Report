# Linear MCP Status — 2026-06-02

## Status: REQUIRES AUTHENTICATION

The Linear MCP server requires `mcp__Linear__authenticate` + `mcp__Linear__complete_authentication` before any data access. This is an OAuth-style flow that requires user interaction (browser redirect) — not feasible in an unattended overnight swarm run.

The `.claude/scripts/linear.sh` helper script reads `LINEAR_API_KEY` from `.env.local`, which is not present in this remote-execution container.

## Implication

This run cannot:
- Query the Linear board for In Progress / Backlog tickets (L0 Wave 2 triage skipped)
- Comment on tickets with PR URL and commit SHAs
- Move tickets to In Review / Done
- File new Backlog tickets from research findings

## Recommended human action

1. After merging this PR, manually file the high-leverage research findings as Backlog tickets — see `.swarm/research-synthesis.md` for the candidates list.
2. To enable Linear-driven future runs, mount `LINEAR_API_KEY` into the remote-execution environment (Settings → Environment → Add env var) so `.claude/scripts/linear.sh` can read it.

## Adjustment to swarm plan

Wave 2 will skip L0 (Linear triage) and use all remaining budget on feature/code-quality implementations identified by Wave 1 research. Updates page will still be updated. Linear ticket updates will be deferred to human action and clearly surfaced in PR body.

# Swarm Run Meta — 2026-09-07

## Branch decision (DEVIATION from the stored prompt — read this first)
- Stored prompt asked for a fresh `swarm-nightly-2026-09-07` branch.
- The session harness explicitly designates `claude/loving-sagan-12996k` and states
  "NEVER push to a different branch without explicit permission". Harness instruction
  is system-controlled and wins.
- **Branch used: `claude/loving-sagan-12996k`** — verified identical to `origin/main`
  (0 ahead / 0 behind) at run start, so it is an equivalent clean cut from main.
- Every substantive guardrail still holds: no push to main, one draft PR, human merges.
- Additional justification: origin already carries **24 unmerged `swarm-nightly-*`
  branches**. Creating a 25th would compound VGC-265, the P1 process ticket that says
  the board is stuck precisely because nightly branches never get merged.

## Preflight
- Base commit: 70c4633 (== origin/main)
- Run start (UK): 2026-09-07 00:08 BST
- History mode: branch already published on origin → **merge only, never rebase, never force-push**

## Credentials / integrations
- LINEAR_API_KEY: present. Linear MCP server is UNAUTHENTICATED in this headless
  session (needs interactive OAuth) → using GraphQL via `.claude/scripts/linear.sh`,
  the established fallback from prior runs.
- DISCORD_BUILDS_WEBHOOK: present.
- POSTHOG_API_KEY / POSTHOG_PROJECT_ID: **MISSING** → PostHog pull skipped for the whole
  run per CLAUDE.md ("skip it for the whole run and say so — do not retry"). Tracked by VGC-220.
- VERCEL_TOKEN / Vercel MCP: not available → Vercel env-var + log checks skipped.
- gh CLI: NOT installed → GitHub ops go through the GitHub MCP server.

## Network reality (updates VGC-255)
- Container `curl` to any external host: **BLOCKED** (000 on reddit/pikalytics/google/live site).
- Server-side `WebSearch` / `WebFetch` tools: **WORKING** — they do not traverse the
  container egress path. Research is therefore viable, but agents must use the tools,
  never curl. VGC-255 should be narrowed to "container egress" rather than "every
  external data source".

## Baseline gate (before any change)
- `npm run typecheck` (tsc --noEmit --incremental false): PASS
- `npm run build`: PASS
- `npm test`: 417/417 PASS on re-run. First run showed 1 failure in the draft-restore
  localStorage test — **flaky** (`vi.waitFor` race), not a real regression. Ticket filed.

## Webhook health (Step 0C)
- CLAUDE.md states the Linear-webhook P0 is stale and merged on main since May; VGC-222
  and VGC-213 corroborate. Doing a static audit only, not a re-investigation.

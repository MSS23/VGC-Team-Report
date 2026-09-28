# Swarm run meta — 28 Sep 2026

## Branch
- Branch: `claude/loving-sagan-c7sclx`
- REMOTE_EXISTS at start: 0 (fresh, not on origin) — cut from `origin/main` @ 70c4633
- AHEAD=0 BEHIND=0 vs origin/main at start
- **Naming deviation (deliberate):** the scheduled prompt specifies
  `swarm-nightly-YYYY-MM-DD`, but this session's harness config designates
  `claude/loving-sagan-c7sclx` and forbids pushing elsewhere. All 7 existing open
  swarm PRs (#72-#79) also use `claude/loving-sagan-*`, so this name matches the
  established precedent. Functional requirements are unchanged: one fresh branch
  off main, never main, one draft PR.

## Integration availability (preflight)
- LINEAR_API_KEY: PRESENT -> Linear ops via direct GraphQL (Linear MCP needs OAuth, unavailable)
- DISCORD_BUILDS_WEBHOOK: PRESENT -> Discord notify available
- POSTHOG_API_KEY / POSTHOG_PROJECT_ID: **MISSING** -> all PostHog steps SKIPPED for whole run
- VERCEL_TOKEN / Vercel MCP: **MISSING/absent** -> cannot read prod env vars or invocation logs
- gh CLI: absent -> PR via GitHub MCP

## Baseline gate (green before any change)
- tsc --noEmit --incremental false: PASS (16s)
- npm run build: PASS (42s)
- vitest: PASS (41 files / 417 tests)

## HEADLINE FINDING: merge backlog, not implementation backlog
7 open DRAFT swarm PRs, none merged:
#72 (03-08), #74 (17-08), #75 (24-08), #76 (31-08), #77 (07-09), #78 (14-09), #79 (21-09)
- 200 distinct source files changed across them
- `src/app/changelog/data.ts` is touched by ALL SEVEN -> they already conflict with each other
- 32 Linear tickets sit In Review because their code is in these unmerged PRs
=> Tonight's run keeps its diff deliberately small and avoids the 200-file
   overlap set where possible, so it is reviewable rather than adding to the pile.

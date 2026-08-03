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

## Wall clock
- Run start ~00:10 BST, 03 Aug 2026.
- Wave 1 (8 agents) dispatched 00:20; Wave 2 rolling from 00:35.

## Dispatch ledger (cap 25)
| # | Agent | Kind |
|---|-------|------|
| 1 | C1 dead code | audit |
| 2 | C2 TypeScript strictness | audit |
| 3 | C3 bundle/perf | audit |
| 4 | C4 security | audit |
| 5 | C5 commit review | audit |
| 6 | R1 competitors + community | research |
| 7 | R6 SEO | research |
| 8 | R8 accessibility | research |
| 9 | VGC-251 Champions SP | impl (bug, P1) |
| 10 | VGC-245 Modes persistence | impl (bug, P1) |
| 11 | VGC-181 Indy top-cut data | impl |
| 12 | VGC-224 Cypress types | impl |
| 13 | VGC-187 PWA screenshots | impl |
| 14 | SWARM-CONSENT (GDPR regression) | impl |
| 15 | SWARM-DEADCODE | impl |
| 16 | SWARM-BUNDLE-MOVENAMES | impl |
| 17 | SWARM-SECURITY | impl |
| 18 | SWARM-SEO | impl |
| 19 | SWARM-A11Y | impl |
Remaining budget: 6.

## Deferred for file overlap (per the file-overlap control rule)
- **VGC-162** (root `page.tsx` Server Component refactor) — `src/app/page.tsx` is owned by the
  VGC-245 P1 bug fix. Also **partly refuted by C3**: `page.tsx` cannot be a Server Component
  (`useState`/`useHomePage`/8 `dynamic()` calls) and its static content is 930 bytes, so the
  ticket's "~200KB" estimate is wrong by two orders of magnitude. Recommend retitling the ticket
  around C3's real wins (zod 223.9 kB, dex-subset 330.3 kB, move-names 111.1 kB).
- **C3 win #1 (lazy-load zod out of the client bundle, 223.9 kB raw / 50.4 kB gz)** — `url-codec.ts`
  is central to the VGC-245 fix (which unifies the duplicated share schema). Sequencing a bundle
  refactor on top of an in-flight P1 schema change would risk the bug fix. Filed as a ticket instead.

## Research degradation to flag
R1 reports the container proxy blocked **all competitor domains and Reddit**, so community-sentiment
research (R1 Part B, and the R3/R4/R5/R7 agent types generally) cannot gather primary evidence in this
environment. Combined with the missing PostHog credentials, the swarm currently has **no working
channel to real user signal** — it can only read the codebase. Worth a ticket alongside VGC-220.

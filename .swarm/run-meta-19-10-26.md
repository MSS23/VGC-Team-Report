# Nightly swarm run — 19 Oct 2026

## Branch

`claude/loving-sagan-tv9kmf` (harness-designated).

**Deviation from the routine prompt, stated plainly:** the prompt asks for
`swarm-nightly-$(date +%Y-%m-%d)`. This session's harness configuration instead
designates `claude/loving-sagan-tv9kmf` and states "NEVER push to a different
branch without explicit permission". All ten currently-open swarm PRs (#72–#82)
were likewise raised from `claude/loving-sagan-*` branches, so the designated
branch is both harness-compliant and consistent with every prior run. The
substantive guarantees the prompt cares about are unchanged: one fresh branch cut
from `main` for this run, zero pushes to `main`, no force-push, one draft PR.

- `REMOTE_EXISTS` = 1 (branch already on origin, created at parity with `main`)
- At run start: 0 commits ahead, 0 commits behind `origin/main` — a clean cut.
- History is published ⇒ **merge-only mode**, no rebase, no force-push.
- Open PR for this branch at run start: none.

## Verified baseline on `origin/main` (before any change)

Measured in an isolated git worktree so it could not be polluted by in-flight
agent edits:

| Gate | Result |
|---|---|
| `tsc --noEmit --incremental false` | clean (exit 0) |
| `vitest run` | 60 files, 501 tests, all pass |
| `next build` | exit 0 |

So `main` is green, and `next build` *does* run in this container without
production secrets. Any gate failure later in this run is therefore attributable
to this run's changes, not to pre-existing breakage.

## Integrations available

| Integration | Status |
|---|---|
| Linear | ✅ via `LINEAR_API_KEY` + GraphQL. (The Linear **MCP server** is unauthenticated and unusable; the REST/GraphQL API key works, so Linear ops proceed.) |
| Discord #builds | ✅ `DISCORD_BUILDS_WEBHOOK` present |
| GitHub | ✅ via `gh api` REST. **GraphQL is blocked** in this environment, so `gh pr list` / `gh pr create` fail; REST + the GitHub MCP tools are used instead. |
| PostHog | ❌ `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` absent (this is exactly ticket VGC-220). No PostHog data this run — Step 1's PostHog pull and every "PostHog signal" downstream is skipped, not faked. |
| Vercel MCP | ❌ not available. Env-var and deployment-log checks in Step 0C(3)/(4) could not be performed. |
| External research domains | ❌ egress-blocked (ticket VGC-255). WebSearch works; WebFetch to competitor/community domains 403s. |
| `.claude/agents/` | ❌ empty — `verification-gate`, `ui-checklist-reviewer`, `linear-discord-updater` do not exist in this container. Their duties were performed inline (central build gate) or by `general-purpose` agents. |

## Board state at run start

124 open issues: **70 Backlog, 52 In Review, 1 Todo, 1 Duplicate — and 0 In Progress.**

The routine's Linear-first instruction assumes In-Progress work to drain. There is
none. The board's actual blockage is at the other end: **52 tickets sit In Review
behind 10 unmerged draft PRs**, the oldest open since 3 Aug 2026. This is ticket
VGC-265 (P1), filed by the swarm itself.

## Deliberate deviation on Wave 1 sizing

The routine asks for ~13 Wave-1 research agents. I ran 6 focused audits instead:

- `.swarm/` already holds **five or more near-identical copies** of every research
  report (r1 Pikalytics teardown ×4, r5 mobile UX ×5, r6 SEO ×8, r8 a11y ×8, …).
  A sixth copy has no reader and no value.
- The external sources those agents exist to read are egress-blocked (VGC-255), so
  R1–R5/R7 would have produced the same low-confidence output prior runs logged.
- PostHog is unavailable, so R3/R5/C4/C5's "cross-reference with PostHog" input
  does not exist.

Budget went to implementation (Goal A) plus a board-vs-`main` reconciliation —
which drains tickets at zero code risk and directly attacks VGC-265.

## Conflict-risk intelligence (files touched by the 10 open PRs)

Derived from the actual changed-file sets of PRs #72–#82:

| Open PRs touching it | File |
|---|---|
| **10 / 10** | `src/app/changelog/data.ts` ← the Updates page |
| 8 | `src/components/report/SpeedTierChart.tsx` |
| 6 | `src/components/input/PasteInput.tsx` |
| 5 | `champions-legality.ts`, `PokemonDetailSlide.tsx`, `MatchupPlanSlide.tsx`, `CompareContent.tsx`, `api/team-graphic/route.tsx`, `public/llms-full.txt` |
| 4 | `useHomePage.ts`, `TeamOverview.tsx`, `PokemonCard.tsx`, `Navbar.tsx`, `ExploreContent.tsx`, `app/page.tsx`, `public/llms.txt`, `package.json` |

**The mandated Updates-page append is itself the single biggest conflict
generator in this repo** — every one of the 10 open PRs edits
`src/app/changelog/data.ts`, each prepending a new entry at the same spot. Ticket
selection this run deliberately avoided the rest of that hot list.


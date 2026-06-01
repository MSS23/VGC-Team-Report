# Research Synthesis — Swarm Run 01-06-26

Wave 1 dispatched 8 agents (Wave 1 used 8/25 budget). All returned.

## Wave 1 results summary

| Agent | Focus | Status | Highlight |
| --- | --- | --- | --- |
| C1 | Dead code | ✅ | 1 orphan: `src/components/providers/ConsentGate.tsx` (37 LOC, zero imports) |
| C2 | TS strictness | ✅ | 12 findings; top 3 = `as unknown as T` in Clerk webhook + `z.unknown()` on /api/share + missing `Promise<NextResponse>` return types |
| C3 | Bundle / perf | ✅ | 5 wins; biggest = Sentry replays (~97KB) + dex-subset.json deduplication (~340KB) + ClarityProvider lazy-load (~30-60KB) |
| C4 | Security | ✅ | No P0; top finding = `/api/share/[id]/collaborators` GET missing rate-limit guard |
| C5 | Recent commits | ✅ | Last 20 commits clean — `1a30839` actually repaired a real corruption. New ticket: tests for share/webhook/keep-alive routes (none have coverage) |
| R1 | Pikalytics + PokePaste teardown | ✅ | Wedge = Team Report narrative (matchup matrix, EV justifications, win conditions). OG card + PokePaste import + structured editor = top 3 ideas |
| R6 | SEO | ✅ | Top wins = rewrite root title to "Free VGC Team Builder, Damage Calcs & Speed Tiers (2026)"; ship /speed-tiers + /guides/how-to-write-a-vgc-team-report |
| R8 | Accessibility | ✅ | 12 findings; top = ShareModal errors lack role="alert"; FeedbackContent type buttons are colour-only |

## Top 5 highest-leverage opportunities (tonight's wave 2 targets)

1. **C3 #3 — Move `dex-subset.json` to server-only** (~340KB off 5 top routes). Largest single bundle win available.
2. **C3 #1 — Disable Sentry session replays** (~97KB off every route). One config edit, no functional impact.
3. **R6 #1+5 — Front-load "Free VGC Team Builder" head terms in root `layout.tsx` + expand WebApplication featureList**. Single-file SEO win, every page inherits.
4. **R6 #2 — Ship `/guides/how-to-write-a-vgc-team-report`**. Pure content, reuses existing HowTo JSON-LD; targets the highest informational-intent gap (Victory Road / vgcwithhats own this today).
5. **R1 #1 — Dynamic OG card for shared reports**. Universal sharing lift; both competitors fail at link unfurls. (Too big for tonight — file as Backlog ticket, prepare scoping doc instead.)

## Top 5 quick-win bugs / issues (low conflict risk, < 1hr each)

1. **C1 — Delete `ConsentGate.tsx`** (37 LOC, zero imports).
2. **C4 #1 — Add `apiGuard` to `/api/share/[id]/collaborators` GET**.
3. **R6 bonus — Dedupe `/compare` in sitemap and add `lastModified` to Mega champion URLs**.
4. **C4 #4 — `src/app/api/webhooks/linear/route.ts:68` bare `catch{}` swallows errors silently — add `console.error`** (extend to posthog + clerk webhooks).
5. **R8 — ShareModal validation errors need `role="alert" aria-live="assertive"`**; FeedbackContent type buttons need visible text labels.

## High-conflict-risk files (from `.swarm/main-changed-files.md`)

Per Wave 1 reports, the following are both worth changing AND on the conflict list — handle carefully or split into separate commits:

- `src/app/layout.tsx` (R6 #1, R6 #5)
- `src/components/ui/ShareModal.tsx` (R8 #1, R8 #11)
- `src/components/layout/Navbar.tsx` (C3 #4, R8 #9 — DEFERRED, too risky for parallel work)
- `src/app/api/webhooks/clerk/route.ts` (C2 #3 — DEFERRED, too risky)
- `src/app/api/share/route.ts` (C2 #9 — DEFERRED, too risky)
- `src/app/sitemap.ts` (R6 bonus)
- `src/app/feedback/FeedbackContent.tsx` (R8 #8)
- `src/app/api/webhooks/linear/route.ts` (C4 #4)

These files have all been touched in the last 7 days on main, so any change risks an inbound conflict at PR merge. Each is assigned to **exactly one** Wave 2 agent and confined to a single commit to keep the diff reviewable and revertable.

## Blockers / gaps

- **PostHog data:** skipped (no creds in env, see `.swarm/posthog-insights.md`). Could not cross-reference C5/C4 findings with live error events.
- **Linear MCP:** OAuth flow can't complete unattended. Tickets to file are drafted under `.swarm/drafts/linear-tickets-to-file.md`; human triages on waking.
- **Discord webhook URL:** not in env; final notification payload will be saved to `.swarm/discord-failed-01-06-26.md`.
- **Vercel MCP:** not exposed to this run — webhook env-var verification stays with the human.

## Wave 2 budget

- Used in Wave 1: 8
- Remaining: 17
- Planned for Wave 2: 10 implementation agents (8 changes + 2 net-new pages)
- Reserve: 7 (for retries or extra work if budget allows)

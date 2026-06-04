# Research Synthesis — 2026-06-04

## Top 5 highest-leverage opportunities (across all Wave 1 reports)

1. **Showdown-format paste import with a transparent linter and round-trip export** (R3 r/VGC #1 gripe; R1 PokePaste weakness). Beat PokePaste at its own primitive — currently the most-cited gap on Reddit. The import box should name the offending Pokémon and line on parse failure, and round-trip exports must preserve blank-line semantics (pin with a unit test).

2. **Searchable team archive by Pokémon × regulation × placement** (R3, R2 VGCpastes gap). Every Monday after a regional, r/VGC asks "any Reg I Calyrex-Shadow top-16 team?" and no tool answers cleanly. We have the data — needs Postgres indices on `regulation`/`placement`/`pokemon[]` plus a `/teams?reg=…&mon=…&placement_lt=…` route and filter UI.

3. **Rewrite the home-page H1 + first 100 words for AI citation** (R7). Current H1 "VGC Team / Report" + "Build, share, and explore" gives LLMs nothing distinctive to attach to. Replace with an entity-defining 78-char H1 and benefit-dense subtitle naming Reg M-A, Mega, and Showdown support. Pair with an SSR'd `<HomeIntro />` prose section so the FAQPage + HowTo JSON-LD have matching visible body text.

4. **Showdown replica codes alongside the existing paste on every team page** (R2 VGCpastes feature, easy to ship). One-click "Copy Showdown" button next to the existing copy-paste action. Highest-leverage micro-feature.

5. **Top Teams Gallery with one-click fork** (R1). Trending/curated tournament teams plus a "fork into my builder" button turns passive viewers into creators. Pure flywheel.

## Top 5 quick-win bugs / issues actionable tonight

(✅ items below were SHIPPED in this run; ⏳ items are filed/drafted for the next pass)

- ✅ Duplicate `/compare` entry in sitemap — landed `swarm: SEO …` commit.
- ✅ /compare contradictory robots `{ index: false, follow: true }` — landed.
- ✅ Missing BreadcrumbList JSON-LD on /compare /feedback /privacy /terms — landed.
- ✅ /api/share/[id] sequential collaborator + fork lookups — landed Promise.all parallelization.
- ✅ /api/explore separate fork query outside the existing Promise.all batch — landed.
- ✅ Dead-code: orphan ConsentGate component — deleted.

## Blockers for Wave 2

- **Linear MCP requires OAuth** — user asleep; cannot query the board, comment on tickets, or file new tickets. All ticket-driven work skipped tonight; would-be tickets are saved as drafts under `.swarm/drafts/linear-tickets-04-06-26.md` for filing on the next run.
- **`.env.local` missing** in this container — no `LINEAR_API_KEY`, `DISCORD_BUILDS_WEBHOOK`, `POSTHOG_API_KEY`. Persistent gap across multiple recent runs (see `.swarm/discord-failed-*.md`).
- **Vercel webhook env-var** — the Linear webhook handler code is correct (verified in Step 0C: raw body, HMAC-SHA256, timingSafeEqual, force-dynamic, empty-body ping handled, both `LINEAR_WEBHOOK_SIGNING_SECRET` and legacy `LINEAR_WEBHOOK_SECRET` accepted). Repeated nightly fixes have all landed on main (see 1a30839 merge commit). If Linear is still reporting delivery failures, the root cause is env-var configuration on Vercel — human must verify the secret in Vercel Production matches the secret configured in Linear's webhook settings. Cannot be fixed from inside the swarm.

## High-conflict-risk files flagged by C1–C5

Cross-referenced against `.swarm/main-changed-files.md`:

- `src/app/api/webhooks/linear/route.ts` — recent on main, C4 audit notes it as a touchpoint. **Avoided this run.**
- `src/components/explore/ExploreFilters.tsx` — C3 perf agent flagged (motion lazy-load opportunity, 60KB) but the file was touched 3x on main in the last 7 days. **Deferred to next run.**
- `src/components/report/SpeedTierChart.tsx` — C3 flagged POKEMON_DATA defer (150-200KB savings). Recently touched. **Deferred.**

## R8 Accessibility — deferred but ready

10 a11y findings logged in `.swarm/r8-accessibility-04-06-26.md`. NotificationBell `aria-modal` and DisplayTogglePill `aria-modal` are NON-modal popovers (don't trap focus / don't block background) so the literal R8 suggestion is incorrect — what those need is either focus trap + aria-modal=true OR explicit role="menu". Recommend a follow-up audit pass before shipping a blanket change.

## R4 / R5 — skipped tonight

Twitter/X sentiment (R4) and mobile UX patterns from Strava/Pinterest (R5) were not dispatched this run. Budget was reallocated to higher-confidence code-quality audits since Linear access is unavailable and outreach drafts are lower ROI tonight.

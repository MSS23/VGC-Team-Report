# Research synthesis — swarm 26-10-26

Source reports: `l0-bug-verification`, `c1-dead-code`, `c2-typescript`, `c3-perf`,
`c4-security`, `c5-commit-review`, `r6-seo`, `r7-aeo`, `r8-accessibility`,
`r-competitors`, `r-ux-sentiment` (all `-26-10-26.md`).

## The headline finding: the board was lying in both directions

L0-VERIFY checked all 10 open Bug tickets against `main` instead of trusting their
Linear state. Linear "In Review" turned out to predict **neither** outcome:

- **6 of 10 are already fixed on main** and should simply be closed — VGC-251, 243,
  242, 245, 267, 260. Several carry regression tests literally named after the bug
  (`speed-tier-form.test.ts` names Floette; `version-diff.test.ts:75` is a
  `describe("VGC-260")`; `useAutoDraft.ts:96` carries a `(VGC-267)` comment).
- **VGC-294 was still broken on main despite being In Review** — the orchestrator
  verified this independently.

This is the condition VGC-265 describes ("~30 unmerged nightly branches and 10
tickets stuck In Review — the swarm is re-fixing already-fixed bugs"), but the
diagnosis in that ticket is half right: the risk is not only wasted re-fixing, it is
also *skipped real bugs*. Only per-ticket verification against `main` distinguishes
them. **Recommendation: verification should be a standing first step of every run.**

Separately, two more tickets are stale on their facts:
- **VGC-289** ("Reg M-C is the live format and is entirely unsupported") — M-C is
  fully shipped: `tags.ts` lists `"Reg M-C"`, `getRegMCMegasWithSprites()` exists,
  `champions-legality.ts:140` takes the regulation. Close it.
- **VGC-300** (4 high-severity advisories) — all four are now unflagged at any
  severity. Close it, but open its replacement (see quick win 1).

## Top 5 highest-leverage opportunities

1. **The homepage and navbar server-render nothing.** `useSearchParams` inside
   `<Suspense>` means `.next/server/app/index.html` ships 0 links, no `<h1>`, and a
   body of `Loading team builder...` (R6 #3; R7 measured 91 chars of body text). The
   navbar is absent from all 95 prerendered pages. Compounding it, the homepage still
   emits `FAQPage` + `HowTo` JSON-LD for Q&A that **is not in the HTML** — a
   structured-data mismatch Google can penalise. The site allow-lists GPTBot,
   ClaudeBot and PerplexityBot (R7 verified robots.txt is correct), then serves them
   a blank page. This gates the entire crawlable link graph.
2. **`/s/[id]` — the share route, this product's main acquisition channel — is a
   client-side redirect shell** to `/?s=…`, which canonicals to `/`. ~5,000 sitemapped
   URLs with no crawlable content (R6 #4), and a recipient on a cold mobile open sees
   a spinner with a 15s abort for "Neon cold start" (R-UX #1). Server-rendering this
   one route is the single biggest shared-link improvement available.
3. **Dark mode fails WCAG AA at the primary CTA.** Every `bg-accent text-white` pair
   sits at **1.40–1.89:1** in dark mode across 67 instances, including the main paste
   CTA and the skip link (R8 BLOCKER #1); light mode also fails for 7 of 9 themes.
   Underneath it, `globals.css` declares no `@custom-variant dark`, so Tailwind v4's
   `dark:` tracks `prefers-color-scheme` while the app themes on `[data-dark-mode]` —
   132 utilities desync on any manual toggle (R8 BLOCKER #2).
4. **83 KB gzip is recoverable from one file.** `/compare` statically imports
   `dex-subset.json` (33.1 KB gz), `pokemon.ts` (38.1) and `mega-pokemon.ts` (12.0)
   into the **client** bundle via `CompareContent.tsx` (C3 #1, verified from chunk
   strings carrying `generatedAt:2026-08-10`). The homepage already solved this in
   v5.26; the same pattern applies, plus adding `/compare` to the existing tripwire
   test. Also `@pkmn/dex` (52 MB) is a `dependency` but only `scripts/build-dex-subset.mjs`
   imports it — moving it to `devDependencies` cuts 52 MB from every Vercel install.
5. **Positioning: the frictionless path self-destructs and the permanent path demands
   signup.** `/api/share` requires auth for all writes, while `/api/quick-share`
   expires in 30 days (R-COMP #1) — so a first-time visitor can have a permanent
   report only by signing up, and our OG/oEmbed artifact (the thing that actually
   beats PokePaste) is attached to the path that dies. Anonymous-permanent reports
   with claim-later is the highest-leverage product change found tonight. **Gate it on
   Neon storage** — the 512 MB free tier previously had `share_versions` consume 447 MB.

## Top 5 quick wins

1. **`zod@4.3.6` is the one production-reachable high-severity advisory**
   (GHSA-mrhx-c7xc-m3w5, CVSS 7.5), reachable through `/api/share`'s uncapped
   `z.array`/`z.record` (C4). VGC-300 misses it entirely.
2. **`llms-full.txt` teaches AI assistants the wrong Stat Points maths** — still says
   "1 SP = 1 EV, interchangeable", the exact VGC-266 myth. It survived because the
   drift test only pins `llms.txt` (R7). Both files are also orphaned (absent from
   sitemap, `<head>` and footer) and stamped `Updated: 2026-05-23`.
3. **A paste can crash the renderer.** `dex-subset.json` ships MissingNo. with type
   `"Bird"`, which is not a `PokemonType`; the unchecked cast at
   `pkmn-dex-fallback.ts:82` carries it to `TYPE_COLORS["Bird"].bg` and throws (C2 #1).
   Root cause: the 18 `PokemonType` members are hand-duplicated in **8 places**.
4. **Mobile visitors to a shared report get only a sign-in wall.** The no-auth
   "Build Your Own" link is `hidden sm:inline-flex` (`Navbar.tsx:597`), so the sole
   mobile CTA is `ShareViewCTA`'s Duplicate → Clerk modal (R-UX #3). Worst possible
   place to lose a first-time visitor.
5. **The newest commit on main doubled sprite requests.** `PokemonSprite` defaults
   `animated = true`, so 30 of 32 call sites fetch a PNG *and* a full GIF — including
   18–30px row icons — and the error guard reads a stale value, which can strand a
   permanently broken image instead of falling back (C5 #2, #3). Matters most on phone
   data at an event, which is this app's core scenario.

Runners-up: `/api/oembed` works but no page advertises it (zero `json+oembed` in
`src/`); 81 mega page titles render at 74–77 chars because the root `%s | VGC Team
Report` template adds 19 to a budget a code comment claims is "under ~60";
`/tournaments` has zero inbound links; `/tools/ev-to-sp` still says "Regulation M-A".

## Blockers — work that could NOT be done, and why

- **VGC-181 (Indianapolis top cut) is hard-blocked.** Every tournament source 403s at
  the proxy CONNECT (`play.limitlesstcg.com`, `victoryroadvgc.com`), reproducing the
  same denials recorded in May. Fabricating player names would be strictly worse than
  the honest "TBD" already shipped. Mitigating: the table is already labelled "Sample"
  / "representative archetypes", so the trust risk is lower than the ticket implies —
  but `ChampionsContent.tsx:342` still promises results "once the tournament
  concludes", which has been false since 31 May 2026.
- **VGC-295's SQL half** is gated on an `EXPLAIN` against a real database and
  `DATABASE_URL` is unset here. Cursor module done; mispagination still live.
- **VGC-301** is explicitly flagged in its own description as needing a human
  decision, not a one-line change: making the regulation authoritative will shift
  displayed numbers on already-stored Champions reports. Same class as the v5.26
  changelog note. Left alone deliberately.
- **VGC-290** ("[Ruling needed] Does Champions Reg M-A/M-B allow restricted Pokémon?")
  — R7 independently found the restricted-legendary rule stated inconsistently across
  **four** surfaces. Needs the owner's ruling before any surface is edited.
- **No PostHog, no Vercel, no egress.** Fifth consecutive run without PostHog
  credentials (VGC-220) and without Vercel access, so nothing tonight is grounded in
  real user behaviour or production logs — R6 #3 and R-UX #1/#3 in particular want
  instrumenting before anyone sizes them. Egress 403s/DNS-fails every competitor and
  community domain (VGC-255), so R-COMP's strand-2 creator research produced **no
  evidence at all** and ~20% of its report is unverified. Trainer Hill: nothing
  established. VGCPastes: single-source.
- **VGC-305 is real and unrotated.** A Discord webhook token was committed at
  `5da513a` in `src/app/api/feedback/route.ts:10`, removed from the tree at `28f5b8b`,
  never rotated, in a repo whose visibility is confirmed public. The tree is clean so
  there is nothing to fix in code; rotation is a ~5-minute human action with no deploy.
  This is the **fourth** run to rediscover it.

## High-conflict-risk files (recommended-to-change AND recently churned on main)

From `.swarm/main-changed-files.md`:

| File | Flagged by | Note |
|---|---|---|
| `src/app/globals.css` | R8 #1 #2 #3, C5 #1 | The revert `c4938de` touched it; now carries the dark-accent regression AND both AA blockers |
| `src/components/compare/CompareContent.tsx` | C3 #1, VGC-293 | Two different wins want this file; only the bug fix was taken tonight |
| `src/components/ui/PokemonSprite.tsx` | C5 #2 #3 | Changed by the newest commit, `68796c5` |
| `package.json` / `package-lock.json` | C4 (zod), C3 (@pkmn/dex) | Churned by the October security-bump merge |
| `src/components/report/TeamStats.tsx`, `TournamentMode.tsx`, `MatchupPlanSlide.tsx` | VGC-292 | Four of VGC-292's files are on the churn list |
| `src/components/explore/ExploreFilters.tsx` | C1 #1 | 18 LOC of superseded i18n consts; C1 recommends this one go last, alone |
| `src/data/indy-top-cut.ts` | VGC-181 | Blocked anyway |

## Two "dead code" findings that are actually unwired features

C1 flagged these as needing human eyes rather than deletion, and it is right — in both
cases the parent passes a real handler and the child destructures then ignores it:

- `onResultChange` — `MatchupPlanSlide.tsx:406/432/447`. Symptom: **game W/L doesn't save.**
- `selectedTemplate` / `onTemplateSelect` — `PasteInput.tsx:90-91/120`. Symptom:
  **the template picker does nothing.**

These are user-facing bugs wearing dead-code clothing. Ticketed, not deleted.

## Scoreboard

C1 found **no** dead files, no dead routes and no unused dependencies — the
reachability graph reaches 321 of 380 code files and all 59 unreachable are tests;
~46 LOC of sub-file dead code remains. C2 found **zero** uses of `any` in the entire
repo. `npm audit` is down to 0 critical / 1 high / 8 moderate, and the 8 moderates are
one OpenTelemetry Baggage advisory fanned across 8 nodes, unreachable here. The v5.26
header-forgery fix, the v5.27 CORS and robots.txt fixes, the v5.26 slide-heading fix
and the v5.26 homepage bundle work were all **verified still in place**. This is a
well-maintained codebase; most of tonight's findings are recent regressions or gaps at
the edges, not rot.

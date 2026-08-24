# Research synthesis — nightly swarm 24 Aug 2026

Wave 1: 13 read-only agents (R1–R8 research/audit, C1–C5 code). Every claim
below traces to a `.swarm/*-24-08-26.md` report. Two data sources were
unavailable all run and nothing was invented to cover for them:

- **PostHog**: no `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` in the container.
  The entire Step 1 analytics pull was skipped. No funnel, rage-click or
  exception data informed any ranking below. (Tracked by VGC-220.)
- **Own domain**: `pokemonvgcteamreport.com` is egress-blocked, so every
  site audit is static/repo-based. General web egress *does* work, so VGC-255
  ("egress blocks every external data source") is now only half true and
  should be updated.
- **Reddit**: blocked to both WebSearch (`allowed_domains:["reddit.com"]`
  returns a hard 400) and WebFetch. R3 substituted Smogon/GitHub/open web and
  said so rather than routing around the block or inventing quotes. This is
  the second run to hit this wall.

---

## Top 5 highest-leverage opportunities

### 1. ~10,000 sitemapped URLs are structurally unindexable (VGC-275)
R6 confirmed the ticket and found the root cause is worse than filed.
`s/[id]/page.tsx:224-231` renders only JSON-LD plus a client redirect
(`redirect.tsx:9-11` → `/?s=<id>`); the team is fetched browser-side from
`/api/share/<id>`. **But `public/robots.txt:7` is `Disallow: /api/`, and
Googlebot's renderer honours robots.txt for XHR** — so the crawler is refused
the very request that would produce the content. These pages are not slow to
index, they cannot be indexed at all. The same defect hits `/creator/[name]`
(`CreatorProfile.tsx:51`) and `/explore` (`ExploreContent.tsx:106`), both also
sitemapped. Share links are the primary growth loop.
**Being implemented tonight for `/s/[id]`; the other two routes are queued.**

### 2. Clerk ships ~78 kB gz on all 89 pages
C3's biggest new find (`layout.tsx:106`) — including `/terms` and the 74 SEO
mega guide pages, none of which need auth. That is a bigger lever than the
motion and `/compare` regressions combined. Measured baseline for a static
legal page is 216.6 kB gz, ~70% of the homepage's weight before any route code.

### 3. The share link preview has been dead the whole time
Found independently by R5 and R6. A good 1200×630 card exists at
`s/[id]/opengraph-image.tsx`, but `page.tsx:131` sets `images: []`, which wins
over the file convention, and `twitter.card` is `summary` (small card). R5 also
explains why past fixes regressed: that renderer self-`fetch`es its own API
(4s) plus 6 uncached external sprites (2.5s) against Discord's ~5s budget.
`/api/team-graphic?style=wide` already does it correctly (DB-direct,
`s-maxage=86400`). **Being addressed tonight alongside item 1.**

### 4. The category is filling up while we are not shipping
Three competitors named across R1–R4 that are not on the board at all:
**crob.at** (visual PokePaste alternative — sprites, OG previews, no login,
Reg M-B, SEO pages), **teamsheet.gg** (direct: social layer + collaborative
reports on roadmap), **reportworm.com**. Meanwhile R1 found PokePaste's repo
**dormant since March 2021** (163 open issues, no API, no paste editing) and R3
found Showdown is replacing it with an in-house DB power users call "extremely
clunky" — a genuine, time-boxed opening. R2 found Limitless publishes a free
key-less API that exposes Pokémon/item/ability/Tera but **never EVs, IVs or
nature** — structurally, that gap is our moat.

### 5. We win AEO exactly where no third-party roundup exists
R7 ran six assistant-style queries. The site **is cited** first or second for
"how to share a VGC team report" and "VGC team report tool" — traceable to the
`FAQPageJsonLd` + `HowToSchema` a previous swarm shipped, so that work paid
off. It is **absent** from "best VGC team builder 2026" and "EV to SP
converter", both of which are decided by third-party roundups we are not listed
in (notably DevonCorp's "Up-to-date VGC Resources"). The fix is off-site
listings, not more on-site schema. R7 explicitly warns **not** to add per-bot
robots.txt groups — that would reintroduce the VGC-272 `/api/` bug.

---

## Top 5 quick-win bugs — all verified, all fixed or in flight tonight

1. **`/api/team-graphic` rendered private teams as PNGs.** No
   `is_public`/`is_unlisted` check, no ID validation, and it skipped
   `redactPasteFields` so owner-hidden items were legible in the image. A full
   bypass of VGC-246. Found by C4 (HIGH) and R5 independently. **Fixed
   centrally tonight, with a 5-case regression test.**
2. **`llms-full.txt` still taught crawlers "1 SP = 1 EV… the terms are
   interchangeable."** VGC-266 corrected `llms.txt` and the FAQ but missed this
   file, on the project's flagship differentiator. The drift guard
   (`sp-docs-drift.test.ts`) only covered the other two files — which is
   exactly why it survived. **Fixed tonight; guard extended to cover both files.**
3. **Worlds 2026 dates were wrong in live structured data, four days out.**
   `tournaments/page.tsx` published Aug 14–17; the event is **Aug 28–30** at
   Moscone Center (verified against Bulbapedia and pokemon.com).
   `ChampionsContent.tsx:491` already had it right, so the page contradicted
   itself. **Fixed tonight**, plus `eventStatus` now derives from the date so a
   past event stops claiming to be upcoming.
4. **A fused Tailwind class shipped to production.** C5 found
   `min-h-11text-[10px]` / `min-h-11text-xs` at `SpeedTierChart.tsx:132,482,500`
   — a missing space that voided both the 44px touch-target fix its commit
   claimed *and* the font-size class it swallowed. **Fixed tonight** (3 sites).
5. **`[undefined]` can reach the type chart.** C2's top find:
   `pkmn-dex-fallback.ts:82-85,138-141` build `[types[0]]` annotated
   `[PokemonType]`, but `splitList()` returns `[]` for empty input. No enabled
   strict flag catches it. **In flight tonight.**

---

## Corrections to existing tickets (verify before closing)

| Ticket | Verified verdict |
|---|---|
| VGC-256 (zod) | **FIXED** — `url-codec.ts:12-22` memoised import; 63.6 kB gz in zero first loads. Closeable. |
| VGC-259 (slide h1) | **FIXED** — `page.tsx:1162-1175`. Closeable. |
| VGC-219 (a11y) | **FIXED, both parts.** Closeable. |
| VGC-261 (strict flags) | **Ticket is wrong.** C2 measured every flag: only **2** are zero-error (`verbatimModuleSyntax`, `useDefineForClassFields` — and the latter is a no-op, no classes in `src/`), not 4. `noUncheckedIndexedAccess` is 323 errors, `noPropertyAccessFromIndexSignature` 649. |
| VGC-257 (dex-subset) | **Half done** — fixed for `/`, but the same weight regressed onto `/compare` (73.3 kB gz eager). In flight tonight. |
| VGC-271 (dex fallback) | **Partial** — decode is lazy, `dex-subset.ts:39` payload import still static. Fix exists on open PR #74. |
| VGC-268 (motion) | Still broken on `main` (38.4 kB gz, 7 route groups; `optimizePackageImports` is inert under Turbopack) — **but fixed on open PR #74.** Merge, don't redo. |
| VGC-269 (bundle visibility) | Still broken on `main` — **fixed on open PR #74.** |
| VGC-270 (edit-mode h1) | Still broken on `main` — **fixed on open PR #74.** |
| VGC-264 / VGC-274 / VGC-221 | Fixed (VGC-274's replay protection only partial). |
| VGC-246 | Mostly fixed; two holes found (team-graphic — fixed tonight; collaborator `is_unlisted` — in flight). |
| VGC-248 | Now **8** moderate, all one OpenTelemetry advisory, shipped to prod but unreachable (no propagator registered). |

**The pattern worth noticing:** four tickets look broken when measured against
`main` and are already fixed on unmerged PR #74. Re-auditing costs a full agent
each run. Merging #74 is worth more than any single implementation tonight.

---

## Blockers for Wave 2 and beyond

- **Linear is over its free-plan issue cap** (275 active vs 250). `issueCreate`
  returns `USAGE_LIMIT_EXCEEDED` — confirmed by an actual attempt, not assumed.
  **GOAL B is blocked by billing.** All findings that would have become tickets
  are queued in `.swarm/proposed-tickets-24-08-26.md`.
- **No PostHog, no Vercel access** — see top of file.
- **Two open draft PRs carry 11 In Review tickets.** See
  `.swarm/board-blockage-24-08-26.md` for the full reconciliation.

## Conflict-risk files (flagged by C1–C5 as worth changing AND recently changed on main)

`src/app/page.tsx`, `src/hooks/useHomePage.ts` (C1's template chain),
`src/lib/data/dex-subset.ts` (C1 + C3), `src/components/report/SpeedTierChart.tsx`
(C5 — fixed tonight), `src/app/api/share/route.ts` (C4 + C5).
Tonight's agents were given explicit, disjoint file ownership to keep these
from colliding inside the run.

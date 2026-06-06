# Research Synthesis — Swarm Run 06-06-26

## Wave 1 outcomes
- **C1 dead code:** 1 high-confidence (`asPokemonTypes`), 2 medium (`replaceSpeciesInBlock`, `migratePlan`). All applied.
- **C2 TypeScript:** zero `any`s, just missing return types on 3-5 async exports. All applied.
- **C3 bundle:** 3 quick wins. Wave 2 applied lazy-CookieBanner (~15KB gzip).
- **C4 security:** 3 P0 / 6 P1 / 6 P2. Comments/flag P0 fixed. Dependency CVEs blocked by network policy — backlog ticket needed.
- **C5 commits review:** orphaned DisplayTogglePill + useGlobalDisplayPrefs (318 LOC) — deleted. console.error in webhook catch — added. verify-bearer tests — added (9 tests passing).
- **R6 SEO:** sitemap dup `/compare` fixed, mega pages got `lastModified`, robots.txt hardened (`/embed/`, `/dashboard/`, `/notifications`, `/*?key=`).
- **R8 a11y:** InstallPrompt full focus-trap + aria + Escape added. CalcInput textarea/input aria-labels added. CollaboratorPanel search aria-label added.
- **R-UX:** highest-leverage idea — per-team OG image — out of scope tonight, file as ticket.

## Top 5 highest-leverage opportunities (carry forward as Backlog tickets)
1. Per-team OG image at `/s/[id]/opengraph-image` — biggest virality lever (R-UX, R6).
2. `/embed/[id]` unframeable in production due to global X-Frame-Options DENY — needs `next.config.ts` override for `/embed/(.*)` (C4 P0).
3. `js-cookie` CVE GHSA-qjx8-664m-686j blocked by `@clerk/shared` — `npm audit fix` blocked here by Cypress binary download policy, but trivial locally (C4 P0).
4. Async-import `dex-subset.json` (340KB raw, ~50-80KB gzip win) — refactor `pkmn-dex-fallback` (C3).
5. Programmatic `/pokemon/[species]` route from `@pkmn/dex` + share aggregations — closes Calyrex/Garchomp keyword gaps (R6).

## Top 5 quick-win bugs / issues (ALL applied this run)
1. Comments/flag mass-deletion vulnerability — Clerk auth required, userId dedup.
2. Sitemap `/compare` emitted twice with conflicting priority — deduped, mega pages got `lastModified`.
3. Orphan DisplayTogglePill + useGlobalDisplayPrefs (318 LOC) — deleted.
4. Linear webhook catch block had no telemetry — `console.error` added.
5. verify-bearer security primitive untested — 9 vitest cases added.

## Blockers / out-of-scope tonight
- Linear MCP needs interactive OAuth → could not push Linear ticket updates from this run. All ticket actions filed in `.swarm/linear-pending.md` for human follow-up.
- PostHog credentials not in this environment → cross-reference with telemetry deferred.
- Discord webhook URL not in this environment → notification payload saved to `.swarm/discord-failed.md`.
- `npm audit fix` blocked by Cypress binary download (HTTP 403 in remote env).

## Conflict-risk overlap with main-changed-files
None of the applied changes touch files in `.swarm/main-changed-files.md` (page.tsx, SlideNavControls.tsx, useHomePage.ts, SwipeHint.tsx, globals.css, sw.js). Recommendations that DO overlap (e.g. `summarizeChangedFields` import in page.tsx) were deferred.

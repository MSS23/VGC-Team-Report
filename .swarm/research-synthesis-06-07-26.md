# Research Synthesis (2026-07-06)

## Wave 1 subagents completed: C1, C2, C4, C5, R6, R8 (6/6)
## Wave 1 skipped (no external service): R1/R2/R3/R4/R5/R7 (research), C3 (perf — needs build), L0 (Linear triage — no MCP)

## Top 5 highest-leverage opportunities

### 1. Dead code removal — HIGHEST CONFIDENCE, LARGEST DELTA (C1)
- `DisplayTogglePill.tsx` (267 LOC), `useGlobalDisplayPrefs.ts` (51 LOC), `ConsentGate.tsx` (37 LOC). Zero importers. ~355 LOC gone.
- 3 files, 2 directories emptied.
- Wave 2: F-DEAD-CODE.

### 2. Accessibility one-liners — HIGH CONFIDENCE (R8)
- 8 one-line aria fixes across 5 files. Restores "you are here" for AT users, fixes modal semantics.
- Wave 2: F-A11Y.

### 3. SEO metadata gaps — HIGH CONFIDENCE (R6)
- OG/Twitter images missing on `/champions`, `/privacy`, `/terms`.
- `/compare` has contradictory noindex vs sitemap listing.
- Wave 2: F-SEO.

### 4. TypeScript strictness — MEDIUM CONFIDENCE (C2)
- 8 quick wins; safest are `src/lib/db.ts:4` (DATABASE_URL guard) and `src/hooks/useSlideSystem.ts:56` + `src/components/report/CommonModesSlide.tsx:108` (drop double-casts by adding key to type).
- Wave 2: F-TS-STRICT.

### 5. Codebase smell — i18n fallback (C5)
- `src/lib/i18n/index.ts:83` cast can render literal "undefined" in UI when a key is missing. One-line fallback fix.
- Wave 2: F-I18N-FALLBACK (batch with F-TS-STRICT).

## Top 5 quick-win bugs (none critical — codebase is unusually clean)
- No stray console.log.
- No TODO/FIXME.
- No hardcoded secrets.
- No security issues.
- No `any` or `@ts-ignore`.
- Real smells are the silent-catch epidemic in DashboardContent (8 spots) and NotificationsContent (3 spots) — but those need a `withToast` helper, larger refactor. Defer.

## Blockers for Wave 2
- Linear MCP unauthenticated — cannot triage tickets or file backlog. Wave 2 will be pure feature/audit-driven, not ticket-driven.
- PostHog unreachable — no user-behavior signals to prioritize with.
- Vercel MCP unreachable — cannot check env-var/webhook health beyond code inspection.
- Discord webhook URL not in env — final notification will be logged to `.swarm/discord-failed.md`.

## High-conflict-risk file overlap (files touched by main in last 7 days)
- Since branch was just cut from main tip (`83d195a`), all files are equally recent. No specific conflict-risk list.

## Wave 2 subagent plan (4 dispatches, well under budget)
1. **F-DEAD-CODE** — delete DisplayTogglePill, useGlobalDisplayPrefs, ConsentGate. Verify no callers with grep, then rm. Build gate.
2. **F-A11Y** — apply 8 one-line aria fixes to PageNavbar, PageFooter, ShortcutHintOverlay, WalkthroughOverlay, MegaLandingContent. Build gate.
3. **F-SEO** — add OG/Twitter blocks to /privacy, /terms; add OG images to /champions; remove /compare noindex OR remove from sitemap. Build gate.
4. **F-TS-STRICT** — apply items #1 (DATABASE_URL guard), #7 (i18n key addition), plus C5's i18n fallback. Build gate.

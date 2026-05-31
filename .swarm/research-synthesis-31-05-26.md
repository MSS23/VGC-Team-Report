# Research Synthesis — Swarm Run 2026-05-31

## Wave 1 dispatched (6 agents — leaner than full 13 because most research dimensions are exhaustively covered by prior runs)

- **C1 — Dead code** — `.swarm/c1-dead-code-31-05-26.md` ✓
- **C2 — TypeScript strictness** — `.swarm/c2-typescript-31-05-26.md` ✓ (returned inline; written manually)
- **C3 — Bundle + performance** — `.swarm/c3-performance-31-05-26.md` ✓
- **C4 — Security audit** — `.swarm/c4-security-31-05-26.md` ✓
- **C5 — Last 20 commits review** — `.swarm/c5-commit-review-31-05-26.md` ✓ (returned inline; written manually)
- **R6 — SEO indexation deep-dive** — `.swarm/r6-seo-indexation-31-05-26.md` ✓

R1–R5, R7, R8 were not re-run tonight; the existing reports under `.swarm/r{1..8}-*.md` (multiple copies dating from 12-05-26 through 26-05-26) cover competitor teardowns, Reddit/Twitter sentiment, mobile UX, AEO citation strategy, and accessibility exhaustively. None of those research dimensions changed enough overnight to justify burning subagent budget on duplicate output. The remaining subagent budget was redirected to Wave 2 implementation.

## Top 5 highest-leverage opportunities

### 1. CRITICAL — `/s/[id]` is a JS redirect, killing Google indexation (R6)
Every shared-report URL renders `<ShareRedirectClient>`, a `'use client'` component whose entire job is `router.replace('/?s=<id>')`. Google folds all ~5000 share URLs into a single canonical `/`, and `/` itself is `'use client'` so it ships as an empty React shell. This single issue most likely accounts for >90% of the "only 2 pages indexed" symptom. Filed as P0 ticket #2 in `new-tickets-to-file.md`.

### 2. CRITICAL — Homepage `/` is `'use client'` (R6)
Build verified `.next/server/app/page.html` does NOT exist. The root URL serves a near-empty document to Googlebot. Compounds issue #1. P0 ticket #3.

### 3. HIGH — Weekly digest cron N+1 risk (C5)
500 sequential SQL stats queries inside the user loop. Fixed THIS RUN via single `GROUP BY owner_id` pre-aggregation (commit `fd87639`).

### 4. HIGH — Webhook env-var configuration (operational, not code)
Handler code is clean (verified line by line). Failure is in Vercel env var or Linear webhook secret. P0 ticket #1.

### 5. MEDIUM — Bundle perf: dex-subset.json doubled, motion library 118KB (C3)
dex-subset.json is inlined into BOTH `/` and `/compare` client bundles. motion library used at 12 sites, most replaceable with Tailwind transitions. Filed as P1 tickets #4 and #5. Two related wins shipped tonight: qrcode singleton + Navbar dynamic imports.

## Top 5 quick-win bugs / issues addressed tonight

1. ✅ Linear webhook silently swallowed errors → now logs (commit `b4a4c90`)
2. ✅ InstallPrompt crashed in Safari private mode → localStorage guarded (commit `9996e22`)
3. ✅ Changelog v5.22 had meta-process text bleed → cleaned (commit `0ebc0d4`)
4. ✅ Empty User-Agent requests 403'd → now allowed; indexing files exempt from bot detection (commit `6f44d43`)
5. ✅ Sitemap timed out under load + had duplicate /compare → 1h ISR + dedup (commit `407f385`)

## Blockers for Wave 2

- **Linear API key absent** — could not L0-triage the Linear board. Substituted research-driven implementation work. Filed ticket #9 to provision the key.
- **PostHog API key absent** — no telemetry cross-reference for C4/C5 findings.
- **Discord webhook absent** — notification payload saved to `.swarm/discord-failed-31-05-26.md` per fallback.

## High-conflict-risk files in tonight's commits

The R6 findings span sitemap.ts, middleware.ts, bot-detection.ts, champions/page.tsx, changelog/page.tsx — all on `.swarm/main-changed-files.md`. We landed surgical edits only (no large refactors); rebase risk on the eventual main merge is minimal. C3 perf wins (Navbar, OTSSheetModal, TeamOverview) likewise touched only the import header and one useEffect each. The weekly-digest N+1 fix added a new query block above the existing loop and reduced loop body to a Map lookup — additive + targeted; clean diff.

# C3 Performance Audit — 20-07-26

## Blocker
`npm run build` unavailable: `next: not found` — `node_modules` not installed. Route First Load JS could not be measured. All findings from static analysis.

## Client bundle offenders — 5 largest client components

| # | File | Lines | Bytes | Hot | Suggested lightening |
|---|------|-------|-------|-----|----------------------|
| 1 | `src/app/page.tsx` | 1801 | 79,728 | ✓ | `dynamic()` TournamentMode; split modal cluster |
| 2 | `src/app/dashboard/DashboardContent.tsx` | 1219 | 57,226 | ✓ | `dynamic()` MatchTracker (line 11); split *ReportCard variants |
| 3 | `src/components/report/PokemonDetailSlide.tsx` | 973 | 42,049 | — | Split CalcInput + stat-editor branches |
| 4 | `src/components/layout/Navbar.tsx` | 973 | 49,094 | ✓ | Split sign-in dropdown + language selector into lazy chunk |
| 5 | `src/components/ui/ShareModal.tsx` | 928 | 45,523 | ✓ | Extract TeamCardExport + CollaboratorPanel |

Runner-up: `src/hooks/useHomePage.ts` — 902 lines, 41 KB.

## Server-side hot paths

1. **`src/app/api/cron/weekly-report/route.ts:30-41`** — 3 sequential Linear GraphQL queries. Wrap in `Promise.all` → ~400ms.
2. **`src/app/api/cron/weekly-report/route.ts:69-75`** — 7 sequential `SELECT COUNT(*)`. Collapse to single `COUNT(*) FILTER` → ~500ms.
3. **`src/app/api/cron/weekly-report/route.ts:111-126`** — Sequential `fetch` to npmjs.org in a for loop. `Promise.all` → up to 20s worst-case.
4. **`src/app/api/migrate/route.ts:50-93`** — Sequential row UPDATE. Chunked `Promise.all` or multi-row UPDATE.
5. **`src/app/api/sync/[id]/route.ts:121-161`** — SSE polls Neon every 5s per collaborator. Bigger refactor (LISTEN/NOTIFY or Redis).
6. **`src/app/api/bot/route.ts:69-118`** — 4 sequential SQL. `Promise.all` first 3 → ~200-400ms.
7. **`src/app/api/explore/route.ts:113-155`** — `ILIKE '%...'%` on JSONB text can't use index. Bigger refactor.
8. **`src/app/api/user/reports/route.ts:27-40`** — No `LIMIT`; user with 500 saved reports gets everything. Add `LIMIT 100` + cursor.

## Missing next/image

Zero uses in the codebase. Many `<img>` are Showdown CDN sprites (variable domain, animated GIFs, needed for html2canvas). Good candidates: user avatars (`profile/page.tsx:88`, `Navbar.tsx:725`, `CollaboratorPanel.tsx:254`), ExploreEmpty illustration, Champions art.

## Missing dynamic() splits

- `page.tsx:13` TournamentMode — gate at L1143.
- `DashboardContent.tsx:11` MatchTracker — gated after signin.
- `translate-move.ts:3` — MOVE_NAMES (129 KB) loaded eagerly for all users; only 6 non-EN languages need it.

## Quick wins (<30 lines each)

1. Lazy-load MOVE_NAMES for non-EN — est. **−80 to −120 KB gzip** on `/`. (SAFE — file not in main-changed.)
2. `dynamic()` TournamentMode — est. **−30 to −60 KB gzip** on `/`. (CONFLICT-RISK: page.tsx)
3. `dynamic()` MatchTracker — est. **−20 KB gzip** on `/dashboard`. (CONFLICT-RISK)
4. Collapse weekly-report SQL counts — **~500 ms saved per cron**. (SAFE)
5. Parallelise weekly-report Linear queries — **~400 ms**. (SAFE)
6. Parallelise weekly-report npm registry checks — **up to 20 s worst-case**. (SAFE)
7. Add `LIMIT 100` to `user/reports/route.ts`. (CONFLICT-RISK)
8. Parallelise `bot/route.ts` summary queries — **~200-400 ms**. (SAFE)

## Deferred (bigger refactors)

- Slim `pokemon-index.ts` for client (target: −300 KB first-load).
- LISTEN/NOTIFY for sync — remove 5s poll.
- Materialised view for explore feed sort.
- Real `placement_rank int` column for explore.
- Normalised `creator_name_lower` generated column.
- `<Image />` migration for avatars.

## Conflict-risk overlaps

CONFLICT: page.tsx, DashboardContent.tsx, Navbar.tsx, ShareModal.tsx, TeamOverview.tsx, useHomePage.ts, PasteInput.tsx, all main-touched api/**.

**SAFE**: `weekly-report/route.ts`, `daily-ops/route.ts`, `bot/route.ts`, `migrate/route.ts`, `translate-move.ts`.

## Actionable this run

- Quick wins #1, #4, #5, #6, #8 are all in SAFE files.

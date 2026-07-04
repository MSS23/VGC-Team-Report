# VGC Team Report — Codebase Improvement Plan

> Full-codebase review, 2026-07-04. Covers the Neon storage incident (98% usage), security, performance/cost, correctness, code health, testing, and infrastructure. Findings reference `file:line` where possible. Severity: 🔴 High · 🟡 Medium · ⚪ Low.

---

## Executive summary

The app is in good shape overall — parameterized SQL throughout, Upstash rate limiting, Redis + CDN caching on hot public reads, correctly lazy-loaded heavy libs, and an exemplary unit-test suite for pure library code. But three things need urgent attention:

1. **The Neon database is full because of a runaway autosave loop.** 447 MB of the 487 MB database is `share_versions` — 131,127 full-report JSONB snapshots for only 119 shares. One share has 98,905 versions. Root cause identified (see §1).
2. **Two broken-access-control bugs** let anyone delete any comment and read private reports via collections (§2).
3. **The share editor is built around a god hook + mega-component** (837-line hook returning ~115 values, 1,885-line page) that makes every one of these bugs harder to find and fix (§5).

Suggested order of attack: §1 emergency cleanup (today, no deploy) → §1 code fixes + §2 security fixes (one push) → everything else incrementally.

---

## 1. 🔴 P0 — Neon storage crisis (the 98%)

### Evidence (measured against prod, read-only)

| Table | Size | Rows | Notes |
|---|---|---|---|
| `share_versions` | **447 MB** | 131,127 | For only **119 shares** (~1,100 versions/share avg) |
| `edit_changelog` | 30 MB | 131,240 | Same growth pattern |
| `shares` (all real product data) | 1.4 MB | 119 | |
| **Total DB** | **487 MB** | | Neon free tier = 512 MB → **~98%** |

Top offender: share `jFLBCdU0` — **98,905 versions / 202 MB** (~1,100 snapshots/day since March). Machine-speed, not human editing.

### Root cause chain

1. **Autosave feedback loop (the trigger).** `src/hooks/useCollaborativeSync.ts:40-45,142` defines self-echo suppression (`markSaving` / `updateVersion`) but **nothing ever calls them**. So: autosave POSTs → server bumps version → SSE echoes it back → `onRemoteUpdate` (`src/hooks/useHomePage.ts:389`) re-parses the paste and regenerates plan/gamePlan IDs via `crypto.randomUUID()` → state now genuinely differs → the 3s autosave (`src/hooks/useShareFlow.ts:105`) fires again → repeat forever while an editor tab is open.
2. **Full snapshot per save (the amplifier).** Every save with detected changes inserts the entire report JSONB into `share_versions` (`src/app/api/share/route.ts:163`).
3. **No retention anywhere (the accumulator).** `/api/cleanup` purges shares/reactions/comments but never touches `share_versions` or `edit_changelog`; deleting a share orphans its versions forever. The versions UI shows max 50 (`src/app/api/share/[id]/versions/route.ts:59`), so anything beyond that is invisible dead weight.

### Fix plan

**Phase A — emergency recovery (SQL only, no deploy, frees ~450 MB):**
- [ ] Delete all but the newest 20 versions per share (simulated: keeps 453 rows / 1.7 MB, deletes 130,674 rows / 336 MB).
- [ ] Same retention for `edit_changelog`; also delete rows for shares that no longer exist.
- [ ] `VACUUM FULL share_versions, edit_changelog` (or rebuild via `CREATE TABLE AS SELECT` + rename) — plain DELETE won't shrink Neon's storage metric.
- Expected: 487 MB → ~15–20 MB (98% → ~4%).

**Phase B — stop the bleeding (code):**
- [ ] Fix the echo loop: call `markSaving()` before `autoSave()` and `updateVersion(v)` after it resolves (or ignore SSE events whose version == last-saved version). Preserve remote plan IDs instead of regenerating with `randomUUID()`.
- [ ] Server-side snapshot coalescing in `/api/share`: only snapshot if the newest version row is older than ~10 min, or when `isPublish` is true.
- [ ] Self-cleaning retention: after each snapshot insert, delete rows beyond the newest 50 for that share.
- [ ] Add `share_versions`/`edit_changelog` retention + orphan sweep to `/api/cleanup`, and cascade them when shares are purged (or add `ON DELETE CASCADE` FKs).

---

## 2. 🔴 Security

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 2.1 | 🔴 | **Comment delete tokens leaked to every reader.** GET `src/app/api/comments/[shareId]/route.ts:62-63` returns each comment's `sessionId`, which is exactly what DELETE (`.../[commentId]/route.ts:42-48`) uses for authorization → anyone can delete any comment. | Return an `isOwn` boolean computed server-side; never expose `session_id`. |
| 2.2 | 🔴 | **Private-report disclosure via collections.** `src/app/api/user/collections/route.ts:100-111` accepts any `shareId` with no visibility/ownership check, then `.../collections/[id]/route.ts:26-32` returns the full `data` blob → read any private report by adding its ID to your collection. | Mirror the saved-reports guard (`src/app/api/user/saved/route.ts:87-97`): require `is_public = true OR owner_id = userId` on insert. |
| 2.3 | 🟡 | **Comment flagging trivially gamed.** `src/app/api/comments/flag/route.ts:29-45` dedups by client-supplied `sessionId`; 3 fabricated IDs auto-delete any comment. No check that the comment belongs to a public share. | Key flags on authenticated `userId` or IP; validate comment→share relationship. |
| 2.4 | 🟡 | **Discord slash commands lack invoker authorization.** `src/app/api/discord/route.ts:210-301` verifies the request is from Discord but not who ran it — any guild member can `approve`/`reject`, which drives the Linear → autonomous-build pipeline. | Check `body.member.user.id`/roles against an allowlist before mutating commands. |
| 2.5 | 🟡 | **Collaborators route bypasses rate limiting.** `src/app/api/share/[id]/collaborators/route.ts:28,155,183` — only POST calls `apiGuard`; PATCH (rotates `edit_token`!) and GET/DELETE have none. | Add `apiGuard` to all four handlers. |
| 2.6 | ⚪ | **`getClientIp` collapses header-less clients into one bucket.** `src/lib/security/input-validation.ts:23-30` — all "unknown" clients share one rate-limit bucket. | Fall back to a per-connection identifier, or treat "unknown" as always-limited on sensitive routes. |
| 2.7 | ⚪ | Loose ID validation: `collections` `shareId`/`collectionId` are bare `z.string()`, `follow` `creatorName` has no max length. Parameterized SQL means no SQLi, but tighten to the `^[A-Za-z0-9]{8}$` pattern used elsewhere. | Reuse the shared `IdSchema`. |

---

## 3. 🟡 Performance & cost (Neon compute + Vercel)

These matter for compute hours (Neon autosuspend) and Vercel function invocations:

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 3.1 | 🟡 | **SSE sync polls the full JSONB blob every 2s per open editor tab** (`src/app/api/sync/[id]/route.ts:117`) — keeps Neon awake and moves the whole report from DB every poll even when unchanged. | Poll `SELECT version` only; fetch `data` only when the version changed. Consider 5s interval. |
| 3.2 | 🟡 | **Notifications poll every 60s per signed-in tab** with a 50-row fetch + COUNT even when nothing changed (`src/hooks/useNotifications.ts:54`, `src/app/api/user/notifications/route.ts:23-36`). One open tab prevents Neon autosuspend permanently. | Poll a cheap unread-count-only query; fetch the list on dropdown open. |
| 3.3 | 🟡 | **`ensureTable()` (≈50 DDL statements + a backfill UPDATE) runs on every match-log request** — 3 call sites in `src/app/api/match-log/route.ts:49,91,122`. | Remove; `/api/setup` is the migration entry point. |
| 3.4 | 🟡 | **Spotlight endpoint never caches** despite `CacheKeys.spotlight()` existing, and runs 4 sequential queries (`src/app/api/spotlight/route.ts:15-45`). Homepage-hot. | `Promise.all` the queries + Redis cache (300s) + `s-maxage`. |
| 3.5 | 🟡 | **Creator profile endpoint has no caching** (`src/app/api/creator/[name]/route.ts`) — public, repeatedly hit, full DB work every visit. | Short-TTL Redis + CDN headers, same pattern as explore/champions-meta. |
| 3.6 | 🟡 | **`user/analytics` runs 9 independent queries sequentially** (`src/app/api/user/analytics/route.ts:21-113`). | `Promise.all`. |
| 3.7 | 🟡 | **Share GET runs up to 6 sequential queries**; `loadForkedFromId` (`src/app/api/share/[id]/route.ts:52-61`) re-queries `shares` for a column the main SELECT could include. | Add `forked_from_id` to the main SELECT; parallelize collab-names + fork-meta. |
| 3.8 | ⚪ | Explore fork-lineage query runs outside the existing `Promise.all` batch (`src/app/api/explore/route.ts:248` vs `:276`). | Move into the batch. |
| 3.9 | ⚪ | `oembed` returns no `Cache-Control` — Discord/Slack unfurls hit the DB every time (`src/app/api/oembed/route.ts`). | Add `s-maxage`. |
| 3.10 | ⚪ | Reactions POST queries `owner_id` twice (`src/app/api/reactions/[shareId]/route.ts:76,103`). | Fetch once. |

### Client bundle

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 3.11 | 🔴 | **~10k lines of static dex data ship in the client bundle.** `src/lib/data/moves.ts` (4,183 lines), `pokemon.ts` (3,403), `pokemon-types-map.ts` (1,336), `mega-pokemon.ts` (919) are imported directly by `"use client"` components (`PokemonDetailSlide.tsx:17`, `PokemonCard.tsx`, `SpeedTierChart.tsx`, `CompareContent.tsx`, `useTeamReport.ts`, …). Every visitor downloads and parses it on first paint. | Move lookups behind an API route or `await import()` boundary, or precompute per-team data server-side. |
| 3.12 | 🟡 | `Navbar.tsx:12` (931 lines) statically imports `VersionHistoryPanel` (379 lines), only relevant in shared/edit views. | `next/dynamic` it. |
| 3.13 | 🟡 | **Zero `React.memo` anywhere in `src/components`** — combined with the god hook (§5.1), typing in one note textarea re-renders the whole 850–960-line slide subtree. | Memo heavy slides; stabilize inline callbacks from `TeamReport.tsx:268-281` with `useCallback`. |

Already done well (keep it up): `html2canvas-pro`, `jspdf`, `qrcode` all dynamically imported; modals/panels/charts use `next/dynamic`; i18n bundles load per-locale; `TeamReport` renders only the active slide.

---

## 4. 🟡 Correctness & reliability

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 4.1 | 🟡 | **Account deletion: ~15 sequential writes, no transaction**, Clerk deleted *after* the DB (`src/app/api/user/delete/route.ts:28-83`) — a mid-sequence failure leaves partial data or an orphaned account. | Single transaction for DB deletes; make Clerk deletion idempotent/reordered. |
| 4.2 | 🟡 | **Fire-and-forget notifications/emails dropped on lambda freeze.** `src/app/api/reactions/[shareId]/route.ts:106` and `comments/[shareId]/route.ts:130-151` don't await or use `after()`. | Wrap in `after()` from `next/server`. |
| 4.3 | 🟡 | **PostHog server events may never flush** — `src/lib/posthog-server.ts:31` un-awaited capture with `flushInterval: 0` on serverless. | `await ph.flush()` inside `after()`. |
| 4.4 | 🟡 | **`notifyFollowers` N+1 insert loop** (`src/lib/notifications.ts:41-45`) — one INSERT per follower on publish. | Single `INSERT … SELECT FROM follows`. |
| 4.5 | 🟡 | **Dashboard tab-switch race** — fetches in `DashboardContent.tsx:61-108` have no `AbortController`/stale guard; slow responses populate the wrong tab. | Abort or ignore-flag in effect cleanup. |
| 4.6 | 🟡 | **Undo/redo silently skips most meta fields** — `useHomePage.ts:183-194` snapshots only `notes, calcs, roles, summary, plans`; teamName/tournamentName/placement/record/tags edits can't be undone. | Snapshot the full meta set or scope undo explicitly. |
| 4.7 | 🟡 | **`beforeunload`/banner effects re-run every render** — `useHomePage.ts:359-386` depend on the freshly-allocated `share` object. | Depend on the specific stable fields. |
| 4.8 | ⚪ | Version revert isn't atomic — snapshot insert (swallowed `.catch`) + UPDATE aren't transactional (`src/app/api/share/[id]/versions/route.ts:143-156`). | One transaction. |
| 4.9 | ⚪ | Hand-rolled fetch-timeout boilerplate per route; `discord/route.ts` `linearQuery` (line 22) has **no** timeout at all. | Shared `fetchWithTimeout` helper. |

### Product-level concern

- 🟡 **The cleanup cron hard-deletes any share not updated in 90 days** (`src/app/api/cleanup/route.ts:42-53`) — including signed-in users' owned reports and drafts. A user's April tournament report silently vanishing in July will read as data loss. Consider exempting `owner_id IS NOT NULL`, or soft-delete + notify.

---

## 5. 🟡 Code health & architecture

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 5.1 | 🔴 | **`useHomePage.ts` is a god hook** — 837 lines, ~20 sub-hooks, ~15 effects, returns ~115 fields. Every state change re-renders the entire report tree; the return object defeats memoization. | Split into context providers (team-content / share / slides / walkthrough) so consumers subscribe to slices. |
| 5.2 | 🔴 | **`page.tsx` `HomeContent` is a ~1,500-line mega-component** (file: 1,885 lines). | Extract draft-loading, version-compare, export handlers, and render regions into children so React can bail out of unaffected subtrees. |
| 5.3 | 🟡 | **Duplicated share-state construction** — `page.tsx:352-377` hand-builds a `ShareableState` that drifts from `buildShareState()` (`useHomePage.ts:232-263`); it already omits `hiddenSlides`, `templateId`, `privateFields`, `genTheme` → inaccurate version diffs. | Expose and reuse the one `buildShareState`. |
| 5.4 | 🟡 | **`TeamReport` takes ~50 props** (`TeamReport.tsx:36-95`), mostly pass-through plumbing. | Context provider or grouped prop objects. |
| 5.5 | ⚪ | Hydration sequenced by 8 one-shot `useRef` booleans + `eslint-disable exhaustive-deps` in `useHomePage.ts` — order-dependent and fragile. | Model as an explicit reducer/state machine. |
| 5.6 | ⚪ | Repeated inline SVG icons across large components (`DashboardContent.tsx:138-150` etc.). | Shared `components/ui/icons` set. |
| 5.7 | ⚪ | Icon-only controls lose their labels at `sm` breakpoint with no `aria-label` (`DashboardContent.tsx:137-151`). | Add `aria-label` to icon-only interactive elements. |
| 5.8 | ⚪ | No FK integrity between `shares` and satellite tables (versions, changelog, notifications, collection_items) — why orphans accumulate. | `ON DELETE CASCADE` FKs (pairs with §1 Phase B). |

---

## 6. 🟡 Testing

**Current state:** 16 Vitest suites (~1,784 lines) + 8 Cypress specs (~645 lines) against 295 source files. The unit layer over pure functions is genuinely good (redaction, Showdown parser, URL codec, stat calc, legality, cron-auth, rate limiting). But coverage stops at the `src/lib` boundary.

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 6.1 | 🔴 | **Zero tests for 50+ API route handlers** — share save/fork/versions, `api-guard`, `verify-bearer`, CSRF/CORS, webhook signature verification are all untested. | Start with route-level tests for `api/share/[id]` and the security guards, mocking `getDb()`. |
| 6.2 | 🟡 | **Redaction integration untested** — `redact-paste.ts` has 361 lines of unit tests, but no test proves a public GET actually strips `privateFields`. This is the privacy-critical path. | One integration test: save with privateFields → assert public GET omits them. |
| 6.3 | 🟡 | Core stateful hooks uncovered — `useShareFlow`, `useUndoRedo`, `useCollaborativeSync`, `useAutoDraft` (the data-loss-prone paths); only `useExploreUrlSync` has a test. | Prioritize `useShareFlow` + `useUndoRedo`. A regression test for the §1 echo loop belongs here. |
| 6.4 | 🟡 | **A failing Cypress screenshot is committed** (`cypress/screenshots/team-report.cy.ts/…(failed).png`) — the spec was failing when last run. | Gitignore `cypress/screenshots|videos/`, remove the PNG, fix the spec. |

---

## 7. ⚪ Infrastructure, config & hygiene

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 7.1 | 🔴 | **Sentry client-side is dead.** No `withSentryConfig` in `next.config.ts` and no `instrumentation-client.ts`, so `sentry.client.config.ts` never loads — browser errors (incl. `global-error.tsx` captures) go nowhere. | Either wire it (`withSentryConfig` + rename to `instrumentation-client.ts`) or drop `@sentry/nextjs` entirely — PostHog already captures exceptions, and the SDK is a heavyweight dep providing near-zero value today (see 7.2). |
| 7.2 | 🟡 | `@sentry/nextjs` effectively inert but shipped in prod; `replaysOnErrorSampleRate: 1.0` would be a surprise-bill setting if ever wired. | Decide: finish or remove. If keeping, sample replays at 0.1–0.25. |
| 7.3 | 🟡 | **`.env.example` documents ~7 of ~28 env vars actually read** (missing Clerk, Upstash, Resend, PostHog, Clarity, `MIGRATE_SECRET`, `DISCORD_BOT_TOKEN`, `ADMIN_USER_ID`, …). Fresh clones fail silently. | Regenerate from a `process.env.*` grep. |
| 7.4 | 🟡 | **Binary junk committed to root:** `HFNfcHdXcAAPrXN.jfif` (137 KB), `Screenshot 2026-04-06 175757.png` (285 KB), plus scratch file `TEST.MD` ("TESTER23~"). | `git rm` all three; extend `.gitignore`. |
| 7.5 | ⚪ | `WIKI.md` untracked (perpetually dirty tree); `docs/` contains only stale April-2026 marketing briefs. | Commit WIKI.md under `docs/` or ignore it; move campaign briefs to Linear/Notion. |
| 7.6 | ⚪ | `sitemap.ts` emits `/compare` twice (lines 16 & 18); creator pages omit `lastModified`. | Dedupe; populate `lastModified` from `MAX(updated_at)`. |
| 7.7 | ⚪ | tsconfig: `strict` is on but no `noUncheckedIndexedAccess` — index access typed always-defined in the data-heavy dex/parser code. | Enable and fix incrementally. |
| 7.8 | ⚪ | No `serverExternalPackages` for OpenTelemetry SDK — inflates server bundle trace/cold starts. | Add to `next.config.ts`. |
| 7.9 | ⚪ | Dependency audit came back clean — `tweetnacl`, `qrcode`, `@microsoft/clarity`, `jspdf`, `html2canvas-pro` all genuinely used. | No action. |

---

## Suggested roadmap

| Phase | What | Effort | Impact |
|---|---|---|---|
| **1 (today)** | §1-A: SQL cleanup + VACUUM — frees ~450 MB, 98% → ~4% | ~1 hr, no deploy | Unblocks the database |
| **2 (this week)** | §1-B echo-loop fix + snapshot coalescing + retention; §2.1 + §2.2 access-control fixes | 1–2 days, one push | Stops regrowth; closes the two real vulns |
| **3** | §2.3–2.5 security hardening; §4.1–4.4 reliability; §3.1–3.7 query/caching wins | 2–3 days | Neon compute headroom, fewer dropped side-effects |
| **4** | §3.11 dex-data bundle split; §6.1–6.3 route + hook tests (incl. echo-loop regression test) | 3–5 days | Page-load wins; safety net for future work |
| **5 (ongoing)** | §5 architecture refactor (god hook → contexts, mega-component split); §7 hygiene | incremental | Long-term velocity |

---

*Generated from a multi-agent review: database forensics (live read-only queries against prod), frontend sweep, backend/API sweep, and infra/testing sweep.*

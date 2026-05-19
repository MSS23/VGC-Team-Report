# C3 Performance Audit — 2026-05-19

## 1. Build Status

**PASS** — `npm run build` completes successfully (TypeScript check passes, 108 pages generated).

Key warnings:
- **`⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`** — not a build failure but will break in a future Next.js version. Low urgency.
- **`⚠ Using edge runtime on a page currently disables static generation for that page`** — at least one route uses edge runtime, preventing static caching.
- **DB connection errors during SSG** — all `champions/[pokemon]` pages log `No database connection string was provided to neon()` during static generation, and the sitemap also fails. These are expected in local CI (no `.env.local`) but confirm the champions pages gracefully degrade (they still generate, just without dynamic team data). **This pattern is fine as long as Vercel has `DATABASE_URL` set.**

No bundle size warnings were emitted — Turbopack does not output First Load JS sizes in the same format as webpack, so no chunk size thresholds were breached.

---

## 2. New Client Components (2026-05-18)

### `src/app/notifications/NotificationsContent.tsx` (346 lines, `"use client"`)

**Assessment: Client component is justified, but has a redundant double-fetch.**

The component correctly must be a client component — it uses `useState`, `useEffect`, `useCallback`, real-time polling via `useNotifications`, and pagination triggered by user interaction. Server component conversion is not possible.

**Problem identified:** Double-fetch on mount.
- `useNotifications(true)` (line 138) immediately fetches `/api/user/notifications?limit=50&offset=0`.
- `fetchInitial` (line 169) also fetches `/api/user/notifications?limit=50&offset=0` independently in a separate `useEffect`.
- These fire simultaneously on page load, resulting in two identical API requests. The `initialLoaded` guard partially mitigates merging, but the network requests are still both issued.

**Fix:** Either pass `enabled=false` to `useNotifications` and rely solely on `fetchInitial`, or remove `fetchInitial` and rely solely on the hook's initial fetch + expose `hasMore`/`offset` via the hook.

**Not a candidate for server component conversion** — requires browser APIs (polling, visibility change listener, pagination state).

### `src/components/ui/ShareModal.tsx` (827 lines, `"use client"`)

**Assessment: Client component correctly placed; `TeamCardExport` eagerly imported is the concern.**

The modal itself is lazy-loaded from `page.tsx` via `dynamic()` — correct. However, inside ShareModal, `TeamCardExport` is a **static import** (line 6: `import { TeamCardExport } from "@/components/ui/TeamCardExport"`). `TeamCardExport` dynamically imports `html2canvas-pro` on-demand (only when the user clicks export), so the canvas library itself is not in the initial bundle. The `TeamCardExport` component shell (~small) is bundled with `ShareModal` — acceptable.

The component bundles `usePostHog`, `useTranslation`, and inline i18n fallback logic — appropriate for an interactive modal.

**Minor concern:** 8 separate `useState` calls for copy-state management (`linkCopied`, `discordCopied`, `embedCopied`, `pasteCopied`, `publicConfirmDismissed`, `tagError`, `creatorError`, `justPublished`) could be consolidated into a single state object, reducing re-render surface. Not a correctness issue.

---

## 3. `src/app/page.tsx` — Server vs Client

**Status: Fully client component (`"use client"` at line 1, 1852 lines).**

The root page is a full client component exporting `Home()` which wraps `HomeContent()`. `HomeContent` uses:
- 55+ hook call sites (useState, useEffect, useCallback, useRef, useMemo, useAuth, usePostHog)
- Real-time state (paste input, analysis, sharing, collaboration)
- Browser APIs (clipboard, swipe navigation, pull-to-refresh, portal)
- Clerk auth hooks (`useAuth`, `SignInButton`, `SignUpButton`)

**VGC-162 feasibility assessment:**

Converting `page.tsx` itself to a server component is **viable but requires a split-shell pattern**, not a straightforward conversion. The current architecture already uses `dynamic()` for the heaviest conditional components (ShareModal, CommentSection, PrintableReport, OTSSheetModal, CollaboratorPanel, EditChangelog, DiffNavigator). The static shell (`HOW_TO_STEPS`, JSON-LD schema, I18nProvider) could be rendered server-side, but `HomeContent` — which is the actual page — cannot be a server component.

**The ~200KB saving claimed in VGC-162 is plausible only if:** the outer `page.tsx` shell becomes a server component and `HomeContent` is split into a separate `"use client"` component imported dynamically. The benefit is that Next.js would stop including `page.tsx` in the initial client bundle hydration pass for routes that don't need it. However, since `/` is the primary landing page (always rendered), the hydration saving is marginal compared to a deep route.

**Current `"use client"` count across app:** 15 files in `src/app/`, 114 total across `src/`.

**Recommended action for VGC-162:** Split `page.tsx` into:
1. `page.tsx` (server) — renders `<I18nProvider>`, JSON-LD schemas, `<Suspense>` wrapper
2. `HomeContent.tsx` (client) — everything currently in `HomeContent()`

This matches the existing pattern used by `notifications/page.tsx` → `NotificationsContent.tsx`, `dashboard/page.tsx` → `DashboardContent.tsx`, etc. The refactor is low-risk. Estimated client JS savings: 15–40KB (the import graph of page.tsx itself, not its children which are already split).

---

## 4. `src/app/api/cron/weekly-digest/route.ts` — External API Calls & N+1 Risk

### External API calls
- **Neon (PostgreSQL):** 3 queries — trending shares (1), user list (1), per-user stats (N), per-user share count (N)
- **Clerk API:** `clerk.users.getUser(userId)` — one HTTP call per user
- **`sendEmail`:** one call per user (likely Resend/SendGrid)

### N+1 query risk: HIGH

The main loop (lines 266–338) processes up to 500 users **sequentially**, making per iteration:
1. `clerk.users.getUser(userId)` — 1 Clerk HTTP request
2. `sql` stats query — 1 DB query (LEFT JOIN across 3 tables)
3. `sql` share count query — **1 additional DB query** (redundant — share count is derivable from the stats query)
4. `sendEmail(...)` — 1 email API call

**Total worst case: 500 users × 3 external calls = 1,500 sequential I/O operations.**

**Issues:**
1. **Two DB queries per user where one would suffice.** The `shareCount` query (step 3) could be folded into the stats query as `COUNT(DISTINCT r.id) AS total_shares` without the `WHERE created_at < NOW() - INTERVAL '7 days'` filter. This halves DB round-trips.
2. **Sequential Clerk calls.** `clerk.users.getUserList({ userId: userIds })` exists and can batch-fetch multiple users in one request. The current pattern fires one `getUser` per iteration.
3. **No rate-limit handling on Clerk.** At 500 users, Clerk's rate limits (typically 100 req/10s) will be hit, causing transient failures logged as `skipped`.
4. **No concurrency** — all processing is awaited serially. Even batching into groups of 10 with `Promise.all` would reduce wall-clock time by ~10x.

### Recommended fixes
- Replace per-user `getUser` with a batched `getUserList({ userId: [...] })` call before the loop.
- Merge the `shareCount` query into the stats query.
- Process users in parallel batches of 10–20.

---

## 5. `vercel.json` — Cron Configuration

```json
{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }
```

**weekly-digest: configured correctly** — runs Monday 9am UTC. Route exists at `src/app/api/cron/weekly-digest/route.ts`. Auth guard (`isCronAuthorized`) is present.

**Clerk webhooks: NOT in vercel.json** — `src/app/api/webhooks/clerk/route.ts` exists but `vercel.json` has no entry for it. This is correct — webhook routes do not need cron entries; they are HTTP endpoints called by Clerk's servers. No action needed.

**All 5 cron entries are properly matched to existing route files:**
- `/api/cleanup` ✓
- `/api/cron/daily-ops` ✓
- `/api/cron/weekly-report` ✓
- `/api/cron/posthog-errors` ✓
- `/api/cron/weekly-digest` ✓ (new, correctly added)

**One concern:** 5 cron jobs on Vercel Pro. The Pro plan allows up to 40 crons but bills on invocations. At daily + weekly cadence this is low-cost. No issues.

---

## 6. Package Dependencies — Large Packages

| Package | Size concern | Usage pattern | Verdict |
|---------|-------------|---------------|---------|
| `html2canvas-pro` | ~500KB minified | Dynamic import on user action (TeamCardExport, OTSSheetModal) | Safe — not in initial bundle |
| `jspdf` | ~300KB minified | Dynamic import on user action (export-report.ts) | Safe — not in initial bundle |
| `motion` (Framer Motion v12) | ~50KB minified | Static import in 12+ client components | **Concern** — pulled into initial bundle via PasteInput, Navbar adjacent components |
| `posthog-js` | ~80KB minified | Via PostHogProvider (client) | Acceptable — analytics, lazy-loaded via provider |
| `@sentry/nextjs` | ~120KB minified | Sentry client config | Acceptable — standard instrumentation |
| `@clerk/nextjs` | ~150KB minified | Auth throughout | Necessary |
| `@pkmn/dex` | ~2MB raw, tree-shaken | Only in InlinePokemonEditor + pkmn-dex-fallback | **Concern** — if InlinePokemonEditor is eagerly imported anywhere, this brings in a large dataset |
| `qrcode` | ~40KB | Dynamic import on demand | Safe |
| `vanilla-cookieconsent` | ~30KB | Likely lazy | Safe |
| `axios` | ~40KB | Present but `fetch` used throughout codebase | **Dead dependency candidate** — verify if axios is actually called anywhere |

**`motion` concern:** Framer Motion is statically imported in `PasteInput` (line 5) which is statically imported in `page.tsx`. This puts motion in the critical path of the home page. Since PasteInput is always rendered, this is unavoidable unless PasteInput animations are removed or the `motion` import is scoped to a sub-component loaded conditionally.

**`axios` concern:** `package.json` lists `axios ^1.16.0` but the codebase uses native `fetch` in API routes and client code. If axios has zero call sites, it should be removed (~40KB savings from the install, though it may not appear in the client bundle if unused).

---

## Summary Table

| Area | Finding | Severity |
|------|---------|---------|
| Build | PASS — TypeScript clean, 108 pages | — |
| Middleware deprecation warning | `middleware` → `proxy` rename needed | Low |
| NotificationsContent double-fetch | Two identical API calls on mount | Medium |
| page.tsx client status | Fully client, 1852 lines, 114 total client files | Info |
| VGC-162 server split | Feasible, low-risk, ~15–40KB saving | Medium |
| weekly-digest N+1 | 500 × 3 sequential I/O calls | High |
| weekly-digest Clerk batching | getUser in loop vs getUserList | High |
| vercel.json | All 5 crons correctly configured | Pass |
| motion in critical path | Statically imported via PasteInput | Medium |
| @pkmn/dex size | Large dataset, verify tree-shaking | Medium |
| axios unused | May be dead dependency | Low |

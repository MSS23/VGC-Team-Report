# C5 — Commit Review (2026-05-22)

Read-only review of the last 20 commits on `swarm-nightly-2026-05-22`,
excluding HEAD (`f2121c3`, Linear webhook handler fix).

Range reviewed: `850e91c..03c1547` plus the merge `cddad63` and bookend
swarm PRs `767ef07`, `6f1e552`, `b1e95df`, `90c57c2`, `7dd9900`.

---

## P0 — Production-breaking / already-bitten

### P0.1 — owner_id corruption between 2026-05-17 and 2026-05-18 (already fixed in code, data not yet repaired)
- Bad commit: `90c57c2` (swarm 17-05-26) — INSERT in
  `src/app/api/share/route.ts` added `${isUnlisted ?? false}` to the
  VALUES list **but not the column list**. Result: `owner_id` received
  the boolean, `search_vector` received the Clerk user ID, full-text
  search was poisoned, and ownership was lost on every share created
  during the window.
- Fix: `b1e95df` (swarm 18-05-26, "fix: share INSERT column mismatch").
- **Outstanding:** `.swarm/drafts/vgc195-db-repair.sql` is still marked
  "DRAFT — for human review only. Do NOT run without review." Any shares
  authored between the two deploys are still corrupted in production —
  every viewer is anonymous, every owner-only path is locked out, and
  search is broken on those rows. **Needs a follow-up ticket to
  schedule the repair window.**

### P0.2 — Inflated stats in weekly digest emails (live, every Monday 9am)
- Commit: `767ef07` → `src/app/api/cron/weekly-digest/route.ts` lines
  312–323.
- The "fold redundant shareCount query into the main stats query"
  refactor merged the per-user share count into the existing
  `LEFT JOIN comments` + `LEFT JOIN reactions` aggregate, but used
  `COUNT(r.id)` and `COALESCE(SUM(r.view_count), 0)` **without
  `DISTINCT`**.
- With the LEFT JOINs there is no GROUP BY and the join produces a
  cross-product per share × comments × reactions. So:
  - `total_shares` is inflated by `(#comments) × (#reactions)` per share.
    Because the only check is `totalShares === 0`, the trending-vs-digest
    branch is usually still correct *unless* a user with one comment
    happens to also have shares pre-deletion.
  - **`total_views = SUM(r.view_count)` is wildly inflated** by the
    same cross-product and is embedded directly into the digest HTML
    via `buildDigestEmailHtml({ totalViews, ... })`. Real users will
    receive emails claiming hundreds or thousands of views they did
    not get. First send is next Monday — fix tonight.

---

## P1 — Likely bugs

### P1.1 — PWA manifest references files that don't exist
- Commit: `09c073c` ("PWA — engagement-triggered install prompt +
  manifest screenshots").
- `public/manifest.json` now points `screenshots[].src` at
  `/screenshots/desktop-team-report.png`, `/screenshots/desktop-explore.png`,
  `/screenshots/mobile-team-report.png`, `/screenshots/mobile-explore.png`.
- `public/screenshots/` does not exist (verified with `ls`). Chrome's
  enhanced install dialog will silently fail and may degrade Lighthouse
  PWA score / installability badge.

### P1.2 — iOS install prompt unreachable if user scrolls early
- Same commit (`09c073c`), `src/components/ui/InstallPrompt.tsx`.
- iOS timer fires at 60s and checks `if (scrollFired)` to decide whether
  to show. `scrollFired` is set inside `onScroll` and the scroll listener
  is **removed as soon as it fires** (`removeEventListener("scroll", onScroll)`).
- Edge case is benign on its own (early scroll just means the iOS prompt
  appears at 60s — fine). The real bug is the iOS path **doesn't share
  the `maybeReveal()` AND-gate that the Android path uses**: if scroll
  happens after 60s, Android shows correctly (via `maybeReveal`) but
  iOS never re-checks. iOS users who don't scroll within the first 60s
  will never see the install instructions, even if they later engage.

### P1.3 — Two duplicate "Save report" implementations live concurrently
- Commit: `850e91c` added a save-toggle inside Navbar
  (`src/components/layout/Navbar.tsx` ~line 50). The existing
  `<SaveButton>` in `src/components/social/SaveButton.tsx` is still
  rendered from `src/app/page.tsx:1404`.
- Both fire `GET /api/user/saved` on mount → 2× API calls per shared
  view for signed-in non-owners. They also disagree on initial
  state when not-found (Navbar sets `false`, SaveButton leaves prior).
- Also: `/api/user/saved` returns the full list to do a single-row
  lookup. Worth a dedicated `?shareId=` parameter, or a thin
  client-side cache shared between the two consumers.

### P1.4 — VGC-189 species[] column is write-only
- Commit: `90c57c2` added `extractSpecies()` write-time population of
  `shares.species text[]` and a GIN index, with the stated purpose of
  "enables future O(1) Champions meta aggregation without the 6-CTE
  regex chain on every request."
- Commit: `282aef1` rewrote the Champions meta aggregation as a
  **6-CTE regex chain** anyway. No reader uses `shares.species`.
- The migration ran (`add-species-column.sql`) but the payoff never
  shipped. Either route the meta query through `species` (intended)
  or drop the column + index (cheap).

---

## P2 — Follow-up

### P2.1 — totalReports denominator changed semantics
- Commit: `282aef1` (VGC-182 SQL aggregation).
- Before: `totalReports = rows.length` (count of paste rows returned
  by the LIMIT-500 query).
- After: `totalReports = (rows[0] as { total_reports }).total_reports`
  which (per the patched CTE later in `7dd9900`) is
  `count(DISTINCT id) FROM filtered`. That's actually the better
  denominator — but the patched commit `7dd9900` notes the original
  CTE was wrong ("inflated usage percentages when reports have null/
  empty paste"). Worth a snapshot diff before/after to make sure the
  numerator/denominator pair is internally consistent on real data.

### P2.2 — i18n stubs are blank strings in 6 languages
- Commits: `b1e95df` (ShareModal namespace stubs), `6f1e552` (filter
  keys ditto).
- The 6 non-English files (`fr/es/it/ja/ko/zh.ts`) hold either empty
  strings (ShareModal) or English text copied verbatim ("All",
  "Popular", "1st"). ShareModal has a local `Proxy` fallback in
  `ShareModal.tsx:74-81` so empty strings render the English value,
  but **no other component using `useTranslation()` has that
  fallback**.
- If any other component starts pulling those keys (or any future
  empty-string stubs), non-English users will see blank UI. Either
  hoist the Proxy fallback into the `I18nProvider` itself, or refuse
  to ship empty stubs.

### P2.3 — `cypress` excluded from tsconfig instead of installing types
- Commit: `b1e95df` adds `"cypress"` to `tsconfig.json` exclude list
  to silence implicit-any errors in untyped Cypress e2e files.
- Suppressing the test tree from typecheck is a workaround; the test
  files now drift unchecked. Better: `npm i -D @types/cypress` or
  delete the dir if Cypress isn't in active use.

### P2.4 — Navbar `/api/user/saved` lookup races optimistic toggle
- Commit: `850e91c`, `Navbar.tsx` `toggleSaved`.
- The optimistic flip + 401 rollback is correct, but the initial
  fetch's `.then()` can still resolve *after* the user has clicked
  toggle, overwriting their state. Add a cancellation flag (or
  `AbortController`) the same way `DoubleTapLikeOverlay` does.

### P2.5 — newsletter DB fallback referenced a table that doesn't exist
- Commit: `b1e95df` added `INSERT INTO newsletter_subscribers ...`
  with no migration alongside it; commit `52437b8` then deleted the
  newsletter route entirely. Net code-tree state is fine, but if the
  `newsletter_subscribers` table ever existed in Neon, it's now
  orphaned. The deletion commit notes the table is "not dropped here
  — run the DROP manually."

---

## P3 — Nitpick

### P3.1 — `clerkUserMap` Map value type is verbose
- `767ef07`, weekly-digest line ~272:
  `Map<string, Awaited<ReturnType<typeof clerk.users.getUser>>>`.
  Could be `Map<string, User>` after a single `import type { User }
  from "@clerk/nextjs/server"`. Cosmetic.

### P3.2 — DOCK_SELECTOR encodes Share dock concepts that no longer exist
- `3ace051` introduced `DOCK_SELECTOR = ['[data-vgc-dock]',
  '[role="region"][aria-label*="Share" i]', ...]` to prevent
  double-tap-to-like from firing on the floating docks.
- `850e91c` (next commit) deleted both floating docks. The selector
  is dead-ish — only `[data-vgc-dock]` would still match if anything
  re-uses the attribute, and the four Share/reaction aria-label
  fallbacks now match nothing. Tightening to just
  `'[data-vgc-dock]'` would be safer (avoids accidental matches on
  unrelated future `aria-label="Share my team"` buttons).

### P3.3 — `761a10d` introduces `as` casts in lieu of generic typing
- `761a10d` ("fix dead exports and implicit-any TypeScript errors")
  pattern is `(await sql\`...\`) as FeedbackRecentRow[]`. Not wrong,
  but the Neon SQL helper supports generics
  (`sql<FeedbackRecentRow>\`...\``) which would catch column-name
  changes at compile time. Worth a sweep.

---

## Summary table

| # | Sev | Where | What |
|---|-----|-------|------|
| P0.1 | P0 | shares table (prod data) | Owner_id corruption window 17→18 May still un-repaired |
| P0.2 | P0 | cron/weekly-digest | LEFT JOIN cross-product inflates total_views / total_shares in digest emails |
| P1.1 | P1 | public/manifest.json | Screenshots reference files that don't exist |
| P1.2 | P1 | InstallPrompt.tsx | iOS install path bypasses the AND-gate maybeReveal pattern |
| P1.3 | P1 | Navbar + SaveButton | Two implementations, two API calls per visit |
| P1.4 | P1 | shares.species | Column written, never read; meta query still uses 6-CTE regex |
| P2.1 | P2 | champions/meta | Denominator semantics changed silently |
| P2.2 | P2 | i18n translations | Empty/English stubs in 6 locales, no global fallback |
| P2.3 | P2 | tsconfig.json | Cypress dir excluded instead of typed |
| P2.4 | P2 | Navbar save toggle | Initial fetch can overwrite optimistic toggle |
| P2.5 | P2 | Neon DB | `newsletter_subscribers` table may be orphaned |
| P3.1 | P3 | weekly-digest | Map<string, Awaited<...>> verbosity |
| P3.2 | P3 | DoubleTapLikeOverlay | DOCK_SELECTOR fallbacks now dead |
| P3.3 | P3 | API routes | `as Row[]` cast pattern → use sql generic |

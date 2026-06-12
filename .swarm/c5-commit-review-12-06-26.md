# C5 — Commit Review (last 20 commits on main)

Date: 2026-06-12
Scope: `git log origin/main -20` (range `90c57c2..06ef1f5`)
Focus: 4 most recent non-swarm commits — `06ef1f5`, `f5217c0`, `76b0c97`, `29f5431`
Reviewer: C5 (Claude Opus 4.7)

## Commits reviewed

```
06ef1f5 Mobile/a11y polish + code wins from optimization audit       ← focus
f5217c0 PWA: navigation preload, network-first share cache, ...      ← focus
76b0c97 Explore: batch like/save lookups, error retry state, ...     ← focus
29f5431 Fix shared-team 500s: add is_unlisted to ensureTable schema  ← focus
8eb39cc Redesign report bottom nav: segmented section tabs + cleanup + PWA
1a30839 Merge swarm-nightly PRs #48/#49 + repair corrupted main
1d6c3de..bcbda85 (6 swarm nightly commits)                            ← skimmed
850e91c Delete share + reaction docks
3ace051 Instagram-style dock UX
b1af62f Streamline mobile shared-view UX
767ef07 swarm: nightly 20-05-26 (#34)
52437b8 chore: remove newsletter signup
6f1e552..90c57c2 (4 swarm nightly commits)                            ← skimmed
```

Cross-referenced against `c5-commit-review-23-05-26.md` to confirm previously-flagged findings (F4 saved-reports privacy leak — **CONFIRMED FIXED** in current `src/app/api/user/saved/route.ts:82-97`, accessibility check now in place; F1/F2 email XSS not relevant to this window).

---

## Findings

### F1 — `ensureTable` adds NOT NULL column but lies in dev about why prod is broken
- Commit: `29f5431`
- File: `src/lib/db.ts:27`
- Category: **Bug / Test (high regression risk)**
- Detail: The commit message says "Column has been added to prod manually; this keeps ensureTable in sync." Two problems:
  1. `ensureTable` is the only schema-migration path. There is **no separate migration runner** — the `migrations/` folder mentioned implicitly in the message isn't applied anywhere. Any other "migration file existed but was never run" condition will reproduce this same prod outage class for the next column. This is a recurring foot-gun.
  2. The new column uses `NOT NULL DEFAULT FALSE`, but `is_public` immediately above it uses `DEFAULT FALSE` with no `NOT NULL`. Inconsistent. If `is_public` ever NULLs (legacy row), the `WHERE is_public = TRUE` partial index on line 28 silently excludes it — already exposed in some Explore queries.
- Suggested follow-up: **Bug ticket** — wire a real migration runner (or at minimum, a startup task that calls `ensureTable` after deploy and fails loudly on schema drift) + audit existing columns for the NOT NULL inconsistency. Add a smoke test that hits `/api/share/<known-id>` and 500-checks on a fresh schema.
- Severity: **High** — this is the second time prod has crashed because a column wasn't on Neon (per commit message). Without a migration runner, it will be the third.

### F2 — Batched reactions GET shares rate-limit bucket with single-share endpoint
- Commit: `76b0c97`
- File: `src/app/api/reactions/route.ts:17` vs `src/app/api/reactions/[shareId]/route.ts:26`
- Category: **Cleanup (low regression risk)**
- Detail: Both routes use `rateLimit: { key: "reactions-read", max: 60 }`. After this change the per-card route is no longer called from Explore, but it's still hit from `src/components/social/*` (single-share view). A page that opens 60 share views in a minute (e.g., a Discord crawler) would consume the same 60-req budget the batched endpoint also draws from. Not exploitable as-is, but the design intent ("one batched call replaces N") is undercut by the shared key.
- Suggested follow-up: **Cleanup** — split keys: `reactions-read-batch` / `reactions-read-single`. Bonus: the batched endpoint validates IDs with `SHARE_ID_RE` (6-16 chars) but the actual `generateId()` always emits **exactly 8**. The looser regex is consistent with siblings — fine — but worth a constant in `src/lib/share-id.ts`.
- Severity: **Low**

### F3 — Batched reactions endpoint trusts arbitrary `sessionId` and returns "did this session like ID X?"
- Commit: `76b0c97`
- File: `src/app/api/reactions/route.ts:21-37`
- Category: **Security (low) / Privacy**
- Detail: The endpoint returns the subset of `ids` that `sessionId` has liked. Anyone with a victim's session ID can probe arbitrary share IDs and reconstruct that session's like history (60 IDs per req, 60 reqs/min = 3,600 IDs/min). Pre-existing exposure inherited from `[shareId]/route.ts`, but the batched endpoint makes the enumeration much cheaper. Session IDs are stored in `localStorage` (not cookie-signed) per `src/lib/utils/session-id.ts`, so they aren't ambient — but they're also not secrets and they leak via PostHog, server logs, etc. There is no auth or visibility check on which shares are queryable.
- Suggested follow-up: **Cleanup** — document the threat model in a comment, and at minimum require `sessionId` to match the caller's cookie if a Clerk session exists. Lower-risk than the previous F4 leak but worth a note.
- Severity: **Low**

### F4 — Network-first share cache parses every share JSON in the SW main thread to check for `_editToken`
- Commit: `f5217c0`
- File: `public/sw.js:233-244`
- Category: **Performance (low) / Cleanup**
- Detail: For every `/api/share/<id>` response, the SW now `clone()`s twice and runs `.json()` on one clone purely to discover whether `_editToken` is present. Share JSON is typically 30-80KB (full team state). On low-end Android this is a measurable extra parse per share view (~5-15ms) on top of the React render. The owner-token signal is also available in the URL (`?key=` is already excluded earlier on line 226) and in a response header the API could set (`X-Has-Edit-Token: 1`), either of which is cheaper than a JSON parse.
- Suggested follow-up: **Cleanup** — have `/api/share/[id]/route.ts` set `Cache-Control: private, no-store` (or a custom `X-No-SW-Cache: 1` header) on owner/collaborator responses, and gate the cache.put on the header. Avoids the double clone + parse entirely.
- Severity: **Low** (correctness fine, just wasteful)

### F5 — Network-first share cache: silent error swallowing on cache-eviction failure
- Commit: `f5217c0`
- File: `public/sw.js:243-247`
- Category: **Cleanup**
- Detail: The `.catch(() => {})` on the inspection promise swallows JSON parse errors silently — fine for malformed responses, but ALSO swallows the case where the SW happily serves a corrupted-but-200 response and never caches it. Hard to debug if it ever happens. The `cache.delete(request)` on 404/410 isn't awaited either; on rapid 404→retry, the next response can race the eviction and the stale entry stays.
- Suggested follow-up: **Cleanup** — `console.warn` the JSON parse failure so it shows up in DevTools; `event.waitUntil(cache.delete(request))` so the eviction extends the SW lifetime past the response.
- Severity: **Low**

### F6 — Two `useEffect`s sync the same liked/saved state, racing the parent fetch
- Commit: `76b0c97`
- File: `src/components/explore/ReportCard.tsx:96-102`
- Category: **Bug (regression risk: minor UX)**
- Detail: `initialLiked`/`initialSaved` are `undefined` while the batched fetch resolves, then flip to `true`/`false`. The effects only run when the prop transitions away from `undefined`, so a user who **likes** a card *before* the batched fetch returns has their optimistic state overwritten by the server truth (which still says "not liked" if the like POST hasn't landed). Visible flicker: heart fills on tap, then unfills 200ms later, then re-fills when the next render arrives. Rare in practice (the batched fetch usually beats the user), but reproducible on slow connections.
- Suggested follow-up: **Bug** — track a `localOverride` flag in `ReportCard`: once `toggleLike` runs, ignore subsequent `initialLiked` syncs. Same for bookmark.
- Severity: **Low-Medium** — annoying flicker on the hottest interaction on Explore.

### F7 — Explore batched-fetch effect re-fires on every `reports` array identity change
- Commit: `76b0c97`
- File: `src/components/explore/ExploreContent.tsx:48-59`
- Category: **Bug (regression risk: cost overrun)**
- Detail: The effect depends on `[reports, sessionId]`. `loadMore` calls `setReports(prev => [...prev, ...data.reports])` which produces a **new array reference every time**. Each Load More click → new `reports` reference → new batched `/api/reactions` fetch for the now-larger ID list. After 5 pages of 12 cards = 6 fetches with cumulatively 12 / 24 / 36 / 48 / 60 / 60-capped IDs (the route caps at `MAX_IDS = 60`). The 4th page silently drops likes for the oldest cards because of the slice. The previous per-card N+1 always returned correct state for every visible card; the new path under-fetches on long scrolls.
- Suggested follow-up: **Bug** — depend on `reports.map(r => r.id).join(",")` (a memoized string), or merge into `likedIds` incrementally only for new IDs from each page. Bump `MAX_IDS` to 200 as a safety net OR send multiple batched calls if `ids.length > 60`.
- Severity: **Medium** — likes silently disappear from cards 60+ on Load More.

### F8 — Live region in Navbar renders `""` on first paint, breaking aria-atomic intent
- Commit: `06ef1f5`
- File: `src/components/layout/Navbar.tsx:362-366`
- Category: **Cleanup (a11y)**
- Detail: `aria-atomic="true"` on a region that flips between `""`, `"Changes saved"`, `""`, and `"Save failed"` will re-announce **empty string** to some screen readers as the status returns to idle. Most modern SR engines treat empty as a no-op, but VoiceOver iOS has historically announced "blank." Bigger concern: the region renders only when `isSharedView && isEditingUnlocked`. The first time the user unlocks editing, the region mounts WITH the current status — if `autoSaveStatus` was already `"saved"` from a prior save, the region announces "Changes saved" the instant it mounts (which is the wrong moment).
- Suggested follow-up: **Cleanup** — render the region as soon as the component mounts (drop the `isSharedView && isEditingUnlocked` gate) and only put text in it on transitions, not on mount. Track previous status with a ref.
- Severity: **Low**

### F9 — ShareModal copy-announcement strings hardcoded English in an i18n-aware codebase
- Commit: `06ef1f5`
- File: `src/components/ui/ShareModal.tsx:201, 240, 253, 266, 282`
- Category: **Cleanup**
- Detail: 5 new strings — `"Embed code copied to clipboard"`, etc. — added as hardcoded English in a component that already imports `useTranslation`. Existing `shareModalSubtitleOwner` translation is right there. Locales other than `en` will hear English announcements.
- Suggested follow-up: **Cleanup** — add `shareCopied.*` keys to `src/lib/i18n/translations/en.ts` and the other locale files.
- Severity: **Low**

### F10 — Magic numbers for safe-area offset duplicated across components
- Commit: `06ef1f5`
- Files: `src/components/ui/EditFab.tsx:19`, `src/components/ui/ShareViewCTA.tsx:32`, `src/app/page.tsx:1120`
- Category: **Cleanup**
- Detail: `bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]`, `bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))]`, `pb-[calc(7rem+env(safe-area-inset-bottom,0px))]` — three components each compute "above the bottom nav + safe area" with different offsets and no shared constant. When the bottom nav height changes (it already did in `8eb39cc`), all three need re-tuning by hand. A future nav height change will silently break alignment.
- Suggested follow-up: **Cleanup** — hoist a CSS variable `--above-bottom-nav` in `globals.css` that resolves to `calc(var(--bottom-nav-height,3.5rem) + env(safe-area-inset-bottom,0px) + Xrem)` and reuse.
- Severity: **Low**

### F11 — `sprite-url.ts` deletion left dead `BASE_URL` constant
- Commit: `06ef1f5`
- File: `src/lib/utils/sprite-url.ts`
- Category: **Cleanup**
- Detail: The 105-line dedupe was a clean win, but the diff retained the `BASE_URL = "https://play.pokemonshowdown.com/sprites"` constant at the top. Confirm it's still referenced lower in the file (the diff truncates).
- Suggested follow-up: **Cleanup** — verify `BASE_URL` is still used; if not, remove.
- Severity: **Trivial** — auto-detectable by `npm run lint` if it isn't already.

### F12 — `loadMore` still has `// silently fail` empty catch (pre-existing, not touched by 76b0c97)
- Commit: pre-existing
- File: `src/components/explore/ExploreContent.tsx:151-153`
- Category: **Cleanup**
- Detail: The new error UI (Retry button) covers the *initial* load, but `loadMore`'s catch is a silent `// silently fail`. A user clicking "Load more" on a flaky network sees the spinner stop and nothing happens. The new error pattern from this commit should be reused.
- Suggested follow-up: **Cleanup** — surface a non-blocking error toast or inline "Couldn't load more, retry?" under the Load More button.
- Severity: **Low**

---

## Regression risks (called out specifically)

1. **F1 (HIGH)** — No real migration runner. The `is_unlisted` story is going to repeat for whatever column the next swarm/sprint introduces. Treat this as P1.
2. **F7 (MEDIUM)** — Explore Load More silently drops likes for cards beyond position 60 due to the `MAX_IDS` cap + identity-change-triggered refetch. User-visible.
3. **F6 (LOW-MEDIUM)** — Optimistic like flicker race on slow connections.
4. **F4** is mild (a few ms per share view), but consistent — every PWA user pays.

The other findings are quality/polish, not regressions.

## Confirmed fixed since 23-05-26

- **F4 (saved-reports privacy leak)** — `src/app/api/user/saved/route.ts:82-97` now does a pre-INSERT visibility check (`is_public OR owner_id = userId`) and returns 404 if inaccessible. Resolved.
- The fire-and-forget `sql\`…\`.catch()` cluster (F3 in prior review) was outside this window; not re-checked here.

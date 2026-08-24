# C5 — Commit Review: last 20 commits on `origin/main`

Range reviewed: `9829faf` (2026-08-11) → `415a281` (2026-08-23). Read-only review; no files modified outside `.swarm/`.

---

## Summary verdict

The run is **converging, not churning**. 12 of 20 commits carry test changes, regressions get named tests, and several commits actively remove duplication rather than patch around it (`getRestrictedBase` → `getRegulationLookupKey`). Commit messages are unusually good — they state the mechanism, not just the symptom.

Two systemic gaps produced almost every finding below:

1. **UI/Tailwind changes have no automated gate.** A broken class-string concatenation shipped to `main` and is live in `SpeedTierChart.tsx` — it silently voids both the 44px touch-target fix the commit claims to make *and* the font-size class it swallowed. Nothing in tsc/eslint/vitest can see it.
2. **The `src/lib/` test convention is applied inconsistently.** Four modules changed or created in `src/lib/` shipped without a test: `detect-archetype.ts`, `item-boosts.ts`, `pokepaste.ts`, `analyze-team.ts`.

A third theme: several fixes are applied **per-call-site** where the cause is structural (satellite-table deletes with no FK cascade; a hand-mirrored zod schema; a keyset-pagination cursor that lost precision).

---

## HIGH

### H1 — Broken Tailwind class concatenation voids the touch-target fix (and eats the font size)

- **Commit:** `0024679` "fix: mobile touch and layout fixes across report UI"
- **File:** `src/components/report/SpeedTierChart.tsx:132`, `:482`, `:500`
- **Still present on `origin/main` and in the working tree.**

```
min-h-11text-[10px]     line 132
min-h-11text-xs         lines 482, 500
```

A missing space fuses two classes into one nonexistent token. Consequences:
- `min-h-11` never applies → the speed-chart modifier pills and the Mega Forms / Meta Threats toggles still miss the 44×44px touch minimum, i.e. the commit's stated fix does nothing on exactly these three controls.
- `text-[10px]` / `text-xs` are destroyed too → those buttons render at inherited font size, a visual regression the commit did not intend.

The sibling fix in `PokemonDetailSlide.tsx:933` (`py-2 min-h-11 rounded-lg`) was written correctly, so this is a slip, not a misunderstanding. Notably `ui-checklist-reviewer` is mandated by CLAUDE.md for `.tsx` changes and either was not run or did not catch it.

- **Severity:** high (shipped, user-visible, defeats the commit's own purpose)
- **Action — trivial, fix in passing:** insert the missing space at all three sites.
- **Action — Linear ticket:** add a cheap guard so this class of typo cannot ship again. A vitest scan over `src/components/**/*.tsx` for `/\b(min-h|max-h|min-w|max-w|py|px|gap|p|m)-[\w[\]./-]*?(text|bg|border|rounded|flex|items|justify)-/` catches fused utilities; or wire the Tailwind v4 CSS-first build to fail on unknown utilities.

---

## MEDIUM

### M2 — `next` pin loosened from exact to a caret range during a CVE bump

- **Commit:** `d44b93a`
- **File:** `package.json:33`
- `"next": "16.2.6"` → `"next": "^16.3.0"`

The commit message describes a 16.2.6 → 16.3.0 upgrade; it does not mention loosening the constraint. Every other framework-critical dep here was pinned exact. With `^`, the next lockfile refresh or a fresh CI install can pull an unreviewed Next minor into a Vercel build — the opposite of what a security-hardening commit wants.

- **Severity:** medium
- **Action — trivial, fix in passing:** re-pin to the exact version currently in `package-lock.json`.

### M3 — Explore keyset pagination: `date_trunc` in `WHERE`, full precision in `ORDER BY`

- **Commit:** `82f9210`
- **File:** `src/app/api/explore/route.ts:193`, `:207`, `:223`, `:225`
- Related: `src/lib/explore/chronological-cursor.ts:19` (cursor is `Date.toISOString()` → millisecond precision), route lines 331–338.

The real cause is that the cursor serializes JS millisecond precision while Postgres `timestamptz` stores microseconds. The fix truncates the *column* to milliseconds inside the predicate. Three problems:

1. **Keyset invariant broken.** `WHERE (like_count, date_trunc('milliseconds', s.created_at)) < (...)` but `ORDER BY COALESCE(rc.like_count,0) DESC, s.created_at DESC` — the filter key and the sort key are now different expressions. Keyset pagination is only correct when they are identical.
2. **`popular` and `views` still skip rows.** With no `s.id` tiebreaker in either the tuple or the `ORDER BY`, every row sharing the cursor's `(like_count, millisecond)` fails the strict `<` and is dropped — including rows never returned on the previous page. The chronological branch (line 223) *does* carry `s.id`; the other two do not. The bug the commit set out to fix is only fixed on one of three paths.
3. **Non-sargable.** Wrapping `s.created_at` in `date_trunc` prevents any index on `created_at` from being used for the range predicate, on the site's hottest listing query.

- **Severity:** medium (correctness + performance, on the main feed)
- **Action — Linear ticket:** drop the `date_trunc` wrappers; carry full-precision timestamps through the cursor (`toISOString()` loses microseconds — serialize the raw PG value, or make `s.id` the sole tiebreaker) and add `s.id DESC` to both the tuple and the `ORDER BY` on the `popular` and `views` branches so all three paths use the same shape as `chronological`. `src/lib/explore/__tests__/chronological-cursor.test.ts` already exists — extend it.

### M4 — Satellite-row cleanup is hand-maintained per call site; one site already missed

- **Commit:** `fd0aa6f`
- **Files:** `src/app/api/cleanup/route.ts:28-45`, `src/app/api/comments/[shareId]/[commentId]/route.ts:79`, `src/app/api/user/delete/route.ts:65`, schema at `src/lib/db.ts:62-71`

`comment_flags` is declared with `comment_id INTEGER NOT NULL` and **no foreign key**, so nothing cascades and every deletion site must remember it by hand. `fd0aa6f` added the purge to `cleanup` and to the single-comment DELETE — but **`src/app/api/user/delete/route.ts:65` deletes `comments` for a user's shares and never touches `comment_flags`**, so account deletion still leaves exactly the orphan class this commit was closing. Same gap applies to the other satellites the commit added to `cleanup` (`collection_items`, `collaborators`, `notifications`) — `user/delete` has its own hand-ordered list.

Secondary: `purgeSatellites` fires eight independent `await sql\`DELETE…\`` statements with **no transaction**, while `user/delete` correctly uses `sql.transaction([...])`. A mid-sequence failure in the cleanup cron leaves partial orphan state.

- **Severity:** medium
- **Action — Linear ticket:** (a) add the `comment_flags` purge to `user/delete`; (b) wrap `purgeSatellites` in `sql.transaction`; (c) the durable fix — a migration adding `REFERENCES comments(id) ON DELETE CASCADE` (and the equivalent on the other satellite tables) so no future delete path can forget.

### M5 — `detect-archetype` infers the format from EV magnitudes instead of being told it

- **Commit:** `1b14f3b`
- **File:** `src/lib/analysis/detect-archetype.ts:82-92`

```ts
const isSpScale = pokemon.length > 0 && pokemon.every((p) => {
  const evs = p.parsed.evs;
  if (!evs) return true;
  return Object.values(evs).reduce((a, b) => a + (b ?? 0), 0) <= CHAMPIONS_TOTAL_SP;
});
const evScale = isSpScale ? CHAMPIONS_MAX_SP_PER_STAT / 252 : 1;
```

`detectArchetypes` only receives `AnalyzedPokemon[]`, so it guesses the stat system from the numbers. Any classic-VGC paste whose every member totals ≤ 66 EVs is treated as SP-scale, and the thresholds collapse to `200 × 32/252 ≈ 25` and `100 × 32/252 ≈ 13`. Per CLAUDE.md, a paste with no EVs line yields an all-zero spread — and a lightly-invested Reg G team can then be tagged "Hyper Offense" off 26 EVs. The caller in `useHomePage.ts` already knows the regulation (`tags.regulation`, `isChampionsFormat`); the detector should take it as a parameter rather than infer it.

Also: `200`, `100`, `252` remain inline magic numbers, now multiplied by a derived scale factor, which makes the thresholds harder to reason about than before.

- **Severity:** medium
- **Action — Linear ticket:** pass `regulation` (or an explicit `statSystem: "ev" | "sp"`) into `detectArchetypes`; hoist the thresholds to named constants per system. Ship it with the missing test file (see M9).

### M6 — Share-route `commonModes` schema is a hand-copy of `ShareableStateSchema`

- **Commit:** `44f780c`
- **File:** `src/app/api/share/route.ts:24-40` — the comment literally says *"same shape as ShareableStateSchema"*
- Canonical schema: `src/lib/sharing/url-codec.schemas.ts:57`

The bug being fixed was "zod silently stripped `combinations[]` on every save". The fix adds that one field back by hand to the duplicate schema. The two schemas remain independently maintained, and the failure mode is silent data loss on save — so the next field added to `ShareableStateSchema` reproduces the identical bug. `src/app/api/user/drafts/route.ts:15` already imports `ShareableStateSchema` directly, so the good pattern exists in the codebase.

- **Severity:** medium (symptom fixed, cause untouched, failure mode is silent)
- **Action — Linear ticket:** derive the share-route body schema from `ShareableStateSchema` (`.pick()`/`.extend()`), or at minimum add a test asserting the two `commonModes` shapes have identical key sets.

### M7 — Linear webhook replay check fails open when the timestamp field is absent

- **Commit:** `a099f97`
- **File:** `src/app/api/webhooks/linear/route.ts:66-72`

```ts
// ponytail: no delivery-id dedupe — within the window a replay is
// possible; add a seen-id cache if this webhook ever mutates state.
if (typeof body.webhookTimestamp === "number") { … }
```

Two things:
- **Leftover `ponytail:` marker** in shipped code (the task's explicit target).
- The window check is guarded by `typeof … === "number"`. Linear always sends `webhookTimestamp`, so a payload lacking it is either a spoof attempt or a format change — and in both cases the code skips replay protection entirely rather than rejecting. Fail-closed is the right default for an auth-adjacent check.

- **Severity:** medium
- **Action — Linear ticket:** reject (401) when `webhookTimestamp` is missing or non-numeric; either implement the delivery-id dedupe the marker describes or convert the marker into a ticket reference and delete it from the source.

### M8 — Unhandled rejections on every new lazy-import path

- **Commits:** `415a281`, `6cec919`
- **Files:** `src/hooks/useTeamReport.ts:47`, `:62`; `src/hooks/useHomePage.ts:673`, `:698`; `src/app/page.tsx:~292`

Every new dynamic import is `void import("…").then(…)` with **no `.catch()`**. If a chunk fails to load — stale tab after a deploy, flaky network, CDN hiccup — the promise rejects unhandled and the UI simply never updates: paste produces no report, with no error state and no retry.

This interacts badly with `6cec919`, which moved `ChunkErrorReloader` — the component whose entire job is detecting `ChunkLoadError` / `Failed to fetch dynamically imported module` and reloading once (`src/components/ui/ChunkErrorReloader.tsx`) — behind its own `ssr:false` dynamic boundary in `DeferredLayoutExtras.tsx`. The recovery mechanism is now itself a chunk that can fail to arrive, in the same release that multiplied the number of chunks a first-paint user must fetch. `ChunkErrorReloader` does listen for `unhandledrejection`, so it *would* catch these — if it loaded.

- **Severity:** medium
- **Action — Linear ticket:** add `.catch()` to each dynamic import with a visible error/retry state; keep `ChunkErrorReloader` (only) as a static import in `layout.tsx` — it is tiny and it is the safety net for everything else being deferred.

Related, same commit: `src/app/layout.tsx:99` adds `<link rel="preconnect" href="https://play.pokemonshowdown.com" crossOrigin="" />`. `crossOrigin=""` opens an *anonymous/CORS* connection, but sprites are fetched by plain `<img>` with no `crossorigin` attribute — a different connection pool. The preconnect will not be reused by the LCP image it was added for. **Trivial fix in passing:** drop the `crossOrigin` attribute.

### M9 — New/changed `src/lib/` logic shipped without tests (CLAUDE.md convention)

| Commit | Module | Gap |
|---|---|---|
| `1b14f3b` | `src/lib/analysis/detect-archetype.ts` | No `__tests__/detect-archetype.test.ts` exists at all. The commit added the `evScale`/`isSpScale` branch and swapped the mega-stone detector — substantial new logic, zero coverage. |
| `82f9210` | `src/lib/analysis/item-boosts.ts:9,36` | Booster Energy ability match made case-insensitive; `item-boosts.test.ts` was not touched and has no case-variant case (existing tests all pass `"Protosynthesis"` title-cased). Regression with no test naming the bug. |
| `82f9210` | `src/lib/utils/pokepaste.ts:1` | `www.` accepted in `POKEPASTE_REGEX`; no `__tests__/pokepaste.test.ts` exists. |
| `415a281` | `src/lib/analysis/analyze-team.ts` (new) | New module, no direct test. `homepage-eager-imports.test.ts` is a static-import tripwire, not a test of `analyzeTeam`. Behaviour is covered only indirectly via `useTeamReport.test.ts`. |

- **Severity:** medium in aggregate
- **Action — Linear ticket:** one "test debt" ticket covering all four; `detect-archetype` is the one that matters most (most branches, zero coverage, and M5 is about to change it).

### M10 — `notificationsRef.current = notifications` assigned during render

- **Commit:** `a1255c1`
- **File:** `src/hooks/useNotifications.ts:22-25`

A ref mutation in the render body is a render-phase side effect — not safe under React 19 concurrent rendering or StrictMode double-render, where a torn-down render can leave the ref holding state that was never committed.

- **Severity:** medium (latent; correct today, fragile)
- **Action — Linear ticket (small):** move the assignment into a `useEffect`, or compute the unread delta inside the `setNotifications` functional updater and drop the ref.

### M11 — `ReportCard` "touched" flags permanently sever server sync

- **Commit:** `a1255c1`
- **File:** `src/components/explore/ReportCard.tsx:99-107, 114, 138`

`likeTouchedRef` / `saveTouchedRef` are set to `true` **before** the request fires and are never reset — including when the request fails and the optimistic state is reverted. From the first tap onward that card ignores every batched refetch for the rest of its mount, so it can silently diverge from server truth. The underlying cause is that the batched lookup carries no version/ordering information, so the client cannot tell a stale response from a fresh one; the flag is a blunt stand-in.

- **Severity:** medium
- **Action — Linear ticket:** reset the flags once the request settles successfully, or version the batched lookup response and drop stale ones by comparison instead of latching.

---

## LOW / trivial

### L12 — Leftover `ponytail:` marker: Dry Skin not modelled
`9829faf` · `src/lib/data/type-chart.ts:189`
```
// ponytail: Dry Skin's extra Fire weakness isn't modeled — immunities only.
```
Dry Skin holders correctly show Water 0×, but Fire renders at the plain type multiplier instead of 1.25×, so the defensive chart understates a real weakness. **Action:** small Linear ticket (needs a multiplier mechanism, not just a lookup-table entry) and remove the marker when done.

### L13 — Blanket `eslint-disable react-hooks/exhaustive-deps` over 12 lines
`a1255c1` · `src/hooks/useExploreUrlSync.ts:138-151`. `useCallback(makeSetter("query"), [])` is not a form the lint rule can verify, so the whole block is suppressed. **Action — trivial:** replace with a single `useMemo(() => ({ setQuery, setSort, … }), [])` built from one `makeSetter` closure, and delete the disable block.

### L14 — `LIMIT 100` with no pagination silently truncates two list endpoints
`fd0aa6f` · `src/app/api/creator/[name]/route.ts:60` and `src/app/api/user/saved/route.ts:37`. Correct as a payload guard, but a prolific creator's profile and a heavy user's saved list now cut off at 100 with no cursor and no "showing N of M" signal. **Action:** low-priority ticket to add cursor pagination (the explore route's cursor helper can be reused).

### L15 — `keepalive` on the exit flush still throws for large reports
`9897389` · `src/hooks/useAutoDraft.ts:91`. The in-session fix is right, but the exit path retains `keepalive: true` and therefore still fails hard above the browsers' 64 KiB body cap — the exact failure being fixed, just narrowed to the one save that most needs to land. The commit calls it "worth the size gamble"; no ticket was filed. **Action:** small ticket — measure the body and fall back to a non-`keepalive` fetch (or trim to a delta) above ~60 KiB.

### L16 — `isDifferentTeam` compares species strings from two different extractors
`0f73ba3` · `src/lib/utils/extract-species.ts:24-30`, caller `src/hooks/useHomePage.ts:765`. `prevSpecies` comes from the full Showdown parser (`p.parsed.species`); `next` comes from the lightweight `extractSpecies`. Exact-string set membership across two independent normalizations means any divergence (form suffixes, gender markers, nicknames) reads as "different team" and silently starts a fresh draft. **Action — trivial:** normalize both sides (lowercase + strip non-alphanumerics) before comparing. The heuristic itself — "any shared species ⇒ same team" — is documented and acceptable.

### L17 — `postToBuildsChannel` logs but does not report failure
`0242253` · `src/lib/discord-webhook.ts:29-32`. Non-2xx now `console.error`s, but the function still returns `void`, so a cron that posts to Discord and then reports "notified #builds" continues to claim success on a 410/429. **Action — trivial:** return a boolean and let callers include it in their summary.

### L18 — `catch { /* ignore */ }` in `markPastePublished`
`bc7dffd` · `src/hooks/useTeamReport.ts:88-90`. Consistent with the file's existing localStorage handling, so acceptable — flagged only for completeness.

### L19 — `deadline` referenced inside `shutdown` before its `const` declaration
`fd0aa6f` · `src/app/api/sync/[id]/route.ts:170-188`. Safe at runtime (`shutdown` never runs before the assignment) but a TDZ hazard one refactor away. **Action — trivial:** hoist `let deadline: ReturnType<typeof setTimeout>` above `shutdown`.

### L20 — Doc-drift tests assert exact prose
`1db8419` · `src/lib/analysis/__tests__/sp-docs-drift.test.ts:20-31` asserts literal strings like `` `${CHAMPIONS_TOTAL_SP} SP total` `` and `"66 total SP"`. Pinning the numbers to the constants is exactly right; pinning the surrounding *wording* means an innocuous copy edit fails CI while the docs remain correct. **Action — trivial:** relax to a regex around the number (`/66\s+(total\s+)?SP/`).

---

## Churn analysis — are fixes staying fixed?

File touch counts across the 20 commits (`src/` only; every other file appears once):

| Count | File | Commits (oldest → newest) |
|---:|---|---|
| 3 | `src/hooks/useHomePage.ts` | `0f73ba3` draft reset · `bc7dffd` published marker · `415a281` lazy imports |
| 3 | `src/app/page.tsx` | `c4c6c75` banner gating · `6cec919` lazy report components · `415a281` lazy mega-detect |
| 2 | `src/lib/validation/champions-legality.ts` (+ its test) | `1b14f3b` species clause / 510 EV · `82f9210` shared form-strip |
| 2 | `src/lib/utils/extract-species.ts` (+ its test) | `0f73ba3` `isDifferentTeam` · `82f9210` `===` header skip |
| 2 | `src/lib/data/type-chart.ts` (+ its test) | `9829faf` ability immunities · `1b14f3b` missing Bug/Poison |
| 2 | `src/hooks/useTeamReport.ts` (+ its test) | `bc7dffd` publish marker · `415a281` lazy analyze |
| 2 | `src/components/report/SpeedTierChart.tsx` | `a1255c1` memoize meta threats · `0024679` touch targets |
| 2 | `src/app/api/share/route.ts` | `44f780c` zod schema · `d44b93a` client IP |
| 2 | `src/app/api/explore/route.ts` | `d44b93a` client IP · `82f9210` search + cursor |

**Read: converging.** No file is re-fixed for the same reason. Every repeat visit addresses a distinct concern, and no commit in the window reverts or re-patches an earlier one. Three concrete convergence signals:

- **Duplication actively collapsed.** `82f9210` deleted `getRestrictedBase`'s private suffix-strip list and pointed it at `getRegulationLookupKey` *specifically so the two lists cannot drift* — the opposite of the copy-paste reflex.
- **Regressions get named tests.** `1b14f3b`, `9829faf`, `0f73ba3`, `82f9210`, `bc7dffd`, `9897389`, `b865fa2`, `1db8419` each land a test whose name states the bug. `9897389` went further and corrected a test that had been *pinning the buggy behaviour* (`keepalive: true` on every save).
- **Tripwire tests instead of re-fixes.** `b865fa2` (no route may parse `x-forwarded-for`), `415a281` (no eager heavy imports on the homepage) and `1db8419` (docs pinned to constants) each convert a fixed bug into a permanent guard.

**The two soft spots:**

1. `src/lib/data/type-chart.ts` was corrected twice in three days for two unrelated data errors (missing Poison-resists-Bug; ability immunities). Both are *completeness* failures in a static table. One `it.each` test comparing `TYPE_CHART` against a canonical Gen 9 matrix would have caught both at once and would prevent a third visit. **Recommended ticket.**
2. `src/app/page.tsx` + the perf pair `6cec919` → `415a281` on consecutive days is one bundle-size job split across two commits — iterative rather than churning, but it did leave the `ChunkErrorReloader` deferral (M8) unreviewed in the second pass.

**Bottom line:** the process is working; the escapes are concentrated where the pre-commit gate is blind. `tsc` + `vitest` + `next build` cannot see a fused Tailwind class (H1), a loosened semver range (M2), or a hand-mirrored zod schema (M6). Those three are the highest-leverage places to add a check.

---

## Recommended Linear tickets (priority order)

1. **H1** — fix `min-h-11text-*` in `SpeedTierChart.tsx` (3 sites) + add a fused-utility scan test. *Bug — first per CLAUDE.md.*
2. **M4** — `comment_flags` orphans in `user/delete`; transaction around `purgeSatellites`; FK `ON DELETE CASCADE` migration.
3. **M3** — explore keyset pagination: full-precision cursor, `s.id` tiebreaker on all three branches, drop `date_trunc`.
4. **M8** — `.catch()` on every lazy import + statically import `ChunkErrorReloader`.
5. **M5 + M9** — pass regulation into `detectArchetypes`, hoist thresholds, add `detect-archetype.test.ts`; plus tests for `item-boosts` case-insensitivity, `pokepaste` `www.`, `analyze-team`.
6. **M6** — derive the share-route `commonModes` schema from `ShareableStateSchema`.
7. **M7** — Linear webhook: fail closed on missing `webhookTimestamp`; resolve the `ponytail` dedupe marker.
8. **M11 / M10** — `ReportCard` touched-flag latching; `useNotifications` render-phase ref write.
9. **Type-chart completeness test** (churn spot 1).
10. **L12 / L14 / L15** — Dry Skin modelling; pagination for creator + saved lists; large-body exit flush.

**Trivial, fix in passing (no ticket):** M2 (re-pin `next`), the `crossOrigin=""` preconnect, L13 (eslint-disable block), L16 (normalize species comparison), L17 (return a boolean), L19 (hoist `deadline`), L20 (relax prose assertions).

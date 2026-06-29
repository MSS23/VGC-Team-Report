# C5 — Commit Review (commits since 23-05-26 review)

Date: 2026-06-29
Scope: 25 new commits on `origin/main` since prior checkpoint `850e91c`
(range `850e91c..abd9872`).
Prior review: `.swarm/c5-commit-review-23-05-26.md`.
Reviewer: code-review (Claude / C5 subagent)

## Commits reviewed (newest first)

```
abd9872 Update PostHog SDKs to clear outdated-version alerts
97dc8bb Enforce true private reports + visibility-toggle hardening
6a20445 Fix Modes section silently not saving on shared/draft reports
2f928ab Add Pokémon Champions Regulation M-B support
2d0e843 Fix history.replaceState rate-limit crash on Explore search
0c81ac1 Fix Chien-Pao (Treasures of Ruin) sprite in team preview
da8a75d Add Home button to report presentation view
e271ef1 Replace presentation "Exit" with role-based control
0b2c87a Fix report swipe nav + fit coverage charts on mobile
6d32c47 VGC-243: stop Manage Access panel from flashing
886119a VGC-242: speed tiers now reflect Mega base stats
a3a5a70 Add mission statement under landing tagline
32cb21e Restructure report: team-first overview, Common Modes slide, remove replays
06ef1f5 Mobile/a11y polish + code wins from optimization audit
f5217c0 PWA: navigation preload, network-first share cache, real maskable icons
76b0c97 Explore: batch like/save lookups, error retry state, 44px touch targets
29f5431 Fix shared-team 500s: add is_unlisted to ensureTable schema
8eb39cc Redesign report bottom nav: segmented section tabs + cleanup + PWA
1a30839 Merge swarm-nightly PRs #48/#49 + repair corrupted main
1d6c3de swarm: nightly improvements 26-05-26 (#47)
484fa50 swarm: nightly improvements 25-05-26 (#46)
709ca2d swarm: nightly improvements 24-05-26 (#38)
6981f23 swarm: nightly improvements 23-05-26 (#37)
ae4b3b4 swarm: nightly improvements 22-05-26 (#36)
bcbda85 swarm: nightly improvements 21-05-26 (#35)
```

**Overall verdict:** the privacy/visibility work in `97dc8bb` + `6a20445` is
the standout — well-thought-out, defensive, and closes the gap C5 last
flagged. The swarm runs (especially `1a30839`) landed a backlog of XSS,
webhook-auth, and admin-route hardening fixes from prior C5 findings, plus
shipped a sizeable bundle cut. Some debt accumulated around schema duplication,
i18n type leaks, and a duplicated component export.

---

## Findings

### F1 — Duplicate `BreadcrumbJsonLd` + `BreadcrumbListJsonLd` exports
- Commit: `1a30839` (repair merge), originally introduced 6981f23 / 1d6c3de
- File: `src/components/seo/JsonLd.tsx:151–193`
- Category: **Tech-Debt / Maintenance**
- Detail: After the merge repair, BOTH `BreadcrumbJsonLd` and
  `BreadcrumbListJsonLd` are exported and emit *identical* BreadcrumbList
  schema.org JSON-LD. Only `creator/[name]/page.tsx` imports
  `BreadcrumbJsonLd`; the other five pages use `BreadcrumbListJsonLd`. Two
  names for one component means a future contributor will guess wrong.
- Suggested fix: collapse to a single export (prefer `BreadcrumbListJsonLd`,
  matching the schema.org type name), update `creator/[name]/page.tsx`, delete
  the older alias.
- File a Linear ticket: **YES** (small).

### F2 — Duplicate Zod schema for `commonModes` / `privateFields`
- Commit: `6a20445` (Fix Modes section silently not saving)
- Files: `src/app/api/share/route.ts:18–63`,
  `src/app/api/user/drafts/route.ts:13–42`
- Category: **Tech-Debt**
- Detail: The same `commonModes` (with all 5 sub-fields) and `privateFields`
  schemas are copy-pasted into two route files. The whole reason this bug
  existed in the first place was that the schemas drift — `.strip()` silently
  dropped keys when the shape diverged. Same risk class is now duplicated.
- Suggested fix: extract a shared `ShareableStateSchema` in
  `src/lib/validation/share-state.ts` (or co-locate with the type), and reuse
  in both routes. Add a `// when you add a field to ShareableState, add it
  here too` comment.
- File a Linear ticket: **YES** — small, prevents recurrence.

### F3 — `t.exit` translation now orphaned in 7 locales
- Commit: `e271ef1` (Replace presentation "Exit" with role-based control)
- Files: `src/lib/i18n/translations/{en,es,fr,it,ja,ko,zh}.ts` (line ~38)
- Category: **Tech-Debt**
- Detail: The presentation-mode "Exit" button was replaced with role-based
  "Build your own"/"Edit" controls. No remaining call sites reference `t.exit`
  (verified by ripgrep), but the key still lives in all 7 translation files.
  Dead i18n keys accumulate fast.
- Suggested fix: remove `exit` from every translation file (and the
  `TranslationKeys` type if explicit).
- File a Linear ticket: **No** — piggyback on next i18n housekeeping pass.

### F4 — Untyped i18n cast pattern leaking into two files
- Commit: `32cb21e` (Restructure report)
- Files: `src/hooks/useSlideSystem.ts:56`,
  `src/components/report/CommonModesSlide.tsx:73`
- Category: **Type Safety / Tech-Debt**
- Detail: Both files index into translations via
  `t as unknown as Record<string, string | undefined>` to read keys that
  haven't been added to `TranslationKeys` yet. Inline comment in
  CommonModesSlide says "Integrate phase adds the commonModes i18n keys".
  Those keys ARE present in `en.ts` etc. now (from the same commit), so the
  cast is no longer necessary — it's a workaround that outlived its trigger.
  Worse, it'll mask future missing keys silently (returns `undefined` → falls
  back to English placeholder).
- Suggested fix: add the missing keys to the `TranslationKeys` interface (or
  whatever drives `t`'s type), drop both casts, let TS catch missing entries
  at compile time.
- File a Linear ticket: **YES** — small, raises type safety.

### F5 — Linear webhook empty-body 200 is unauthenticated
- Commit: `484fa50` / `1d6c3de` / `1a30839` (all touched this route)
- File: `src/app/api/webhooks/linear/route.ts:27–30`
- Category: **Security (Low) / Observability**
- Detail: The empty-body branch (Linear's "setup ping") returns `200 ok`
  BEFORE the signature check. An attacker scanning `/api/webhooks/*` learns
  the route exists and can spam 200s with empty POSTs, with no rate-limit and
  no log. No state mutation, so impact is observability noise + accidental
  endpoint enumeration. Not a real exploit path, but inconsistent with the
  rest of the file's defensive posture.
- Suggested fix: gate the empty-body 200 on a header that Linear actually
  sends (e.g. require `linear-event` header) OR move the check after
  signature verification (Linear DOES sign the empty ping; verify it).
- File a Linear ticket: **No** — note for next security pass.

### F6 — `useSwipeNavigation` boundary uses magic `1px` constant
- Commit: `0b2c87a` (Fix report swipe nav)
- File: `src/hooks/useSwipeNavigation.ts:140–141`
- Category: **Maintainability (Low)**
- Detail: `sc.scrollLeft < maxScroll - 1 : sc.scrollLeft > 1` — the `1` is a
  sub-pixel guard against fractional `scrollLeft` values on hi-DPI displays.
  Fine pattern, but the literal `1` has no comment and a future reader will
  ask "why minus one." Trivial.
- Suggested fix: extract to `const SUBPIXEL_TOLERANCE_PX = 1; // hi-DPI
  scrollLeft can land on a non-integer pixel`.
- File a Linear ticket: **No** — opportunistic.

### F7 — Webhook catch-blocks now silently mask all errors as 200
- Commit: `1d6c3de` (clerk + posthog), `1a30839` (linear)
- Files: `src/app/api/webhooks/clerk/route.ts:69–70`,
  `src/app/api/webhooks/posthog/route.ts:306–308`,
  `src/app/api/webhooks/linear/route.ts:69–71`
- Category: **Observability / Trade-off**
- Detail: All three webhook catch blocks were changed from `500 + error` to
  `200 + {ok:false, error:"…"}`. The intent is correct (prevent
  PostHog/Clerk/Linear from auto-disabling the integration), but it removes
  one of the few real signals we had into webhook health. console.error still
  fires, but Vercel logs are an opt-in look — without a 5xx counter the only
  way we'll know something's broken is a user complaint.
- Suggested fix: add a counter (Discord ping via existing webhook util, or a
  PostHog event) inside each catch so we still get a signal even though the
  HTTP response is 200.
- File a Linear ticket: **YES** — operational gap.

### F8 — Dashboard "All Public"/"All Private" bulk PATCH lacks error handling
- Commit: `97dc8bb` (touched the loops to include `isUnlisted`)
- File: `src/app/dashboard/DashboardContent.tsx:216–235`
- Category: **Bug / Maintainability**
- Detail: Both loops fire serial `await fetch(...)` calls. If the third of
  ten fails, the loop continues silently and the optimistic
  `setMyReports(prev => prev.map(...))` claims all of them succeeded. User
  thinks they made all private; some are still public.
- Suggested fix: collect failures, fall back to a refetch of the
  affected reports on partial failure, and show a toast/inline error if
  count > 0. At minimum, await `Promise.allSettled` and only flip the local
  state for the ids that succeeded.
- File a Linear ticket: **YES** — silent privacy regression risk (the failure
  case is "I told it to make my reports private and it didn't").

### F9 — `cacheDel` can't purge Vercel's edge CDN — workaround acknowledged but fragile
- Commit: `97dc8bb`
- File: `src/app/api/share/[id]/route.ts:289–298`
- Category: **Architecture / Note**
- Detail: Commit drops `s-maxage` from 300s + 900s SWR to 30s because
  `cacheDel()` invalidates Redis but not the edge CDN. The 30s ceiling caps
  the stale-public-view window but does NOT eliminate it — a public-to-private
  flip is still visible for up to 30s. There's no inline test/proof, just the
  comment. If we ever bump this back up "for cost reasons" the privacy bug
  reappears.
- Suggested fix: (1) add a comment-with-warning rule and link to the privacy
  ticket; (2) longer term, look into Vercel's
  `revalidateTag`/`revalidatePath` API which CAN purge the edge cache
  per-key. The current 30s window is acceptable but it's a temporary tax.
- File a Linear ticket: **YES** (P3) — proper edge-purge integration.

### F10 — Reg M-B Mega data sourced from one swarm + Serebii cross-ref only
- Commit: `2f928ab`
- File: `src/lib/data/mega-pokemon.ts:617–784`
- Category: **Data Quality / Risk**
- Detail: 16 new MEGA entries (typing, ability, mega stone, description) were
  produced by a "32-agent swarm" cross-verified against Serebii, Bulbapedia,
  PokemonDB, Game8. This is fine, but: a) the entries do NOT include base
  stats explicitly here, b) there are NO unit tests for the new entries, c)
  the commit message says "184 unit tests pass" — those exist for the
  legality validator but not the data itself. If Game Freak adjusts any of
  these in a patch (which has happened), we won't know until users complain.
- Suggested fix: a) add a small data-integrity test that asserts every
  `CHAMPIONS_REG_MB_ONLY_MEGAS` entry has a matching
  `MEGA_POKEMON_LIST` entry AND a `POKEMON_DATA` lookup; b) note in the
  comment when each entry was last verified.
- File a Linear ticket: **YES** (P3) — data drift detector.

### F11 — Magic `15000ms` and `30s` cache constants without named constants
- Commits: `97dc8bb`
- Files: `src/hooks/useShareUrl.ts:159`,
  `src/app/api/share/[id]/route.ts:296`
- Category: **Maintainability (Low)**
- Detail: 15s share-fetch timeout and 30s edge-cache window are scattered
  magic numbers. Both have GOOD comments explaining the reasoning, which is
  more than the previous review's F8 — but the next time we touch this,
  someone will tweak one and forget the other.
- Suggested fix: hoist to named constants near the top of each file.
- File a Linear ticket: **No** — opportunistic.

### F12 — `is_unlisted` ensureTable column is `NOT NULL` after the fact
- Commit: `29f5431`
- File: `src/lib/db.ts:27`
- Category: **Tech-Debt / Note**
- Detail: `ALTER TABLE shares ADD COLUMN IF NOT EXISTS is_unlisted BOOLEAN
  NOT NULL DEFAULT FALSE` — works for fresh tables and existing tables WITH
  the default. The commit message says it was manually added in prod. If a
  fresh environment is bootstrapped from `ensureTable` (e.g. preview deploy
  with a new DB), this is fine. But any environment where the column was
  pre-created NULL-able would fail this ALTER. Not actionable now (prod is
  fixed), but the pattern is worth a comment.
- Suggested fix: comment explaining the manual prod migration history, OR
  collapse `ensureTable` into a real migration file and stop hand-rolling
  schema changes.
- File a Linear ticket: **No** — note. The broader "kill ensureTable, use
  migrations" ticket is probably already filed.

### F13 — `freshShare` / `copyShareUrl` URL-cleanup race not covered
- Commit: `97dc8bb`
- File: `src/hooks/useShareUrl.ts:225–233`
- Category: **Maintainability**
- Detail: `editKeyFromUrl is intentionally NOT a dependency` — the eslint
  disable is legitimate (the comment explains it), but a unit/integration
  test would lock the behaviour. Today it's a comment + one disable + a
  history.replaceState side-effect.
- Suggested fix: add a hook test that asserts only one fetch fires when the
  effect's dependencies don't change, and the URL is rewritten exactly once.
- File a Linear ticket: **No** — tooling/test capacity.

---

## Cross-reference with `.swarm/main-changed-files.md`

Files flagged in this review that ALSO appear in `main-changed-files.md`
(implementer collision risk):

- `src/app/api/share/route.ts` — F2 lands here. Hot file, in `main-changed`.
  **Coordinate.**
- `src/app/api/user/drafts/route.ts` — F2. Not in `main-changed`. Safe.
- `src/app/dashboard/DashboardContent.tsx` — F8. Listed. **Coordinate.**
- `src/app/api/share/[id]/route.ts` — F9. Listed. **Coordinate.**
- `src/hooks/useShareUrl.ts` — F11, F13. Listed.
- `src/hooks/useShareFlow.ts` — visibility refs (no current finding). Listed.
- `src/components/seo/JsonLd.tsx` — F1. Not in 7-day list. Safe.
- `src/lib/data/mega-pokemon.ts` — F10. Listed. **Coordinate.**
- `src/lib/db.ts` — F12 note only. Not listed. Safe.
- `src/hooks/useSwipeNavigation.ts` — F6 (tiny). Listed.

**Recommendation:** for the implementer wave, batch F1 (JsonLd) + F3 (i18n
dead key) + F4 (i18n cast) in one safe PR; F2 + F8 in a second PR (both
touch hot share files, coordinate); leave F7 to security-focused work
alongside notification plumbing; defer F10/F13 (need tests).

---

## Suggested Linear tickets

1. **C5-29-1: Collapse duplicate `BreadcrumbJsonLd` exports in `JsonLd.tsx`.**
   Two functions emit identical schema; one importer uses each. Merge to a
   single named export.

2. **C5-29-2: Extract shared Zod schema for the report state across `/api/share` and `/api/user/drafts`.**
   `commonModes` and `privateFields` are currently duplicated; the original
   bug (silent drop on schema drift) will recur next time a field is added.

3. **C5-29-3: Drop the orphaned `exit` translation key from all 7 locales.**
   No call sites after the presentation-mode role-based control refactor.

4. **C5-29-4: Type the `commonModes*` i18n keys and remove the `t as unknown as Record` casts.**
   Two files cast around the closed `TranslationKeys` type; the keys are now
   present, so the casts are no longer necessary and mask future misses.

5. **C5-29-5: Add error handling to the dashboard "All Public" / "All Private" bulk PATCH loops.**
   Today they silently succeed in the UI even when individual PATCHes fail —
   real privacy regression risk: user thinks reports went private, some
   didn't.

6. **C5-29-6: Add observability to the 200-on-error webhook catch blocks.**
   Clerk + PostHog + Linear webhooks all swallow internal errors as `200 ok`
   to prevent auto-disable; we now have no signal when they're broken.

7. **C5-29-7: Investigate edge-cache purge for share visibility flips.**
   Current 30s `s-maxage` is a temporary cap on the public-to-private leak
   window. Look into Vercel `revalidateTag` for proper purge so we can raise
   the cache window without re-opening the privacy bug.

8. **C5-29-8: Add a data-integrity test for Reg M-B Mega data.**
   Assert every `CHAMPIONS_REG_MB_ONLY_MEGAS` entry has a matching
   `MEGA_POKEMON_LIST` + `POKEMON_DATA` lookup, and last-verified date.

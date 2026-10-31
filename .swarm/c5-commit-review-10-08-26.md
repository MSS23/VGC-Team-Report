# C5 — Commit Review of the Last 20 Commits on `main`

**Date:** 2026-08-10 · **Agent:** C5 (overnight code-quality swarm) · **Mode:** READ-ONLY (no files edited, no mutating git commands run)

**Range reviewed:** `cba0832..a70d924` (`git log --oneline -20 origin/main`)

```
a70d924 fix: swarm container connections — env-first creds, npm proxy setup, preflight
d962cc6 chore: changelog entry (5.25) for dismissible stat-bar caption
7fe21cd feat: make 'Bar color = stat type, not quality' caption dismissible
53395ca ci: make lint non-blocking until existing debt cleared; fix docs auth path
ec469bf docs: rebuild CLAUDE.md — correct deploy model, env quirks, subagents
6671461 ci: add GitHub Actions workflow (tsc, lint, vitest)
b5712a6 fix: stop fabricating 32 HP / 32 Atk SP for uninvested spreads
fe70914 VGC-64: refresh public sitemap hourly
d706f71 VGC-219: finish report accessibility controls
cfcbd2f VGC-243: sync Mega selection with speed tiers
14273a1 Fix shared report home navigation
359cdef Secure report editing and exit-safe drafts
3c895f1 Improve mobile report navigation and private sharing
d3260c6 Fix latest reports and draft saving
7349ac7 Add multilingual moves and monetization foundation
0269462 Improve mobile UX and sharing journey
83d195a §7.6: add lastModified to champion sitemap pages
ede31b4 docs: record IMPROVEMENTS.md execution status (2026-07-05)
2a24ae9 §6.1/§6.3: share-route handler tests + stateful hook tests
470dfa2 §3.5: add CDN/Vercel edge cache headers to creator route
```

---

## Verdict up front

These 20 commits are, on the whole, **above-average quality**: purposeful diffs, dense explanatory comments that say *why*, no debug artifacts, no type-checker-appeasing escape hatches, and full compliance with the "new `src/lib/` logic gets a sibling test" rule. The security rewrite in `359cdef` in particular is careful, well-reasoned work.

There is, however, **one serious cluster of findings on the app's most correctness-sensitive path** — the Champions SP conversion. Commit `b5712a6` advertises a fix for SP fabrication, but only removed *half* the fabrication, shipped regression tests weak enough to pass on the remaining half, and silently changed what every already-shared Champions report displays. That cluster (F1–F5) is the reason this review is not a clean bill of health.

**Compliance checks that came back clean:**

| Check | Result |
|---|---|
| New `src/lib/` module without sibling `__tests__/` | **0 violations.** All 3 new lib modules (`speed-tier-form.ts`, `chronological-cursor.ts`, and `translate-move.ts`'s rewrite) shipped with tests. |
| `as any` added | 0 |
| `@ts-ignore` / `@ts-expect-error` added | 0 |
| `eslint-disable` added | 0 |
| `console.log` / debug output added | 0 (one intentional `console.warn` in an instrumentation integrity check) |
| TODO/FIXME/HACK/XXX added in the range | 0 |

---

## Repo-wide TODO / FIXME / HACK / XXX sweep

**Total matches: 8** (excluding `node_modules`, `.next`, `.git`, `coverage`, `package-lock.json`).

**Matches in shipped code (`src/`, `scripts/`, `cypress/`, config): ZERO.** This codebase carries no in-code TODO debt at all — a genuinely good result and worth stating plainly.

All 8 matches live in non-shipping markdown. The most significant, in order:

| # | File:line | Text | Why it matters |
|---|---|---|---|
| 1 | `.swarm/r3-community-sentiment.md:44` | `VGC-XXX: Add "Rental Code" first-class field…` | Unfiled ticket placeholder — a proposed high-leverage feature that exists only in a swarm report |
| 2 | `.swarm/r3-community-sentiment.md:45` | `VGC-XXX: Add "Source / Credit" field with auto-linkify` | Unfiled ticket placeholder |
| 3 | `.swarm/r3-community-sentiment.md:46` | `VGC-XXX: Sprite-fallback CDN proxy` | Unfiled ticket placeholder |
| 4 | `.swarm/r3-community-sentiment.md:47` | `VGC-XXX: Public report search by Pokemon + regulation` | Unfiled ticket placeholder |
| 5 | `.swarm/r3-community-sentiment.md:48` | `VGC-XXX: OTS PDF export from a report` | Unfiled ticket placeholder |
| 6 | `.swarm/c5-review-17-05-26.md:8` | "no TODO/FIXME markers … found anywhere in src/" | Prior C5 review; the claim still holds three months later |
| 7 | `.planning/phases/02-advanced-filter-drawer/02-VERIFICATION.md:93` | "No TODOs, FIXMEs, placeholder text…" | Verification note, not debt |
| 8 | `package-lock.json` | dependency metadata | Noise |

The only actionable item here is that five concrete feature proposals sit as `VGC-XXX` placeholders in a swarm report and have never been filed in Linear.

---

## Findings

Severity scale: **HIGH** (wrong output shipped to users) · **MEDIUM** (real defect or meaningful risk) · **LOW** (loose end / maintainability) · **INFO**.

---

### F1 — HIGH — `convertToChampionsSp` still fabricates SP; the commit fixed only half the bug

- **Commit:** `b5712a6` — *"fix: stop fabricating 32 HP / 32 Atk SP for uninvested spreads"*
- **File:** `src/lib/analysis/stat-calculator.ts:118-136` (Step 3)

The commit removed the fallback that padded **uninvested** stats. It left in place the loop that pads **invested** stats up to the 66 SP budget — and that loop produces exactly the same class of fabricated allocation the commit set out to eliminate. Verified by simulating the shipped function:

| Input EV spread | Shipped SP output | Problem |
|---|---|---|
| `252 HP / 4 Def` | **`32 HP / 32 Def`** | A 4-EV filler stat is inflated into a fully-maxed defensive investment |
| `100 HP / 156 Spe` | **`32 HP / 32 Spe`** | A deliberately non-maxed spread collapses to max/max |
| `252 Atk / 4 SpD / 252 Spe` | `32 Atk / 2 SpD / 32 Spe` | 4 EVs → 2 SP, not the documented 1 SP |

This directly contradicts the function's own docstring at `stat-calculator.ts:82-88`: *"Preserves the intent of the original spread: … 4 EVs → 1 SP (minimum investment)"*. A user who pastes a standard `252 HP / 4 Def` bulk spread is shown a Pokémon with 32 SP of Defense it does not have, and the derived stat bars, damage calcs, and speed tiers all inherit the error.

The new comment at line 121 — *"Leftover budget stays unspent; the legality validator surfaces it"* — describes behaviour the code does not implement: leftover budget is still spent, just on a narrower candidate set.

> **Ticket:** `VGC-XX: convertToChampionsSp still inflates minimum-investment stats to 32 SP`

---

### F2 — HIGH — Over-budget SP trim is declaration-order-biased and guts HP

- **Commit:** pre-existing logic, left untouched by `b5712a6` despite being the same bug class
- **File:** `src/lib/analysis/stat-calculator.ts:138-149` (Step 4)

When the direct conversion exceeds 66 SP, the excess is removed from the lowest-SP stats first via `sort((a, b) => sp[a] - sp[b])`. When several stats tie at 32 SP — the common case — `Array.prototype.sort` is stable, so it removes from whichever stat appears first in the hardcoded `["hp", "atk", "def", "spa", "spd", "spe"]` array. HP is always first, so **HP is always the stat sacrificed**, and it is sacrificed all the way to zero before the next stat is touched:

| Input EV spread | Shipped SP output |
|---|---|
| `252 HP / 252 Atk / 252 Def` | **`2 HP / 32 Atk / 32 Def`** |
| `252 HP / 252 Atk / 252 Def / 252 Spe` | **`0 HP / 2 Atk / 32 Def / 32 Spe`** |

An arbitrary array ordering deciding which of a user's stats gets zeroed is precisely the "declaration order" defect `b5712a6`'s own commit message calls out. A proportional trim (scale all stats by `66/total`) would preserve the shape of the spread.

> **Ticket:** `VGC-XX: trim EV→SP overflow proportionally instead of by stat declaration order`

---

### F3 — HIGH (flagging loudly) — `b5712a6` retroactively changes what already-shared reports display

- **Commit:** `b5712a6`
- **Files:** `src/lib/analysis/stat-calculator.ts` → consumed by `src/components/report/PokemonCard.tsx:154,419`, `PokemonDetailSlide.tsx:423,441,678`, `SpeedTierChart.tsx:182,236`, `src/components/compare/CompareContent.tsx:170`

This app persists reports and hands out permanent share URLs. SP is **derived at render time** from the stored paste, never stored. Changing `convertToChampionsSp` therefore rewrites what every previously-shared Champions report shows — retroactively, with no version pin and no migration.

Concretely, a Champions report shared before 2026-08-01 whose paste had no EVs line previously rendered `32 HP / 32 Atk / 2 Def`; the same URL now renders all-zero. The **Speed Tier chart moves too**, because `SpeedTierChart.tsx:182` derives the tier from `sp.spe`. A player who shared a team report and screenshotted it, or a viewer returning to a bookmarked link, sees different numbers than the author intended.

The fix itself is right — the old behaviour was worse. The loose end is that it shipped with **no changelog entry**: `d962cc6`, the very next commit, adds a changelog entry for a dismissible caption, but nothing anywhere tells users that Champions SP display changed. Note also that F1/F2 remain, so whatever follow-up fixes those will cause a *second* retroactive shift.

> **Ticket:** `VGC-XX: changelog entry + in-app notice for the retroactive Champions SP display change`

---

### F4 — MEDIUM — The regression tests added in `b5712a6` are shaped to pass rather than to pin behaviour

- **Commit:** `b5712a6`
- **File:** `src/lib/analysis/__tests__/stat-calculator.test.ts:123-156`

Every wrong output in F1 and F2 satisfies every assertion in the new test block:

- `"does not pad uninvested stats when invested stats are already maxed"` (line 129) uses `spread({ hp: 252 })` — the single input where padding is *structurally impossible*, because no other stat is invested and the padding loop's candidate list is empty. It cannot catch F1. Add a second invested stat (`{ hp: 252, def: 4 }`) and it fails immediately.
- `"converts a standard 252/4/252 EV spread within budget"` (line 138) asserts `expect(sp.spd).toBeGreaterThanOrEqual(1)`. The actual value is `2`, i.e. double the documented "4 EVs → 1 SP" rule, and the assertion passes anyway. A `toBe(1)` would have surfaced F1 at authoring time.
- `"never exceeds the 66 SP budget or 32 per stat"` (line 150) only asserts budget invariants. It passes on the `0 HP / 2 Atk / 32 Def / 32 Spe` output from F2, which is nonsense but within budget.

The commit message claims *"regression tests added"*; what was added are invariant smoke tests that do not lock down the conversion's actual contract.

> **Ticket:** `VGC-XX: pin exact expected SP spreads in convertToChampionsSp tests (not just budget invariants)`

---

### F5 — MEDIUM — SP-form fast path is too permissive; small EV spreads are misread as SP

- **Commit:** pre-existing, reaffirmed and relied on by `b5712a6`
- **File:** `src/lib/analysis/stat-calculator.ts:99-103`

```ts
if (totalInput > 0 && totalInput <= CHAMPIONS_TOTAL_SP && !anyOverMax) {
  return { ...evs };
}
```

Any spread totalling ≤66 with no stat above 32 is treated as already-SP. That means a genuine EV paste of `EVs: 4 HP` is read as **4 SP**, not the 1 SP the conversion rules call for. Likewise `EVs: 8 HP / 8 Def` → 8/8 SP.

The ambiguity is real and honestly documented in the comment above it — Showdown has no `SPs:` line. But the current threshold resolves the ambiguity in favour of "SP" for spreads that are far more likely to be sparse EV pastes. Tying the fast path to the detected regulation (`isChampionsFormat(regulation)`, already available at every call site) or requiring the total to be near 66 would remove the guesswork. Note the same heuristic is duplicated independently in `src/lib/validation/champions-legality.ts:268`, so any change has to land in both places.

> **Ticket:** `VGC-XX: tighten SP-form detection using the detected regulation instead of a ≤66 heuristic`

---

### F6 — MEDIUM — `keepalive: true` applied to *all* draft saves can break autosave for large reports

- **Commit:** `359cdef` — *"Secure report editing and exit-safe drafts"*
- **File:** `src/hooks/useAutoDraft.ts:88-93`

```ts
const res = await fetch("/api/user/drafts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ state, draftId: draftIdRef.current }),
  // Allows the browser to finish the request while a tab or mobile
  // webview is being backgrounded or closed.
  keepalive: true,
});
```

The comment scopes the intent to the exit flush, but `saveDraft()` is the *single* save path — the 4-second debounced autosave (`useAutoDraft.ts:130`), the manual "save for later" action, and the `pagehide`/`visibilitychange` flush all funnel through it. So `keepalive` is now set on every draft write.

Browsers enforce a **64 KiB cumulative body limit on keepalive requests**; over it, `fetch` rejects with a `TypeError`. `ShareableState` (`src/lib/sharing/url-codec.ts:125-155`) carries `paste`, per-mon `notes`, per-mon `calcs: Record<string, CalcEntry[]>`, `matchupPlans`, and `commonModes` free text — a heavily annotated six-Pokémon report can plausibly exceed 64 KB. When it does, the rejection is caught at line 100 and surfaced as `status: "error"` with *"Could not save this draft"* — meaning the users with the most work invested are exactly the ones whose autosave silently stops working, on every single attempt rather than just at exit.

There is no size guard on either side: `src/app/api/user/drafts/route.ts` has no payload-length check.

> **Ticket:** `VGC-XX: scope keepalive to the pagehide flush and fall back to a normal fetch above 64KB`

---

### F7 — MEDIUM-LOW — `fe70914` silently reverts `83d195a`'s sitemap `lastModified` work

- **Commits:** `fe70914` (*"VGC-64: refresh public sitemap hourly"*) vs `83d195a` (*"§7.6: add lastModified to champion sitemap pages"*), two commits apart
- **File:** `src/app/sitemap.ts:8-27`

`83d195a` deliberately added `lastModified` to the champion mega pages. `fe70914` removes `lastModified` from **all** static entries and from the `getRegMAMegasWithSprites()` mega pages, and the commit message never mentions it — the message is entirely about hourly revalidation.

The removal is defensible in isolation (`new Date()` on every render produced a meaningless always-now timestamp that crawlers learn to ignore), but it undoes a recent, explicitly-ticketed SEO change without acknowledgement, on pages CLAUDE.md marks **SEO-critical**. The right end state is a real per-page timestamp (deploy time or content-change time), not the removal of the field.

Positives in the same commit: switching `ORDER BY created_at` → `updated_at` for shares, and adding `ORDER BY MAX(updated_at) DESC LIMIT 5000` to the previously unbounded creator query, are both good catches.

> **Ticket:** `VGC-XX: restore a meaningful lastModified on champion sitemap entries`

---

### F8 — MEDIUM-LOW — CI lint disabled with no tracking ticket, plus a stray token in the committed comment

- **Commit:** `53395ca` — *"ci: make lint non-blocking until existing debt cleared"*
- **File:** `.github/workflows/ci.yml:19-22`

```yaml
      # ponytail: 35 pre-existing lint errors (react-hooks etc.) — non-blocking
      # until that debt is cleared, then remove continue-on-error
      - run: npm run lint
        continue-on-error: true
```

Three things:

1. **35 known eslint errors are now permanently unenforced.** The comment says *"until that debt is cleared"*, but no Linear ticket is referenced and nothing forces the cleanup — this is the classic form of debt that never gets paid. `react-hooks/set-state-in-effect` errors in particular are correctness smells in a React 19 codebase, not style nits.
2. **CLAUDE.md is now out of date.** Its CI section (line 54) still states CI *"runs `tsc --noEmit`, `eslint`, and `vitest`"* as the gate; eslint is no longer a gate. The commit updated a different CLAUDE.md line (the Vercel auth path) but not this one.
3. **The comment begins with the stray token `# ponytail:`**, which is not a word that belongs in a CI file and matches nothing else in the repo. It reads as an accidental paste or leftover marker and should be removed.

> **Ticket:** `VGC-XX: clear the 35 eslint errors, remove continue-on-error from CI, and fix the stray comment token`

---

### F9 — LOW — Dead mutation endpoint left behind after the "revoke link" UI was deleted

- **Commit:** `359cdef`
- **Files:** `src/app/api/share/[id]/collaborators/route.ts:161` (`PATCH`), caller removed from `src/components/social/CollaboratorPanel.tsx`

`359cdef` deleted `handleRevokeLink` and its whole confirm/success UI block (~90 lines) from `CollaboratorPanel`. The `PATCH /api/share/[id]/collaborators` handler it called still exists and is still routable, with **zero callers** in the codebase (verified: the only two `fetch` calls to that path are the GET and POST/DELETE flows).

Either the revoke capability was intentionally retired — in which case the endpoint should go too — or it was lost as collateral in the token-removal refactor and users silently lost the ability to invalidate old collaboration links. Neither the commit message nor the changelog says which.

> **Ticket:** `VGC-XX: remove the unused collaborators PATCH revoke endpoint (or restore its UI)`

---

### F10 — LOW — `Link` → `<a>` swaps trade client-side navigation for a full reload to mask stale state

- **Commit:** `14273a1` — *"Fix shared report home navigation"*
- **Files:** `src/app/page.tsx:788`, `src/app/page.tsx:1400`, `src/components/layout/Navbar.tsx:352`, `:574`, `:599`

Five `<Link href="/">` elements were converted to plain `<a href="/">`. The effect is a hard document navigation that discards all React state — which does fix the reported bug (returning to `/` from a shared report left the builder in shared-view state), but it fixes it by nuking the state rather than by resetting it.

The cost: a full re-download, re-hydration, and Clerk re-initialisation on what is one of the app's most-travelled paths ("Build your own" from a shared report — the primary conversion funnel). The same commit removed `exitSharedView` entirely (from `useShareUrl`, `useHomePage`, and `NavbarProps`), so the state-reset path no longer exists to be fixed. Cleanly removed, at least — no dangling references remain.

> **Ticket:** `VGC-XX: restore client-side navigation out of shared view by resetting share state on route change`

---

### F11 — LOW — Speed tiers now recompute Speed instead of using the analyzed value (two sources of truth)

- **Commit:** `cfcbd2f` — *"VGC-243: sync Mega selection with speed tiers"*
- **File:** `src/components/report/SpeedTierChart.tsx:184-186`

```ts
} else if (form.data) {
  baseSpe = calculateStat("spe", form.data.baseStats.spe, mon.parsed.ivs.spe, mon.parsed.evs.spe, mon.parsed.level, mon.parsed.nature);
}
```

Previously, non-Champions formats used `mon.calculatedStats.spe` — the value produced by the analysis pipeline. The new branch fires for essentially every Pokémon (`form.data` is non-null whenever the species resolves) and recomputes Speed locally from raw parsed fields.

For the base form the two should agree today, but they are now two independent derivations of the same number: any adjustment the analysis layer folds into `calculatedStats` (form corrections, ability or item effects) will silently stop reaching the Speed Tier chart. Only the Mega branch actually needed the recomputation.

Also note this branch passes `mon.parsed.level`, while CLAUDE.md states VGC is always level 50 and `0269462` hardcoded `const level = 50` in the parser — the parameter is currently always 50, so no live defect, just a redundant path.

> **Ticket:** `VGC-XX: derive speed-tier Speed from a single source of truth`

---

### F12 — LOW — Fourth local re-implementation of species-key normalisation

- **Commit:** `cfcbd2f`
- **File:** `src/lib/utils/speed-tier-form.ts:16-21`

```ts
function toSpeciesKey(species: string): string {
  return species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
```

The repo already has species/slug normalisation in `src/lib/utils/sprite-slug.ts`, `src/lib/utils/extract-species.ts`, and `src/lib/utils/mega-detect.ts`. This is a fourth, subtly different variant (no handling of apostrophes-to-nothing vs. hyphen, no `.` handling for `Mr. Mime`-style names). Small now; a divergence bug later, because the whole point of these keys is that they must match across modules.

> **Ticket:** `VGC-XX: consolidate species-key normalisation into one shared helper`

---

### F13 — LOW — Dismissible caption is permanently dismissible with no way back, and does not sync across tabs

- **Commit:** `7fe21cd`
- **File:** `src/components/report/StatColorNote.tsx:24-61`

Two loose ends in an otherwise tidy component (good use of `useSyncExternalStore`, correct 44×44 touch target, focus ring, `aria-label`, try/catch around `localStorage`):

1. The dismiss is advertised as permanent (`aria-label="Hide this note permanently"`) and writes `vgc.display.hideStatColorNote` to `localStorage`, but **no settings surface exists to un-hide it**. A user who dismisses it by accident, or who later shares the app with someone who needs the explanation, has to clear site data.
2. `subscribe` (line 15) listens only for the custom `vgc:stat-color-note-dismissed` event, so a second open tab keeps showing the caption until it reloads. The docstring calls this out as in-tab-only, but adding the `storage` event would be a two-line fix.

> **Ticket:** `VGC-XX: add a "restore hidden hints" control and sync dismissals across tabs`

---

### F14 — LOW — Explore's newest/updated feed dropped to `no-store` at the CDN

- **Commit:** `d3260c6`
- **File:** `src/app/api/explore/route.ts:364-375`

`sort=newest` and `sort=updated` now return `Cache-Control: private, no-store` plus `CDN-Cache-Control: no-store`, and skip the in-process cache entirely (line 40). Correct for the bug being fixed — a cached "latest reports" feed is a broken feed — but it removes CDN caching from a high-traffic public endpoint, and every request becomes a Neon query.

Given CLAUDE.md's explicit cost guardrails around Vercel usage and the Neon 512 MB free tier, this is worth a deliberate note rather than an unremarked side effect. A short `s-maxage=5–10` would preserve most of the freshness win with a fraction of the origin load.

> **Ticket:** `VGC-XX: reinstate a short CDN TTL on the newest/updated explore feed`

---

### F15 — INFO — Comment says "fail loudly", code only warns

- **Commit:** `0269462`
- **File:** `src/instrumentation.ts:11-19`

The comment reads *"Build-time data integrity check — **fail loudly** if a Champions-legal Mega is missing"*, but the implementation only `console.warn`s and continues. `0269462` edited the surrounding comment text and left the "fail loudly" phrasing intact while the behaviour stayed soft.

This is mostly harmless because the same check is now a hard test assertion (`src/lib/data/__tests__/champions-dex.test.ts:31` was **strengthened** in this commit from a filtered subset to `expect(result.errors).toEqual([])`), so CI does catch drift. The comment is just wrong about the runtime path.

---

## Commits reviewed and found clean

| Commit | Note |
|---|---|
| `a70d924` | Genuinely good bug fixing. The lazy `linear_state_backlog()` correctly uses `\"` escaping — verified against `linear_query`, which interpolates the query raw into a JSON string body, so the *old* eager version's bare `"` would have produced invalid JSON. Root-causing the `set -euo pipefail` + missing-`.env.local` interaction is solid work. |
| `d962cc6` | Trivial changelog entry, well-formed. |
| `d706f71` | Careful a11y work: a real focus trap (Escape, Tab cycling, focus restore on unmount), roving `tabIndex` with `data-slide-dot` + Home/End on the slide tablist, `aria-label`s on unlabelled controls, `sr-only` `<h1>` for read-only reports, and 44px touch targets. No shortcuts taken. |
| `3c895f1` | Swipe/keyboard nav hardening. Notably fixes render-phase ref mutation (a React 19 correctness issue) by moving assignments into `useEffect`, and broadens the focus guard to `SELECT`/`contentEditable`/`role=radio|slider|listbox|menu|tab`. Ships with a new `useSwipeNavigation` test file. |
| `359cdef` | Substantial and coherent auth rewrite (apart from F6/F9). Edit tokens demoted from credential to update nonce; all writes now require a Clerk session (`share/route.ts:103-114`) *before* the owner/collaborator check, so the `owner_id === authedUserId` comparison can never be `null === null`; collaborator checks consistently gained `COALESCE(status,'accepted') = 'accepted'`; legacy `localStorage` tokens actively purged. Ships with two new API route test files. |
| `d3260c6` | Correct keyset-pagination fix — `(col, id) < (ts, id)` with a matching `ORDER BY col DESC, s.id DESC` — and `chronological-cursor.ts` handles legacy timestamp-only cursors, rejects malformed input, and has a sibling test covering all three cases. |
| `7349ac7` | Generated move catalogue is properly reproducible: pinned PokéAPI commit SHA, a real quoted-CSV parser, deterministic duplicate merging for Z-Move ID collisions, coverage reporting. `translate-move.ts`'s NFKC + smart-quote normalisation is a good fix for imported-paste variants, and the type narrowing after the `lang === "en"` early return is genuinely correct rather than cast away. |
| `0269462` | Broad cleanup; the CSP `unsafe-eval` split (dev-only) and the dev service-worker unregistration are both well-reasoned. The `middleware.ts` → `proxy.ts` rename dropped a `createRouteMatcher`/`isPublicRoute` block that was already dead (`clerkMiddleware` was invoked with `_auth` unused and never called `protect()`), so no access control was lost. |
| `6671461`, `ec469bf` | CI scaffolding and docs. `AGENTS.md` is a genuine pointer to CLAUDE.md, not a duplicate — matches the stated convention. |
| `83d195a`, `ede31b4`, `2a24ae9`, `470dfa2` | Small, focused, and unremarkable in the good sense. |

---

## Suggested ticket titles (consolidated)

**Do first — Champions SP correctness:**

1. `VGC-XX: convertToChampionsSp still inflates minimum-investment stats to 32 SP`
2. `VGC-XX: trim EV→SP overflow proportionally instead of by stat declaration order`
3. `VGC-XX: pin exact expected SP spreads in convertToChampionsSp tests (not just budget invariants)`
4. `VGC-XX: changelog entry + in-app notice for the retroactive Champions SP display change`
5. `VGC-XX: tighten SP-form detection using the detected regulation instead of a ≤66 heuristic`

**Then:**

6. `VGC-XX: scope keepalive to the pagehide flush and fall back to a normal fetch above 64KB`
7. `VGC-XX: clear the 35 eslint errors, remove continue-on-error from CI, and fix the stray comment token`
8. `VGC-XX: restore a meaningful lastModified on champion sitemap entries`
9. `VGC-XX: remove the unused collaborators PATCH revoke endpoint (or restore its UI)`
10. `VGC-XX: reinstate a short CDN TTL on the newest/updated explore feed`
11. `VGC-XX: restore client-side navigation out of shared view by resetting share state on route change`
12. `VGC-XX: derive speed-tier Speed from a single source of truth`
13. `VGC-XX: consolidate species-key normalisation into one shared helper`
14. `VGC-XX: add a "restore hidden hints" control and sync dismissals across tabs`

---

*Review performed read-only. No files in `src/` were modified and no mutating git command was run.*

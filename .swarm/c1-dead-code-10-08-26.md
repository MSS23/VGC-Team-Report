# C1 — Dead Code Scan (read-only)

**Date:** 2026-08-10
**Agent:** C1 (overnight code-quality swarm)
**Repo:** `/home/user/VGC-Team-Report` @ `a70d924`
**Scope:** unused exports in `src/lib/**` + `src/components/**`, orphaned components, dead routes, unused npm deps, unused `src/lib/data/` blobs.
**Mutations made:** none. No source file edited, created, or deleted. No state-mutating git commands run (`git log`/`git status` only).

---

## Method

Three independent passes, cross-checked against each other:

1. **Export inventory + per-symbol ripgrep.** Extracted every `export` (function/class/const/type/interface/enum/`export {}`) from every non-test file in `src/lib` and `src/components` (then repeated across all of `src`), and ran a word-boundary fixed-string ripgrep for each symbol across `src/`, `cypress/`, `scripts/`, `next.config.ts`, `vitest.config.ts`, `package.json`. Hits in the defining file itself were excluded; hits in `__tests__`/`*.test.*`/`cypress/` were bucketed separately so test-only symbols surface as **production-dead** rather than being silently dropped.
2. **Module reachability graph.** Built the real import graph (resolving `@/*`, relative, `index.ts`, `.json`, and dynamic `import("…")`) seeded from every Next.js entry point — all `page/layout/route/sitemap/opengraph-image/not-found/error/global-error/loading/template/default` files under `src/app`, plus `src/instrumentation.ts` and `src/proxy.ts`. Anything not reached is dead *including whole dead subtrees*, which per-symbol grep alone cannot find.
3. **Route + dependency passes.** Every `src/app/api/**/route.ts` mapped to its URL and grepped for callers (dynamic segments wildcarded so templated paths like `/api/share/${id}/versions` match). Every `package.json` dependency grepped for import specifiers across source, scripts and configs.

Confirmed the graph is trustworthy: it correctly resolved `src/lib/data/__validate-mega-coverage.ts` as **live** via the dynamic `await import("./lib/data/__validate-mega-coverage")` in `src/instrumentation.ts:14`, and correctly kept all `next/dynamic` targets alive. All five `next/dynamic` call sites use static string literals — there is no variable/template-literal component resolution anywhere in `src`, so nothing can be hidden from this analysis.

**Result:** 278 of 312 files are reachable from production entry points. Of the 34 unreachable, 31 are test files. **Exactly 3 non-test files are dead.**

---

## Ranked findings

### Tier 1 — Safe, high-value deletions (recommended)

#### 1. `src/components/display/DisplayTogglePill.tsx` — entire file

| | |
|---|---|
| **Symbol** | `DisplayTogglePill` (named export) |
| **Confidence** | **HIGH** |
| **Saves** | **267 lines / 11,120 bytes** — plus removes the now-empty `src/components/display/` directory |

Evidence — the only occurrences of the name in the entire repo are its own definition and one doc-comment mention in the other dead file:

```
$ rg -n -w "DisplayTogglePill" src cypress scripts docs public
src/components/display/DisplayTogglePill.tsx:5:interface DisplayTogglePillProps {
src/components/display/DisplayTogglePill.tsx:48:export function DisplayTogglePill({
src/components/display/DisplayTogglePill.tsx:57:}: DisplayTogglePillProps) {
src/lib/hooks/useGlobalDisplayPrefs.ts:9: * specific report's data. Used by the DisplayTogglePill to track
```

Zero import sites. Directory-level grep confirms nothing references the folder either:

```
$ rg -n "components/display" src cypress
(no matches)
```

Reachability graph agrees: `importers=[]`, `reachedByTest=false`.

This is the largest single dead artifact in the codebase. It was superseded by the segmented section tabs introduced in `8eb39cc "Redesign report bottom nav: segmented section tabs + cleanup + PWA"` (2026-06-05) — the redesign replaced the floating pill but left the file behind. Dead for ~2 months.

---

#### 2. `src/lib/hooks/useGlobalDisplayPrefs.ts` — entire file

| | |
|---|---|
| **Symbol** | `useGlobalDisplayPrefs` (named export) |
| **Confidence** | **HIGH** |
| **Saves** | **51 lines / 1,575 bytes** — plus removes the entire `src/lib/hooks/` directory |

```
$ rg -n -w "useGlobalDisplayPrefs" src cypress scripts docs public
src/lib/hooks/useGlobalDisplayPrefs.ts:36:export function useGlobalDisplayPrefs(): { hasSeenPill: boolean; markPillSeen: () => void } {

$ rg -n "lib/hooks" src cypress
(no matches)
```

Sole definition, zero import sites. This hook existed **only** to serve finding #1 — its own docblock says so ("Used by the DisplayTogglePill to track first-run discovery"). It manages one localStorage key, `vgc.display.pillSeen`, which nothing else reads or writes.

Bonus structural win: this is the only file in `src/lib/hooks/`, a confusing duplicate of the real `src/hooks/` directory that holds all 24 live hooks. Deleting it removes that ambiguity permanently.

**Delete #1 and #2 together** — they are one dead cluster, and deleting either alone leaves a dangling reference in a comment.

---

#### 3. `src/components/providers/ConsentGate.tsx` — entire file

| | |
|---|---|
| **Symbol** | `ConsentGate` (named export) |
| **Confidence** | **HIGH** |
| **Saves** | **37 lines / 1,089 bytes** |

```
$ rg -n -w "ConsentGate" src cypress scripts docs public
src/components/providers/ConsentGate.tsx:6:interface ConsentGateProps {
src/components/providers/ConsentGate.tsx:19:export function ConsentGate({ children }: ConsentGateProps) {
```

**Note — this is a status change from the previous scan.** The May report (`.swarm/c1-dead-code-23-05-26.md`) explicitly listed `ConsentGate` under "verified NOT dead — imported in `src/app/layout.tsx:11`". That is no longer true. `src/app/layout.tsx:11` now reads:

```
11:import { CookieBanner } from "@/components/providers/CookieBanner";
```

The consent architecture was refactored: instead of a wrapper component gating children, `PostHogProvider` and `ClarityProvider` now each subscribe to consent directly. `ConsentGate` was orphaned by that refactor and no one noticed.

**Verified no cascade.** Deleting it does *not* orphan `src/lib/consent.ts` — the helpers it imported remain in active use by three live callers:

```
$ rg -n -w "hasAnalyticsConsent|onConsentChange" src
src/components/providers/PostHogProvider.tsx:43,174,175   ← live
src/components/providers/ClarityProvider.tsx:29,31        ← live
src/components/providers/ConsentGate.tsx:24,27            ← dead file
```

`lib/consent.ts` stays. Only the wrapper goes.

**Tier 1 total: 355 lines / 13,784 bytes across 3 files, plus 2 directories eliminated.**

---

### Tier 2 — Production-dead, kept alive only by tests (review before acting)

#### 4. `isRateLimited` — `src/lib/rate-limit.ts:84`

| | |
|---|---|
| **Confidence** | **HIGH** that it is production-dead; **flagged for human review** on the action |
| **Saves** | 11 lines (incl. docblock) in `rate-limit.ts` + 47 lines / 1,503 bytes if the test file goes too |

Its own docblock declares it legacy:

```
80  /**
81   * Synchronous in-memory rate limiter (legacy API).
82   * Kept for backward compatibility — prefer isRateLimitedAsync.
83   */
84  export function isRateLimited(
```

Every production caller uses the async variant instead:

```
$ rg -n "lib/rate-limit" src
src/lib/security/api-guard.ts:10:import { isRateLimitedAsync } from "@/lib/rate-limit";
src/app/api/feedback/route.ts:2:import { isRateLimitedAsync } from "@/lib/rate-limit";
src/lib/__tests__/rate-limit.test.ts:2:import { isRateLimited } from "@/lib/rate-limit";   ← test only
```

All 16 remaining hits on the symbol are inside `src/lib/__tests__/rate-limit.test.ts`. **Zero production call sites.**

No cascade risk: the shared internal `isRateLimitedInMemory` stays alive as the fallback path inside `isRateLimitedAsync` (line 77), so removing the sync wrapper deletes no logic that production depends on.

⚠️ **Do not act on this without human review.** Removing it means also deleting `src/lib/__tests__/rate-limit.test.ts`, which is currently the *only* test covering the in-memory sliding-window logic — including the reset-after-window and per-key-isolation cases that `isRateLimitedAsync` also relies on. The correct move is probably to **retarget the test at `isRateLimitedAsync`** (it exercises the same in-memory path when Upstash env vars are unset, which is the case under vitest) and *then* drop the sync export. That is a behaviour-preserving refactor, not a deletion, and it needs a human to sign off on the coverage swap.

---

#### 5. `getRegMBMegas` — `src/lib/data/mega-pokemon.ts:846`

| | |
|---|---|
| **Confidence** | **HIGH** that it is unused; **NOT recommended for deletion** |
| **Saves** | ~5 lines |

```
$ rg -n -w "getRegMBMegas" src cypress scripts
src/lib/data/mega-pokemon.ts:846:export function getRegMBMegas(): MegaPokemonEntry[] {
```

Sole occurrence. Its Reg M-A counterpart is live in two places (`src/app/champions/page.tsx:4`, `src/app/champions/ChampionsContent.tsx:14`), so this is the unwired half of a symmetric pair.

⚠️ **Do not delete.** CLAUDE.md lists Reg M-B as an actively supported format, and the underlying `CHAMPIONS_REG_MB_MEGAS` set *is* consumed (`src/lib/data/champions-dex.ts:1`). This reads as a deliberately staged accessor for M-B champions pages that haven't shipped yet. Deleting 3 lines to break format symmetry is a bad trade — leave it, or ask the owner whether M-B champions pages are still planned.

---

#### 6. `asPokemonTypes` — `src/lib/data/dex-subset.ts:123`

| | |
|---|---|
| **Confidence** | **HIGH** unused / **LOW value** |
| **Saves** | ~4 lines |

```
$ rg -n -w "asPokemonTypes" src cypress scripts
src/lib/data/dex-subset.ts:123:export function asPokemonTypes(types: string[]): PokemonType[] {
```

A three-line `as` cast helper (`return types as PokemonType[]`) with zero call sites. Genuinely dead, but the payoff is negligible. Fold into the next real change to that file rather than spending a build on it.

---

### Tier 3 — Dead configuration

#### 7. Stale `/api/builder/` CORS exemption — `src/proxy.ts:87`

| | |
|---|---|
| **Confidence** | **HIGH** |
| **Saves** | 1 clause; **security-relevant** |

```
$ rg -n "api/builder" src scripts docs
src/proxy.ts:87:  if (isApiRoute && !pathname.startsWith('/api/discord') && !pathname.startsWith('/api/webhooks/') && !pathname.startsWith('/api/builder/') && pathname !== '/api/setup' && !isAllowedOrigin(request)) {
```

The route it exempts does not exist — `src/app/api/` contains no `builder` directory (verified by `ls`). The comment above it still describes "builder proxy endpoints — authenticated via secret key, called from cloud sandbox", a feature that has been removed.

This is more than cosmetic: it is a **pre-authorised CORS hole for a path prefix that nothing owns**. If anyone later adds `src/app/api/builder/*`, it silently ships with cross-origin checks disabled and no one will remember why. Recommend removing the clause and its comment sentence. Cheap, and it closes a latent footgun.

---

### Tier 4 — Redundant `export` keywords (NOT recommended)

31 symbols across `src/lib`, `src/components`, `src/hooks` and `src/data` are `export`ed but referenced only inside their own defining file. Full list, all verified by per-symbol ripgrep:

`TeamCombination`, `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `AccentTheme`, `VersionDiffState`, `DexSubsetMegaStone`, `MoveCategory`, `MoveFlag`, `MoveData`, `NatureData`, `TYPE_CHART`, `ChronologicalCursor`, `NotificationType`, `PrivateField`, `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ReportTemplate`, `REPORT_TEMPLATES`, `ImportSource`, `SpeedTierForm`, `LegalitySeverity`, `flushServerEvents`, `isDynamicAllowedOrigin`, `generateCsrfToken`, `migrateCalcEntries`, `replaceSpeciesInBlock`, `ChangelogItem`, `ChampionsSampleTeam`, `IndyTopCutEntry`, `DraftSaveResult`, `SyncStatus`, `DamageCalcsMap`, `FilterState`, `GamePlanSlots`, `ViewMode`, `WALKTHROUGH_STEPS`.

**I do not recommend acting on any of these**, for three reasons:

- **Zero bytes saved.** Every one of these symbols is *used* — dropping `export` deletes no code and no bundle weight. Tree-shaking already handles them.
- **Several are legitimately public.** `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem` and `PdfExportProps` are the prop types of exported components; consumers reasonably need them. `MoveData`, `NatureData`, `AccentTheme`, `ReportTemplate` are the shapes of exported data structures.
- **It is exactly the drive-by refactor CLAUDE.md forbids.** A 39-file diff touching only `export` keywords, burning a full Vercel build, for no user-visible or bundle-visible gain.

Listed here for completeness only, per the brief's instruction not to omit test-only/unused-export cases.

Two members of this list — `pokemonToShowdown` (`src/lib/utils/export-paste.ts:20`) and the pair `parseFiltersFromUrl` / `buildUrlSearch` (`src/hooks/useExploreUrlSync.ts:52,78`) — are a distinct sub-case: each is used internally by its own module *and* imported by its test. The `export` exists **solely to make the unit test possible**. Removing it would break `export-paste.test.ts` and `useExploreUrlSync.test.ts`. Explicitly **do not touch these** — they are test-visibility exports, which is a legitimate pattern, not dead code.

---

## Verified NOT dead (investigated and cleared)

Recording these so the next scan doesn't re-litigate them.

| Item | Why it's live |
|---|---|
| **All 16 files in `src/lib/data/`** | Every data blob has at least one production importer. Largest: `pokemon.ts` (243KB → `speed-tier-form.ts`, `useTeamReport.ts`, `champions/[pokemon]/page.tsx`); `dex-subset.json` (331KB → `dex-subset.ts` → `pkmn-dex-fallback.ts`); `move-names.ts` (129KB → `translate-move.ts`); `moves.ts` (82KB → `stat-relevance.ts`, `move-type-style.ts`, `OffensiveCoverageChart.tsx`); `pokemon-types-map.ts` (42KB → `api/team-graphic/route.tsx`, sole consumer but live). **No unused data blobs found.** |
| `src/lib/data/__validate-mega-coverage.ts` | Dynamically imported at `src/instrumentation.ts:14`. The `__` prefix makes it *look* orphaned; it is not. |
| `src/lib/templates.ts` | Live via `getTemplate` → `src/hooks/useHomePage.ts:27,648`. (`REPORT_TEMPLATES`/`ReportTemplate` are Tier-4 internal-only, but the file stays.) |
| `src/data/champions-sample-teams.ts`, `src/data/indy-top-cut.ts` | Both reachable from production entry points. |
| `/api/bot`, `/api/oembed`, `/api/webhooks/{clerk,linear,posthog}` | Zero internal callers **by design** — external entry points (Discord CLI, external unfurlers, third-party webhook senders). Never delete. |
| `/api/cron/{daily-ops,weekly-report,posthog-errors,weekly-digest}`, `/api/cleanup` | All five declared in `vercel.json` crons. Invoked by Vercel, not by app code. |
| `/api/{setup,migrate,keep-alive,sprite}` | Admin/ops or templated-URL endpoints; all confirmed referenced or intentionally external. |
| `/notifications` vs `/dashboard/notifications` | **Looks** like a duplicate route pair (both have a `page.tsx` + `NotificationsContent.tsx`). They are **not** duplicates: `/notifications` is the 341-line activity feed (linked from `NotificationBell.tsx:183`); `/dashboard/notifications` is the 213-line *email preferences* screen (linked from `DashboardContent.tsx:154`). Distinct features. Do not merge or delete. |
| All 30 npm dependencies | Every prod and dev dependency resolves to a real usage. `jsdom` (via `// @vitest-environment jsdom` pragmas), `start-server-and-test` + `typescript` (package.json scripts), `@types/*` (implicit) all check out despite scoring 0 on a naive import grep. |

---

## Dependency finding

#### 8. `@pkmn/dex` is in `dependencies` but is build-tooling-only

| | |
|---|---|
| **Confidence** | **HIGH** on the facts; **flagged for human review** on the action |
| **Saves** | ~1.8MB removed from the production install graph (per `pkmn-dex-fallback.ts`'s own comment) |

There is **no runtime import of `@pkmn/dex` anywhere in `src/`**:

```
$ rg -n "^import .*@pkmn/dex|from \"@pkmn/dex\"|require\(.@pkmn/dex" src
src/lib/data/dex-subset.ts:16: * scripts) can still `import { Dex } from "@pkmn/dex"` directly — only the
   ↑ a comment, not an import
```

The only real import is in a build script:

```
scripts/build-dex-subset.mjs:25:import { Dex } from "@pkmn/dex";
```

Production reads the pre-extracted `src/lib/data/dex-subset.json` through `pkmn-dex-fallback.ts` instead — which is the entire point of that script, as its header states: *"pre-extract the minimal @pkmn/dex slice … [to avoid] the full @pkmn/dex bundle from every page load. The full @pkmn/dex package is ~1.8MB."*

So the architecture already treats this as a dev-time tool; the `package.json` classification just never caught up.

⚠️ **Review before acting.** Moving it to `devDependencies` is almost certainly correct and safe (Vercel installs devDependencies during builds, and `next build` never invokes `build-dex-subset.mjs`). But it is a dependency-graph change that touches install behaviour, it should be validated against the actual Vercel build rather than reasoned about, and per CLAUDE.md it would need a real code commit at the push tip to avoid the Ignored-Build-Step cancellation. Worth doing — but deliberately, not as a drive-by.

---

## Delta vs. the previous scan (`c1-dead-code-23-05-26.md`)

Useful signal on what actually got cleaned up:

**Acted on since May (now gone):** `Badge` component, `useScrollHide` hook, `encodeShareState`, `pokemonToOpenSheet` (de-exported to a plain `function` at `export-paste.ts:86`). Good follow-through.

**Still outstanding from May:** `pokemonToShowdown`, `detectRegulationWithSignals`/`RegulationDetection`, `replaceSpeciesInBlock`, `isDynamicAllowedOrigin`, `generateCsrfToken`, `migrateCalcEntries` — all now confirmed as Tier-4 "used internally, export redundant". None are deletable code; my recommendation is to stop tracking them as dead-code debt.

**Newly dead since May:** `ConsentGate` (finding #3) — was explicitly cleared as live in the May report, orphaned since by the consent refactor. Worth noting that a component can go dead *between* scans; the reachability-graph pass is what catches this reliably.

**One piece of harmless residue:** `src/lib/sharing/__tests__/url-codec.test.ts:81` still names its block `describe("encodeShareState / decodeShareState …")` even though `encodeShareState` no longer exists. The test itself passes (it only calls `decodeShareState`); the string is just a stale label. Fix opportunistically.

---

## Recommended action list

| # | Action | Confidence | Saves | Verdict |
|---|---|---|---|---|
| 1 | Delete `src/components/display/DisplayTogglePill.tsx` (+ empty dir) | HIGH | 267 ln / 11,120 B | ✅ Safe |
| 2 | Delete `src/lib/hooks/useGlobalDisplayPrefs.ts` (+ empty dir) | HIGH | 51 ln / 1,575 B | ✅ Safe — do with #1 |
| 3 | Delete `src/components/providers/ConsentGate.tsx` | HIGH | 37 ln / 1,089 B | ✅ Safe |
| 7 | Remove stale `/api/builder/` CORS exemption in `src/proxy.ts:87` | HIGH | 1 clause | ✅ Safe, closes latent hole |
| 6 | Delete `asPokemonTypes` | HIGH | 4 ln | 🟡 Trivial — piggyback only |
| 4 | Retarget rate-limit test at `isRateLimitedAsync`, then drop `isRateLimited` | HIGH | 11 + 47 ln | ⚠️ **Human review** — coverage swap |
| 8 | Move `@pkmn/dex` to `devDependencies` | HIGH | ~1.8MB install | ⚠️ **Human review** — validate on Vercel |
| 5 | Delete `getRegMBMegas` | HIGH (unused) | 5 ln | ❌ **Do not** — staged Reg M-B API |
| — | De-export the 39 Tier-4 symbols | HIGH | 0 bytes | ❌ **Do not** — drive-by refactor, no gain |

**Clean, no-review-needed total: findings 1 + 2 + 3 + 7 → ~355 lines / ~13.8KB removed, 3 files and 2 directories deleted, one stale CORS exemption closed.** All four are pure deletions with verified zero import sites and no cascade; they should pass `tsc`/`vitest`/`build` untouched.

---

## Non-dead-code observations (FYI, out of scope)

- **`/tournaments` is navigationally orphaned.** The page is listed in `src/app/sitemap.ts:18` (priority 0.7) so search engines reach it, but **no internal link points to it** — it is absent from `PageFooter.tsx`, `PageNavbar.tsx` and `Navbar.tsx`. Not dead code (SSG + sitemap = live), but users can only arrive from search. Likely an unintentional nav omission worth raising.
- **No `/sign-in` route exists** in `src/app`, yet `src/app/notifications/page.tsx:15` and `src/app/dashboard/notifications/page.tsx:16` both `redirect("/sign-in…")`. Presumably resolved by Clerk's hosted portal / `CLERK_SIGN_IN_URL`; flagging only because a misconfigured env var would turn both redirects into 404s. Not a dead-code item.
- **Working tree is dirty.** `src/lib/utils/version-diff.ts` has uncommitted modifications (another agent's work in progress). I did not analyse or touch it beyond confirming it exports nothing unused.

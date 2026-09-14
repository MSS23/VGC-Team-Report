# C1 — Dead Code Scan (read-only)

**Date:** 2026-09-14
**Agent:** C1 (code-quality swarm)
**Repo:** `/home/user/VGC-Team-Report` @ `70c4633`
**Scope:** unused exports in `src/lib/**` + `src/components/**`, orphaned components, dead routes under `src/app/api/**`, unused npm deps, unused `public/` assets.
**Mutations made:** none. No source file edited, created, or deleted. No state-mutating git commands run (`git log` / `git status` only). This report file is the only write.

---

## Headline

**The codebase is in unusually good shape.** Every one of the 324 non-test TypeScript files under `src/` is reachable from a real Next.js entry point — there are **zero orphaned components and zero orphaned modules**. Every API route has either an in-app caller, a `vercel.json` cron entry, or a documented external caller. Every npm dependency (prod and dev) resolves to a real usage.

The previous scan's entire "safe to delete" tier has been **fully actioned** (see Delta section). What remains is a short tail of low-value items, most of which are repeat offenders that were consciously deferred rather than missed.

**Net new deletable material this run: 5 files / 3,314 bytes** (orphaned `create-next-app` starter SVGs) **+ 4 lines** (`asPokemonTypes`).

---

## Method

Three independent passes, cross-checked:

1. **Module reachability graph.** Built the real import graph (resolving `@/*`, relative specifiers, `index.*`, `.json`, and dynamic `import("…")`) seeded from all 90 Next.js implicit entry points under `src/app` — `page` / `layout` / `route` / `sitemap` / `robots` / `manifest` / `opengraph-image` / `twitter-image` / `icon` / `not-found` / `error` / `global-error` / `loading` / `template` / `default` — plus `src/instrumentation.ts` and `src/proxy.ts`. These implicit entry points are **never** treated as dead. Result: **284 files reachable; 40 unreachable, all 40 of which are test files.** Non-test unreachable count: **0**.
2. **Export inventory + per-symbol ripgrep.** Extracted all 588 exported symbols (function / const / class / interface / type / enum / `export {}` re-exports) from every non-test file in `src/`, then ran a word-boundary fixed-string `rg` for each across `src`, `cypress`, `scripts`, `next.config.ts`, `vitest.config.ts`, `package.json`, `vercel.json`, `public`, `docs`. Hits in the defining file were separated from external hits, and external hits were bucketed test-vs-production so test-only symbols surface as *production-dead* rather than being silently counted as live.
3. **Route / dependency / asset passes.** Every `src/app/api/**/route.ts(x)` mapped to its URL, with dynamic segments wildcarded so templated call sites (`` `/api/share/${id}/versions` ``) match. Every `package.json` entry grepped for real import specifiers. Every `public/` file grepped across source, `manifest.json`, `sw.js` precache list, `next.config.ts` and `vercel.json`.

**False-positive controls applied:**
- App Router implicit entry points excluded from all "unused export" conclusions (24 of the 65 self-only exports are `RootLayout`, `SharePage`, `ExploreLoading`, `GlobalError` etc. — these are framework contracts, not dead code).
- `rg -n "import\(\s*[\`$]" src` returned **zero hits** — there is no template-literal or variable-based dynamic component resolution anywhere in `src`, so nothing can hide from the static graph.
- `src/lib/data/__validate-mega-coverage.ts` correctly resolved as **live** via the dynamic `import()` in `src/instrumentation.ts` (the `__` prefix makes it look orphaned; it is not) — this confirms the graph handles dynamic imports.
- PWA `public/sw.js` `PRECACHE_URLS` and `public/manifest.json` icon arrays were parsed as asset reference sources, not just source code.

---

## Tier 1 — Safe to delete now

### 1. Five orphaned `create-next-app` starter SVGs — `public/` — **NEW**

| | |
|---|---|
| **Files** | `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` |
| **Confidence** | **HIGH** |
| **Saves** | **5 files / 3,314 bytes** |
| **Status** | 🆕 **NEW** — never flagged in any prior `.swarm` dead-code report (verified: `rg -l "window.svg\|globe.svg\|vercel.svg" .swarm/` → no matches) |

Zero references anywhere in the repo:

```
$ rg -n -F -e "file.svg" -e "globe.svg" -e "next.svg" -e "vercel.svg" -e "window.svg" \
     src cypress scripts public docs next.config.ts
(zero)
```

Critically, they are also absent from the two places a `public/` asset can be referenced without appearing in source:

- **`public/manifest.json`** — its `icons` and shortcut `icons` arrays name only `/favicon.svg`, `/icon-192.png`, `/icon-512.png`, `/icon-192-maskable.png`, `/icon-512-maskable.png`.
- **`public/sw.js` `PRECACHE_URLS`** (line 6) — lists only `/favicon.svg`, `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`.

And not in `src/app/layout.tsx`'s `metadata.icons` block (lines 62–70), which names `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/manifest.json`.

These are the stock Next.js scaffold assets. They have never been referenced by this project's code. Deleting them cannot affect the OG image pipeline (`opengraph-image.tsx` files render via `next/og`, not these files), the PWA manifest, or favicon resolution.

⚠️ Per CLAUDE.md's Ignored Build Step gotcha: this is an asset-only change. `public/*` is **not** in Vercel's ignore list (only `*.md` and `.claude/` are), so it *would* trigger a build — but it is not worth a build on its own. **Piggyback on the next real code push.**

---

### 2. `asPokemonTypes` — `src/lib/data/dex-subset.ts:221` — **PREVIOUSLY-REPORTED-AND-STILL-PRESENT**

| | |
|---|---|
| **Confidence** | **HIGH** (unused) / **LOW value** |
| **Saves** | 4 lines |
| **Status** | ♻️ **PREVIOUSLY-REPORTED-AND-STILL-PRESENT** — was finding #6 in `.swarm/c1-dead-code-10-08-26.md`. Unchanged, still zero call sites, 5 weeks later. (Note the line number moved 123 → 221; the file grew around it.) |

```
$ rg -n -w "asPokemonTypes" src cypress scripts
src/lib/data/dex-subset.ts:221:export function asPokemonTypes(types: string[]): PokemonType[] {
```

Sole occurrence in the entire repo — not even a self-reference. The body is a bare cast:

```ts
/** Narrow a string[] of types to the typed PokemonType union. */
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types as PokemonType[];
}
```

It was flagged HIGH-confidence-dead in August with the recommendation "fold into the next real change to that file rather than spending a build on it." That advice still holds, and the fact that it survived a scan cycle is itself the signal: **it is being deferred, not overlooked.** Either delete it opportunistically on the next `dex-subset.ts` touch, or accept it permanently and stop tracking it.

---

## Tier 2 — Needs human judgement

### 3. `isRateLimited` — `src/lib/rate-limit.ts:84` — **PREVIOUSLY-REPORTED-AND-STILL-PRESENT**

| | |
|---|---|
| **Confidence** | **HIGH** that it is production-dead |
| **Status** | ♻️ **PREVIOUSLY-REPORTED-AND-STILL-PRESENT** — finding #4 in the August report. **Zero change.** |

```
$ rg -n -w "isRateLimited" src
src/lib/rate-limit.ts:84:export function isRateLimited(          ← definition
src/lib/__tests__/rate-limit.test.ts:2,4,14,19,20,21,26,27,28,33,34,37,41,42,43,44   ← test only
```

Every production caller uses `isRateLimitedAsync` instead (`src/lib/security/api-guard.ts`, `src/app/api/feedback/route.ts`). The function's own docblock calls it "legacy API … prefer isRateLimitedAsync."

**Recommendation unchanged from August, and it is still the right one:** this is not a deletion, it is a *coverage swap*. `src/lib/__tests__/rate-limit.test.ts` is the only test covering the in-memory sliding-window logic (reset-after-window, per-key isolation) that `isRateLimitedAsync` also depends on via its fallback path. Retarget the test at `isRateLimitedAsync` (which exercises the same in-memory path when Upstash env vars are unset — the case under vitest), *then* drop the sync export. **Needs a human to sign off on the coverage change.** This has now been deferred through two scan cycles; if nobody intends to do the swap, it is worth closing the item deliberately rather than re-reporting it a third time.

---

### 4. `@pkmn/dex` classified as a runtime dependency — `package.json` — **PREVIOUSLY-REPORTED-AND-STILL-PRESENT**

| | |
|---|---|
| **Confidence** | **HIGH** on the facts |
| **Saves** | ~1.8MB from the production install graph |
| **Status** | ♻️ **PREVIOUSLY-REPORTED-AND-STILL-PRESENT** — finding #8 in the August report. **Zero change.** |

There is still exactly one real import in the entire repo, and it is a build script:

```
$ rg -n -e "from [\"']@pkmn/dex" -e "import\([\"']@pkmn/dex" src scripts
scripts/build-dex-subset.mjs:48:import { Dex } from "@pkmn/dex";
src/lib/data/dex-subset.ts:34: * scripts) can still `import { Dex } from "@pkmn/dex"` directly — only the
                              ↑ a comment inside a docblock, not an import
```

Production reads the pre-extracted `src/lib/data/dex-subset.json` via `pkmn-dex-fallback.ts`. That is the entire stated purpose of `build-dex-subset.mjs` ("the full @pkmn/dex package is ~1.8MB").

Moving it to `devDependencies` is almost certainly correct — Vercel installs devDependencies during builds, and `next build` never invokes the generator script. But it changes install behaviour and should be validated against a real Vercel build rather than reasoned about. **Still flagged for human review; still worth doing deliberately.**

---

### 5. `/api/oembed` has zero callers *and* no oEmbed discovery link — **NEW**

| | |
|---|---|
| **Route** | `src/app/api/oembed/route.ts` |
| **Confidence** | **MEDIUM** (may be intentionally external; may be genuinely unreachable) |
| **Status** | 🆕 **NEW** — the August report cleared `/api/oembed` as "external entry point, never delete." I am **not** contradicting that, but adding a fact that changes the picture. |

`/api/oembed` is the only route in the app with **zero** references of any kind:

```
$ rg -n -F "/api/oembed" src cypress scripts public docs
(zero)
```

That alone is expected for an oEmbed provider — consumers are external unfurlers (Discord, Notion, WordPress), not app code. **However**, oEmbed consumers discover the endpoint one of two ways: a provider registry entry, or a discovery `<link>` on the shared page. Neither exists here:

```
$ rg -n "json\+oembed|alternate.*oembed" src
(none — no discovery link)
```

So no `<link rel="alternate" type="application/json+oembed" href="…">` is emitted on `/s/[id]`, and the route is not in any public oEmbed provider registry that this repo references. In its current state the endpoint is reachable only by someone who already knows its URL.

**This is not a delete recommendation.** It is a fork in the road that needs a human:
- If oEmbed embedding is a wanted feature → **the bug is the missing discovery link**, not the route. Add the `<link>` tag to the `/s/[id]` head. The route is live and correct (the changelog at `data.ts:188` records a security fix to it in v5.10, so it has been maintained).
- If oEmbed was abandoned in favour of the `/embed/[id]` iframe route (which *is* wired into `ShareModal`'s "Copy Embed") → the endpoint is genuinely dead weight and can go.

Worth asking the owner. Either answer is a small change; leaving it in limbo is the only bad outcome.

---

### 6. Test-visibility exports in `src/lib/utils/version-diff.ts` — **NEW**

| | |
|---|---|
| **Symbols** | `SectionKey` (:32), `parseSectionKey` (:83), `sectionKeyLabel` (:119), `sectionKeySlide` (:148) |
| **Confidence** | **HIGH** that no production module imports them / **NOT recommended for action** |
| **Status** | 🆕 **NEW** to this report — but only because `version-diff.ts` had uncommitted WIP modifications during the August scan and was explicitly excluded from it. This is newly *visible*, not newly *dead*. |

Each is used internally by `version-diff.ts` itself (self-hit counts 7, 4, 3, 2) and imported by `src/lib/utils/__tests__/version-diff.test.ts`. No production importer.

**Do not touch these.** This is the same legitimate test-visibility pattern the August report identified for `pokemonToShowdown`, `parseFiltersFromUrl` / `buildUrlSearch` (`useExploreUrlSync.ts`) and `isDynamicAllowedOrigin` (`security/cors.ts`) — all four of which are still present and still correct. Removing the `export` keyword would break the unit tests and save zero bytes. Listed only so the next scan does not re-litigate them.

Full current test-visibility set (9 symbols, all **correct as-is**):
`parseFiltersFromUrl`, `buildUrlSearch`, `isRateLimited`*, `isDynamicAllowedOrigin`, `pokemonToShowdown`, `SectionKey`, `parseSectionKey`, `sectionKeyLabel`, `sectionKeySlide`.
*(\* `isRateLimited` is the exception — it is finding #3, genuinely legacy rather than test-visibility, because it has **no internal caller either**.)*

---

### 7. `evictStoredDraft` — `src/hooks/useTeamReport.ts:31` — **NEW**

| | |
|---|---|
| **Confidence** | **HIGH** (export is redundant) / **LOW value** |
| **Status** | 🆕 **NEW** — introduced by HEAD commit `70c4633 "fix: published teams can no longer resurface as a device-only draft"` |

```
$ rg -n -w "evictStoredDraft" src
src/hooks/useTeamReport.ts:31:export function evictStoredDraft() {
src/hooks/useTeamReport.ts:67:    evictStoredDraft();
src/hooks/useTeamReport.ts:166:    evictStoredDraft();
```

Used twice inside its own module, exported to nobody, not imported by any test. Zero bytes saved by de-exporting (tree-shaking already handles it).

**Mentioned only because it is brand new** — if the export was added anticipating an external caller (e.g. a sign-out handler that should also evict the draft), that caller may simply have been forgotten, which would be a *functional* gap rather than dead code. Worth a 10-second check by whoever wrote `70c4633`. Otherwise, ignore.

---

## Tier 3 — Redundant `export` keywords (explicitly NOT recommended)

**41 symbols** across `src/lib`, `src/components`, `src/hooks` and `src/data` are `export`ed but referenced only inside their own defining file. (The raw scan found 65; **24 of those are App Router implicit entry points** — `RootLayout`, `SharePage`, `ExplorePage`, `GlobalError`, `NotFound`, `DashboardLoading`, `ShareLoading`, `ProfileLayout` etc. — which are framework contracts and were excluded as false positives.)

The remaining 41: `ChangelogItem`, `TeamCombination`, `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `ChampionsSampleTeam`, `IndyTopCutEntry`, `DraftSaveResult`, `SyncStatus`, `DamageCalcsMap`, `FilterState`, `GamePlanSlots`, `evictStoredDraft`, `ViewMode`, `WALKTHROUGH_STEPS`, `AccentTheme`, `VersionDiffState`, `DexSubsetMegaStone`, `asPokemonTypes`, `MoveCategory`, `MoveFlag`, `MoveData`, `NatureData`, `TYPE_CHART`, `ChronologicalCursor`, `NotificationType`, `flushServerEvents`, `generateCsrfToken`, `PrivateField`, `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ReportTemplate`, `REPORT_TEMPLATES`, `ImportSource`, `migrateCalcEntries`, `replaceSpeciesInBlock`, `SpeedTierForm`, `GlobalFieldKey`, `LegalitySeverity`.

**Status:** ♻️ **PREVIOUSLY-REPORTED-AND-STILL-PRESENT** — near-identical to the August Tier-4 list (`GlobalFieldKey` and `evictStoredDraft` are the only additions; both arrived with new code since).

**Recommendation unchanged and emphatic: do not act.** Zero bytes saved (every symbol *is* used; tree-shaking handles them), several are legitimately public API (`HowToStep`, `SportsEventData`, `FAQItem`, `PdfExportProps` are prop types of exported components; `MoveData`, `NatureData`, `AccentTheme`, `ReportTemplate` are the shapes of exported data), and a 40-file diff touching only `export` keywords is exactly the drive-by refactor CLAUDE.md forbids — burning a full Vercel build for no user-visible or bundle-visible gain.

**This list has now been reported three times (May, August, September) and correctly ignored each time. Recommend formally closing it as "won't fix" so it stops consuming scan budget.**

---

## Verified NOT dead (investigated and cleared)

| Item | Why it's live |
|---|---|
| **All 324 non-test files under `src/`** | 100% reachable from Next.js entry points. **Zero orphaned components, zero orphaned modules.** |
| **All 53 API routes except `/api/oembed`** | Every route has an in-app `fetch` caller, a `vercel.json` cron entry, or a documented external caller. |
| `/api/cleanup`, `/api/cron/{daily-ops,weekly-report,posthog-errors,weekly-digest}` | All five declared as crons in `vercel.json`. Invoked by Vercel, never by app code. |
| `/api/bot`, `/api/webhooks/{clerk,linear,posthog}` | Zero internal callers **by design** — Discord CLI and third-party webhook senders. Never delete. |
| Low-caller routes (`/api/champions/meta`, `/api/creator/[name]`, `/api/user/{feed,export,delete,search}`, `/api/comments/flag`, `/api/views/[shareId]`) | Each has exactly one real `fetch` call site, individually verified (e.g. `MetaSnapshot.tsx:36`, `CreatorProfile.tsx:51`, `dashboard/privacy/page.tsx:37,65`, `CommentSection.tsx:140`, `CollaboratorPanel.tsx:88`, `page.tsx:688`). One caller is not dead. |
| **All 30 npm dependencies** | Every prod and dev dependency resolves to a real usage. `jsdom` (vitest environment pragmas), `start-server-and-test` + `typescript` (package.json scripts), `@types/qrcode` (implicit types for the live `qrcode` dep), `@opentelemetry/*` (instrumentation) all check out. `@pkmn/dex` is used — just in the wrong section (finding #4). |
| `public/llms.txt`, `public/llms-full.txt` | `llms-full.txt` is **not** linked from `llms.txt` or from `sitemap.ts`, which makes it *look* orphaned. It is not: both are well-known-path AEO assets per the llmstxt.org spec, fetched directly by AI crawlers at `/llms-full.txt`. Multiple `.swarm/r7-*` AEO reports treat it as a deliberate deliverable. **Do not delete.** |
| `public/{robots.txt, manifest.json, sw.js, og-default.png, favicon.*, icon-*.png, apple-touch-icon.png}` | All referenced from `layout.tsx` metadata, `manifest.json`, or `sw.js` `PRECACHE_URLS`. |
| `src/lib/data/__validate-mega-coverage.ts` | Dynamically imported at `src/instrumentation.ts`. The `__` prefix makes it look orphaned; it is not. |
| `getRegMBMegas` (`src/lib/data/mega-pokemon.ts:846`) | **Status change — now genuinely live.** August flagged it as unused-but-do-not-delete ("staged Reg M-B API"). It has since been wired up: `src/app/champions/page.tsx:4,45` and `src/app/champions/ChampionsContent.tsx:17,63`, plus an internal caller at `mega-pokemon.ts:914`. The August call to leave it alone was correct. |
| Test-visibility exports (9 symbols, finding #6) | Legitimate pattern — the `export` exists solely to make the unit test possible. |

---

## Delta vs. the previous scan (`.swarm/c1-dead-code-10-08-26.md`)

**Fully actioned since August — the entire "no-review-needed" tier is gone:**

| August finding | Status now |
|---|---|
| #1 `src/components/display/DisplayTogglePill.tsx` | ✅ **DELETED** (+ empty dir gone) |
| #2 `src/lib/hooks/useGlobalDisplayPrefs.ts` | ✅ **DELETED** (+ the confusing duplicate `src/lib/hooks/` dir gone) |
| #3 `src/components/providers/ConsentGate.tsx` | ✅ **DELETED** |
| #7 stale `/api/builder/` CORS exemption in `src/proxy.ts` | ✅ **REMOVED** — and done well: `src/proxy.ts:86` now carries a `// NOTE:` tombstone explaining what used to be there and why it went, which is exactly the right way to stop it being re-added |
| #5 `getRegMBMegas` ("do not delete") | ✅ Correctly left alone — and has since been **wired up** and is now live |

That is 5/5 of the actionable August recommendations, including the judgement call. Strong follow-through.

**Still outstanding (deferred, not missed):** #4 `isRateLimited`, #6 `asPokemonTypes`, #8 `@pkmn/dex` classification. All three were explicitly marked "human review" or "piggyback only" in August, so their survival is consistent with the advice given. **But `asPokemonTypes` (4 lines, HIGH confidence, no cascade) has now survived two scans on a "piggyback on the next change" note that never came** — if the piggyback strategy isn't working for a 4-line cast helper, just delete it or close the item.

**Newly dead since August:** nothing. No component or module went dead between scans this cycle — a contrast with the August→May delta, where `ConsentGate` was orphaned by a refactor without anyone noticing.

**Newly discovered (existed before, never previously flagged):** the 5 starter SVGs in `public/`. Prior scans covered `src/` thoroughly but appear never to have swept `public/`. Worth keeping `public/` in scope from now on.

---

## Recommended action list

| # | Action | Confidence | Saves | Status | Verdict |
|---|---|---|---|---|---|
| 1 | Delete `public/{file,globe,next,vercel,window}.svg` | HIGH | 5 files / 3,314 B | 🆕 NEW | ✅ **Safe** — piggyback on next code push |
| 2 | Delete `asPokemonTypes` (`dex-subset.ts:221`) | HIGH | 4 ln | ♻️ 2nd report | ✅ **Safe** — or close the item |
| 5 | Decide `/api/oembed`: add discovery `<link>` **or** delete the route | MEDIUM | — | 🆕 NEW | ⚠️ **Human** — feature question, not a cleanup |
| 3 | Retarget rate-limit test at `isRateLimitedAsync`, then drop `isRateLimited` | HIGH | ~58 ln | ♻️ 2nd report | ⚠️ **Human** — coverage swap |
| 4 | Move `@pkmn/dex` to `devDependencies` | HIGH | ~1.8MB install | ♻️ 2nd report | ⚠️ **Human** — validate on Vercel |
| 7 | Check whether `evictStoredDraft`'s export anticipates a missing caller | — | 0 B | 🆕 NEW | 🟡 10-second sanity check |
| 6 | Test-visibility exports (9 symbols) | HIGH | 0 B | ♻️ | ❌ **Do not** — legitimate pattern |
| — | De-export the 41 Tier-3 symbols | HIGH | 0 B | ♻️ 3rd report | ❌ **Do not** — close as won't-fix |

**Zero-review-needed total: findings 1 + 2 → 5 files and 4 lines, ~3.3KB.** Both are pure deletions with verified zero references and no cascade; they will pass `tsc` / `vitest` / `build` untouched. Neither justifies a Vercel build on its own — batch them per CLAUDE.md's cost guardrails, and make sure the push's **tip commit carries a code change** or the Ignored Build Step will cancel the whole build.

---

## Non-dead-code observations (FYI, out of scope)

- **`/tournaments` is still navigationally orphaned.** Raised in the August report and unchanged: the page is in `src/app/sitemap.ts:19` (priority 0.7) so search engines reach it, but no internal link points to it from `PageFooter.tsx`, `PageNavbar.tsx` or `Navbar.tsx`. Not dead code (SSG + sitemap = live), but users can only arrive via search. Two scans running — likely an unintentional nav omission.
- **Working tree is dirty, but only under `.swarm/`** (`main-changed-files.md`, `run-meta.md`, `webhook-investigation.md` — other agents' scratch output). No source file has uncommitted changes, so unlike the August scan, this analysis ran against a clean `src/`.

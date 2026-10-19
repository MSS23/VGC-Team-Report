# Board ↔ code reconciliation — 19 Oct 2026

**Scope:** read-only. For each candidate ticket, does the described problem still exist in the code on `main`?

**Baseline:** commit `534a59b` (`claude/loving-sagan-tv9kmf` at exact parity with `origin/main`).

> ⚠️ **Methodology note — the working tree was dirty.** 18 tracked files had uncommitted
> modifications when this audit ran (plus untracked `src/lib/db/migrations/add-explore-sort-indexes.sql`).
> Every verdict below was therefore re-verified against a clean `git archive HEAD` snapshot, **not**
> the working tree. This mattered: `src/lib/utils/translate-move.ts` has an uncommitted lazy-load of
> `move-names` that would have produced a **false `RESOLVED`** for half of VGC-268. See the
> "uncommitted work" note at the end.

## Summary table

| Ticket | Linear state | Verdict | Evidence (file:line) | Recommended action |
|---|---|---|---|---|
| VGC-289 | Backlog (High) | **RESOLVED ON MAIN** | `src/lib/data/tags.ts:9,23`; `src/lib/data/champions-dex.ts:318,325-326`; `src/lib/data/mega-pokemon.ts:912-928,998-999`; `src/app/champions/[pokemon]/page.tsx:3,28,221`; `src/app/sitemap.ts:3,30`; `src/app/changelog/data.ts:20-26` | Close. All sub-claims inverted. |
| VGC-266 | In Review (Urgent) | **RESOLVED ON MAIN** | `public/llms.txt:12,29`; `src/lib/analysis/__tests__/sp-docs-drift.test.ts:1-45` | Close. |
| VGC-262 | In Review (High) | **RESOLVED ON MAIN** | `src/app/tools/ev-to-sp/page.tsx:1-40`, `src/app/tools/ev-to-sp/EvToSpConverter.tsx`; `src/app/sitemap.ts:17` | Close. |
| VGC-298 | In Review (Medium) | **STILL OPEN ON MAIN** (one descriptive sub-claim outdated) | `src/app/faq/page.tsx:109,142`; `public/llms-full.txt:3,91`; `src/app/creator/[name]/page.tsx:3,57`; `src/lib/analysis/__tests__/sp-docs-drift.test.ts` | Keep open. **Raise priority** — see below. |
| VGC-259 | In Review (High) | **STILL OPEN ON MAIN** | `src/components/report/TeamReport.tsx` — zero `<h1>` in the whole 400-line file | Keep open. |
| VGC-270 | In Review (Medium) | **STILL OPEN ON MAIN** | `src/components/report/TeamOverview.tsx:418,424,432` | Keep open. Correct its premise (see below). |
| VGC-219 | In Review (Medium) | **RESOLVED ON MAIN** (all 5 items) | `TeamOverview.tsx:418-421`; `HomePageClient.tsx:382-420`; `SlideNavControls.tsx:406,447,491-510`; `ReportCard.tsx:322,337`; aria-labels on all 12 audited fields | Close. |
| VGC-260 | In Review (Medium) | **RESOLVED ON MAIN** | `src/lib/utils/version-diff.ts:21-32,59,83,119`; `src/lib/utils/__tests__/version-diff.test.ts` (15 tests) | Close. |
| VGC-267 | In Review (High) | **RESOLVED ON MAIN** | `src/hooks/useAutoDraft.ts:91-96`; `src/hooks/__tests__/useAutoDraft.test.ts:50-53,93-108` | Close. |
| VGC-292 | In Review (High) | **STILL OPEN ON MAIN** | `src/lib/analysis/analyze-team.ts:3,21-22`; `TeamStats.tsx:23`; `TournamentMode.tsx:74,86,222,332`; `MatchupPlanSlide.tsx:9,171` | Keep open. Highest-value live bug in this set. |
| VGC-291 | In Review (High) | **STILL OPEN ON MAIN** (worse than described) | `grep statForm src/` → 0 hits; `grep isSpFormSpread src/` → 0 hits; `champions-legality.ts:273-286`; `CompareContent.tsx:130-137`; `detect-archetype.ts:87-92` | Keep open. Correct its premise (see below). |
| VGC-247 | In Review (High) | **RESOLVED ON MAIN** | `package.json:36-37` (`posthog-js ^1.392.0`, `posthog-node ^5.38.2`) | Close. |
| VGC-256 | In Review (High) | **RESOLVED ON MAIN** | `src/lib/sharing/url-codec.ts:4-15` (dynamic `import("./url-codec.schemas")`, names VGC-256); `url-codec.schemas.ts` has no client-side static importer | Close. |
| VGC-257 | In Review (High) | **PARTIALLY RESOLVED** | AC1 met: `dex-subset.json` = 129,858 B (was 331,481); `dex-subset.ts:11-19`. AC2 **not** met: `dex-subset.ts:39` static `import rawSubset from "./dex-subset.json"`, consumed statically at `pkmn-dex-fallback.ts:30-35` | Close as superseded by VGC-271, or keep open until AC2 lands. |
| VGC-268 | In Review (High) | **STILL OPEN ON MAIN** (both halves) | motion: 10 static `motion/react` imports across 10 route-reachable components. move-names: `src/lib/utils/translate-move.ts:3` static `import { MOVE_NAMES }` **on HEAD** | Keep open. Uncommitted fix for the move-names half exists in the tree. |
| VGC-271 | In Review (High) | **STILL OPEN ON MAIN** | `dex-subset.ts:39`; `pkmn-dex-fallback.ts:30-35`; no server/client split file exists; server consumers still sync (`champions/[pokemon]/page.tsx:205`, `instrumentation.ts:14-15`) | Keep open. |
| VGC-272 | In Review (High) | **RESOLVED ON MAIN** (both halves) | `public/robots.txt:1-9` (single wildcard group, comment names VGC-272); `src/app/sitemap.ts:20-22` + `src/app/compare/page.tsx:10` | Close. |
| VGC-273 | In Review (Medium) | **STILL OPEN ON MAIN** (6 of 7 items; item 1 partial) | `.github/workflows/ci.yml:22-25`; `src/lib/linear.ts:14` + `src/app/api/discord/route.ts:23`; `src/app/api/webhooks/posthog/route.ts:188`; `src/lib/email.ts:32`, `src/lib/discord-bot.ts:60`; `src/lib/rate-limit.ts:84`; `package.json:27`; `src/app/sitemap.ts:12-35` | Keep open, or split into per-item tickets. |
| VGC-295 | In Review (Medium) | **PARTIALLY RESOLVED** | `src/app/api/explore/route.ts:223,227` (tuple cursor added) vs `:193/194`, `:207/208` (no id tiebreaker); truncation mismatch between `WHERE` and `ORDER BY` persists in all three branches | Keep open; narrow the description. |

(VGC-265 was read as context only — it is the process ticket that motivated this audit, not a code candidate. Its diagnosis is confirmed: 9 of 19 candidates are stale board entries.)

---

## Per-ticket evidence

### VGC-289 — Reg M-C unsupported → RESOLVED ON MAIN
Every sub-claim in the ticket is now false. Checked each individually:

- *"`REGULATIONS` stops at M-B"* — false. `src/lib/data/tags.ts:9` lists `"Reg M-C"`; `isChampionsFormat()` at `:22-23` returns true for M-A/M-B/M-C.
- *"`getRegMBMegasWithSprites()` caps `generateStaticParams` and the sitemap"* — false, and the named function **does not exist** on main. `generateStaticParams` calls `getRegMCMegasWithSprites()` (`src/app/champions/[pokemon]/page.tsx:28`), as does `relatedMegas` (`:221`) and the sitemap (`src/app/sitemap.ts:30`).
- *"~24 new M-C Megas never prerender"* — false, and the figure was an over-estimate. `CHAMPIONS_REG_MC_ONLY_MEGAS` (`mega-pokemon.ts:912-917`) holds **6** M-C-only Megas: `garchomp-mega-z`, `lucario-mega-z`, `absol-mega-z`, `salamence-mega`, `baxcalibur-mega`, `golisopod-mega`. All 6 are in `MEGAS_WITH_SPRITES` (`:978-981`), so all 6 prerender. Measured at runtime: `getRegMCMegasWithSprites().length === 81`, `getRegMCMegas().length === 81` — **100 % sprite coverage, zero Megas gated out**, versus 59 for M-A.
- The data gap that blocked the swarm is filled: `CHAMPIONS_MC_DEX` (`champions-dex.ts:318`) has 339 species vs `CHAMPIONS_MB_DEX`'s 304, and `getChampionsDex()` dispatches M-C at `:325-326`.
- Shipped publicly: `src/app/changelog/data.ts:20-26`, v5.28 "Pokémon Champions Regulation M-C & the Z Megas".
- Regression test green: `src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts` imports `getRegMCMegasWithSprites` at `:12` and asserts `slugs.size === getRegMCMegasWithSprites().length` at `:74`. Ran it — passes.

A human supplied the canonical M-C data the ticket was blocked on. **Safe to close.**

### VGC-266 — llms.txt wrong SP definition → RESOLVED ON MAIN
`public/llms.txt:29` now reads: *"**SP (Stat Points) vs EVs** … The conversion is not 1:1 — the first SP in a stat costs 4 EVs and every SP after that costs 8 … The budget is 66 SP total per Pokémon with a maximum of 32 SP per stat."* Correct name, correct 4-then-8 ladder, correct 66/32 budget. `:12` names M-A/M-B/M-C.

The ticket's requested guard also exists: `src/lib/analysis/__tests__/sp-docs-drift.test.ts` pins `llms.txt` and the FAQ to `CHAMPIONS_TOTAL_SP` / `CHAMPIONS_MAX_SP_PER_STAT` imported from `stat-calculator`, and asserts `llms.txt` never matches `/standard points/i` or `/1 SP = 1 EV/i`. Ran it — passes. The FAQ's old "600 SP / 200 per stat" claim is likewise pinned out.

**Safe to close.** Note the staleness has *moved*, not vanished — `public/llms-full.txt` is not covered by this test and still carries the exact error (VGC-298).

### VGC-262 — standalone EV→SP converter page → RESOLVED ON MAIN
`src/app/tools/ev-to-sp/page.tsx` exists with full `Metadata` (title, description, 11 keywords, canonical, OpenGraph), plus `BreadcrumbListJsonLd` / `FAQPageJsonLd`, and delegates the interactive part to `src/app/tools/ev-to-sp/EvToSpConverter.tsx`. It imports the tested primitives (`evToChampionsSp`, `championsSpToEv`, `CHAMPIONS_TOTAL_SP`, `CHAMPIONS_MAX_SP_PER_STAT`). It is sitemapped at `src/app/sitemap.ts:17` (priority 0.8). **Safe to close.**

Minor follow-up worth its own ticket, not a blocker: the page's `DESCRIPTION` (`page.tsx:20`) still says *"Regulation M-A"* only, now that M-C is live.

### VGC-298 — hidden structured data on /faq + llms-full.txt staleness → STILL OPEN ON MAIN
All four actionable items remain. One *descriptive* sub-claim has gone stale in the ticket's favour.

1. **FAQ HowTo — STILL OPEN.** `src/app/faq/page.tsx:3` imports `HowToSchema`; `:109` defines `SHARE_VGC_TEAM_HOW_TO_STEPS`; `:142` emits `<HowToSchema steps={SHARE_VGC_TEAM_HOW_TO_STEPS} />`. A repo-wide grep for the identifier returns exactly those two lines — the array is still never rendered. The homepage-class violation is intact.
2. **llms-full.txt — MOSTLY STILL OPEN.** `:3` is still `Updated: 2026-05-23`. `grep -c ev-to-sp` → **0**, so the converter page is still omitted. Most importantly, `:91` still reads: *"**SP (Stat Points or Standard Points)** … where 1 SP = 1 EV. The terms are interchangeable."* — **this is the identical VGC-266 error, still live in a file served to AI crawlers.** *Sub-claim that no longer holds:* the "describes Champions as Regulation M-A in 5 places" count is outdated — `M-C` now appears 4× (`:29,46,75,112`).
3. **Breadcrumb alias — STILL OPEN.** `src/app/creator/[name]/page.tsx:3,57` still uses `BreadcrumbJsonLd` (defined at `src/components/seo/JsonLd.tsx:153`). It is the sole remaining caller, so the alias still cannot be deleted.
4. **Drift guard not extended — STILL OPEN.** `sp-docs-drift.test.ts` pins only the 66/32 strings and the two forbidden phrases. It does not assert the ladder figure, and it does not read `llms-full.txt` at all. Independently confirmed the gap is live: `llms.txt:29` says *"32 SP = 248+ EVs"* where `cost(32) = 8·32 − 4 = 252`.

**Recommendation: raise priority from P3.** Item 2 means production still mis-teaches AI crawlers the exact fact VGC-266 was Urgent about — the Urgent ticket was fixed in one file and closed-in-spirit while its twin kept shipping the error.

### VGC-259 — no `<h1>` except on slide 0 → STILL OPEN ON MAIN
`src/components/report/TeamReport.tsx` is 400 lines and contains **zero** `<h1>`, `<h2>` or `<h3>` elements and no `sr-only` / `aria-labelledby` region heading. Each slide branch returns its child component bare: Common Modes (`:280-293`), `PokemonDetailSlide` (`:296-325`), `SpeedTierChart` (`:328-338`), the coverage slides (`:341-358`), `MatchupPlanSlide` (`:361-378`), `MatchupSheet` (`:382-393`). The only `<h1>`s in `src/components/report/` are the two in `TeamOverview.tsx` (`:419`, `:432`), both on slide 0.

**The ticket's own history is wrong:** VGC-270 states VGC-259 "shipped in PR #73". It did not land on `main` — PR #73 is unmerged. Keep open.

### VGC-270 — edit-mode slide 0 renders no h1 → STILL OPEN ON MAIN
Confirmed exactly as described. `TeamOverview.tsx:418` gates the sr-only fallback on `isReadOnly && !teamName`; the visible `<h1>` at `:432` sits inside the true-branch of the `isReadOnly ? … : …` ternary opened at `:424`. The else-branch (edit mode, from `:534`) renders a `<p>` of helper text and the labelled inputs — no heading. Those two are the only `<h1>`s in the file, so **edit mode renders zero `h1`**.

Caveat for whoever picks this up: the ticket says "Confirm this does not produce two `h1`s in read-only mode", reasoning against VGC-259's `(tournamentMode || physicalSlide !== 0)` guard. **That guard does not exist on `main`** (see VGC-259), so the stated interaction cannot be relied on. Fix and re-check against main's actual code.

### VGC-219 — remaining a11y findings → RESOLVED ON MAIN
All five, checked individually:

1. **h1 on no-name shared reports — RESOLVED.** `TeamOverview.tsx:418-421` renders `<h1 className="sr-only">{tournamentName || pokemon.map(e => e.parsed.species).join(" / ") || "VGC Team Report"}</h1>` when `isReadOnly && !teamName` — the exact fallback chain the ticket specified.
2. **Export Theme focus trap — RESOLVED.** `HomePageClient.tsx:382-420` (the modal moved out of `src/app/page.tsx`, now a 10-line shim). A `useEffect` keyed on `showExportThemePicker` moves focus to the first focusable on open (`:393`), handles `Escape` (`:396-400`), and wraps `Tab` / `Shift+Tab` at both ends (`:402-416`), restoring prior focus on cleanup.
3. **Slider keyboard handlers — RESOLVED by redesign.** `grep -rn 'role="slider"' src/` → **0 hits**; the un-keyboarded slider no longer exists. `SlideNavControls.tsx` now uses the correct pattern: `role="tablist"` (`:491`), `role="tab"` with roving `tabIndex={isCurrent ? 0 : -1}` (`:504-505`), `onKeyDown={handleSlideTabKeyDown}` (`:508`, handler at `:406`), and `aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"` (`:447`).
4. **ReportCard 18 px controls — RESOLVED, and exceeded.** 4 occurrences of `min-h-[44px] min-w-[44px]` on the like/save buttons (`ReportCard.tsx:322,337` and their `SignInButton` variants) — the full 44 × 44 target, not the 32 px the ticket settled for.
5. **Unlabelled inputs — RESOLVED.** Audited all 12 form fields across the three named files; every one carries an `aria-label`: `TeamOverview.tsx:194,543,553,562,570,578,589,703`, `PokemonCard.tsx:376`, `MatchupPlanSlide.tsx:678`.

**Safe to close.** Consistent with VGC-270's own note that it is "the one item genuinely still open from the VGC-219 family".

### VGC-260 — version-diff `pokemon:<index>` parsed as species → RESOLVED ON MAIN
The discriminated union the ticket asked for exists: `export type SectionKey` at `src/lib/utils/version-diff.ts:32`, with both directions funnelled through `encodeSectionKey` (`:59`, emits `` `pokemon:${key.index}` `` at `:64`) and `parseSectionKey` (`:83`). The comment at `:25-29` names the exact bug. `sectionKeyLabel` (`:119`) resolves a `pokemon:<index>` key via `speciesKeys` instead of treating the token as a species name, and `sectionKeySlide` (`:148`) maps it to a slide; both consumers (`:357-363`, `:402-405`) go through `parseSectionKey`. Every `addChange` call is typed to `SectionKey` (`:202-203`), so emit and parse cannot drift.

The missing-test complaint is also addressed: `src/lib/utils/__tests__/version-diff.test.ts` has 15 tests covering `encodeSectionKey`, `parseSectionKey`, `sectionKeyLabel` and `sectionKeySlide`. Ran it — passes. **Safe to close.**

### VGC-267 — keepalive on all draft saves → RESOLVED ON MAIN
`src/hooks/useAutoDraft.ts:96` is `keepalive: opts?.exitFlush === true` — scoped to the exit flush exactly as asked, with the 64 KiB rationale at `:91-95`. Regression tests name the ticket: `src/hooks/__tests__/useAutoDraft.test.ts:50-53` asserts `{ keepalive: false }` for in-session autosaves, `:93-108` asserts `{ keepalive: true }` on `pagehide`. Ran them — pass. **Safe to close.**

### VGC-292 — three components use the EV formula for Champions → STILL OPEN ON MAIN
Confirmed, and the root cause is upstream of the three components. `src/lib/analysis/analyze-team.ts:21-22`:

```ts
const calculatedStats = data
  ? calculateAllStats(data.baseStats, parsed.ivs, parsed.evs, parsed.level, parsed.nature)
```

`calculateAllStats` (`stat-calculator.ts:44-50`) takes no regulation and applies the classic EV formula. `analyze-team.ts` never imports `convertToChampionsSp` or `calculateAllChampionsStats`.

- `TeamStats.tsx:23` reads `p.calculatedStats.spe` for the speed range → EV numbers.
- `TournamentMode.tsx:86` reads `calculatedStats[key]`; `:222` and `:332` read `mon.calculatedStats.spe` → EV numbers. Both files import only `isChampionsFormat` (for hiding Tera), never the SP calculator.
- `MatchupPlanSlide.tsx:9,171` calls `calculateAllStats` directly on the parsed opponent paste.

Meanwhile the SP-aware path is live in `PokemonCard.tsx:154,419`, `SpeedTierChart.tsx:179,233`, `pokemon-detail/StatsPanel.tsx:23`, `pokemon-detail/usePokemonDetailModel.ts:96,114` and `CompareContent.tsx:170`. **The two-different-numbers-for-one-Pokemon bug is live in production.** Of this set, the highest-value genuine defect still open.

### VGC-291 — carry `statForm` explicitly → STILL OPEN ON MAIN (and worse than the ticket says)
- `grep -rn "statForm" src/` → **0 hits**. `src/lib/utils/effective-typing.ts` does not exist. Both live only on unmerged PR #81/#82.
- `grep -rn "isSpFormSpread" src/` → **0 hits**, so the ticket's premise *"PR #81 fixed the serious half … with a new shared `isSpFormSpread(evs)` helper"* **does not hold on `main`.** That half is unmerged too.
- The magnitude heuristic is still inline and still duplicated, as the ticket's "Bonus" predicted: `champions-legality.ts:273-286` (`looksLikeSp`, computed inline), `CompareContent.tsx:130-137`, `detect-archetype.ts:87-92`.
- The 32-SP-per-stat cap still has no error path on `main`, for a different reason than the ticket gives: `champions-legality.ts:279-280` comments *"`looksLikeSp` guarantees every stat ≤ 32, so per-stat cap is already satisfied"* — a spread over the cap falls to the `else` branch and is validated against the **510-EV** budget instead (`:290-301`).

Keep open, and amend the description: there is no partial fix on `main` to build on.

### VGC-247 — PostHog SDK versions → RESOLVED ON MAIN
`package.json:36-37`: `"posthog-js": "^1.392.0"`, `"posthog-node": "^5.38.2"` — exactly the two target versions in the ticket body (from 1.364.7 and 5.21.2). **Safe to close.**

### VGC-256 — lazy-load zod out of the client bundle → RESOLVED ON MAIN
`src/lib/sharing/url-codec.ts` has no `import { z } from "zod"` and no static import of the schemas. The schemas moved to `src/lib/sharing/url-codec.schemas.ts`, loaded via a memoised dynamic import: `let schemasPromise: Promise<typeof import("./url-codec.schemas")>` (`:12`), `schemasPromise ??= import("./url-codec.schemas")` (`:15`). The header comment at `:4-11` names VGC-256, quantifies the saving (~265 kB raw / ~63 kB gzip) and warns against re-adding the static import. Verified the split holds: the only static importers of `url-codec.schemas` are `src/app/api/user/drafts/route.ts:10` (server route) and two test files — nothing in the client graph. `useShareUrl.ts:7-10` imports only `decodeShareState` and the type. **Safe to close.**

### VGC-257 — dex-subset.json eagerly bundled → PARTIALLY RESOLVED
- **AC1 (first-load JS drops) — met.** `dex-subset.json` is 129,858 bytes on disk, matching the re-encode reported in VGC-271 (331,481 → 129,858, −60.8 %). The positional-array wire format and its VGC-257 rationale are documented at `src/lib/data/dex-subset.ts:11-19`.
- **AC2 (chunk absent from the prerendered script/preload set) — not met.** `dex-subset.ts:39` is a static `import rawSubset from "./dex-subset.json"`, and `pkmn-dex-fallback.ts:30-35` statically imports from `@/lib/data/dex-subset`. The module's own comment at `:20` says *"Decoding is lazy"* — but only the **decode** is deferred; the JSON bytes are still in the client graph.
- **AC3 (miss-path test) — not verified here**; `src/lib/data/__tests__/dex-subset.test.ts` exists but I did not audit its coverage of the miss path.

Either close as superseded by VGC-271 (which exists precisely to track AC2), or keep open until AC2 lands — but not both tickets for the same remaining work.

### VGC-268 — motion eager on 7 routes, move-names eager on / → STILL OPEN ON MAIN
- **motion — STILL OPEN.** 10 static `import … from "motion/react"` sites, none behind a component-boundary lazy load: `components/ui/WhatsNewModal.tsx:5`, `components/social/CreatorProfile.tsx:4`, `components/explore/ExploreContent.tsx:4`, `components/explore/ExploreFilters.tsx:6`, `components/explore/ExploreEmpty.tsx:3`, `components/explore/ReportCard.tsx:4`, `app/feedback/FeedbackContent.tsx:4`, `app/champions/[pokemon]/MegaLandingContent.tsx:5`, `app/dashboard/profile/page.tsx:4`, `app/changelog/ChangelogContent.tsx:4`. (10 files, not 7 — the cost has grown since filing.)
- **move-names — STILL OPEN ON MAIN.** `src/lib/utils/translate-move.ts:3` is a static `import { MOVE_NAMES } from "@/lib/data/move-names"`, feeding a module-scope `new Map(Object.entries(MOVE_NAMES)…)` at `:15-16`. The table is eagerly bundled.
  **This is the trap.** The *working tree* has an uncommitted 95-line rewrite of `translate-move.ts` that converts this to `pendingLoad ??= import("@/lib/data/move-names")`. Reading the working tree yields a false `RESOLVED`. On `HEAD` the fix is absent. The ticket's own warning — *"a previous run's changelog claims a move-names win already shipped; that fix is on an unmerged branch, so main still carries the cost"* — is **correct**, and is now also true of an uncommitted local change.

Keep open. Commit-and-merge the local `translate-move.ts` work to close half of it.

### VGC-271 — lazy-load the dex-subset fallback → STILL OPEN ON MAIN
The eager import is intact (`dex-subset.ts:39`; `pkmn-dex-fallback.ts:30-35`) and the server/client split the ticket specifies does not exist — `src/lib/data/` contains a single `pkmn-dex-fallback.ts`. Both synchronous server consumers the ticket names are still synchronous: `src/app/champions/[pokemon]/page.tsx:205` calls `lookupPokemon(mega.dataKey)` during SSG, and `src/instrumentation.ts:14-15` runs `validateMegaCoverage()` at startup. The refactor is unstarted. Keep open — this is the live half of VGC-257.

### VGC-272 — robots.txt per-bot groups + /compare sitemapped → RESOLVED ON MAIN
Both halves, and the fix names the ticket:

1. `public/robots.txt` is now a single wildcard group — `User-agent: *` / `Allow: /` / `Disallow: /api/` (`:5-7`) — with the named per-bot groups deleted. The comment at `:1-4` explains the no-inheritance semantics and tags `(VGC-272)`. Every crawler now inherits the `/api/` block.
2. `/compare` is gone from the sitemap. `src/app/sitemap.ts:20-22` carries a tombstone comment — *"intentionally noindex … do not re-add it here"* `(VGC-272)` — and `src/app/compare/page.tsx:10` keeps `robots: { index: false, follow: true }`. The decision was "keep it noindex", recorded in code.

**Safe to close.**

### VGC-273 — grouped cleanup → STILL OPEN ON MAIN
Checked all seven. Six are untouched; item 1 is partial.

1. **sitemap `lastModified` — PARTIAL / still open.** `src/app/sitemap.ts` has `lastModified` on the two DB-driven blocks (share pages `:48`, creator pages `:63`) but **none of the 11 static entries** (`:12-35`) carries one. The reverted per-route values were not restored and the revert is still unexplained.
2. **CI lint non-blocking — STILL OPEN.** `.github/workflows/ci.yml:24-25` is `- run: npm run lint` / `continue-on-error: true`, and the stray `# ponytail:` token is still in the comment at `:22`.
3. **`linearQuery` duplicated — STILL OPEN.** Both copies present: `src/lib/linear.ts:14` and `src/app/api/discord/route.ts:23`, with 8 call sites in the route alone.
4. **Untyped `.json()` — STILL OPEN.** 24 inbound `await request.json()` sites under `src/app/api/`, 8 outbound `return …json()`. The worst case the ticket names is unchanged: `src/app/api/webhooks/posthog/route.ts:188` is a bare `const body = await request.json()` with no zod boundary.
5. **`Promise<any>` exports — STILL OPEN.** `src/lib/email.ts:32` (`sendEmail`) and `src/lib/discord-bot.ts:60` (`postFeedbackEmbed`) both still lack explicit return types.
6. **`isRateLimited` production-dead — STILL OPEN.** `src/lib/rate-limit.ts:84` exports it; the only caller anywhere in `src/` is `src/lib/__tests__/rate-limit.test.ts`. All production call sites use `isRateLimitedAsync` (`api/feedback/route.ts:86`, `api/quick-share/route.ts:12`). The coverage trap the ticket flags is real and unaddressed.
7. **`@pkmn/dex` in `dependencies` — STILL OPEN.** `package.json:27` (`^0.10.7`). No runtime import in `src/` — all 8 hits are comments or changelog prose. Still needs the human Vercel-install confirmation the ticket calls for.

Keep open, or split: item 2 (blocking lint) and item 4 (webhook zod boundary) are independently worth doing and are being held up by a 7-item bundle.

### VGC-295 — Explore keyset pagination ties → PARTIALLY RESOLVED
Real progress, but the defect the ticket names is still literally in the code.

- **Resolved:** the chronological branch now has the `(timestamp, id)` keyset cursor the fix section asked for — `src/app/api/explore/route.ts:223` compares the tuple `(date_trunc('milliseconds', col), s.id) < (ts::timestamptz, id)` against `ORDER BY ${col} DESC, s.id DESC` (`:227`), backed by a new `src/lib/explore/chronological-cursor.ts` with tests. Same-millisecond ties in `created_at`/`updated_at` now break deterministically by `id`.
- **Still open — the stated bug.** The truncation is *still* inconsistent between `WHERE` and `ORDER BY` in all three branches: `WHERE` wraps the column in `date_trunc('milliseconds', …)` while `ORDER BY` uses the raw column (`:193` vs `:194`, `:207` vs `:208`, `:223` vs `:227`). Postgres timestamps are microsecond-precision, so two rows can differ sub-millisecond: `ORDER BY` separates them by raw value while the cursor sees them as equal and falls through to the `id` tiebreak — which can order them the other way. A row can still be skipped at a page edge, just in a narrower window than before.
- **Still open — popular/views have no `id` tiebreaker at all.** `parseCompositeCursor` (`:163-175`) encodes only `(value, createdAt)`, so two reports sharing both a like/view count *and* a truncated `created_at` millisecond remain ambiguous — exactly the original failure mode, on the two sorts with the heaviest ties (`:193-194`, `:207-208`).

Also relevant: `src/lib/db/migrations/add-explore-sort-indexes.sql` is **untracked** in the working tree — index work for this path exists locally but is not committed, let alone applied. The ticket's "needs `EXPLAIN` before changing, not a blind edit" caveat still stands.

---

## Tickets a human can close right now

Nine stale board entries. Each verdict rests on cited code in commit `534a59b`, in files with no uncommitted modifications.

1. **VGC-289** — Reg M-C is fully supported: `REGULATIONS` and `isChampionsFormat` cover M-C, `CHAMPIONS_MC_DEX` has 339 species, and all 81 M-C Megas (6 of them M-C-only) prerender and sitemap via `getRegMCMegasWithSprites()`; shipped as changelog v5.28.
2. **VGC-266** — `public/llms.txt:29` now states "SP (Stat Points)", the 4-then-8 ladder and the 66/32 budget, with `sp-docs-drift.test.ts` pinning it to the real constants and banning both wrong phrasings.
3. **VGC-262** — `src/app/tools/ev-to-sp/page.tsx` + `EvToSpConverter.tsx` exist, fully SEO-equipped and sitemapped at `sitemap.ts:17`.
4. **VGC-219** — all five remaining a11y findings fixed: sr-only `h1` fallback, full Export-Theme focus trap, the `role="slider"` control replaced by a keyboard-complete `tablist`, like/save buttons at 44 × 44, and `aria-label` on all 12 audited form fields.
5. **VGC-260** — `SectionKey` discriminated union with `encodeSectionKey`/`parseSectionKey` makes emit/parse drift unrepresentable, species names resolve through `speciesKeys`, and 15 passing tests now cover the module.
6. **VGC-267** — `useAutoDraft.ts:96` scopes `keepalive` to `exitFlush` only, with passing tests that name VGC-267 and assert both the `false` and `true` cases.
7. **VGC-247** — `package.json:36-37` pins `posthog-js ^1.392.0` and `posthog-node ^5.38.2`, the exact targets in the ticket.
8. **VGC-256** — zod is out of the client graph: `url-codec.ts` loads `url-codec.schemas` through a memoised dynamic `import()`, with no client-side static importer.
9. **VGC-272** — `robots.txt` collapsed to one wildcard group so `Disallow: /api/` applies to every crawler, and `/compare` is removed from the sitemap with a tombstone comment keeping it noindex.

**Do not close** VGC-298, VGC-259, VGC-270, VGC-292, VGC-291, VGC-268, VGC-271, VGC-273 (all live), nor VGC-257 / VGC-295 without first narrowing them to the residue described above.

---

## Uncommitted work in the tree at audit time

Not part of any verdict, but it is what makes a working-tree audit unsafe. 18 modified tracked files, 2 untracked:

```
src/components/report/{OffensiveCoverageChart,PokemonCard,TournamentMode,TypeBadge}.tsx
src/components/report/pokemon-detail/MovesPanel.tsx
src/components/ui/OTSSheetModal.tsx
src/lib/__tests__/homepage-eager-imports.test.ts
src/lib/analysis/__tests__/damage-calculator.test.ts
src/lib/data/type-chart.ts  src/lib/data/__tests__/type-chart.test.ts
src/lib/db.ts
src/lib/parser/showdown-parser.ts  src/lib/parser/__tests__/showdown-parser.test.ts
src/lib/types/pokemon.ts
src/lib/utils/translate-move.ts  src/lib/utils/__tests__/translate-move.test.ts
src/lib/utils/type-colors.ts  src/lib/utils/__tests__/export-paste.test.ts
?? .swarm/run-meta-19-10-26.md
?? src/lib/db/migrations/add-explore-sort-indexes.sql
```

Two of these bear directly on tickets above: `translate-move.ts` (half of VGC-268) and `add-explore-sort-indexes.sql` (VGC-295). Both are real work that is invisible to `main` — the same class of loss VGC-265 describes, one step earlier in the pipeline: not an unmerged branch, an uncommitted diff.

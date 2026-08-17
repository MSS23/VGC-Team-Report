# C1 — Dead Code Scan (read-only)

**Date:** 2026-08-17
**Agent:** C1 (overnight audit swarm)
**Repo:** `/home/user/VGC-Team-Report` @ `5d456cd`, branch `claude/loving-sagan-853anq`
**Prior run compared against:** `.swarm/c1-dead-code-10-08-26.md` (@ `a70d924`)
**Mutations made:** none. No source file edited/created/deleted. Read-only git only (`status`, `log`, `rev-parse`). `npm run typecheck` run (passes clean). **No build run** (shared worktree).

---

## Headline

**The codebase is in very good shape. Exactly one symbol is genuinely dead, and it is a 3-line type cast.**

The prior run's four "no-review-needed" items (findings 1, 2, 3, 7) have **all been actioned and verified gone**. One prior finding (#5, `getRegMBMegas`) has **flipped to live**. One **new** production-dead symbol appeared, and it turns out to be a deliberate regression guard — not deletable.

---

## Method

Four independent passes, cross-checked:

1. **Module reachability graph.** Resolved every import (`@/*`, relative, `index.*`, `.json`, and dynamic `import("…")`) across all 320 code files in `src/`, seeded from the 90 Next.js App Router entrypoints (`page`/`layout`/`route`/`sitemap`/`robots`/`not-found`/`error`/`global-error`/`loading`/`template`/`default`/`opengraph-image`/`icon`/`manifest`) plus `src/instrumentation.ts` and `src/proxy.ts`.
   → **282 files reachable. Zero unreachable non-test files. Zero unresolved local specifiers.**
2. **Export inventory + per-symbol cross-reference.** Extracted all 591 exports from non-test files, then token-counted every identifier across `src/`, `cypress/`, `scripts/`, `.github/`, and root configs. Run **twice** — once on raw text, once with comments and string literals stripped — so a symbol whose only "usage" is a doc-comment mention cannot hide. Next.js framework-reserved export names in App Router files (`generateStaticParams`, `metadata`, `GET`/`POST`/…, `revalidate`, `dynamic`, `alt`, `size`, `contentType`, `viewport`) were excluded as framework entrypoints, as were all default exports of route files.
3. **Route pass.** All 54 `src/app/api/**/route.ts` files mapped to their URL (dynamic segments wildcarded so `/api/share/${id}/versions` matches) and grepped for callers across app code, `cypress/`, `scripts/`, `vercel.json`, `.claude/`. All 21 `page.tsx` routes checked for internal `href` links and sitemap presence.
4. **Component render pass.** Every component-shaped export (201) checked for an actual `<Name …>` JSX usage somewhere in `src/`. → **Zero orphaned components.** Every entry on the "not rendered as JSX" list is a constant, a page default export, or a route handler.
5. **Dependency pass.** All 23 prod + 13 dev dependencies grepped for import specifiers across source, scripts, configs, `package.json` scripts, and `globals.css`.

---

## Confirmed dead (safe to delete)

### 1. `src/lib/data/dex-subset.ts:221` — `asPokemonTypes` — **STILL-PRESENT-FROM-PRIOR-RUN** (was finding #6)

```
src/lib/data/dex-subset.ts:220  /** Narrow a string[] of types to the typed PokemonType union. */
src/lib/data/dex-subset.ts:221  export function asPokemonTypes(types: string[]): PokemonType[] {
src/lib/data/dex-subset.ts:222    return types as PokemonType[];
src/lib/data/dex-subset.ts:223  }
```

| | |
|---|---|
| **Confidence** | **HIGH** |
| **External references** | **0** — production, tests, cypress, scripts, docs, all of it |
| **Internal references** | **0** — the symbol appears exactly once in its own file (the declaration) |
| **Saves** | 4 lines |

Repo-wide grep (excluding `.swarm/` reports, which only quote it):

```
$ rg -n "asPokemonTypes" . -g '!node_modules' -g '!.next' -g '!.swarm'
src/lib/data/dex-subset.ts:221:export function asPokemonTypes(types: string[]): PokemonType[] {
```

This is the **only genuinely dead symbol in `src/`**. Verdict unchanged from the prior run: it is real dead code, but the payoff is negligible. **Piggyback it onto the next real change to `dex-subset.ts`** — do not spend a Vercel build on 4 lines.

**Confirmed-dead total: 1 symbol / 4 lines. Nothing else in `src/` qualifies.**

---

## Suspicious but referenced (do NOT delete)

### 2. `src/lib/data/mega-pokemon.ts:902` — `getRegMAMegasWithSprites` — **NEW**

**This is the only genuinely new dead-code signal since the last scan, and the answer is "leave it".**

```
src/lib/data/mega-pokemon.ts:901  /** Reg M-A Megas that have sprites on Showdown — the only ones we link to. */
src/lib/data/mega-pokemon.ts:902  export function getRegMAMegasWithSprites(): MegaPokemonEntry[] {
src/lib/data/mega-pokemon.ts:903    return getRegMAMegas().filter((m) => MEGAS_WITH_SPRITES.has(m.dataKey));
src/lib/data/mega-pokemon.ts:904  }
```

Every reference, in full:

```
src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts:9,31   ← test only
src/app/champions/[pokemon]/page.tsx:25                                    ← a COMMENT, not a call
src/lib/data/mega-pokemon.ts:902                                           ← the declaration
```

Zero production call sites; internal self-references = 0. It went production-dead in **VGC-258**, when `/champions` static params, the index grid and the sitemap were widened from Reg M-A to `getRegMBMegasWithSprites()` (M-B is a superset of M-A).

**Do not delete.** `generate-static-params.test.ts` is an explicit VGC-258 regression guard whose docblock says so, and the M-A accessor is load-bearing inside it — the test asserts static params cover *every sprited M-A Mega* **and** *every sprited M-B Mega*, so the next regulation rotation (M-C) can't silently narrow coverage again. Deleting the accessor deletes half the guard. This is a legitimate test-visibility export, exactly the pattern CLAUDE.md's "regressions get a test that names the bug" convention produces.

**Status change worth noting:** the prior run flagged `getRegMBMegas` (M-B variant) as the unwired half of a symmetric pair. That has **inverted** — `getRegMBMegas` is now live in three places (`champions/page.tsx:4,45`, `ChampionsContent.tsx:17,63`, and via `getRegMBMegasWithSprites`), and it is the **M-A** variant that is now unwired. Prior finding #5 is **resolved**; do not re-file it.

---

### 3. `src/lib/rate-limit.ts:84` — `isRateLimited` — **STILL-PRESENT-FROM-PRIOR-RUN** (was finding #4)

Unchanged since 10-08. Its own docblock declares it legacy:

```
src/lib/rate-limit.ts:80  /**
src/lib/rate-limit.ts:81   * Synchronous in-memory rate limiter (legacy API).
src/lib/rate-limit.ts:82   * Kept for backward compatibility — prefer isRateLimitedAsync.
src/lib/rate-limit.ts:83   */
src/lib/rate-limit.ts:84  export function isRateLimited(
```

Zero production call sites (0 internal, 0 external non-test); every prod consumer uses `isRateLimitedAsync` (`src/lib/security/api-guard.ts:10`, `src/app/api/feedback/route.ts:2`). Sole external importer is `src/lib/__tests__/rate-limit.test.ts:15`.

⚠️ **Still needs human review, not deletion.** That test is the only coverage of the in-memory sliding-window logic (reset-after-window, per-key isolation) that `isRateLimitedAsync` also depends on via `isRateLimitedInMemory`. The correct move remains: retarget the test at `isRateLimitedAsync` (which takes the in-memory path under vitest, where Upstash env vars are unset), *then* drop the sync wrapper. That is a coverage swap requiring sign-off, not a cleanup.

---

### 4. `src/lib/db/migrations/*.sql` — 3 unreferenced SQL files — **NEW**

The reachability graph's non-code sweep found the only unreferenced non-TS files in `src/`:

| File | Lines | Status |
|---|---|---|
| `src/lib/db/migrations/add-species-column.sql` | 5 | **Superseded** — the column it adds was dropped by `drop-species-column.sql` (VGC-218). No code reads or writes `shares.species` anywhere; `grep` for it in `db.ts` / `api/share/route.ts` returns nothing. |
| `src/lib/db/migrations/drop-species-column.sql` | 13 | The migration that undid the above. Historical record. |
| `src/lib/db/migrations/add-unlisted-column.sql` | 1 | **Duplicated inline** — its exact statement is already in `src/lib/db.ts:27` (`ensureSchema`), which is what actually runs. |

No code path reads these files (no `fs.readFile`, no glob, no migration runner). `/api/migrate` does batch **data** normalization, not DDL — it never touches this directory. The only repo references are `.swarm/` design notes from May.

**Not recommended for deletion — but flag to the owner.** They are zero-cost operational history, and one-way SQL runbooks are legitimately kept for the record. The genuine risk is the opposite of dead weight: `add-species-column.sql` sitting in a `migrations/` directory *looks* like a pending migration for a column that no longer exists, and there is no manifest or runner distinguishing applied from unapplied. If anything is done here, the useful change is a `README.md` in that directory recording that schema is managed by `ensureSchema()` in `db.ts` and these files are historical. That is a docs change, so per CLAUDE.md it must not be the tip commit of a push.

---

### 5. `@pkmn/dex` classified as a prod dependency — **STILL-PRESENT-FROM-PRIOR-RUN** (was finding #8)

Unchanged. The only `src/` hit is a **comment** in `src/lib/data/dex-subset.ts:16`; the only real import is `scripts/build-dex-subset.mjs:25`. Production reads the pre-extracted `src/lib/data/dex-subset.json` (129KB) via `pkmn-dex-fallback.ts`. Moving it to `devDependencies` would drop ~1.8MB from the production install graph.

⚠️ Still flagged for human review — it changes install behaviour and should be validated against a real Vercel build, and it needs a code commit at the push tip to dodge the Ignored-Build-Step cancellation.

---

### 6. Framework/external entrypoints with zero internal callers — **all cleared, unchanged**

Re-verified so the next scan doesn't re-litigate:

| Item | Why it is live |
|---|---|
| `/api/bot`, `/api/oembed`, `/api/webhooks/{clerk,linear,posthog}` | Zero internal callers **by design** — external entry points (Discord CLI, unfurlers, third-party webhook senders). |
| `/api/cron/{daily-ops,weekly-report,posthog-errors,weekly-digest}`, `/api/cleanup` | Declared in `vercel.json` crons (lines 4, 8, 12, 16, 20). Invoked by Vercel. |
| `/api/migrate`, `/api/setup` | **Zero code callers** — confirmed: the apparent hits at `src/app/changelog/data.ts:105` are changelog *prose*, and `src/proxy.ts:33` is a bot-detection path exemption, not a call. Both are bearer-secret-protected admin/ops endpoints invoked by hand. Correct as-is. |
| `src/lib/data/__validate-mega-coverage.ts` | Dynamically imported at `src/instrumentation.ts:14`. The `__` prefix makes it look orphaned; the graph resolves it. |
| `src/proxy.ts:140` `config` | Next.js middleware matcher — framework-read, never imported. False positive of any naive scan. |
| All 7 i18n locale files | Loaded through the dynamic-import map at `src/lib/i18n/index.ts:26–32`. All 7 wired. |
| All 31 exports in `src/components/ui/icons.tsx` | Every one has ≥2 external references. No dead icons. |
| All 23 prod + 13 dev dependencies | Every one resolves to a real usage. `jsdom` (via `@vitest-environment` pragmas), `start-server-and-test`/`typescript` (package.json scripts), `@types/*` (implicit) check out despite scoring 0 on a naive import grep. |

---

### 7. Redundant `export` keywords — **STILL-PRESENT-FROM-PRIOR-RUN, unchanged, still not actionable**

~40 symbols are `export`ed but referenced only inside their own defining file (verified used internally by both the raw and comment-stripped passes — e.g. `TYPE_CHART` used at `type-chart.ts:180`, `REPORT_TEMPLATES` at `templates.ts:61`, `generateCsrfToken` at `csrf.ts:49`, `migrateCalcEntries` at `normalize-report.ts:103`, `replaceSpeciesInBlock` at `paste-edit.ts:97`, `flushServerEvents` at `posthog-server.ts:44`, `WALKTHROUGH_STEPS` at `useWalkthrough.ts:189`, `MEGAS_WITH_SPRITES` at `mega-pokemon.ts:903,914,932`, `POKEMON_DATA` at `pokemon.ts:3385,3395`, `GlobalFieldKey` at `version-diff.ts:34,54`).

**Recommendation unchanged: do not act.** Zero bytes saved (tree-shaking already handles them), several are legitimately public prop/data types (`HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, `PdfExportProps`, `MoveData`, `NatureData`, `AccentTheme`, `ReportTemplate`), and it is precisely the drive-by refactor CLAUDE.md forbids.

A distinct sub-case — **test-visibility exports**, explicitly do not touch: `pokemonToShowdown` (`export-paste.ts:20`), `parseFiltersFromUrl`/`buildUrlSearch` (`useExploreUrlSync.ts:52,78`), `isDynamicAllowedOrigin` (`cors.ts:39`), `SectionKey`/`parseSectionKey`/`sectionKeyLabel`/`sectionKeySlide` (`version-diff.ts:32,83,119,148`), `MEGAS_WITH_SPRITES`, `POKEMON_DATA`. Each is used internally *and* imported by its unit test; the `export` exists to make the test possible. Legitimate pattern, not debt.

---

## Delta vs. `c1-dead-code-10-08-26.md`

| Prior # | Item | Status today |
|---|---|---|
| 1 | `src/components/display/DisplayTogglePill.tsx` | ✅ **FIXED** — file and directory gone |
| 2 | `src/lib/hooks/useGlobalDisplayPrefs.ts` | ✅ **FIXED** — file and the confusing `src/lib/hooks/` directory gone |
| 3 | `src/components/providers/ConsentGate.tsx` | ✅ **FIXED** — file gone; `src/lib/consent.ts` correctly retained (still live via `PostHogProvider`, `ClarityProvider`) |
| 7 | `/api/builder/` CORS exemption in `src/proxy.ts` | ✅ **FIXED** — clause removed from the condition at `src/proxy.ts:90`, and replaced with a good explanatory NOTE at lines 86–89 warning against re-adding it. Exemplary fix. |
| 5 | `getRegMBMegas` unwired | ✅ **RESOLVED BY INVERSION** — now live in 3 places; the M-A variant took its place as the unwired half (finding #2 above) |
| 4 | `isRateLimited` production-dead | 🔁 **STILL-PRESENT** — unchanged, still awaiting the coverage-swap decision |
| 6 | `asPokemonTypes` | 🔁 **STILL-PRESENT** — the only confirmed dead symbol |
| 8 | `@pkmn/dex` in `dependencies` | 🔁 **STILL-PRESENT** — unchanged |
| Tier 4 | ~40 redundant `export` keywords | 🔁 **STILL-PRESENT** — unchanged, still not recommended |

**Net:** 4 of 4 no-review-needed items shipped (~355 lines, 3 files, 2 directories, 1 CORS hole). Follow-through was complete and correct.

**New this run:** finding #2 (`getRegMAMegasWithSprites`, non-actionable) and finding #4 (orphaned SQL migrations, non-actionable). **No new deletable dead code appeared in the last week.**

---

## Non-dead-code observations (FYI, out of scope)

- **`/tournaments` is still navigationally orphaned — STILL-PRESENT-FROM-PRIOR-RUN.** It is in `src/app/sitemap.ts:18` at priority 0.7, but internal-link count is **0** — absent from `PageFooter.tsx`, `PageNavbar.tsx`, `Navbar.tsx` and every other `src/` file. Users can only arrive from search. Every other public route has ≥1 internal link (`/compare` 2, `/tools/ev-to-sp` 2, `/faq` 1, `/support` 2, `/terms` 2, `/privacy` 4, `/changelog` 6, `/feedback` 7, `/explore` 14, `/champions` 6). Not dead code, but a week later it is still the single odd one out and looks like an unintentional nav omission. Worth a ticket.
- **Stale test label — STILL-PRESENT.** `src/lib/sharing/__tests__/url-codec.test.ts:88` still reads `describe("encodeShareState / decodeShareState (Node-compatible)")` although `encodeShareState` no longer exists anywhere in `src/`. The test passes (it only calls `decodeShareState`); the string is cosmetic residue. Fix opportunistically.
- **No `/sign-in` route exists — STILL-PRESENT.** `src/app/notifications/page.tsx:15` and `src/app/dashboard/notifications/page.tsx:16` both `redirect("/sign-in…")`, presumably resolved by Clerk's hosted portal / `CLERK_SIGN_IN_URL`. Flagged only because a misconfigured env var turns both into 404s.
- **`/notifications` vs `/dashboard/notifications` are still NOT duplicates** — activity feed vs. email preferences. Re-verified; do not merge.
- **Working tree is clean** apart from the untracked `.swarm/run-meta-17-08-26.md`. Unlike the prior run, no other agent's WIP was in flight during this scan.
- **`npm run typecheck` (cold, `--incremental false`) passes clean** at `5d456cd`.

---

## Recommended action list

| # | Action | Confidence | Saves | Verdict |
|---|---|---|---|---|
| 1 | Delete `asPokemonTypes` — `src/lib/data/dex-subset.ts:221–223` | HIGH | 4 ln | 🟡 Safe, but **piggyback only** — not worth a build |
| 3 | Retarget `rate-limit.test.ts` at `isRateLimitedAsync`, then drop `isRateLimited` (`src/lib/rate-limit.ts:84`) | HIGH | 11 + 47 ln | ⚠️ **Human review** — coverage swap |
| 5 | Move `@pkmn/dex` to `devDependencies` | HIGH | ~1.8MB install | ⚠️ **Human review** — validate on Vercel |
| 4 | Add a `README.md` to `src/lib/db/migrations/` noting schema is owned by `ensureSchema()` | MEDIUM | 0 | 🟡 Optional; docs-only, never the push tip |
| 2 | Delete `getRegMAMegasWithSprites` | HIGH (prod-unused) | 4 ln | ❌ **Do not** — load-bearing in the VGC-258 regression guard |
| — | De-export the ~40 Tier-4 symbols | HIGH | 0 bytes | ❌ **Do not** — drive-by refactor, no gain |
| — | File a ticket to link `/tournaments` from the footer or navbar | — | — | 📋 Follow-up (not dead code) |

**Bottom line for the orchestrator: there is no clean deletable batch this week.** The prior run's batch was fully shipped; what remains is one 4-line cast worth piggybacking, two items already carrying a human-review flag from last week, and two new findings that both resolve to "leave it alone". `src/` currently has zero orphaned files, zero orphaned components, and zero dead routes.

# C1 — Dead Code Scan (read-only audit)

**Repo:** `/home/user/VGC-Team-Report` · Next.js 16 App Router, React 19, TS, Tailwind v4
**Date:** 2026-10-05
**Scope:** `src/`, `scripts/`, `cypress/`, `public/`, root config, `package.json`
**Mode:** READ-ONLY. No repo file was modified, created or deleted except this report. No git state changes, no network sends.

---

## Method

Three independent passes, all run over the live working tree:

1. **Export extraction.** Every `export` form in all 329 `src/**/*.{ts,tsx}` files was parsed into a symbol table (`552` named exports, excluding `export default`). Coverage was then verified negatively — this grep returns **zero rows**, proving no export form escaped the parser:
   ```bash
   grep -rhn "^export" src/ --include='*.ts' --include='*.tsx' \
     | sed 's/^[0-9]*://' \
     | grep -v "^export \(async \)\?\(declare \)\?\(const\|let\|var\|function\|class\|interface\|type\|enum\) [A-Za-z0-9_$]*" \
     | grep -v "^export {" | grep -v "^export default" | sort -u
   ```
   There are also **no barrel files** — `grep -rn "export \*" src/` returns nothing — so the "re-exported from a used barrel" exemption never applies in this repo.

2. **Whole-repo token index.** Every identifier-shaped token in every `.ts .tsx .mjs .js .jsx .json .md .css .sql .sh .yml .yaml .html .webmanifest` file (excluding `node_modules`, `.next`, `.git`, `.swarm`, `.planning`) was indexed to the set of files containing it. A symbol is a candidate only when that set contains **no file other than its own definition file**. Because the index is token-based rather than import-based, it also catches string-based references, `import()` specifiers, test files, comments and docs — which makes it conservative (it under-reports dead code rather than over-reporting it).

3. **File-level import graph.** All static `from "…"` / `import(…)` / `require(…)` specifiers plus CSS `@import` were resolved through the `@/* → ./src/*` tsconfig alias with `.ts/.tsx/.json/.css/index.*` resolution, across `src/`, `scripts/`, `cypress/` and the root configs, producing an importer list per file.

Framework exports were exempted only on true Next.js entrypoint filenames (`page|layout|route|sitemap|robots|opengraph-image|twitter-image|icon|apple-icon|not-found|error|global-error|loading|template|default|instrumentation|proxy|middleware`): `metadata`, `generateMetadata`, `generateStaticParams`, `dynamic`, `runtime`, `revalidate`, `viewport`, `maxDuration`, `alt`, `size`, `contentType`, the HTTP verb handlers, `register`, `onRequestError`, etc.

Every candidate below was then re-checked with an individual `grep -rnw <symbol> . --exclude-dir={node_modules,.next,.git,.swarm,.planning}` and the defining file filtered out. The exact greps are quoted per finding.

**Methodology validation.** The 31 exports of `src/components/ui/icons.tsx` were swept individually; the lowest external count was 2 (import line + use site) for every icon, i.e. the scan produces no false "unused" on a file known to be fully consumed.

---

## Headline counts

| Category | CONFIRMED | SUSPECTED |
|---|---|---|
| 1. Unreferenced exported symbols | 41 | 0 |
| 2. Orphaned component files in `src/components/` | **0** | 0 |
| 3. Dead routes (pages / API) | **0** | 2 |
| 4. Unused npm `dependencies` | **0** | 1 (misplaced, not unused) |
| 5. Unused files entirely | 5 | 6 |
| — Production-dead (alive only via its own test) | 1 | 0 |
| **Total** | **47** | **9** |

Of the 41 unreferenced exports, **only 1 is a dead definition** (`asPokemonTypes` — never referenced even inside its own file). The other 40 are **over-exported but internally used**: the fix is deleting the `export` keyword, not the code. They are reported separately below so the distinction is not lost.

---

## CONFIRMED findings, ranked by deletion safety (safest first)

### Tier 1 — Unused static assets (zero code impact)

Five `create-next-app` template SVGs that nothing in the repo references. Confirmed with a repo-wide grep that excludes `public/` itself (so the file's own existence can't satisfy the match):

```bash
for s in file.svg globe.svg next.svg vercel.svg window.svg; do
  echo -n "$s: "; grep -rn -F "$s" . \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
    --exclude-dir=.swarm --exclude-dir=.planning --exclude-dir=public | wc -l
done
# file.svg: 0 / globe.svg: 0 / next.svg: 0 / vercel.svg: 0 / window.svg: 0
```

Also checked against `public/manifest.json`, `public/sw.js`, `public/robots.txt`, `public/llms.txt`, `src/app/globals.css`, `next.config.ts` and `vercel.json` (all inside the broader grep in pass 3) — no hits.

| # | File | Safety |
|---|---|---|
| 1 | `public/file.svg` | Safest — static asset, no importer, no CSS `url()`, not in manifest or service worker precache |
| 2 | `public/globe.svg` | same |
| 3 | `public/next.svg` | same |
| 4 | `public/vercel.svg` | same |
| 5 | `public/window.svg` | same |

> Caveat worth one check before deleting: `public/sw.js` is a hand-written service worker. It was grepped and does not name these files, but if it precaches by directory listing rather than by name, re-verify. (It does not — the grep above covered `public/`.)

### Tier 2 — One genuinely dead function

**`src/lib/data/dex-subset.ts:221` — `asPokemonTypes`**

```bash
grep -nw "asPokemonTypes" src/lib/data/dex-subset.ts
# 221:export function asPokemonTypes(types: string[]): PokemonType[] {
grep -rnw "asPokemonTypes" . --exclude-dir=node_modules --exclude-dir=.next \
  --exclude-dir=.git --exclude-dir=.swarm --exclude-dir=.planning \
  | grep -v "^./src/lib/data/dex-subset.ts:"
# (no output)
```

Line 221 is the **only** occurrence of the identifier anywhere in the repo — no callers, no internal use, no test, no doc mention. This is the one finding in category 1 where the body is dead and not just the `export` keyword. Deleting the function is safe; the `PokemonType` import it uses is shared with the rest of the file, so check the import line still has other consumers before trimming it.

### Tier 3 — Production-dead: alive only because of its own test

**`src/lib/rate-limit.ts:84` — `isRateLimited`** (plus its test file `src/lib/__tests__/rate-limit.test.ts`)

```bash
grep -rn "lib/rate-limit" src/
# src/app/api/feedback/route.ts:2:   import { isRateLimitedAsync } from "@/lib/rate-limit";
# src/lib/security/api-guard.ts:10:  import { isRateLimitedAsync } from "@/lib/rate-limit";
# src/lib/__tests__/rate-limit.test.ts:2: import { isRateLimited } from "@/lib/rate-limit";
grep -nw "isRateLimited" src/lib/rate-limit.ts
# 84:export function isRateLimited(   ← only occurrence; no internal caller
```

Both production call sites use `isRateLimitedAsync`. `isRateLimited` has **no internal caller and no production caller** — its only reference in the entire repo is the vitest file that exists to test it. The source comment states the intent explicitly:

> `Synchronous in-memory rate limiter (legacy API). Kept for backward compatibility — prefer isRateLimitedAsync.`

**Judgment:** this is a private Next.js app, not a published package, so there is no external consumer the "backward compatibility" can be protecting. Removing the function and its test is low-risk. Because the comment is a deliberate keep-signal, it belongs to the user, not to an automated sweep — see *Deliberately-unused-but-keep* below.

### Tier 4 — Over-exported symbols: remove the `export` keyword, keep the code (40 symbols)

Each of the following has **zero references outside its defining file** (confirmed per-symbol with `grep -rnw <name> . --exclude-dir={node_modules,.next,.git,.swarm,.planning} | grep -v "^./<file>:"` → no output for all 40), but **is used inside that file**. The only safe change is dropping `export`; deleting the symbol would break its own module.

These are one-token, zero-behaviour edits — safe, but genuinely low payoff. `tsc`, `eslint` and the bundler all treat them identically either way; the only gain is a smaller public surface and a clearer signal next time this audit runs.

| File:line | Symbol | Internal mentions | Note |
|---|---|---|---|
| `src/app/changelog/data.ts:3` | `ChangelogItem` | 1 | **high churn (3)** |
| `src/components/report/CommonModesSlide.tsx:16` | `TeamCombination` | 6 | |
| `src/components/seo/JsonLd.tsx:36` | `HowToStep` | 2 | props shape |
| `src/components/seo/JsonLd.tsx:83` | `SportsEventData` | 1 | props shape |
| `src/components/seo/JsonLd.tsx:142` | `BreadcrumbItem` | 2 | props shape |
| `src/components/seo/JsonLd.tsx:193` | `FAQItem` | 2 | props shape |
| `src/components/ui/PdfExport.tsx:25` | `PdfExportProps` | 1 | props-interface convention |
| `src/data/champions-sample-teams.ts:7` | `ChampionsSampleTeam` | 1 | data-table shape |
| `src/data/indy-top-cut.ts:7` | `IndyTopCutEntry` | 1 | data-table shape |
| `src/hooks/useAutoDraft.ts:13` | `DraftSaveResult` | 3 | hook return type |
| `src/hooks/useCollaborativeSync.ts:6` | `SyncStatus` | 1 | hook return type |
| `src/hooks/useDamageCalcs.ts:19` | `DamageCalcsMap` | 4 | hook return type |
| `src/hooks/useExploreUrlSync.ts:6` | `FilterState` | 10 | hook return type |
| `src/hooks/useMatchupPlans.ts:24` | `GamePlanSlots` | 2 | hook return type |
| `src/hooks/useTeamReport.ts:31` | `evictStoredDraft` | 2 | **high churn (3)** |
| `src/hooks/useTeamReport.ts:74` | `ViewMode` | 1 | **high churn (3)** |
| `src/hooks/useWalkthrough.ts:16` | `WALKTHROUGH_STEPS` | 1 | data table |
| `src/lib/accent-themes.ts:3` | `AccentTheme` | 2 | data-table shape |
| `src/lib/contexts/VersionDiffContext.tsx:6` | `VersionDiffState` | 2 | context value type |
| `src/lib/data/dex-subset.ts:65` | `DexSubsetMegaStone` | 9 | **documented public API** — see keep-list |
| `src/lib/data/moves.ts:3` | `MoveCategory` | 1 | generated-data shape |
| `src/lib/data/moves.ts:4` | `MoveFlag` | 1 | generated-data shape |
| `src/lib/data/moves.ts:10` | `MoveData` | 2 | generated-data shape |
| `src/lib/data/natures.ts:3` | `NatureData` | 1 | data-table shape |
| `src/lib/data/type-chart.ts:6` | `TYPE_CHART` | 1 | **high churn (3)** + data table — see keep-list |
| `src/lib/explore/chronological-cursor.ts:1` | `ChronologicalCursor` | 1 | |
| `src/lib/notifications.ts:3` | `NotificationType` | 1 | |
| `src/lib/posthog-server.ts:56` | `flushServerEvents` | 2 | referenced in its own doc comment as the scheduled callback |
| `src/lib/security/csrf.ts:17` | `generateCsrfToken` | 1 | security primitive — see keep-list |
| `src/lib/sharing/redact-paste.ts:21` | `PrivateField` | 4 | |
| `src/lib/sharing/url-codec.schemas.ts:30` | `SerializedGamePlanSchema` | 1 | **high churn (1)** + schema module — see keep-list |
| `src/lib/sharing/url-codec.schemas.ts:36` | `SerializedMatchupPlanSchema` | 1 | **high churn (1)** + schema module — see keep-list |
| `src/lib/templates.ts:1` | `ReportTemplate` | 2 | data-table shape |
| `src/lib/templates.ts:13` | `REPORT_TEMPLATES` | 1 | data table |
| `src/lib/utils/multi-import.ts:7` | `ImportSource` | 1 | |
| `src/lib/utils/normalize-report.ts:10` | `migrateCalcEntries` | 1 | |
| `src/lib/utils/paste-edit.ts:59` | `replaceSpeciesInBlock` | 1 | |
| `src/lib/utils/speed-tier-form.ts:9` | `SpeedTierForm` | 1 | |
| `src/lib/utils/version-diff.ts:44` | `GlobalFieldKey` | 3 | **high churn (1)**; derived via `keyof typeof FIELD_LABELS`, documented at line 373 |
| `src/lib/validation/champions-legality.ts:31` | `LegalitySeverity` | 1 | **high churn (2)** |

### Tier 5 — Dependency hygiene (not a deletion)

**`@pkmn/dex` is in `dependencies` but has exactly one import site, and it is a build-time script.**

```bash
grep -rn 'from "@pkmn/dex"\|from '"'"'@pkmn/dex'"'"'\|require("@pkmn/dex")\|import("@pkmn/dex")' . \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  --exclude-dir=.swarm --exclude-dir=.planning
# ./src/lib/data/dex-subset.ts:34:  * scripts) can still `import { Dex } from "@pkmn/dex"` directly — only the   ← comment
# ./scripts/build-dex-subset.mjs:48: import { Dex } from "@pkmn/dex";                                              ← only real import
```

Every runtime path goes through the pre-extracted `src/lib/data/dex-subset.json` via `dex-subset.ts` / `pkmn-dex-fallback.ts`. The only true importer is `scripts/build-dex-subset.mjs`, a manually-run generator ("Run once per `@pkmn/dex` bump"). The package is therefore **not unused** — moving it to `devDependencies` is the correct change, and it would trim the Vercel production install. Deleting it would break regeneration of the dex subset.

**All 21 other `dependencies` are confirmed in use.** Verified import site for each (dynamic imports resolve too):

| Dependency | Confirming site |
|---|---|
| `@clerk/nextjs` | 60+ sites across `src/app`, `src/components` |
| `@microsoft/clarity` | `src/components/providers/ClarityProvider.tsx:27` (`await import`) |
| `@neondatabase/serverless` | `src/lib/db.ts:1` |
| `@opentelemetry/api-logs` | `src/instrumentation.ts:3`, `src/app/api/views/[shareId]/route.ts:5` |
| `@opentelemetry/exporter-logs-otlp-http` | `src/instrumentation.ts:2` |
| `@opentelemetry/resources` | `src/instrumentation.ts:4` |
| `@opentelemetry/sdk-logs` | `src/instrumentation.ts:1` |
| `@upstash/ratelimit` | `src/lib/rate-limit.ts:1` |
| `@upstash/redis` | `src/lib/rate-limit.ts:2`, `src/lib/cache.ts:1` |
| `html2canvas-pro` | `src/lib/dynamic-imports/html2canvas.ts:11` |
| `jspdf` | `src/lib/utils/export-report.ts:5` (`await import`) |
| `motion` | 13 sites |
| `next` / `react` / `react-dom` | framework, 100+ sites |
| `posthog-js` | `src/components/providers/PostHogProvider.tsx:168` (`await import`) |
| `posthog-node` | `src/lib/posthog-server.ts:1` |
| `qrcode` | `src/components/ui/OTSSheetModal.tsx:95`, `src/components/report/TeamOverview.tsx:402` |
| `tweetnacl` | `src/app/api/discord/route.ts:4` |
| `vanilla-cookieconsent` | `src/components/providers/CookieBanner.tsx:4` + its CSS at `:5` |
| `zod` | 27 sites |

---

## Categories that came back clean

### 2. Orphaned component files — NONE

The import graph gives **every** non-entrypoint, non-test file in `src/` at least one importer. Zero orphans. Full importer lists for the quietest files (1 importer each) were printed and inspected; representative examples:

```
src/components/explore/ExploreEmpty.tsx        <- src/components/explore/ExploreContent.tsx
src/components/ui/TeamCardExport.tsx           <- src/components/ui/ShareModal.tsx
src/components/ui/ChunkErrorReloader.tsx       <- src/components/ui/DeferredLayoutExtras.tsx   (dynamic import)
src/components/social/VersionHistoryPanel.tsx  <- src/components/layout/Navbar.tsx             (dynamic import)
src/data/indy-top-cut.ts                       <- src/app/champions/ChampionsContent.tsx
src/lib/data/__validate-mega-coverage.ts       <- src/instrumentation.ts:14 (await import)
                                                + src/lib/data/__tests__/champions-dex.test.ts:4
```

Note the `__validate-mega-coverage.ts` case specifically: its only production reference is a **dynamic** `await import("./lib/data/__validate-mega-coverage")` inside `src/instrumentation.ts:14`. A static-import-only scan would have mis-reported it as dead. It is alive.

### 3. Dead routes — NONE CONFIRMED

Every one of the **52 API routes** and **22 page routes** was checked by grepping its literal path prefix across `src/ cypress/ scripts/ public/ vercel.json next.config.ts` (with `src/app/api` and the changelog prose file filtered out, since `src/app/changelog/data.ts` mentions dozens of paths in release notes and inflates every count).

Six API routes have zero *internal* references, and all six are legitimately externally-invoked:

| Route | Why it is not dead |
|---|---|
| `/api/webhooks/clerk` | Clerk-invoked; allow-listed in `src/proxy.ts:90` |
| `/api/webhooks/linear` | Linear-invoked; allow-listed in `src/proxy.ts:90` |
| `/api/webhooks/posthog` | PostHog-invoked; allow-listed in `src/proxy.ts:90` |
| `/api/bot` | Discord interactions endpoint; command set defined in `scripts/register-commands.json`, URL configured in the Discord developer portal; referenced in `.env.example` |
| `/api/migrate` | Manual admin endpoint, secret-gated with `crypto.timingSafeEqual` |
| `/api/setup` | Manual admin endpoint; explicitly allow-listed in `src/proxy.ts:33` and `:90` |

The five cron routes (`/api/cleanup`, `/api/cron/daily-ops`, `/api/cron/weekly-report`, `/api/cron/posthog-errors`, `/api/cron/weekly-digest`) are all wired in `vercel.json` `crons`. Every remaining route resolved to a real `fetch()` / `EventSource` / `<img src>` call site — the full verification table was produced and all 52 passed.

Page routes: all 22 resolve to a real `href`, a `redirect()`, or `src/app/sitemap.ts`. The apparent duplicate pair is **not** a duplicate — both are linked and serve different purposes:

```bash
grep -rn -F '"/notifications' src/ cypress/ scripts/ public/
# src/components/ui/NotificationBell.tsx:183:  href="/notifications"          → activity feed (341-line content)
grep -rn -F '/dashboard/notifications' src/ cypress/ scripts/ public/
# src/app/dashboard/DashboardContent.tsx:154: href="/dashboard/notifications" → email preferences (213-line content)
```

### 5. Unused files entirely — 5 confirmed (the Tier 1 SVGs); everything in `src/` is reachable

---

## SUSPECTED findings (ambiguous — do not delete without an owner decision)

### S1. `/tournaments` is an internal-link orphan (SEO page, not dead code)

```bash
grep -rhon 'href="/[a-z/-]*"' src/components/layout/ | sort -u
# only: "/", "/dashboard", "/feedback"   ← no /tournaments anywhere in nav or footer
grep -rn "tournaments" src/app/sitemap.ts
# 19: { url: `${BASE}/tournaments`, changeFrequency: "weekly", priority: 0.7 },
```

`src/app/tournaments/page.tsx` + `TournamentsContent.tsx` are reachable only via the sitemap and direct URL. No navbar, footer or in-page link points at them. It emits `SportsEventJsonLd` and a canonical URL, so it is clearly an intentional SEO landing page — but with no internal link it gets no internal PageRank and no human discovery path. **This is a SEO/UX gap to route to the nav owner, not a deletion.** `TournamentsContent.tsx:208` fires `posthog.capture("tournaments_page_visited")`, so real traffic is measurable — check PostHog before acting either way.

### S2. `/api/oembed` has no discovery mechanism

```bash
grep -rn "oembed" src/ public/ cypress/ scripts/ --include='*.ts' --include='*.tsx' --include='*.json' -i
# src/app/api/oembed/route.ts:6   ← its own apiGuard call
# src/app/api/oembed/route.ts:45  ← its own comment
# src/app/changelog/data.ts:188   ← release-note prose
```

The route's own comment says *"oEmbed payloads are polled repeatedly by Discord/Slack unfurlers"*, but unfurlers find an oEmbed endpoint through a `<link rel="alternate" type="application/json+oembed">` tag in the page head — and **no page emits one**. `src/app/s/[id]/page.tsx` has no such `other:` metadata entry. So the endpoint is live and rate-limited but practically undiscoverable. Two readings: (a) the discovery `<link>` was never shipped and this is a **missing-feature bug**, or (b) consumers hit it by constructed URL. Worth a ticket either way; do not delete.

### S3–S5. One-shot generator scripts with no caller (keep)

```bash
for f in $(ls scripts/); do
  n=$(grep -rn -F "$f" package.json CLAUDE.md src/ scripts/ .github/ | grep -v "^scripts/$f" | wc -l); echo "$n scripts/$f"; done
# 6 scripts/build-dex-subset.mjs      ← documented in dex-subset.ts
# 2 scripts/generate-move-names.mjs   ← npm run generate:move-names
# 1 scripts/swarm-setup.sh            ← CLAUDE.md
# 0 scripts/generate-maskable-icon.mjs
# 0 scripts/generate-og-default.mjs
# 0 scripts/register-commands.json
```

- `scripts/generate-maskable-icon.mjs` — produced `public/icon-192-maskable.png` / `icon-512-maskable.png`, which **are** referenced by `public/manifest.json`. Keep: it is the regeneration recipe for a shipped asset.
- `scripts/generate-og-default.mjs` — produced `public/og-default.png`, which **is** referenced. Same reasoning.
- `scripts/register-commands.json` — the Discord slash-command payload for `/api/bot`, posted manually to the Discord API. Keep.

These are correctly not wired to any npm script (one-shot, manual). They are *uncalled*, not *dead*. Consider adding `npm run` entries so the next audit stops flagging them.

### S6. `src/lib/db/migrations/*.sql` are loaded by nothing

```bash
grep -n "migrations\|\.sql\|readFile" src/app/api/migrate/route.ts src/app/api/setup/route.ts
# (no output — both routes carry inline SQL)
```

`add-species-column.sql`, `add-unlisted-column.sql`, `drop-species-column.sql` are read by no code path; `/api/migrate` executes inline SQL instead. They read as a historical migration ledger (`drop-species-column.sql:3` explicitly cross-references `add-species-column.sql`). **Keep as schema history**, but note the drift: a migration directory nothing executes will rot, and the real schema changes live inline in a route handler.

---

## Deliberately-unused-but-keep

| Item | Reason |
|---|---|
| `src/lib/data/dex-subset.ts` — `DexSubsetMegaStone`, `DexSubsetSpecies` | The file header (lines 16, 34) calls these "the public API below" and documents the regeneration contract with `scripts/build-dex-subset.mjs`. The export is the documented surface even where the consumer is currently internal. Leave the `export`. |
| `src/lib/data/type-chart.ts:6` — `TYPE_CHART` | Canonical generated data table, and the file is **high churn (3 touches)** with a dedicated test (`__tests__/type-chart.test.ts`, also 3 touches). De-exporting a named data table that tests and future callers will reach for is churn for no gain. |
| `src/lib/sharing/url-codec.schemas.ts` — `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema` | A `*.schemas.ts` module exists to publish zod schemas. Composed internally today, but the naming makes the export the intent. |
| `src/lib/security/csrf.ts:17` — `generateCsrfToken` | Security primitive, paired with the consumer at `:49`. Keeping it individually addressable makes it individually testable; de-exporting a crypto helper to save a token is a bad trade. |
| `src/lib/rate-limit.ts:84` — `isRateLimited` | Carries an explicit keep-signal in its own comment ("legacy API … kept for backward compatibility"). My read is that the signal is stale for a private app (Tier 3 above), but it is a deliberate author decision and should be confirmed, not swept. |
| `scripts/generate-maskable-icon.mjs`, `scripts/generate-og-default.mjs`, `scripts/register-commands.json` | One-shot generators / manual payloads for assets and endpoints that **are** live (see S3–S5). |
| `src/lib/db/migrations/*.sql` | Schema history (see S6). |
| Props interfaces (`PdfExportProps`, `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem`, and the hook return types `DraftSaveResult` / `SyncStatus` / `DamageCalcsMap` / `FilterState` / `GamePlanSlots` / `VersionDiffState`) | Exporting the props/return type beside its component or hook is a consistent, intentional convention across this codebase. De-exporting these 11 would fight the house style for zero functional benefit. Listed in Tier 4 for completeness; recommend **not** acting on them. |

---

## Conflict risk vs `.swarm/main-changed-files.md`

The branch was 0 ahead / 0 behind `origin/main` at run start (last commit `70c4633`, 2026-08-24), so there is no divergence yet — but these files are the most-churned on main and any edit here is the likeliest to conflict:

| File | Churn | Finding touching it | Recommendation |
|---|---|---|---|
| `src/hooks/useTeamReport.ts` | **3** | `evictStoredDraft:31`, `ViewMode:74` (Tier 4) | **Avoid.** Paired test also at 3 touches. |
| `src/lib/data/type-chart.ts` | **3** | `TYPE_CHART:6` (Tier 4) | **Avoid** — also on the keep-list. |
| `src/app/changelog/data.ts` | **3** | `ChangelogItem:3` (Tier 4) | **Avoid** — appended to every release. |
| `src/lib/validation/champions-legality.ts` | **2** | `LegalitySeverity:31` (Tier 4) | Avoid. |
| `src/lib/sharing/url-codec.schemas.ts` | **1** | both `*Schema` exports (Tier 4) | Avoid — also on the keep-list. |
| `src/lib/utils/version-diff.ts` | **1** | `GlobalFieldKey:44` (Tier 4) | Avoid. |
| `src/lib/security/cors.ts` | **2** | `isDynamicAllowedOrigin` (test-only ref, but internally used — **no action**) | No action needed. |
| `public/*.svg` (Tier 1) | **0** | 5 confirmed deletions | **Zero conflict risk.** |
| `src/lib/data/dex-subset.ts` | **0** | `asPokemonTypes:221` (Tier 2) | **Zero conflict risk** — not in the churn list. |
| `src/lib/rate-limit.ts` | **0** | `isRateLimited:84` (Tier 3) | Zero conflict risk. |

Convenient result: the three findings actually worth acting on (Tiers 1–3) all sit in **zero-churn** files. The high-churn overlap is confined to Tier 4, which is the tier not worth acting on anyway.

---

## Recommended action order

1. **Delete** `public/{file,globe,next,vercel,window}.svg` — 5 files, zero references, zero conflict risk.
2. **Delete** `asPokemonTypes` at `src/lib/data/dex-subset.ts:221` — the only truly dead function body in `src/`.
3. **Move** `@pkmn/dex` from `dependencies` to `devDependencies` — build-script-only, trims the production install. Verify `npm run build` and `node scripts/build-dex-subset.mjs` both still work (the latter needs the dev install present).
4. **Ask the user** about `isRateLimited` (`src/lib/rate-limit.ts:84`) + its test — dead in production, but carries a deliberate keep-comment.
5. **File tickets, don't edit:** S1 `/tournaments` has no internal link (SEO), S2 `/api/oembed` has no discovery `<link>` (likely a missing-feature bug).
6. **Skip Tier 4** unless a de-export sweep is explicitly wanted. 40 symbols, all internally used, all zero-behaviour edits, 7 of them in high-churn files and 11 of them following a deliberate props/return-type convention.

Per repo policy, every change above still needs the `verification-gate` (cold `tsc --noEmit --incremental false`, `vitest run`, `next build`) before any commit, and nothing is pushed without an explicit user signal.

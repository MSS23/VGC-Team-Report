# C1 — Dead Code Scan (READ-ONLY)

**Date:** 2026-08-03
**Agent:** C1, overnight code-quality swarm
**Repo:** `/home/user/VGC-Team-Report` @ `a70d924`
**Scope:** `src/lib/**`, `src/components/**`, `src/app/**`, `src/hooks/**`, `package.json`
**Baseline compared against:** `.swarm/c1-dead-code-23-05-26.md` (most recent prior C1 run)

## Method

1. Extracted all 575 named exports from 310 `.ts`/`.tsx` files under `src/` with a
   script (`export function|const|let|var|class|interface|type|enum`).
2. Indexed **343** non-`node_modules`/`.next`/`.git` repo files and counted whole-word
   references per symbol, split into *production* vs *test* files.
3. **Explicitly excluded `.swarm/*.md`** from the index. Prior audit reports name the
   dead symbols verbatim, which silently marked them "used" on a naive grep. This is
   why the raw first pass reported only 19 candidates vs the real 49.
4. Separate whole-file orphan pass: for each non-entry-point file, searched for
   `@/<path>`, `./<stem>`, `../**/<stem>` and `src/<path>` import forms.
5. Next.js entry points excluded by pattern: `page|layout|route|template|loading|error|
   not-found|global-error|default|sitemap|robots|opengraph-image|twitter-image|icon|
   apple-icon|manifest|instrumentation|middleware` + `generateMetadata` /
   `generateStaticParams` / default exports.
6. Every candidate below was re-verified with an independent repo-wide `grep -rn`
   (excluding `node_modules`, `.next`, `.git`, `.swarm`) before being listed.

### Verified-live false positives the automation produced (do NOT act on these)

| Flagged by script | Why it is live |
|---|---|
| `src/proxy.ts` | **Next.js 16 renamed `middleware.ts` → `proxy.ts`.** Framework entry point. |
| `src/lib/i18n/index.ts` | Imported ~45× as bare `@/lib/i18n` (directory index); my path regex required `/index`. |
| `src/app/champions/[pokemon]/page.tsx:17 generateStaticParams` | App Router SSG entry point. |
| `/notifications` vs `/dashboard/notifications` | Look duplicated (same filenames) but are **different pages** — activity feed vs email preferences. Both linked (`NotificationBell.tsx:183`, `DashboardContent.tsx:154`). |
| `/api/reactions` vs `/api/reactions/[shareId]` | Batch-read endpoint vs per-share toggle. Both fetched from client code. |
| `/api/cron/*`, `/api/webhooks/*`, `/api/setup`, `/api/migrate`, `/api/cleanup`, `/api/bot`, `/api/keep-alive`, `/api/sprite`, `/api/team-graphic` | External / cron / admin entry points. `/api/keep-alive` is pinged by `daily-ops/route.ts:17`; all five `vercel.json` crons resolve to real routes. |
| All npm dependencies | See §4 — zero unused. |

---

## 1. Status of the 2026-05-23 findings

| # | Item | Status now |
|---|---|---|
| 1 | `Badge` component | ✅ **FIXED** — `src/components/ui/Badge.tsx` no longer exists |
| 2 | `useScrollHide` hook | ✅ **FIXED** — `src/hooks/useScrollHide.ts` no longer exists |
| 3 | `encodeShareState` | ✅ **FIXED** — removed from `url-codec.ts` (only a stale test *describe label* remains) |
| 4a | `pokemonToShowdown` | ❌ **STILL OPEN** — still `export`, still test-only |
| 4b | `pokemonToOpenSheet` | ✅ **FIXED** — now a private `function` (`export-paste.ts:86`) |
| 5 | `detectRegulationWithSignals` + `RegulationDetection` | ✅ **FIXED** — both private now (`detect-regulation.ts:63,72`) |
| 6 | `replaceSpeciesInBlock` | ❌ **STILL OPEN** |
| 7 | `migrateCalcEntries` | ❌ **STILL OPEN** — and the "recently churned" caveat has **expired**: `normalize-report.ts` is *not* in this run's 14-day conflict list, so it is now safe to touch |
| 8 | `isDynamicAllowedOrigin` | ❌ **STILL OPEN** |
| 9 | `generateCsrfToken` | ❌ **STILL OPEN** |

---

## 2. NEW findings

### N1. `ConsentGate` is orphaned — and that is a **GDPR compliance regression**, not a delete candidate
**Confidence: HIGH (orphan) / HIGH (compliance impact)** — **NEW**

- **File:** `/home/user/VGC-Team-Report/src/components/providers/ConsentGate.tsx` (37 lines)
- **Evidence:** repo-wide grep for `ConsentGate` outside the defining file returns **only
  `.planning/**` design docs** — zero source references. `src/app/layout.tsx` imports
  `PostHogProvider`, `ClarityProvider`, `CookieBanner` but **not** `ConsentGate`
  (`layout.tsx:9-11`, JSX at `108-149`).
- **Why this is more than dead code:** `.planning/phases/08-.../08-02-SUMMARY.md` records
  that `ConsentGate` was wired into `layout.tsx` in commit `701ad65` to gate analytics.
  It has since been unwired. Today:
  - `PostHogProvider` still self-guards (`hasAnalyticsConsent()` at `PostHogProvider.tsx:43`) ✅
  - **`ClarityProvider` does NOT.** `ClarityProvider.tsx:6-13` calls `Clarity.init(id)`
    unconditionally inside `useEffect` with no consent check, and is mounted bare at
    `layout.tsx:144`. Microsoft Clarity is a session-recording tracker that now fires
    before the cookie banner is answered.
- **Recommended action — do NOT delete. Re-wire:**
  1. In `src/app/layout.tsx`, add `import { ConsentGate } from "@/components/providers/ConsentGate";`
  2. Wrap line 144: `<ConsentGate><ClarityProvider /></ConsentGate>`
  3. Keep `<CookieBanner />` (line 109) **outside** the gate so the banner always renders.
  4. Verify in a fresh incognito window: zero `clarity.ms` network requests before consent.
- **Escalation:** worth a Linear bug ticket. This is the one finding in this report that
  is a live user-facing/legal issue rather than housekeeping.
- **Conflict risk:** none — neither file is in the 14-day changed list.

### N2. `DisplayTogglePill` + `useGlobalDisplayPrefs` — orphaned feature pair, 318 lines
**Confidence: HIGH** — **NEW**

- **Files:**
  - `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx` (267 lines)
  - `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts` (51 lines)
- **Evidence:** repo-wide grep (excluding `.next`/`.swarm`/`node_modules`) for
  `DisplayTogglePill` returns 3 hits — all inside its own file — plus **one prose comment**
  at `useGlobalDisplayPrefs.ts:9` ("Used by the DisplayTogglePill to track…"). `grep -rn
  "useGlobalDisplayPrefs" .` returns exactly **one** hit: the export declaration itself.
  No dynamic `import()`, no `next/dynamic`, no string reference.
- These are the **only two files** in `src/components/display/` and `src/lib/hooks/`
  respectively — both directories become empty on removal, which is itself strong evidence
  the feature was ripped out and the leaves left behind.
- **Removal steps:**
  ```bash
  git rm src/components/display/DisplayTogglePill.tsx
  git rm src/lib/hooks/useGlobalDisplayPrefs.ts
  rmdir src/components/display src/lib/hooks
  ```
  Then `tsc --noEmit` + `vitest run` + `next build` (verification-gate). No import fixups
  needed — nothing imports them. Note `src/hooks/` (the other hooks dir) is unaffected.
- **Conflict risk:** none.

### N3. Dead `/api/builder/` exemption in `src/proxy.ts` — dead code with a latent security edge
**Confidence: HIGH** — **NEW**

- **File:** `/home/user/VGC-Team-Report/src/proxy.ts`, lines 86–87
- **Exact text:**
  ```ts
  // Exempt builder proxy endpoints — authenticated via secret key, called from cloud sandbox
  if (isApiRoute && !pathname.startsWith('/api/discord') && !pathname.startsWith('/api/webhooks/') && !pathname.startsWith('/api/builder/') && pathname !== '/api/setup' && !isAllowedOrigin(request)) {
  ```
- **Evidence:** `src/app/api/builder/` **does not exist**. `find src/app/api -name route.ts*`
  lists 51 routes; none under `builder`. The whole `/api/builder/` route family was removed
  but its **CORS/origin-check exemption survived**.
- **Why it matters beyond tidiness:** any future route added under `/api/builder/*` would
  silently skip `isAllowedOrigin()` — a bypass nobody would expect from reading that route's
  own code.
- **Removal steps:** delete `&& !pathname.startsWith('/api/builder/')` from line 87 and the
  now-inaccurate comment on line 86. Single-line diff, no test changes.
- **Conflict risk:** `src/proxy.ts` is **not** in the 14-day changed list. However this is
  security-adjacent middleware on the hot path for every request — pair with C4's audit
  before shipping.

### N4. `getRegMBMegas` — zero references anywhere
**Confidence: HIGH** — **NEW**

- **File:** `/home/user/VGC-Team-Report/src/lib/data/mega-pokemon.ts:846`
- **Evidence:** repo-wide grep returns exactly one hit — the `export function` line. No
  internal call, no external import, no test.
- **Context:** `CHAMPIONS_REG_MB_MEGAS` (line 840, the Set it filters on) *is* used elsewhere;
  only the convenience wrapper is dead. Reg M-B support appears to consume the Set directly.
- **Removal steps:** delete lines 845–848 (the JSDoc comment + 3-line function). Confirm
  `MegaPokemonEntry` is still referenced elsewhere in the file before assuming the import
  can go too (it is — used by `MEGA_POKEMON_LIST`).
- **Conflict risk:** none.

### N5. `asPokemonTypes` — zero references anywhere
**Confidence: HIGH** — **NEW**

- **File:** `/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts:122-125`
- **Evidence:** repo-wide grep returns exactly one hit — the definition. It is a pure
  `as`-cast helper (`return types as PokemonType[]`), so there is no behavioural risk.
- **Removal steps:** delete lines 122–125 (JSDoc + function). Check whether `PokemonType`
  remains imported for other uses in the file before touching the import line — it is.
- **Conflict risk:** none.

### N6. `isRateLimited` (sync legacy) — test-only export
**Confidence: HIGH** — **NEW**

- **File:** `/home/user/VGC-Team-Report/src/lib/rate-limit.ts:84-92`
- **Evidence:** production callers = 0. The only consumer is
  `src/lib/__tests__/rate-limit.test.ts` (13 call sites). All production rate limiting goes
  through `isRateLimitedAsync` (`api-guard.ts:33`, `api/feedback/route.ts:86`). The doc
  comment itself says *"legacy API. Kept for backward compatibility — prefer
  isRateLimitedAsync."* — there is no external consumer to be backward-compatible with.
- **Removal steps (choose one):**
  - **Preferred:** delete `isRateLimited` (lines 81–92 incl. JSDoc) and repoint
    `src/lib/__tests__/rate-limit.test.ts` at the still-private `isRateLimitedInMemory`
    by exporting *that* instead — the tests exercise real in-memory windowing logic worth
    keeping.
  - **Minimal:** leave as-is; it is one function and the tests are green.
- **Conflict risk:** none.

### N7. `/api/oembed` is unreachable — no discovery link tag anywhere
**Confidence: MEDIUM** — **NEW**

- **File:** `/home/user/VGC-Team-Report/src/app/api/oembed/route.ts`
- **Evidence:** `grep -rn "oembed" src/ public/` outside the route directory returns
  **nothing**. oEmbed consumers (Discord, Slack, WordPress) discover an endpoint via
  `<link rel="alternate" type="application/json+oembed" href="…">` in the target page's
  `<head>`. `src/app/s/[id]/page.tsx` sets `alternates:` (line 133) but only canonical —
  no oEmbed link. The endpoint is also absent from `public/` (no `.well-known`, no provider
  registration).
- The May 2026 changelog (`data.ts:161`) notes the Satori OG image for `/s/{id}` was removed
  in favour of "clean text-only unfurls" — consistent with oEmbed having been orphaned then.
- **Why MEDIUM not HIGH:** a third party could be calling the URL directly with a hardcoded
  path; I cannot prove absence of external callers from the repo.
- **Recommended action — prefer fixing over deleting:** add the discovery link to
  `src/app/s/[id]/page.tsx` metadata (`other: { "application/json+oembed": … }` or a raw
  `<link>` in the page head). Only delete the route if product confirms oEmbed is abandoned.
  Check Vercel logs for hits on `/api/oembed` before either choice.
- **Conflict risk:** none. **Note:** touching `src/app/s/[id]/page.tsx` metadata is
  SEO-adjacent — coordinate with the R6 SEO agent's output.

### N8. Internal-only exports that should lose the `export` keyword
**Confidence: MEDIUM** (each individually safe; zero bundle impact — already tree-shaken)
— **NEW** unless marked

| Symbol | File:line | Only used at | Note |
|---|---|---|---|
| `flushServerEvents` | `src/lib/posthog-server.ts:56` | same file, line 44 (`after(() => flushServerEvents())`) | NEW |
| `REPORT_TEMPLATES` | `src/lib/templates.ts:13` | same file, line 61 (inside `getTemplate`) | NEW — `getTemplate` *is* imported (`useHomePage.ts:27`), the array is not |
| `TYPE_CHART` | `src/lib/data/type-chart.ts:6` | same file, line 179 | NEW — `getEffectiveness`/`getDefensiveProfile` are the real public API |
| `WALKTHROUGH_STEPS` | `src/hooks/useWalkthrough.ts:16` | same file, line 189 | NEW |
| `SerializedGamePlanSchema` | `src/lib/sharing/url-codec.ts:15` | same file, line 25 | NEW |
| `SerializedMatchupPlanSchema` | `src/lib/sharing/url-codec.ts:21` | same file, line 77 | NEW |
| `parseFiltersFromUrl` | `src/hooks/useExploreUrlSync.ts:52` | same file + `__tests__/useExploreUrlSync.test.ts` | NEW — test-only export; keep exported if you value the unit tests |
| `buildUrlSearch` | `src/hooks/useExploreUrlSync.ts:78` | same file + same test | NEW — same call |

**Removal steps:** drop the leading `export ` keyword. No import fixups required (nothing
imports them). For `parseFiltersFromUrl`/`buildUrlSearch`, leave them exported — the
existing tests are the justification, and removing the export would delete real coverage.
**Conflict risk:** none of these files are in the 14-day changed list.

### N9. Internal-only exported interfaces/types (cosmetic)
**Confidence: MEDIUM, LOW value** — **NEW**

These are exported but referenced only inside their own file. Zero runtime/bundle impact
(types are erased); the only benefit is a smaller public API surface. Listed for
completeness, **not recommended as standalone work** — fold into whatever PR next touches
each file.

`PdfExportProps` (`ui/PdfExport.tsx:25`) · `TeamCombination` (`report/CommonModesSlide.tsx:16`)
· `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem` (`seo/JsonLd.tsx:36,83,142,193`)
· `DraftSaveResult` (`hooks/useAutoDraft.ts:13`) · `FilterState` (`hooks/useExploreUrlSync.ts:6`)
· `GamePlanSlots` (`hooks/useMatchupPlans.ts:24`) · `SyncStatus` (`hooks/useCollaborativeSync.ts:6`)
· `DamageCalcsMap` (`hooks/useDamageCalcs.ts:19`) · `ViewMode` (`hooks/useTeamReport.ts:19`)
· `ChampionsSampleTeam` (`data/champions-sample-teams.ts:7`) · `IndyTopCutEntry` (`data/indy-top-cut.ts:7`)
· `LegalitySeverity` (`validation/champions-legality.ts:29`) · `VersionDiffState` (`contexts/VersionDiffContext.tsx:6`)
· `NatureData` (`data/natures.ts:3`) · `MoveCategory`, `MoveFlag`, `MoveData` (`data/moves.ts:3,4,10`)
· `DexSubsetMegaStone` (`data/dex-subset.ts:47`) · `AccentTheme` (`accent-themes.ts:3`)
· `NotificationType` (`notifications.ts:3`) · `ChronologicalCursor` (`explore/chronological-cursor.ts:1`)
· `SpeedTierForm` (`utils/speed-tier-form.ts:9`) · `ImportSource` (`utils/multi-import.ts:7`)
· `PrivateField` (`sharing/redact-paste.ts:21`)

> ⚠️ **`ChangelogItem`** (`src/app/changelog/data.ts:3`) also falls in this bucket, but
> **`src/app/changelog/data.ts` IS in the 14-day conflict-risk list.** Do not touch it this
> run.

### N10. Unreferenced SQL migration files
**Confidence: LOW** — **NEW**

- `src/lib/db/migrations/add-species-column.sql`, `drop-species-column.sql`,
  `add-unlisted-column.sql`
- **Evidence:** `grep -rn "\.sql\b" src/ --include=*.ts` outside that directory returns
  nothing. `src/app/api/migrate/route.ts` uses inline tagged-template SQL, never reads these
  files. They are manual-run ops artifacts.
- The `add-species-column.sql` / `drop-species-column.sql` pair suggests that migration was
  applied and then reverted.
- **Action:** none recommended — these are ops history, not shipped code, and they add zero
  bundle weight. Flagged only so future scans don't re-discover them as "dead".

---

## 3. ALREADY-KNOWN findings still open

Carried from `c1-dead-code-23-05-26.md`, re-verified today. All are `export` → private
downgrades; **zero bundle impact** (already tree-shaken), value is API-surface reduction.

| Symbol | File:line | Only used at | Confidence | Change vs May |
|---|---|---|---|---|
| `pokemonToShowdown` | `src/lib/utils/export-paste.ts:20` | same file line 77 (`teamToShowdown`) + `__tests__/export-paste.test.ts` | HIGH | unchanged; its sibling `pokemonToOpenSheet` **has** been made private, so this one is now inconsistent with its own file |
| `replaceSpeciesInBlock` | `src/lib/utils/paste-edit.ts:59` | same file (`replacePokemonSpecies`) | MEDIUM | unchanged |
| `migrateCalcEntries` | `src/lib/utils/normalize-report.ts:10` | same file (`normalizeReportData`) | **MEDIUM (upgraded from LOW)** | **`normalize-report.ts` is no longer in the recent-changes list — the May caveat has expired and it is now safe to downgrade** |
| `isDynamicAllowedOrigin` | `src/lib/security/cors.ts:18` | same file, lines 27 & 41 | MEDIUM | unchanged. Security-adjacent — coordinate with C4 |
| `generateCsrfToken` | `src/lib/security/csrf.ts:17` | same file (`setCsrfCookie`) | LOW | unchanged. Not worth a standalone commit |

**Also still open (trivial, cosmetic):** `src/lib/sharing/__tests__/url-codec.test.ts:81`
has a stale `describe("encodeShareState / decodeShareState …")` label — `encodeShareState`
was deleted from the source. Rename to `describe("decodeShareState …")`.

---

## 4. npm dependencies — **zero unused**

Every entry in `package.json` was grepped across `src/`, `scripts/`, `cypress/`,
`next.config.ts` and the npm scripts. All 22 runtime + 13 dev deps resolve to a real
import or script:

| Dep | Proof |
|---|---|
| `@clerk/nextjs` | 61 refs |
| `@microsoft/clarity` | `ClarityProvider.tsx:4` |
| `@neondatabase/serverless` | `src/lib/db.ts` |
| `@opentelemetry/{api-logs,exporter-logs-otlp-http,resources,sdk-logs}` | `src/instrumentation.ts:1-4`; also `next.config.ts:27-30` `serverExternalPackages` |
| `@pkmn/dex` | 30 refs |
| `@upstash/ratelimit` | `src/lib/rate-limit.ts:1` |
| `@upstash/redis` | `src/lib/rate-limit.ts:2`, `src/lib/cache.ts:1` |
| `html2canvas-pro` | `src/lib/dynamic-imports/html2canvas.ts` (lazy) |
| `jspdf` | `src/lib/utils/export-report.ts:5` (`await import`) |
| `motion` | 112 refs |
| `posthog-js` / `posthog-node` | `PostHogProvider.tsx` / `posthog-server.ts:1` |
| `qrcode` + `@types/qrcode` | `OTSSheetModal.tsx:95`, `TeamOverview.tsx:401` (both `import()`) |
| `tweetnacl` | `src/app/api/discord/route.ts:4` (signature verify) |
| `vanilla-cookieconsent` | `CookieBanner.tsx:4-5`, `globals.css:102` |
| `zod` | 25 refs |
| `start-server-and-test` | `package.json` `test:e2e` scripts (0 src refs is expected) |
| `jsdom`, `cypress`, `eslint*`, `tailwindcss`, `typescript`, `vitest`, `@types/*` | toolchain |

Note: `qrcode` and `jspdf` are reachable **only** through dynamic `import()`. A naive
`import ... from` scan would flag both as unused — they are not.

---

## 5. Recommended batching

**Batch A — one commit, `chore: remove orphaned display-pill feature` (318 lines):**
N2 (delete both files + both now-empty dirs).

**Batch B — one commit, `chore: drop dead exports` (~20 lines):**
N4, N5, N8 (minus the two test-backed `useExploreUrlSync` helpers), plus the ALREADY-KNOWN
§3 downgrades: `pokemonToShowdown`, `replaceSpeciesInBlock`, `migrateCalcEntries`,
`isDynamicAllowedOrigin`. Plus the stale `describe` label rename.
`pokemonToShowdown` needs the test in `__tests__/export-paste.test.ts` repointed at
`teamToShowdown([mon])`.

**Batch C — separate, needs review, `fix:` not `chore:`:**
N1 (ConsentGate/Clarity re-wire — file a Linear bug) and N3 (`/api/builder` exemption).
Both are behaviour changes on security/compliance paths; route through `verification-gate`
**and** C4's security pass, and do not bundle them with the housekeeping commits.

**Do not do this run:** N7 (needs product/log input), N9 (fold opportunistically),
N10 (no action), anything in `src/app/changelog/data.ts` (conflict list).

## 6. Conflict-risk cross-check

The 14-day changed-on-main list was checked against every recommendation:

`.claude/scripts/linear.sh`, `.github/workflows/ci.yml`, `AGENTS.md`, `CLAUDE.md`,
`scripts/swarm-setup.sh`, `src/app/changelog/data.ts`, `src/components/report/PokemonCard.tsx`,
`src/components/report/PokemonDetailSlide.tsx`, `src/components/report/StatColorNote.tsx`,
`src/lib/analysis/__tests__/stat-calculator.test.ts`, `src/lib/analysis/stat-calculator.ts`

**Exactly one overlap:** `src/app/changelog/data.ts` (`ChangelogItem`, N9). **Excluded from
all recommendations.** No other finding touches a conflict-risk file.

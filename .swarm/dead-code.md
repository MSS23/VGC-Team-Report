# Dead-code scan — 2026-08-02

Scope: `src/**` (plus `cypress/`, `scripts/`, root configs as usage sites).
Method: `node_modules` is not installed, so no ts-prune/knip. Instead:

1. A resolver-backed import graph (`@/*` + relative, with `.ts/.tsx/.mts/.js/index.*` resolution,
   covering `from "…"`, `import("…")`, `require("…")`) to find files with **zero importers**.
2. Regex export extraction (`export function|const|let|var|class|type|interface|enum`,
   `export { … }`, `export default`) — verified complete: no `export *`, no destructured
   `export const {…}`, no indented `export` statements exist in this repo.
3. For every exported identifier, a whole-word scan of **every other** TS/TSX/JS file in
   `src`, `cypress`, `scripts` and the root configs. A symbol is only flagged when it appears
   in **no other file at all** — this errs heavily toward false negatives (misses), never
   false positives.
4. Next.js framework exports excluded by convention: `default` of
   `page/layout/route/loading/error/not-found/sitemap/opengraph-image`, plus `metadata`,
   `generateMetadata`, `generateStaticParams`, `dynamic`, `revalidate`, `runtime`,
   `viewport`, `alt`, `size`, `contentType`, `GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS`,
   `register`, `onRequestError`, `config`.

Note: PR #51 (`claude/cleanup-dead-exports-dock-selectors`) is wildly divergent from `main`
(321 files, ~22k deletions, and it renames `src/proxy.ts` → `src/middleware.ts`). Overlap was
not de-duplicated; everything below is verified against `main` as it stands today.

---

## CONFIRMED DEAD

### A. Files never imported anywhere (3)

Proof (single grep covering all three module paths and their exported names, excluding the
files themselves — returns nothing):

```
$ grep -rn "DisplayTogglePill\|components/display\|providers/ConsentGate\|useGlobalDisplayPrefs\|lib/hooks" \
    src cypress scripts --include="*.ts" --include="*.tsx" \
  | grep -v "^src/components/display/DisplayTogglePill.tsx:" \
  | grep -v "^src/components/providers/ConsentGate.tsx:" \
  | grep -v "^src/lib/hooks/useGlobalDisplayPrefs.ts:"
(no output)
```

| File | Export | Notes |
|---|---|---|
| `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx` | `DisplayTogglePill` | Only other occurrence of the name in the repo is a prose comment in `useGlobalDisplayPrefs.ts:9` ("Used by the DisplayTogglePill to track…"). Nothing imports it. |
| `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts` | `useGlobalDisplayPrefs` | Sole member of `src/lib/hooks/` (all other hooks live in `src/hooks/`). Pairs with the pill above — the whole feature was never wired up. |
| `/home/user/VGC-Team-Report/src/components/providers/ConsentGate.tsx` | `ConsentGate` | `src/app/layout.tsx` imports `CookieBanner` (line 11) but **never** `ConsentGate`. Remaining hits are all in `.planning/**` design docs. Note this one is a *deliberate* GDPR component per `.planning/research/ARCHITECTURE.md` — it is dead because analytics gating was implemented another way, not because the idea was abandoned. Delete only if you're satisfied PostHog/Clarity gating is handled elsewhere (`ClarityProvider`/`PostHogProvider` + `src/lib/consent.ts`). |

All three landed in the same commit `1a30839` ("Merge swarm-nightly PRs #48/#49 + repair
corrupted main") and have never been referenced since.

### B. Exported symbols with zero references anywhere — including inside their own file

These are genuinely unreachable code, not just redundant `export` keywords.

| Symbol | Location | Proof |
|---|---|---|
| `getRegMBMegas` | `/home/user/VGC-Team-Report/src/lib/data/mega-pokemon.ts:846` | `grep -rn "\bgetRegMBMegas\b" src cypress scripts public *.ts *.mjs` → only the declaration line. (Sibling `getRegMAMegasWithSprites` **is** used by `src/app/sitemap.ts:3` — don't confuse them.) |
| `asPokemonTypes` | `/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts:123` | `grep -rn "\basPokemonTypes\b" src cypress scripts public *.ts *.mjs` → only the declaration line. |
| `DisplayTogglePill`, `useGlobalDisplayPrefs`, `ConsentGate` | see section A | — |

### C. Exported symbols used **only** inside their declaring module

Safe to drop the `export` keyword (no importer can break). Zero-risk, low-value cleanup —
listed for completeness. Verified per symbol with
`grep -rn "\b<name>\b" src cypress scripts | grep -v "^<own-file>:"` returning nothing.

Types/interfaces:

- `ChangelogItem` — `src/app/changelog/data.ts`
- `MetaEntry`, `ChampionsMetaResult` — `src/app/api/champions/meta/route.ts`
  (**note:** `src/components/champions/MetaSnapshot.tsx:5,11` declares its own private
  `MetaEntry`/`ChampionsMetaResult` interfaces rather than importing these. Duplicated shape —
  worth de-duplicating instead of deleting.)
- `TeamCombination` — `src/components/report/CommonModesSlide.tsx`
- `HowToStep`, `SportsEventData`, `BreadcrumbItem`, `FAQItem` — `src/components/seo/JsonLd.tsx`
  (the components that consume them — `HowToSchema`, `SportsEventJsonLd`, `BreadcrumbJsonLd`,
  `BreadcrumbListJsonLd`, `FAQPageJsonLd`, `JsonLd`, `WebSiteSchema`, `OrganizationJsonLd` —
  are **all** used externally; only the prop types are module-private in practice)
- `PdfExportProps` — `src/components/ui/PdfExport.tsx`
- `ChampionsSampleTeam` — `src/data/champions-sample-teams.ts`
- `IndyTopCutEntry` — `src/data/indy-top-cut.ts`
- `DraftSaveResult` — `src/hooks/useAutoDraft.ts`
- `SyncStatus` — `src/hooks/useCollaborativeSync.ts`
- `DamageCalcsMap` — `src/hooks/useDamageCalcs.ts`
- `FilterState` — `src/hooks/useExploreUrlSync.ts`
- `GamePlanSlots` — `src/hooks/useMatchupPlans.ts`
- `ViewMode` — `src/hooks/useTeamReport.ts`
- `AccentTheme` — `src/lib/accent-themes.ts`
- `VersionDiffState` — `src/lib/contexts/VersionDiffContext.tsx`
- `DexSubsetMegaStone` — `src/lib/data/dex-subset.ts`
- `MoveCategory`, `MoveFlag`, `MoveData` — `src/lib/data/moves.ts`
- `NatureData` — `src/lib/data/natures.ts`
- `ChronologicalCursor` — `src/lib/explore/chronological-cursor.ts`
- `NotificationType` — `src/lib/notifications.ts`
- `PrivateField` — `src/lib/sharing/redact-paste.ts`
- `ImportSource` — `src/lib/utils/multi-import.ts`
- `SpeedTierForm` — `src/lib/utils/speed-tier-form.ts`
- `LegalitySeverity` — `src/lib/validation/champions-legality.ts`
- `ReportTemplate` — `src/lib/templates.ts`

Values/functions:

- `TYPE_CHART` — `src/lib/data/type-chart.ts:6` (used at `:179` in the same file)
- `flushServerEvents` — `src/lib/posthog-server.ts:56` (used at `:44` in the same file)
- `generateCsrfToken` — `src/lib/security/csrf.ts:17` (used at `:49`)
- `isDynamicAllowedOrigin` — `src/lib/security/cors.ts:18` (used at `:27`, `:41`)
- `REPORT_TEMPLATES` — `src/lib/templates.ts:13` (used at `:61`)
- `WALKTHROUGH_STEPS` — `src/hooks/useWalkthrough.ts:16` (used at `:189`)
- `migrateCalcEntries` — `src/lib/utils/normalize-report.ts:10` (used at `:103`)
- `replaceSpeciesInBlock` — `src/lib/utils/paste-edit.ts:59` (used at `:97`)
- `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema` — `src/lib/sharing/url-codec.ts:15,21` (used at `:25`, `:77`)

### D. Exported for tests only

| Symbol | Location | Verdict |
|---|---|---|
| `isRateLimited` | `/home/user/VGC-Team-Report/src/lib/rate-limit.ts:84` | **Dead in production.** Every production caller uses `isRateLimitedAsync` (`src/app/api/feedback/route.ts:2`, `src/lib/security/api-guard.ts:10`). The only importer of `isRateLimited` is `src/lib/__tests__/rate-limit.test.ts`. Its own docblock says "Synchronous in-memory rate limiter (legacy API). Kept for backward compatibility — prefer isRateLimitedAsync." Removing it means deleting `rate-limit.test.ts` too. |
| `parseFiltersFromUrl`, `buildUrlSearch` | `src/hooks/useExploreUrlSync.ts:52,78` | **Keep.** Used internally (`:106`, `:119`); `export` exists so `__tests__/useExploreUrlSync.test.ts` can unit-test them. Legitimate test-visibility export. |
| `pokemonToShowdown` | `src/lib/utils/export-paste.ts:20` | **Keep.** Used internally at `:78` by `teamToShowdown`; exported for `__tests__/export-paste.test.ts`. |

---

## UNCERTAIN

### 1. `/api/oembed` — no discovery link, no internal caller
`/home/user/VGC-Team-Report/src/app/api/oembed/route.ts`

```
$ grep -rn "oembed" src public cypress next.config.ts vercel.json | grep -v "^src/app/api/oembed"
(no output)
```

Nothing in the app links to it, and `src/app/s/[id]/page.tsx` `generateMetadata` emits only
`alternates.canonical` (line 133) — there is **no**
`<link rel="alternate" type="application/json+oembed">` tag, which is how Discord/Twitter/
Notion discover an oEmbed endpoint. So it is currently unreachable in practice.
**Uncertain because** it is a public integration surface: an external consumer that already
knows the URL, or a platform with a hardcoded provider registry, could be calling it. Route
handlers also have no static importers by design, so the import graph can't help here.
Recommended action is to *wire it up* (add the discovery `<link>`) rather than delete.

### 2. `/api/bot` — no caller of any kind
`/home/user/VGC-Team-Report/src/app/api/bot/route.ts`

```
$ grep -rn "/api/bot" src cypress public vercel.json .github scripts
(no output outside the route file itself)
```

Not in `vercel.json` crons, not fetched from the client, not referenced by
`src/app/api/cron/daily-ops/route.ts` (which does reference `/api/keep-alive`).
**Uncertain because** it is `verifyBearer`-guarded and drives Discord bot operations
(`sendWeeklySummary`, `buildWeeklySummaryHtml`, Discord REST). It is almost certainly invoked
manually or by an external scheduler/Discord integration outside this repo. Do not delete
without checking the Discord app config and any external cron.

### 3. Admin/ops routes with no in-repo caller
`/api/migrate`, `/api/setup`, `/api/cleanup` (DELETE handler).
Referenced only in `src/app/changelog/data.ts` prose and `src/proxy.ts` bypass lists.
`/api/cleanup` GET is a Vercel cron (`vercel.json`), so the file is live either way.
These are intentionally manual, secret-guarded endpoints — **not dead code**, listed so
they aren't re-flagged next scan.

### 4. `/tournaments` — orphaned from internal navigation (not from the sitemap)
`/home/user/VGC-Team-Report/src/app/tournaments/page.tsx`

```
$ grep -rn "\"/tournaments\|'/tournaments\|\`/tournaments" src cypress public
src/app/sitemap.ts:18:    { url: `${BASE}/tournaments`, ... priority: 0.7 },
```

It is the **only** page in the sitemap's `staticPages` list with no corresponding entry in
`src/components/layout/PageNavbar.tsx` (`/compare` is there) or
`src/components/layout/PageFooter.tsx` (`/faq`, `/terms` are there), and no `<Link>` anywhere.
Reachable by URL and indexed via sitemap, so it is *not* dead code — but it is an internal-nav
orphan and a link-equity dead end. Either add it to the navbar/footer or drop it from the
sitemap. Marked UNCERTAIN because this may well be deliberate (soft-launched page).

### 5. Duplicate notifications implementation — reachable, but redundant
- `/home/user/VGC-Team-Report/src/app/notifications/NotificationsContent.tsx` (341 lines) —
  linked from `src/components/ui/NotificationBell.tsx:183`
- `/home/user/VGC-Team-Report/src/app/dashboard/notifications/NotificationsContent.tsx` (213 lines) —
  linked from `src/app/dashboard/DashboardContent.tsx:154`

Two independent, substantially different components rendering the same feature at two routes.
Both are live, so neither is dead — but this is duplicated surface area worth consolidating.

### 6. Explicitly NOT dead (verified, so they don't get re-flagged)
- `/home/user/VGC-Team-Report/src/proxy.ts` — zero importers, but this is the Next.js 16
  middleware convention (`proxy.ts` replaced `middleware.ts`). `default` + `config` are
  framework exports. **Do not delete.**
- `/home/user/VGC-Team-Report/src/lib/data/__validate-mega-coverage.ts` — no static import,
  but dynamically imported at `src/instrumentation.ts:14`
  (`await import("./lib/data/__validate-mega-coverage")`) and used by
  `src/lib/data/__tests__/champions-dex.test.ts`.
- `/home/user/VGC-Team-Report/src/app/api/share/route.ts` and
  `src/app/api/share/[id]/route.ts` — statically imported only by their own tests, but they
  are live route handlers.
- All 7 `src/lib/i18n/translations/*.ts` — imported by `src/lib/i18n/index.ts`.
- Every other file under `src/components/**` has at least one importer.

---

## Known limitations of this scan

- Symbol-level detection is whole-word grep. A symbol referenced only through a computed
  property, a dynamic string, or a barrel re-export alias would be *missed* (reported as
  alive), never falsely flagged. No `export *` re-exports exist in this repo, so barrel
  aliasing is not a concern here.
- Route handlers and Next.js convention files have no static importers by design, so
  "unused API route" findings rest on `fetch("/api/…")` string searches plus `vercel.json`
  crons — external callers are invisible to this method. That is why every route-level
  finding is filed under UNCERTAIN.
- CSS/Tailwind class usage, unused i18n translation keys, and unused DB columns were out of
  scope.

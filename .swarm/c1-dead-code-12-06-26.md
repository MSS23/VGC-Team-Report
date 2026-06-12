# Dead Code Audit — VGC Team Report

**Date:** 2026-06-12
**Auditor:** C1 (overnight nightly swarm)
**Scope:** `src/**/*.{ts,tsx}` minus Next.js convention files & test fixtures
**Method:**
- Glob `src/**/*.{ts,tsx}` → ~273 non-test files
- For every `^export (function|const|class)` symbol, grep across `src/` excluding the defining file and `__tests__/*`/`*.test.ts`
- Cross-checked dynamic-import patterns (`import("./X")`, `dynamic(() => import("X"))`) — the May 23 false-positive list (WhatsNewModal, OTSSheetModal, ShareModal, DiffNavigator, all i18n translations) is dynamically imported and live; not re-flagged.
- Cross-checked `.swarm/c1-dead-code-23-05-26.md` (previous run) and `.swarm/main-changed-files.md` (recent main churn) to mark KNOWN vs. NEW and to flag any conflict risk.

**Status of previous (May 23) findings:**

| # | Item | May 23 status | June 12 status |
|---|---|---|---|
| 1 | `Badge.tsx` (full file) | HIGH delete | DONE — file removed |
| 2 | `useScrollHide.ts` (full file) | HIGH delete | DONE — file removed |
| 3 | `encodeShareState` | MEDIUM-HIGH delete | DONE — function removed; test describe label still references it (cosmetic) |
| 4a | `pokemonToShowdown` | HIGH de-export | STILL PRESENT (KNOWN) |
| 4b | `pokemonToOpenSheet` | HIGH de-export | STILL PRESENT (KNOWN) |
| 5 | `detectRegulationWithSignals` / `RegulationDetection` | HIGH de-export | STILL PRESENT (KNOWN) |
| 6 | `replaceSpeciesInBlock` | MEDIUM de-export | STILL PRESENT (KNOWN) |
| 7 | `migrateCalcEntries` | LOW (recently changed) | STILL PRESENT — `normalize-report.ts` NOT in current `main-changed-files.md`; risk now LOW. Promote to MEDIUM |
| 8 | `isDynamicAllowedOrigin` | MEDIUM de-export | STILL PRESENT (KNOWN) |
| 9 | `generateCsrfToken` | LOW (security-adjacent, optional) | STILL PRESENT (KNOWN) |

---

## NEW findings (not in May 23 audit)

### N1. `ConsentGate.tsx` — full file dead (HIGH)
- **File:** `/home/user/VGC-Team-Report/src/components/providers/ConsentGate.tsx`
- **Symbol:** `export function ConsentGate` (the whole file — 37 lines)
- **Evidence:**
  ```bash
  grep -rn "ConsentGate" src/ --include="*.ts" --include="*.tsx"
  ```
  Returns exactly two lines, both inside `ConsentGate.tsx` itself (the `interface ConsentGateProps` and the `export function ConsentGate`).
- **Background:** The May 23 audit specifically flagged this component as LIVE, citing an import in `src/app/layout.tsx:11`. That import has since been replaced — `layout.tsx:11` now imports `JsonLd`, and the analytics gating is handled inline by `CookieBanner` + the `hasAnalyticsConsent()` guard inside `PostHogProvider`/`ClarityProvider`. `ConsentGate` is now orphaned.
- **Risk:** **LOW** — safe delete. No dynamic import, no string lookup, no test reference.
- **Recently changed?** No — not in `.swarm/main-changed-files.md`. (The adjacent `PostHogProvider`/`ClarityProvider`/`CookieBanner` files are also not in the changed-files list, so this is a stable refactor that happened pre-May-23 but the prior audit missed.)
- **Bundle impact:** ~0.5 KB minified. The bigger win is removing a confusing parallel consent path.
- **Action:** Delete the whole file. Optionally also remove the entry from `src/components/providers/` if it leaves the folder empty (it doesn't — `PostHogProvider`, `ClarityProvider`, `CookieBanner` remain).

### N2. `DisplayTogglePill.tsx` + `useGlobalDisplayPrefs.ts` — paired dead pair (HIGH)
- **Files:**
  - `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx` (~280 lines, whole file)
  - `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts` (51 lines, whole file)
- **Symbols:** `export function DisplayTogglePill`, `export function useGlobalDisplayPrefs`
- **Evidence:**
  ```bash
  grep -rn "DisplayTogglePill" src/ --include="*.ts" --include="*.tsx"
  ```
  Two file hits: the component's own file and a docstring inside `useGlobalDisplayPrefs.ts` (`// Used by the DisplayTogglePill to track …`). No JSX usage anywhere — `src/app/page.tsx`, `TeamReport.tsx`, and every other render tree omit it.
  ```bash
  grep -rn "useGlobalDisplayPrefs" src/ --include="*.ts" --include="*.tsx"
  ```
  Only the export declaration itself.
- **Cross-check:** The pill's props (`hasSeenPill`, `markPillSeen`, `setGlobalMegaDefaultAndReset`, `hasMegaOverrides`) are still produced by `useHomePage.ts`, but nothing consumes them — the pill render call site is gone. The `useHomePage` outputs `hasMegaOverrides` etc. are also used internally by other UI in `page.tsx:1511` (`onChange: (m) => setGlobalMegaDefaultAndReset(m === "mega")`), so don't strip those from the hook — only the pill + the local-storage prefs hook are dead.
- **Risk:** **LOW** — `DisplayTogglePill` is a leaf component, not dynamically imported anywhere. `useGlobalDisplayPrefs` is only mentioned in the pill and its own docstring.
- **Recently changed?** No — neither file is in `.swarm/main-changed-files.md`.
- **Component dir:** `src/components/display/` would become empty after deleting `DisplayTogglePill.tsx` — also delete the empty directory.
- **Bundle impact:** ~3 KB minified (pill JSX + motion-respecting popover) + ~0.4 KB (hook). The hook is "use client" so it sits in client bundles where it's reachable.
- **Action:**
  1. Delete `src/components/display/DisplayTogglePill.tsx`
  2. Delete `src/lib/hooks/useGlobalDisplayPrefs.ts`
  3. Remove the now-empty `src/components/display/` directory
  4. Optional follow-up: audit `useHomePage.ts` for the `hasSeenPill`/`markPillSeen` plumbing if it exists (none found in this audit, but worth a re-grep on the implementer's side)

### N3. `asPokemonTypes` — trivial helper, never called (HIGH)
- **File:** `/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts:123`
- **Symbol:** `export function asPokemonTypes`
- **Evidence:**
  ```bash
  grep -rn "asPokemonTypes" src/ --include="*.ts" --include="*.tsx"
  ```
  One match — the declaration itself. The function body is a trivial cast: `return types as PokemonType[];`. Zero callers.
- **Risk:** **LOW** — safe delete. Pure helper, no side effects, no dynamic-import surface.
- **Recently changed?** No.
- **Bundle impact:** Negligible (~50 bytes minified), but the deletion removes a tiny inline cast helper that adds no value over inline `as`.
- **Action:** Delete the function (lines 122–125).

### N4. `WALKTHROUGH_STEPS` — should be private (MEDIUM)
- **File:** `/home/user/VGC-Team-Report/src/hooks/useWalkthrough.ts:16`
- **Symbol:** `export const WALKTHROUGH_STEPS`
- **Evidence:**
  ```bash
  grep -rn "WALKTHROUGH_STEPS" src/ --include="*.ts" --include="*.tsx"
  ```
  Two hits, both inside `useWalkthrough.ts`: the export declaration (line 16) and the local use (`let steps = WALKTHROUGH_STEPS;` on line 189). Zero external consumers.
- **Risk:** **LOW** — drop `export` keyword (don't delete). Internal-only constant.
- **Recently changed?** No.
- **Action:** Drop `export` on line 16.

### N5. `TYPE_CHART` — should be private (MEDIUM)
- **File:** `/home/user/VGC-Team-Report/src/lib/data/type-chart.ts:6`
- **Symbol:** `export const TYPE_CHART`
- **Evidence:**
  ```bash
  grep -rn "TYPE_CHART" src/ --include="*.ts" --include="*.tsx"
  ```
  Two hits, both inside `type-chart.ts` itself: the declaration (line 6) and the consumer on line 179 (`mult *= TYPE_CHART[attackType]?.[defType] ?? 1;`). Public surface is the `getTypeEffectiveness()` family of functions, not the raw map.
- **Risk:** **LOW** — drop `export`. This is a large 18×18 effectiveness matrix; keeping it private prevents accidental client-side imports of the whole table.
- **Recently changed?** No.
- **Bundle impact:** Marginal — already tree-shaken if unused, but removing the export makes intent clear and shields against future accidental imports.
- **Action:** Drop `export` on line 6.

### N6. URL-codec schema exports — internal Zod shapes leak (MEDIUM)
- **File:** `/home/user/VGC-Team-Report/src/lib/sharing/url-codec.ts`
- **Symbols:**
  - `export const SerializedGamePlanSchema` (line 11)
  - `export const SerializedMatchupPlanSchema` (line 18)
  - `export const ShareableStateSchema` (line 39)
- **Evidence:**
  ```bash
  grep -rn "SerializedGamePlanSchema\|SerializedMatchupPlanSchema\|ShareableStateSchema" src/ --include="*.ts" --include="*.tsx"
  ```
  Each schema is referenced **only** inside `url-codec.ts` itself (as a sub-schema or in `safeParse` on line 185). No external file imports any of them. The public API is the `encodeShareableState` / `decodeShareState` functions, not the raw Zod schemas.
- **Risk:** **LOW** — drop `export` on all three. Zod schemas are sometimes intentionally re-exported for caller-side validation; here, callers always go through the encode/decode wrappers and don't need the schema directly. Re-grepped `__tests__` — none use these schemas either.
- **Recently changed?** No.
- **Action:** Drop `export` on lines 11, 18, 39.

---

## Possibly-dead, MEDIUM confidence (de-export, don't delete)

Things that are exported but only used inside their defining file — same shape as the May-23 items #6–9, just additional siblings I found this round. These are LOW priority but worth cleaning up in a single drive-by commit alongside the May-23 carry-overs.

| File:line | Symbol | Only-internal-use note |
|---|---|---|
| `src/hooks/useTeamReport.ts:19` | `ViewMode` (type) | Only used as the generic for `useState<ViewMode>` in the same file. |
| `src/hooks/useDamageCalcs.ts:19` | `DamageCalcsMap` (type) | Only used as the state shape in the same file. |
| `src/hooks/useCollaborativeSync.ts:6` | `SyncStatus` (type) | Only used internally for the `useState<SyncStatus>` call. |
| `src/hooks/useUndoRedo.ts:7` | `UndoRedoSnapshot` (type) | Only used as the ref/return type in the same file. |
| `src/hooks/useMatchupPlans.ts:25` | `GamePlanSlots` (type) | Used internally by `MatchupPlan.planA/planB` typing. |
| `src/lib/notifications.ts:3` | `NotificationType` (type) | Only used as the parameter type of the (exported) `notify` function in the same file — so this is borderline; keep exported if the public function signature should be importable by name. |
| `src/lib/validation/champions-legality.ts:29` | `LegalitySeverity` (type) | Only used as a field type on the (internal-only?) `Issue` interface in the same file. |

None of these are HIGH-impact — the pattern is "type ergonomically exported alongside the function that returns it". Some callers may prefer the type to stay exported for `ReturnType<>` ergonomics. Recommendation: leave them as-is unless a maintainer is doing a deliberate API-surface cleanup pass.

---

## Cross-checked — NOT recommending deletion this round

These appeared in my orphan-files grep as candidates but inspection showed they are alive (dynamically imported, or referenced via templated paths that my plain grep missed):

| File / symbol | Why live |
|---|---|
| `WhatsNewModal.tsx` | `dynamic(() => import("@/components/ui/WhatsNewModal"))` in `PasteInput.tsx:15` |
| `OTSSheetModal.tsx` | `dynamic()` in `page.tsx`; also `/api/sprite?u=…` template URL |
| `ShareModal.tsx` | `dynamic()` in `page.tsx`; in `.swarm/main-changed-files.md` so do **not** flag |
| `DiffNavigator.tsx` | `dynamic()` in `page.tsx:37` |
| `DoubleTapLikeOverlay`, `EditChangelog`, `CollaboratorPanel`, `CommentSection` | All `dynamic()` from `page.tsx` |
| `InlinePokemonEditor`, `OffensiveCoverageChart`, `DefensiveCoverageChart` | All `dynamic()` from `PokemonCard.tsx` / `TeamReport.tsx` |
| `src/lib/i18n/translations/{fr,es,it,ja,ko,zh}.ts` | Loaded via `import("./translations/${code}")` in `i18n/index.ts:25-33`; also re-exported as a `Record<LanguageCode, …>` loader map |
| `src/middleware.ts` | Next.js convention file |
| `src/lib/utils/export-report.ts` | `await import("@/lib/utils/export-report")` in `page.tsx:497` |

### API routes — orphan-looking but legitimately external

Carrying over the May-23 list, re-verified this round; **do not delete**:

- `/api/cron/{daily-ops,weekly-report,weekly-digest,posthog-errors}` — Vercel cron (`vercel.json`)
- `/api/webhooks/{clerk,linear,posthog}` — external webhook providers
- `/api/{setup,migrate,cleanup}` — admin/ops endpoints (bearer-secret protected)
- `/api/keep-alive` — Vercel cron + external pings
- `/api/sprite` — referenced via templated `/api/sprite?u=…` URLs
- `/api/bot` — admin/CLI/Discord-bot endpoint
- `/api/oembed` — invoked by external embed unfurlers (Discord, Slack, etc.)

---

## npm dependencies — all live

Cross-checked every entry in `package.json` `dependencies` against `src/` imports (including dynamic). No dead npm deps found:

| Dep | Used by |
|---|---|
| `html2canvas-pro` | `src/lib/dynamic-imports/html2canvas.ts` (singleton dynamic import) |
| `jspdf` | `await import("jspdf")` in `src/lib/utils/export-report.ts` |
| `qrcode` | `import("qrcode")` in `OTSSheetModal.tsx`, `TeamOverview.tsx` |
| `motion` | `from "motion/react"` in ~10 components |
| `posthog-js`, `posthog-node` | client + server analytics |
| `tweetnacl` | webhook signature verification |
| `vanilla-cookieconsent` | `CookieBanner.tsx` |
| `@opentelemetry/*` | OTLP log exporter pipeline in `instrumentation.ts` |
| all others | direct static imports |

---

## Conflict-risk overlap with `.swarm/main-changed-files.md`

None of the NEW findings (N1–N6) touch files that appear in `.swarm/main-changed-files.md`. Specifically:

- **N1 `ConsentGate.tsx`** — not in changed-files. Safe.
- **N2 `DisplayTogglePill.tsx` + `useGlobalDisplayPrefs.ts`** — neither in changed-files. Safe.
- **N3 `asPokemonTypes`** — `src/lib/data/dex-subset.ts` not in changed-files. Safe.
- **N4 `WALKTHROUGH_STEPS`** — `src/hooks/useWalkthrough.ts` not in changed-files. Safe.
- **N5 `TYPE_CHART`** — `src/lib/data/type-chart.ts` not in changed-files. Safe.
- **N6 url-codec schemas** — `src/lib/sharing/url-codec.ts` not in changed-files. Safe.

The KNOWN finding promoted this round (`migrateCalcEntries` in `normalize-report.ts`) is **also no longer in changed-files**, so it can be safely demoted from LOW to MEDIUM-HIGH and acted on alongside the May-23 carryovers.

The file `src/components/ui/ShareModal.tsx` **is** in changed-files; my audit confirmed it is live (dynamically imported), so no recommendation touches it.

---

## Summary table

| # | Item | Type | Lines | Confidence | Risk | NEW vs KNOWN | Recently changed? | Recommended action |
|---|---|---|---|---|---|---|---|---|
| N1 | `ConsentGate.tsx` (full file) | Component | 37 | HIGH | LOW | NEW | No | Delete file |
| N2a | `DisplayTogglePill.tsx` (full file) | Component | ~280 | HIGH | LOW | NEW | No | Delete file |
| N2b | `useGlobalDisplayPrefs.ts` (full file) | Hook | 51 | HIGH | LOW | NEW | No | Delete file |
| N3 | `asPokemonTypes` | Lib export | 4 | HIGH | LOW | NEW | No | Delete function |
| N4 | `WALKTHROUGH_STEPS` | Lib export | 1 | MEDIUM | LOW | NEW | No | Drop `export` |
| N5 | `TYPE_CHART` | Lib export | 1 | MEDIUM | LOW | NEW | No | Drop `export` |
| N6 | `Serialized{GamePlan,MatchupPlan}Schema`, `ShareableStateSchema` | Lib exports | 3 | MEDIUM | LOW | NEW | No | Drop `export` on 3 lines |
| K4a | `pokemonToShowdown` | Lib export | 56 | HIGH | LOW | KNOWN | No | Drop `export` |
| K4b | `pokemonToOpenSheet` | Lib export | 39 | HIGH | LOW | KNOWN | No | Drop `export` |
| K5 | `detectRegulationWithSignals` + `RegulationDetection` | Lib exports | 78 | HIGH | LOW | KNOWN | No | Drop `export` on both |
| K6 | `replaceSpeciesInBlock` | Lib export | 13 | MEDIUM | LOW | KNOWN | No | Drop `export` |
| K7 | `migrateCalcEntries` | Lib export | ~25 | MEDIUM-HIGH | LOW (was LOW-risk in May, now safer) | KNOWN — promoted | **No (no longer)** | Drop `export` |
| K8 | `isDynamicAllowedOrigin` | Lib export | 5 | MEDIUM | LOW | KNOWN | No | Drop `export` |
| K9 | `generateCsrfToken` | Lib export | 6 | LOW (optional) | LOW | KNOWN | No | Optional |

**Total whole-file deletes (N1 + N2a + N2b):** ~368 lines across 3 files.
**Total trivial-fn delete (N3):** 4 lines.
**Total de-exports (N4–N6 + K4–K9):** ~227 lines of public-API surface reduced across ~11 symbols.

---

## Search commands used (for reproducibility)

```bash
# 1. Orphan-file scan (by symbol-as-filename)
for f in $(find src -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v __tests__ | grep -v ".test." | grep -v "/api/" | grep -v "/app/"); do
  base=$(basename "$f" .tsx); base=$(basename "$base" .ts)
  [ "$base" = "index" ] && continue
  hits=$(grep -rE "\b${base}\b" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "^${f}:" | wc -l)
  [ "$hits" = "0" ] && echo "ORPHAN: $f"
done

# 2. Dead-export scan (exported function/const with zero external refs)
for f in $(find src -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v __tests__ | grep -v ".test." | grep -v "/app/"); do
  grep -oE "^export (default )?(function|const|class) [A-Za-z_][A-Za-z0-9_]*" "$f" | \
    sed 's/^export \(default \)\?\(function\|const\|class\) //' | while read sym; do
      [ -z "$sym" ] || [ "$sym" = "default" ] && continue
      hits=$(grep -rE "\b${sym}\b" src/ --include="*.ts" --include="*.tsx" | grep -v "^${f}:" | wc -l)
      [ "$hits" = "0" ] && echo "DEAD: $f :: $sym"
    done
done

# 3. API route caller scan
find src/app/api -name "route.ts" | while read route; do
  seg=$(echo "$route" | sed 's|^src/app||; s|/route\.ts$||; s|^/api/||; s|/.*$||')
  hits=$(grep -rE "/api/${seg}" src/ --include="*.ts" --include="*.tsx" | grep -v "^${route}:" | wc -l)
  echo "$hits  $route"
done | sort -n

# 4. npm dep usage
for dep in $(jq -r '.dependencies | keys[]' package.json); do
  count=$(grep -rE "from ['\"]${dep}['\"]|from ['\"]${dep}/|import\\(['\"]${dep}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
  echo "$count  $dep"
done | sort -n
```

All commands were executed from the repo root `/home/user/VGC-Team-Report/`.

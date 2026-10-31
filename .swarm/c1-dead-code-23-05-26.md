# Dead Code Audit — VGC Team Report

**Date:** 2026-05-23
**Scope:** `src/lib/**/*.ts`, `src/components/**`, `src/hooks/**`, `src/app/api/**`
**Method:** symbol-by-symbol grep across `src/` excluding the defining file and `__tests__`/`*.test.ts`. Cross-checked previous audit (`c1-dead-code-20-05-26.md`) and `.swarm/main-changed-files.md` to avoid recommending deletion of recently-touched code.

---

## Top Findings (HIGH confidence — safe to delete)

### 1. `Badge` component — fully unused
- **File:** `/home/user/VGC-Team-Report/src/components/ui/Badge.tsx`
- **Lines:** 21 (entire file)
- **Symbol:** `export function Badge`
- **Evidence:**
  ```bash
  grep -rn "\bBadge\b" src/ --include="*.ts" --include="*.tsx"
  ```
  Only two matches: (1) the export itself on line 8, (2) `// ── Legality Badge ─` — an unrelated section comment in `src/components/report/TeamOverview.tsx:194`.
- **Imports of `@/components/ui/Badge`:** 0 (`grep -rn "from.*ui/Badge" src/ --include="*.ts" --include="*.tsx"` returns nothing).
- **Confidence:** HIGH — no callers anywhere, no dynamic imports, simple presentational component.
- **Recently changed?** No (not in `main-changed-files.md`).
- **Bundle impact:** ~0.3 KB minified. Marginal but a clean delete (whole file).
- **Action:** Delete the entire file.

### 2. `useScrollHide` hook — fully unused
- **File:** `/home/user/VGC-Team-Report/src/hooks/useScrollHide.ts`
- **Lines:** 124 (entire file)
- **Symbol:** `export function useScrollHide`
- **Evidence:**
  ```bash
  grep -rn "useScrollHide" src/ --include="*.ts" --include="*.tsx"
  ```
  Only one match — the export declaration itself (line 46). Zero importers, zero callers, zero dynamic imports.
- **Confidence:** HIGH — entire file is orphaned.
- **Recently changed?** No. (Note: `useTouchIdleHide.ts` appears in the recent-changes manifest but the file no longer exists — already removed. `useScrollHide` is its older cousin and likewise unreferenced.)
- **Bundle impact:** ~1.2 KB minified pre-treeshake. Since it's an unused export only (no eager side effects), tree-shaking already drops it from the bundle, but the source file remains as maintenance burden.
- **Action:** Delete the entire file.

### 3. `encodeShareState` — test-only export
- **File:** `/home/user/VGC-Team-Report/src/lib/sharing/url-codec.ts`
- **Lines:** 27 (lines 149–175)
- **Symbol:** `export async function encodeShareState`
- **Evidence:**
  ```bash
  grep -rn "encodeShareState" src/ --include="*.ts" --include="*.tsx"
  ```
  Two matches: (1) the definition on line 149, (2) a describe-block label in `src/lib/sharing/__tests__/url-codec.test.ts:81`. **The test does NOT actually call `encodeShareState`** — it uses its own `encodeSync()` helper (lines 33–37 of the test) for Node-compatibility reasons. Inspection confirms `encodeShareState` is never invoked in production code or in test bodies.
- **Confidence:** MEDIUM-HIGH — could become useful if someone wants a server-side encoder, but currently 100% dead.
- **Recently changed?** No (`url-codec.ts` not in `main-changed-files.md`).
- **Bundle impact:** ~0.5 KB minified. More importantly: it imports `CompressionStream` which keeps a polyfill path open in the share-codec module graph. Removing trims unused web-API surface.
- **Action:** Remove the function. Update the test describe-block label and the (already-unused) import line.

### 4. `pokemonToShowdown` & `pokemonToOpenSheet` — should be private (carried over from prior audit, still valid)
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/export-paste.ts`
- **Symbols & lines:**
  - `pokemonToShowdown` — lines 20–75 (56 lines)
  - `pokemonToOpenSheet` — lines 86–124 (39 lines)
- **Evidence:**
  ```bash
  grep -rn "pokemonToShowdown\|pokemonToOpenSheet" src/ --include="*.ts" --include="*.tsx"
  ```
  Production callers: 0. Both are only used internally by `teamToShowdown` / `teamToOpenSheet` (lines 77 and 127, same file). `pokemonToShowdown` appears in the test file `src/lib/utils/__tests__/export-paste.test.ts` — but tests are not production callers.
- **Confidence:** HIGH — same finding as 2026-05-20 audit; nothing has changed.
- **Recently changed?** No.
- **Bundle impact:** Nothing if just changing `export function` → `function`. Saves cognitive surface and lets `pokemonToShowdown` get inlined into the `team*` wrappers. The test would need a tiny update (call `teamToShowdown([mon])` and slice off the join separator) or be deleted.
- **Action:** Drop the `export` keyword on both. Either update or delete the per-pokemon tests.

### 5. `detectRegulationWithSignals` — should be private
- **File:** `/home/user/VGC-Team-Report/src/lib/analysis/detect-regulation.ts`
- **Lines:** 78 (lines 71–148)
- **Symbol:** `export function detectRegulationWithSignals`
- **Evidence:**
  ```bash
  grep -rn "detectRegulationWithSignals" src/ --include="*.ts" --include="*.tsx"
  ```
  Two matches: (1) the definition on line 71, (2) one internal callsite on line 217 inside `detectRegulation()` in the same file. Zero external imports.
  ```bash
  grep -rn "RegulationDetection" src/ --include="*.ts" --include="*.tsx"
  ```
  Same story for the paired interface — only used as the return type of `detectRegulationWithSignals`. No external consumers.
- **Confidence:** HIGH — public API is `detectRegulation()`; `detectRegulationWithSignals` is an implementation detail that leaked out as `export`.
- **Recently changed?** No.
- **Bundle impact:** None directly (already tree-shaken), but reduces public API surface and makes it safe to refactor without grep paranoia.
- **Action:** Drop the `export` on both `detectRegulationWithSignals` and `RegulationDetection`.

---

## Other findings (MEDIUM confidence — make private, don't delete)

### 6. `replaceSpeciesInBlock`
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/paste-edit.ts`, lines 59–71 (13 lines)
- Only used by `replacePokemonSpecies()` in the same file (line 97). Make private.
- Carried over from prior audit. **Recently changed?** No.

### 7. `migrateCalcEntries`
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/normalize-report.ts`, line 10
- Only used internally by `normalizeReportData()` on line 102 of the same file.
- **Recently changed?** **YES** — `normalize-report.ts` is in `main-changed-files.md`. Be cautious: this function may have been recently exported for an upcoming migration script that hasn't landed yet. Verify with the author before downgrading. **Confidence: LOW (recently churned).**

### 8. `isDynamicAllowedOrigin`
- **File:** `/home/user/VGC-Team-Report/src/lib/security/cors.ts`, lines 18–22
- Two internal callsites (lines 27 and 41) inside the same file; zero external imports. Make private.
- **Recently changed?** No.

### 9. `generateCsrfToken`
- **File:** `/home/user/VGC-Team-Report/src/lib/security/csrf.ts`, lines 17–22
- Only used internally by `setCsrfCookie()` on line 49. Make private.
- **Recently changed?** No. **Caveat:** CSRF helpers are security-adjacent; keeping it exported costs nothing. LOW priority.

---

## Cross-checked, NOT recommending deletion

The following symbols had a low ref count in my initial grep, but on inspection turned out to be live. Listing them here so future audits don't re-flag them.

| Symbol | File | Why it's live |
|---|---|---|
| `ConsentGate` | `src/components/providers/ConsentGate.tsx` | Imported in `src/app/layout.tsx:11` |
| `CreatorProfile` (interface) | `src/components/social/CreatorProfile.tsx` | Internal type for `CreatorProfileWrapper`, which IS exported and imported in `src/app/creator/[name]/page.tsx` |
| `Badge` (the comment in `TeamOverview.tsx:194`) | — | Section-divider comment, not a JSX reference |
| `validateMegaCoverage` | `src/lib/data/__validate-mega-coverage.ts` | Dynamically imported in `src/instrumentation.ts:14` |
| `NewsletterSignup`, `ShareDock` (mentioned in changed-files list) | — | Files no longer exist; only mentioned in `ChangelogContent.tsx` text. Already deleted. |
| All `src/app/api/*/route.ts` with 0 internal callers | — | Either external (cron, webhooks, oembed, sprite proxy, admin: setup/migrate/cleanup) or referenced via templated paths (`/api/share/${id}/collaborators` etc.) that my grep didn't catch on first pass. Each was re-verified. |

### API routes — orphan-looking but legitimately external

These have 0 internal `fetch()` calls but are intentional external entry points; **do not delete**:

- `/api/cron/daily-ops`, `/api/cron/weekly-report`, `/api/cron/weekly-digest`, `/api/cron/posthog-errors` — invoked by Vercel cron
- `/api/webhooks/clerk`, `/api/webhooks/linear`, `/api/webhooks/posthog` — invoked by external webhook providers
- `/api/setup`, `/api/migrate`, `/api/cleanup` — admin/ops endpoints, secret-protected, called manually
- `/api/keep-alive` — Vercel cron + external pings
- `/api/sprite` — referenced via templated `/api/sprite?u=…` URLs in `PokemonSprite.tsx`, `OTSSheetModal.tsx`, `TeamCardExport.tsx` (matched on re-grep)
- `/api/bot` — admin/CLI endpoint
- `/api/oembed` — invoked by external embed unfurlers (Discord, Slack, etc.)

---

## Summary table

| # | Item | Type | Lines | Confidence | Recently changed? | Recommended action |
|---|---|---|---|---|---|---|
| 1 | `Badge` (full file) | Component | 21 | HIGH | No | Delete file |
| 2 | `useScrollHide` (full file) | Hook | 124 | HIGH | No | Delete file |
| 3 | `encodeShareState` | Lib export | 27 | MEDIUM-HIGH | No | Delete function |
| 4a | `pokemonToShowdown` | Lib export | 56 | HIGH | No | Drop `export` |
| 4b | `pokemonToOpenSheet` | Lib export | 39 | HIGH | No | Drop `export` |
| 5 | `detectRegulationWithSignals` + `RegulationDetection` | Lib export | 78 | HIGH | No | Drop `export` on both |
| 6 | `replaceSpeciesInBlock` | Lib export | 13 | MEDIUM | No | Drop `export` |
| 7 | `migrateCalcEntries` | Lib export | ~25 | LOW | **YES** | Skip this round |
| 8 | `isDynamicAllowedOrigin` | Lib export | 5 | MEDIUM | No | Drop `export` |
| 9 | `generateCsrfToken` | Lib export | 6 | LOW | No | Optional |

**Total lines deletable (items 1–3):** ~172 lines, two whole files removed.
**Total lines de-exportable (items 4–6, 8):** ~191 lines of public-API surface reduced.

---

## Search commands used (for reproducibility)

```bash
# Per-symbol production usage (excludes self-file and tests)
grep -rE "\b<SYMBOL>\b" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "<FILE>:" \
  | grep -vE "__tests__|\.test\.ts|\.spec\.ts"

# API route caller discovery
grep -rn "/api/<route>" src/ --include="*.ts" --include="*.tsx"

# Templated API path discovery (catches /api/share/${id}/x)
grep -rn "share/.*/<segment>" src/ --include="*.ts" --include="*.tsx"
```

All commands were executed from the repo root `/home/user/VGC-Team-Report/`.

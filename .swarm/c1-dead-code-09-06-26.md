# Dead Code Audit — VGC Team Report

**Date:** 2026-06-09
**Agent:** C1 (overnight swarm)
**Scope:** `src/**`, `cypress/**`
**Method:** Symbol-by-symbol grep across `src/` and `cypress/`, excluding the defining file. Cross-checked against `package.json` and Next.js routing.

Prior-removal confirmations (from previous runs):
- `useScrollHide` — no source file exists; only mentioned in changelog text. CONFIRMED removed.
- `ReactionBar` — no source file; only mentioned in changelog text. CONFIRMED removed.
- `axios` — not in `package.json` dependencies; no `from "axios"` import in `src/`. CONFIRMED removed.
- `parsePikalyticsUrl`, `evsToSp`, `spToEv` — no source references; only in changelog text. CONFIRMED removed.
- `Badge` component — file `src/components/ui/Badge.tsx` no longer exists. CONFIRMED removed.
- `encodeShareState` — no longer present in `src/lib/sharing/url-codec.ts`. CONFIRMED removed.
- `detectRegulationWithSignals` — already private (no `export` keyword). CONFIRMED downgraded.

---

## Confirmed dead exports / orphaned components (HIGH confidence)

### 1. `DisplayTogglePill` — orphaned component
- **File:** `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx`
- **Lines to remove:** 267 (entire file) + the `src/components/display/` directory itself (only contains this file)
- **Symbol:** `export function DisplayTogglePill`
- **Evidence:** `grep -rn "DisplayTogglePill" src/ cypress/` returns only the export declaration in the file itself and a doc-comment reference in `src/lib/hooks/useGlobalDisplayPrefs.ts` (which is itself orphaned — see #2). Zero importers anywhere in `src/app`, `src/components`, `src/hooks`, or `cypress/`.
- **Context:** Commit `8eb39cc` removed the call site from `src/app/page.tsx` (Mega toggle was moved into the bottom-nav overflow sheet). The file itself was never deleted. `.swarm/c5-commit-review-09-06-26.md` already flagged this.
- **Confidence:** HIGH — confirmed via grep, confirmed via existing review note.
- **Action:** Delete the file. Delete the `src/components/display/` directory (would otherwise be empty).

### 2. `useGlobalDisplayPrefs` hook — orphaned (paired with #1)
- **File:** `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts`
- **Lines to remove:** 51 (entire file) + the `src/lib/hooks/` directory if no other file lives there (this is the only one)
- **Symbol:** `export function useGlobalDisplayPrefs`
- **Evidence:** `grep -rn "useGlobalDisplayPrefs" src/ cypress/` returns only the export declaration. Zero callers. Sole consumer was `DisplayTogglePill` (see #1) which is itself dead. Doc comment in the file references "Used by the DisplayTogglePill" — confirming it was always paired.
- **Confidence:** HIGH — the orphan chain (DisplayTogglePill → useGlobalDisplayPrefs) is mutually-confirming.
- **Action:** Delete the file. Check the `src/lib/hooks/` directory afterward (currently single-file).

### 3. `ConsentGate` — orphaned component
- **File:** `/home/user/VGC-Team-Report/src/components/providers/ConsentGate.tsx`
- **Lines to remove:** 37 (entire file)
- **Symbol:** `export function ConsentGate`
- **Evidence:** `grep -rn "ConsentGate" src/` returns matches only in:
  - the file itself (export, interface),
  - `.planning/` docs (historical planning notes — not source),
  - `.swarm/c1-dead-code-23-05-26.md` (prior audit incorrectly listed it as still imported in `layout.tsx:11`).
  - **Verified:** `grep -n "ConsentGate" src/app/layout.tsx` → **No matches.** The wrapper was removed from layout (likely when PostHogProvider/Analytics were restructured) but the file was left behind.
- **Confidence:** HIGH — layout.tsx no longer imports it, no other file does either.
- **Action:** Delete the file. (Note: `hasAnalyticsConsent` is still imported into `PostHogProvider` for in-effect consent gating; that's fine.)

### 4. `exportAsPdf` function — dead export
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/export-report.ts`
- **Lines to remove:** ~21 (the `exportAsPdf` async function, lines 95–115). Also `getJsPDF` helper (lines 4–7, 4 lines) becomes orphaned once `exportAsPdf` is gone.
- **Symbol:** `export async function exportAsPdf` and internal `async function getJsPDF`
- **Evidence:** `grep -rn "exportAsPdf" src/ cypress/` — only the export declaration and i18n string keys (no `t("exportAsPdf")` call sites). `exportAsImage` is still used (page.tsx:497 dynamic-imports it), so the file stays — but the PDF half is fully orphaned.
- **Confidence:** HIGH — verified no callers; the dynamic-import call in `page.tsx` only pulls `exportAsImage`.
- **Action:** Remove `exportAsPdf` and `getJsPDF` from `src/lib/utils/export-report.ts`. Drop `jspdf` from `package.json` (see #5).

### 5. `jspdf` npm dependency — unused
- **Package:** `jspdf` (declared in `package.json` dependencies)
- **Evidence:** `grep -rE "from .\"?jspdf|import\(.\"?jspdf" src/` returns a single match: `src/lib/utils/export-report.ts:5` inside `getJsPDF()`, which is only called by the dead `exportAsPdf` function (see #4). No other `jspdf` imports anywhere.
- **Confidence:** HIGH — fully dead once finding #4 is applied.
- **Action:** After applying #4, `npm uninstall jspdf` (and remove from `package.json` dependencies). Saves roughly 300 KB from `node_modules` (and removes a `package-lock.json` block).

### 6. `asPokemonTypes` function — dead export
- **File:** `/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts`
- **Lines to remove:** 3 (lines 122–125)
- **Symbol:** `export function asPokemonTypes`
- **Evidence:** `grep -rn "asPokemonTypes" /home/user/VGC-Team-Report` returns exactly one match — the export declaration itself. Zero callers anywhere (no `src/`, no `cypress/`, no tests, no scripts).
- **Confidence:** HIGH — the function is a one-line type-cast utility never referenced.
- **Action:** Delete lines 122–125.

### 7. Dead i18n translation keys: `exportAsImage`, `exportAsPdf`, `exporting`
- **Files:** `src/lib/i18n/translations/{en,es,fr,it,ja,ko,zh}.ts` (7 files)
- **Lines to remove:** 3 keys × 7 languages = **21 lines** + comment headers
- **Evidence:** `grep -rn "t(.exportAsImage\|t(.exportAsPdf\|t(.exporting." src/` → **No matches.** None of these translation keys are looked up via the i18n `t()` function anywhere in the app. The Export Report section in translations is entirely orphaned — `exportAsImage` is called as a function name only (via direct dynamic import) and not as a translation key.
- **Confidence:** HIGH — verified zero `t("exportAs*")` or `t("exporting")` callsites.
- **Action:** Remove the `// Export report` section keys from all 7 translation files.

---

## Suspicious-but-uncertain candidates (NOT recommended for Wave 2)

### Internal-only exports (can be downgraded to non-export but are NOT dead)
These are exports whose only consumers live in the same file. Removing the `export` keyword would tighten the API surface but doesn't remove code. **Low priority; leave for now.**
- `migrateCalcEntries` in `src/lib/utils/normalize-report.ts` — only used by `normalizeReportData` in the same file. Flagged in multiple prior audits; recently churned, skip.
- `replaceSpeciesInBlock` in `src/lib/utils/paste-edit.ts` — only used by `replacePokemonSpecies` in the same file. Flagged before, never acted on.
- `SerializedGamePlanSchema`, `SerializedMatchupPlanSchema`, `ShareableStateSchema` in `src/lib/sharing/url-codec.ts` — composed within the same file but never imported elsewhere.
- `LegalitySeverity` type in `src/lib/validation/champions-legality.ts` — used internally as a field type only.
- `WALKTHROUGH_STEPS`, `UndoRedoSnapshot`, `GamePlanSlots`, `DamageCalcsMap` — all used only inside the hook file that exports them.
- `pokemonToShowdown` in `src/lib/utils/export-paste.ts` — used by tests (which look alive); skip per task rules.
- `generateCsrfToken`, `isDynamicAllowedOrigin`, `getClientIp`, `hasValidContentType` in `src/lib/security/*.ts` — used only within the `security` module.

### Routes that look internal/external but not imported by source code (likely intentional public endpoints)
Listed for awareness. Do NOT delete without external traffic analysis.
- `/api/oembed` — oEmbed responder for external sites/Discord; serves consumers outside this codebase.
- `/api/setup`, `/api/migrate` — admin/bootstrap endpoints called manually with secrets.
- `/api/keep-alive` — likely external uptime ping.
- `/api/discord` — public Discord interactions endpoint (signature-verified).
- `/api/bot` — bot trigger endpoint (CRON_SECRET gated).

### Duplicate type definition (not dead — but cleanup opportunity)
- `ReportTags` is declared in BOTH `src/lib/data/tags.ts` AND `src/hooks/useTeamMeta.ts` (the latter has a comment noting "canonical ReportTags in src/lib/data/tags.ts"). The hook's local copy is only used inside the hook; could be deleted in favor of importing from `tags.ts`. Not strictly dead code — but a refactor candidate.

### Suspect translation strings (lower confidence — manual audit needed)
Other translation files have many keys; the `exportAs*` block was the only one I could exhaustively verify zero call sites for. A full i18n key-usage audit (translate vs. lookup) might surface 20–50 more dead keys per language but would need a more thorough sweep than this run allowed.

---

## Summary table

| # | Target | Path | Lines | Type |
|---|--------|------|-------|------|
| 1 | `DisplayTogglePill` | `src/components/display/DisplayTogglePill.tsx` | 267 | Orphan component (entire file) |
| 2 | `useGlobalDisplayPrefs` | `src/lib/hooks/useGlobalDisplayPrefs.ts` | 51 | Orphan hook (entire file) |
| 3 | `ConsentGate` | `src/components/providers/ConsentGate.tsx` | 37 | Orphan component (entire file) |
| 4 | `exportAsPdf` + `getJsPDF` | `src/lib/utils/export-report.ts` | ~25 | Dead exports inside live file |
| 5 | `jspdf` dep | `package.json` | n/a (1 dep line) | Unused npm dependency |
| 6 | `asPokemonTypes` | `src/lib/data/dex-subset.ts` | 3 | Dead export |
| 7 | i18n export keys | `src/lib/i18n/translations/*.ts` (7 files) | ~21 | Dead translation keys |

**Net code removable in Wave 2: ~404 lines + 1 npm dependency (and ~300 KB out of `node_modules`).**

---

## Notes on conflict-risk files
Reviewed the conflict list. None of my findings recommend edits to:
- `public/sw.js`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/report/SlideNavControls.tsx`
- `src/components/ui/SwipeHint.tsx`
- `src/hooks/useHomePage.ts`

All proposed removals are in isolated files or are localized to functions inside `lib/utils/export-report.ts` (which is not on the conflict list).

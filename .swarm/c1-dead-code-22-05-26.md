# Dead Code Audit — 2026-05-22

**Project:** VGC Team Report (Next.js 16 / React 19 / TypeScript)
**Branch:** swarm-nightly-2026-05-22
**Scope:** `src/lib`, `src/hooks`, `src/components`, `src/app/api`, `src/data`
**Method:** ripgrep across `*.ts`/`*.tsx`, checked dynamic imports (`import("...")`),
string-literal route lookups, and barrel re-exports.

---

## Confirmed dead — safe to delete tonight

### 1. `src/hooks/useScrollHide.ts` (entire file, 125 lines) — HIGH VALUE

- **File:** `/home/user/VGC-Team-Report/src/hooks/useScrollHide.ts:46`
- **Export:** `export function useScrollHide(options: UseScrollHideOptions = {}): boolean`
- **Verification:**
  ```
  $ rg "useScrollHide" --type-add 'ts:*.{ts,tsx}' -tts
  src/hooks/useScrollHide.ts:export function useScrollHide(options: UseScrollHideOptions = {}): boolean {
  ```
  Only the defining line matches. **Zero callers.** Checked all `.ts`/`.tsx` under `src/`.
  Also searched for `import\(.*useScrollHide.*\)` for dynamic imports — none found.
- **History:** Almost certainly orphaned by the 850e91c "Delete share + reaction docks" commit
  (it was the scroll-driven hide hook for ShareDock/FloatingReactionDock, both deleted).
- **Conflict-risk:** No overlap with `.swarm/main-changed-files.md`.
- **Safe to delete:** YES. Self-contained, no side effects, no public API surface.

### 2. `src/components/social/ReactionBar.tsx` (entire file, 139 lines) — HIGH VALUE

- **File:** `/home/user/VGC-Team-Report/src/components/social/ReactionBar.tsx:29`
- **Export:** `export function ReactionBar({ shareId, compact = false, isOwner = false }: ReactionBarProps)`
- **Verification:**
  ```
  $ rg "ReactionBar" --type-add 'ts:*.{ts,tsx}' -tts
  src/app/changelog/ChangelogContent.tsx:  …text describes old WCAG fix history…
  src/app/changelog/ChangelogContent.tsx:  …text describes old aria-label fix…
  src/components/social/ReactionBar.tsx:interface ReactionBarProps {
  src/components/social/ReactionBar.tsx:export function ReactionBar(...) {
  ```
  All non-self matches are **prose strings inside `ChangelogContent.tsx`**, not imports.
  No `import { ReactionBar }` anywhere, no `import("...ReactionBar")` dynamic import.
- **History:** Reactions are now handled by `DoubleTapLikeOverlay` (commit 3ace051) +
  `/api/reactions/[shareId]`. ReactionBar appears to be the prior pill-style component
  that was replaced.
- **Conflict-risk:** No overlap with `.swarm/main-changed-files.md`.
- **Safe to delete:** YES. Component is fully orphaned; depends on `useSessionId`,
  `usePostHog`, and Clerk — but those remain alive (used elsewhere), so removing
  ReactionBar has no transitive effect.

### 3. `src/components/ui/PdfExport.tsx` → `PdfExportButton` export (47 lines, lines 208–254)

- **File:** `/home/user/VGC-Team-Report/src/components/ui/PdfExport.tsx:208`
- **Export:** `export function PdfExportButton(props: PdfExportProps)`
- **Verification:**
  ```
  $ rg "PdfExportButton" --type-add 'ts:*.{ts,tsx}' -tts
  src/components/ui/PdfExport.tsx:/*  PdfExportButton – the trigger button … */
  src/components/ui/PdfExport.tsx:export function PdfExportButton(props: PdfExportProps) {
  ```
  Only self-references. The file's `PrintableReport` and `ExportMode` are still
  used by `src/app/page.tsx` (via dynamic import), so the **file stays**, but
  `PdfExportButton` (and its inline comment block at L204–207) can be removed.
- **Conflict-risk:** No overlap with `.swarm/main-changed-files.md`.
- **Safe to delete:** YES. The button has been superseded by direct `window.print()`
  triggering elsewhere; `PrintableReport` is rendered straight into the print container
  by callers, no button needed.

---

## Cleanup candidates — safe but lower value

### 4. `src/lib/utils/export-paste.ts` → `pokemonToOpenSheet` (lines 86–124)

- **File:** `/home/user/VGC-Team-Report/src/lib/utils/export-paste.ts:86`
- Only called by `teamToOpenSheet` in the same file (line 127). Should be made
  non-`export` (private to the module) or inlined. Carried over from the
  2026-05-20 audit — still present.
- **Verification:**
  ```
  $ rg "pokemonToOpenSheet" --type-add 'ts:*.{ts,tsx}' -tts
  src/lib/utils/export-paste.ts:export function pokemonToOpenSheet(mon: ParsedPokemon): string {
  src/lib/utils/export-paste.ts:  return pokemon.map(pokemonToOpenSheet).join("\n\n");
  ```
- **Safe action:** Remove `export` keyword (38 lines stay, just stop exposing it).

### 5. `src/lib/utils/paste-edit.ts` → `replaceSpeciesInBlock` (lines 59–71)

- Only called by `replacePokemonSpecies` in same file. Same recommendation:
  remove the `export`. Carried over from prior audit.

### 6. `src/lib/analysis/detect-regulation.ts` → `detectRegulationWithSignals` (lines 71–148)

- Only called by `detectRegulation` (line 216) inside the same module.
- Carried over from prior audit. Remove `export`.

### 7. `src/lib/security/cors.ts` → `isDynamicAllowedOrigin` (line 18)

- Only called inside its own file (line 27). Internal helper — drop `export`.

### 8. `src/lib/security/csrf.ts` → `generateCsrfToken` (line 17)

- Only called inside its own file by `setCsrfCookie` (line 49). Internal — drop `export`.

---

## What was already cleaned up (verified — do not re-flag)

- `parsePikalyticsUrl`, `evsToSp`, `spToEv` — removed (confirmed via changelog and
  `rg` returning only changelog mentions).
- `ShareDock.tsx`, `FloatingReactionDock.tsx`, `NewsletterSignup.tsx`,
  `useTouchIdleHide.ts` — files are gone.

---

## Conflict-risk overlap with `.swarm/main-changed-files.md`

Cross-referenced every finding against the changed-on-main list:

| Finding | File | Conflict-risk? |
|---|---|---|
| 1. useScrollHide.ts | `src/hooks/useScrollHide.ts` | NO — not on list |
| 2. ReactionBar.tsx | `src/components/social/ReactionBar.tsx` | NO — not on list |
| 3. PdfExportButton | `src/components/ui/PdfExport.tsx` | NO — not on list |
| 4. pokemonToOpenSheet | `src/lib/utils/export-paste.ts` | NO — not on list |
| 5. replaceSpeciesInBlock | `src/lib/utils/paste-edit.ts` | NO — not on list |
| 6. detectRegulationWithSignals | `src/lib/analysis/detect-regulation.ts` | NO — not on list |
| 7. isDynamicAllowedOrigin | `src/lib/security/cors.ts` | NO — not on list |
| 8. generateCsrfToken | `src/lib/security/csrf.ts` | NO — not on list |

**One adjacent risk:** `src/components/seo/JsonLd.tsx` IS on the changed-files list,
but its exports (`HowToSchema`, `SportsEventJsonLd`, etc.) are all in use
(`src/app/page.tsx`, `src/app/tournaments/...`). **Nothing to flag in JsonLd.tsx.**

---

## Methodology notes

- Searched all 288 `.ts`/`.tsx` files in `src/` with ripgrep.
- For each candidate, ran a second pass for dynamic imports
  (`import\(['\"][^'\"]*<name>`) and string-literal lookups.
- Distinguished "exported but unused externally" (still callable, valid type-only
  imports possible) from "exported and only self-referenced internally"
  (privatisable).
- Excluded test files from caller counts (`__tests__`, `*.test.*`) — a hook used
  only by its own test is still dead.

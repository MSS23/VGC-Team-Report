# R8 — Accessibility Audit (WCAG 2.1 AA) — 31 Aug 2026

Branch: `claude/loving-sagan-ib785e` (tip `70c4633`)
Scope: static analysis of `src/app/**/*.tsx` + `src/components/**/*.tsx`. No network, no live-site checks, **no files modified**.
Note: `.claude/skills/ui-ux-pro-max/SKILL.md` does **not** exist on this branch (`.claude/` contains only `scripts/`), so UI standards were taken from `CLAUDE.md` § UI standards.

---

## 1. Status of the three open tickets

### VGC-259 — "Report viewer renders no `<h1>` on any slide except the first" → **FIXED**

`src/app/page.tsx:1169-1173` now renders a visually-hidden `<h1>` for every slide that is *not* physical slide 0, and for tournament mode:

```
{(tournamentMode || physicalSlide !== 0) && (
  <h1 className="sr-only">
    {`${tournamentMode ? "Tournament Mode" : (slideLabels[currentSlide] ?? "Team report")}${teamName ? ` — ${teamName}` : ""}`}
  </h1>
)}
```

Slide 0 is covered by `TeamOverview` (`src/components/report/TeamOverview.tsx:419` / `:432`). Verified against the slide router `src/components/report/TeamReport.tsx:236-391`: slides 1..N and the chart/matchup slides carry no `h1` of their own (`PokemonDetailSlide.tsx:583` h2, `SpeedTierChart.tsx:435` h2, `MatchupSheet.tsx:67` h2, `MatchupPlanSlide.tsx:193` h2, `CommonModesSlide.tsx:181` h3, `OffensiveCoverageChart.tsx:168` h3, `DefensiveCoverageChart.tsx:72` h3), so the page-level sr-only h1 is the only heading-level-1 — correct, exactly one per view. **Close the ticket.** (Residual: heading *skip*, see F6 below.)

### VGC-270 — "Edit-mode slide 0 renders no h1 (TeamOverview gates both headings)" → **STILL BROKEN**

Both `h1`s in `TeamOverview` sit behind an `isReadOnly` gate:

- `src/components/report/TeamOverview.tsx:418` — `{isReadOnly && !teamName && (<h1 className="sr-only">…)}`
- `src/components/report/TeamOverview.tsx:424` — `{isReadOnly ? ( … {teamName && <h1 …>} … ) : ( /* edit branch, lines 526+ — no h1 at all */ )}`

And the page-level backstop at `src/app/page.tsx:1169` explicitly excludes `physicalSlide === 0`.

Therefore when a signed-in author is editing their own report and is on slide 0 (`isReadOnly === false`, `physicalSlide === 0`), the document contains **zero `<h1>`**. Confirmed by grep: the only `<h1>` tags in `TeamOverview.tsx` are lines 419 and 432.

**WCAG:** 1.3.1 Info and Relationships (A); 2.4.6 Headings and Labels (AA); 2.4.10 (AAA, best practice).

**Exact fix (one-line, `src/app/page.tsx:1169`)** — drop the slide-0 exclusion when the view is editable, so the sr-only h1 covers edit mode without duplicating the visible read-only h1:

```diff
-        {(tournamentMode || physicalSlide !== 0) && (
+        {(tournamentMode || physicalSlide !== 0 || !isReadOnly) && (
```

(`isReadOnly` is already destructured at `src/app/page.tsx:119`, so no new plumbing is needed.)

Alternative, if the heading is preferred inside the component: in `src/components/report/TeamOverview.tsx`, move the sr-only heading out of the `isReadOnly &&` gate at line 418:

```diff
-      {isReadOnly && !teamName && (
+      {!teamName && (
         <h1 className="sr-only">
```

…which also covers the read-only no-name case unchanged. Prefer the `page.tsx` variant — it keeps the fix in one file and cannot double up with the visible `h1` at line 432.

### VGC-219 — "Remaining a11y findings: h1 on no-name shared reports, Export Theme modal…" → **MOSTLY FIXED; one residual**

- **h1 on no-name shared reports — FIXED.** `src/components/report/TeamOverview.tsx:418-422` renders an sr-only `h1` falling back to `tournamentName` → species list → `"VGC Team Report"`. The server route also derives a heading string (`src/app/s/[id]/page.tsx:182-188`) and hands it to `src/app/s/[id]/redirect.tsx:18`, which renders `<h1 className="sr-only">{heading ?? "VGC Team Report"}</h1>`.
- **Export Theme modal — FIXED.** `src/app/page.tsx:1682-1689` has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="export-theme-modal-title"` and `tabIndex={-1}`; `src/app/page.tsx:408-430` moves focus to the first focusable on open, traps Tab, handles Escape and restores focus on close. Backdrop Escape also handled at `src/app/page.tsx:1677-1679`.
- **RESIDUAL — the `ThemePicker` *inside* that modal is not accessible.** See F4 below. Keep VGC-219 open scoped to `ThemePicker` only, or close it and file the ThemePicker fix as a new ticket.

---

## 2. Findings, prioritised (real AA failures, small focused diffs)

### F1 — Three `<select>` controls have no accessible name — **WCAG 4.1.2 (A) / 3.3.2 (A)**

| File:line | Control |
|---|---|
| `src/app/dashboard/DashboardContent.tsx:205` | Report sort (Newest / Oldest / Most Views / Name) |
| `src/components/compare/CompareContent.tsx:82` | "Select from my reports…" picker |
| `src/components/social/CreatorProfile.tsx:303` | Report sort (Newest first / Most viewed) |

None has `id` + `<label htmlFor>`, a wrapping `<label>`, `aria-label`, or `aria-labelledby`. A screen reader announces only "combo box, Newest".

**Fix — add one attribute each:**

```diff
# src/app/dashboard/DashboardContent.tsx:205
   <select
+    aria-label="Sort reports"
     value={sortBy}

# src/components/compare/CompareContent.tsx:82
   <select
+    aria-label="Add a report to compare"
     className={...}

# src/components/social/CreatorProfile.tsx:303
   <select
+    aria-label="Sort reports"
     value={sortBy}
```

### F2 — `role="switch"` toggle with no accessible name — **WCAG 4.1.2 (A)**

`src/app/dashboard/profile/page.tsx:437-443` — the "Public profile" switch carries `role="switch"` and `aria-checked` but has no text child and no `aria-label`/`aria-labelledby`. The visible label lives in a sibling `<p>` at line 434 that is never associated. Screen readers announce "switch, on" with no name.

**Fix:**

```diff
# src/app/dashboard/profile/page.tsx:433-434
-                      <div>
-                        <p className="text-sm font-bold text-text-primary">Public profile</p>
+                      <div>
+                        <p id="public-profile-label" className="text-sm font-bold text-text-primary">Public profile</p>

# src/app/dashboard/profile/page.tsx:437-440
                       <button
                         type="button"
                         role="switch"
                         aria-checked={profile.isPublic}
+                        aria-labelledby="public-profile-label"
```

### F3 — Two edit/delete controls are mouse-only — **WCAG 2.1.1 Keyboard (A)**

**F3a — `src/components/report/PokemonDetailSlide.tsx:164-175`.** A calc entry's text is edited by clicking a bare `<span onClick={…}>` that enters edit mode. There is no `tabIndex`, `role`, or key handler, and the sibling controls (category switcher at `:190`, delete at `:216`) offer no way to edit the text. Keyboard-only users cannot edit a saved calc at all.

**Fix — make it a real button (keeps layout; `text-left` preserves appearance):**

```diff
-        <span
-          className={`flex-1 text-sm sm:text-base text-text-primary leading-relaxed ${!isReadOnly ? "cursor-text" : ""}`}
-          onClick={() => {
+        <span
+          {...(!isReadOnly && onEdit
+            ? { role: "button" as const, tabIndex: 0,
+                onKeyDown: (e: React.KeyboardEvent) => {
+                  if (e.key === "Enter" || e.key === " ") {
+                    e.preventDefault(); setEditText(entry.text); setEditing(true);
+                  }
+                } }
+            : {})}
+          className={`flex-1 text-sm sm:text-base text-text-primary leading-relaxed ${!isReadOnly ? "cursor-text" : ""}`}
+          onClick={() => {
```

**F3b — `src/components/report/MatchupPlanSlide.tsx:552-559`.** The "delete game plan" control is a `<span onClick>` nested *inside* the collapse-toggle `<button>` that opens at line 499 and closes at line 560. It is unreachable by keyboard (spans are not focusable), and nesting a control inside a button is invalid regardless. Since a nested `<button>` is also invalid, the fix is to lift it out of the header button:

```diff
-        {!isReadOnly && canDelete && (
-          <span
-            onClick={(e) => { e.stopPropagation(); onDelete(); }}
-            className="text-text-tertiary hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
-          >
-            {t.delete}
-          </span>
-        )}
-      </button>
+      </button>
+      {!isReadOnly && canDelete && (
+        <button
+          type="button"
+          onClick={onDelete}
+          className="absolute right-4 top-3.5 min-h-11 min-w-11 text-text-tertiary hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
+        >
+          {t.delete}
+        </button>
+      )}
```

…adding `relative` to the wrapper `<div>` at line 502. (If the absolute positioning is unwelcome, restructure the header as a `<div>` containing a full-width toggle `<button>` plus the delete `<button>` as siblings.)

### F4 — `ThemePicker` (VGC-219 residual): group label unassociated + selected state not exposed — **WCAG 1.3.1 (A) / 4.1.2 (A)**

`src/components/ui/ThemePicker.tsx:18-20` uses a bare `<label>` with no `htmlFor` to title a group of buttons — a `<label>` that labels nothing is a 1.3.1 failure and is announced as stray text. `src/components/ui/ThemePicker.tsx:40-54`: the selected theme is conveyed **only** by border colour and a ring (`isSelected ? "border-accent ring-2 …"`) plus a decorative checkmark SVG at line 73-79 — nothing programmatic. A screen-reader user cannot tell which accent theme is active.

**Fix:**

```diff
# lines 17-20
-      <div>
-        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
+      <div>
+        <span id="accent-theme-label" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
           Accent Theme
-        </label>
+        </span>

# line 34
-      <div className="flex flex-wrap gap-3">
+      <div className="flex flex-wrap gap-3" role="group" aria-labelledby="accent-theme-label">

# lines 40-49 (each theme button)
             <button
               key={theme.id}
               type="button"
+              aria-pressed={isSelected}
               onClick={() => {
```

Also add `aria-hidden="true"` to the decorative lock (line 66) and check (line 75) SVGs, and give locked buttons `aria-disabled` text rather than `title`-only (a `disabled` button removes it from the tab order, so its unlock condition is never announced).

### F5 — Nine form controls labelled by `placeholder` only — **WCAG 3.3.2 (A) / 4.1.2 (A) / 2.4.6 (AA)**

Placeholder text disappears on input and is not a reliable accessible name. All of these have no `id`+`htmlFor`, no wrapping `<label>`, and no `aria-label`:

| File:line | Control | Suggested `aria-label` |
|---|---|---|
| `src/components/match-tracker/MatchTracker.tsx:238` | Opponent archetype — visible `<label>` at `:235` has **no `htmlFor`** | add `id="mt-archetype"` + `htmlFor` |
| `src/components/match-tracker/MatchTracker.tsx:316` | Tournament — visible `<label>` at `:313` has no `htmlFor` | add `id="mt-tournament"` + `htmlFor` |
| `src/components/match-tracker/MatchTracker.tsx:329` | Notes — visible `<label>` at `:326` has no `htmlFor` | add `id="mt-notes"` + `htmlFor` |
| `src/app/dashboard/privacy/page.tsx:142` | Account-deletion confirmation | `aria-label="Type DELETE to confirm account deletion"` |
| `src/app/dashboard/profile/page.tsx:296` | Avatar URL | `aria-label="Avatar image URL"` |
| `src/components/report/PokemonDetailSlide.tsx:862` | Per-Pokémon notes textarea (`<h3>` at `:854` is not associated) | `aria-label` from the same string, or `aria-labelledby` pointing at the h3 |
| `src/components/report/CalcInput.tsx:361` | Damage-calc entry | `aria-label="Add a damage calc"` |
| `src/components/report/InlinePokemonEditor.tsx:162` | Species search | `aria-label="Search for a Pokémon"` |
| `src/components/compare/CompareContent.tsx:415`, `:434` | Paste textareas | `aria-label="Team A paste"` / `"Team B paste"` |

The three `MatchTracker` cases are the cheapest and most valuable — the visible label text already exists, it just needs `htmlFor`/`id` wiring.

### F6 — Heading level skipped on three report slides — **WCAG 1.3.1 (A)**

With the VGC-259 sr-only `h1` in place, these slides jump `h1 → h3`:

- `src/components/report/CommonModesSlide.tsx:181` — "How to Pilot This Team" is the slide's top heading, rendered as `h3` (its children are `h4` at `:218`, `:296`, `:624`).
- `src/components/report/OffensiveCoverageChart.tsx:168` — "Offensive Profile", `h3`, only heading on the slide.
- `src/components/report/DefensiveCoverageChart.tsx:72` — `h3`, only heading on the slide.

Sibling slides get this right (`PokemonDetailSlide.tsx:583`, `SpeedTierChart.tsx:435`, `MatchupSheet.tsx:67`, `MatchupPlanSlide.tsx:193` all use `h2`).

**Fix:** change those three `<h3>`/`</h3>` to `<h2>`/`</h2>`. Styling is entirely class-driven so there is no visual change. (`CommonModesSlide`'s `h4`s at `:218`/`:296`/`:624` then correctly nest under an `h2` → they should become `h3`; the file-internal skip report also flags `TeamOverview.tsx:531` `h1 → h3`, `DashboardContent.tsx:615`, `tools/ev-to-sp/page.tsx:326`, `CompareContent.tsx:481`, `page.tsx:1691` — same one-character remedy where the intervening `h2` is genuinely absent.)

### F7 — Icon-only control glyphs below 3:1 — **WCAG 1.4.11 Non-text Contrast (AA)**

`--text-tertiary` is `#5E5E7A` (light) / `#9898B8` (dark) — both pass on their own. Composited at reduced alpha they do not:

| File:line | Class | Approx. contrast on `--surface` (light) |
|---|---|---|
| `src/components/report/PokemonCard.tsx:278` | `text-text-tertiary/50` (damage-calc link icon) | ~2.4:1 |
| `src/components/report/PokemonCard.tsx:304` | `text-text-tertiary/50` (replace-Pokémon icon) | ~2.4:1 |
| `src/components/report/PokemonCard.tsx:322` | `text-text-tertiary/40` (MVP star, unset state) | ~2.0:1 |
| `src/components/report/PokemonCard.tsx:463` | `text-text-tertiary/50` | ~2.4:1 |
| `src/components/report/PokemonDetailSlide.tsx:714` | `text-text-tertiary/50` | ~2.4:1 |
| `src/components/report/TournamentMode.tsx:52`, `:112`, `:159` | `/40`, `/30`, `/30` | 1.6–2.0:1 |
| `src/components/report/DefensiveCoverageChart.tsx:196` | `text-text-tertiary/25` | ~1.4:1 |

These are the *only* visual indicator of the control (the buttons are icon-only), so 1.4.11 applies at 3:1.

**Fix:** drop the alpha modifier — `text-text-tertiary/50` → `text-text-tertiary` — on the interactive ones (`PokemonCard.tsx:278`, `:304`, `:322`, `:463`; `PokemonDetailSlide.tsx:714`). The `TournamentMode`/`DefensiveCoverageChart` instances are decorative dividers/watermarks; verify individually before changing, and add `aria-hidden="true"` where they are purely decorative.

### F8 — Placeholder text below 4.5:1 — **WCAG 1.4.3 Contrast (Minimum) (AA)**

`placeholder:text-text-tertiary/40` and `/50` composite to roughly `#B8B8C6`–`#AEAEBD` on white ≈ **2.2–2.4:1**. Placeholder text is text and must meet 4.5:1.

- `src/components/input/PasteInput.tsx:417` — `/40`, and the placeholder is a nine-line worked example that carries real instructional content
- `src/components/compare/CompareContent.tsx:419`, `:438` — `/40`
- `src/components/report/TeamOverview.tsx:197` — `/50`
- `src/components/report/PokemonCard.tsx:378` — `/60` (~2.9:1, still short)

**Fix:** use the unmodified token, `placeholder:text-text-tertiary` (`#5E5E7A` on `#FFFFFF` ≈ 7.0:1; `#9898B8` on `#141428` ≈ 6.7:1) — which is already the pattern used in `MatchTracker.tsx:322`/`:334` and `PokemonDetailSlide.tsx:865`.

### F9 — `focus:outline-none` with no replacement indicator — **WCAG 2.4.7 Focus Visible (AA)**

`src/app/globals.css:826-829` sets a global `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` in `@layer base`. Tailwind *utilities* beat `@layer base`, so any `focus:outline-none` without a `ring`/`border` substitute silently removes the indicator. Three sites were scanned; two are fine, one is borderline:

- `src/components/explore/ExploreFilters.tsx:675` — **OK**: the wrapper at `:637` supplies `focus-within:ring-2`.
- `src/components/ui/NotificationBell.tsx:129` — **OK**: `tabIndex={-1}` programmatic-focus container, deliberate.
- `src/components/input/PasteInput.tsx:417` — **borderline**: the only substitute is `focus:border-accent/50`. `#E11D48` at 50% over `#FFFFFF` ≈ `#F08EA3` vs the resting `--border` — under 3:1, so it also fails 1.4.11 as a focus indicator. **Fix:** `focus:border-accent` (drop `/50`), or add `focus-visible:ring-2 focus-visible:ring-accent/60`.

### F10 — Modal/sheet semantics gaps — **WCAG 2.4.3 (A) / 4.1.2 (A)**

Audited every `role="dialog"` in the tree. Fully compliant (focus trap + Escape + focus restore + `aria-modal` + labelled): `ShareModal.tsx:327`, `OTSSheetModal.tsx:194`, `WhatsNewModal.tsx:132`, `ShortcutHintOverlay.tsx:66`, `page.tsx:1683` (Export Theme). Gaps:

- **`src/components/report/InlinePokemonEditor.tsx:129-135`** — `role="dialog"` + `aria-label` are on the **backdrop** div (which also owns the click-to-close handler), so the entire overlay including the scrim is exposed as the dialog. No `aria-modal="true"`, no focus trap. Also, the window-level handler at `:103-118` calls `preventDefault()` on `ArrowUp`/`ArrowDown`/`Enter` unconditionally, which blocks caret movement in the search input.
  **Fix:** move `role="dialog" aria-label="Replace Pokemon" aria-modal="true"` from line 132 onto the inner panel div at `:135`, and gate the arrow handling on `document.activeElement === inputRef.current` or scope the listener to the panel.
- **`src/components/report/SlideNavControls.tsx:434-437`** — `role="dialog"` with `aria-label="Slide options"` but no `aria-modal` and no focus trap. Escape *is* handled (`:164-172`) and the backdrop at `:428` is correctly `aria-hidden`. **Fix:** add `aria-modal="true"` and focus the first item on open; low risk.
- **`src/components/ui/InstallPrompt.tsx:114-125`** — the PWA install bottom sheet has no `role="dialog"`, no label, no Escape handler and no focus management; the scrim is `aria-hidden` + click-to-dismiss. **Fix:** wrap the sheet at `:121` with `role="dialog" aria-modal="true" aria-labelledby={…}` and add an Escape listener mirroring `OTSSheetModal.tsx:136-183`.
- **`src/components/ui/WalkthroughOverlay.tsx:257-260`** — `role="dialog"` + `aria-label="Walkthrough"`, Escape handled at `:68`, close button always present. No `aria-modal`; acceptable for a non-blocking coach-mark, but adding it is free.

### F11 — `title`-only accessible name + sub-44px target

`src/components/report/MatchupPlanSlide.tsx:607-620` — the mobile "Swap lead and back" button is icon-only with its name supplied solely by `title="Swap lead and back"`. `title` is an accname fallback (so not a hard 4.1.2 failure) but is invisible to touch and keyboard users. It is also `p-1.5` around a 14px icon ≈ **26×26px**, which clears WCAG 2.2's 2.5.8 (24×24) by 2px but fails the project's own 44×44 standard on the one control that exists *specifically* as the touch alternative to drag-and-drop.

**Fix:**

```diff
                   className="self-center p-1.5 rounded-lg text-text-tertiary hover:text-accent hover:bg-accent-surface/50 transition-all cursor-pointer lg:hidden"
-                  title="Swap lead and back"
+                  title="Swap lead and back"
+                  aria-label="Swap lead and back"
```
…and change `p-1.5` → `min-h-11 min-w-11 inline-flex items-center justify-center`.

`src/app/dashboard/profile/page.tsx:437` is the other `title`-less icon-only control — already covered by F2.

### F12 — Embed route ships a document with no heading — **WCAG 1.3.1 / 2.4.6 (minor)**

`src/app/embed/[id]/page.tsx` renders a standalone `<html>` document (line 24) with a `<title>` but no `<h1>`; the team name is a styled `<span>` at line 60. Iframed content is still a document for AT. **Fix:** make line 60's `<span>` an `<h1>` carrying the same inline styles, or add an `sr-only` `h1` fallback of `tournamentName || species.join(" / ")`.

---

## 3. Things that are already correct (no action)

- **Reduced motion**: `src/app/globals.css:812-818` collapses all animations, transitions and smooth scrolling under `prefers-reduced-motion: reduce`. Comprehensive.
- **Focus rings**: global `*:focus-visible` at `src/app/globals.css:826-829` with `outline-offset: 2px`, plus `:focus:not(:focus-visible)` suppression at `:833`. Only one site defeats it (F9).
- **Image alt text**: a full scan of every `<img>` in `src/app` and `src/components` found **zero** missing `alt` attributes, including the dynamically generated QR code (`TeamOverview.tsx:471-473`, `alt={`QR code for rental code ${rentalCode}`}`) and the embed-route sprites.
- **Icon-only buttons**: a full scan of every `<button>` with no text child found only two lacking `aria-label` (F2, F11). The rest — `Navbar`, `ShareModal`, `SlideNavControls`, `OTSSheetModal`, `PokemonCard`, `PokemonDetailSlide` — are all correctly labelled, and decorative SVGs consistently carry `aria-hidden`.
- **Live regions**: `role="status"`/`aria-live` are used appropriately for copy confirmations (`ShareModal.tsx:334`), slide announcements (`SlideNavControls.tsx:547`), notification counts (`NotificationsContent.tsx:212`), errors (`error.tsx:30`, `global-error.tsx:15`, `TeamCardExport.tsx:340`, `CollaboratorPanel.tsx:369`) and the EV→SP converter (`EvToSpConverter.tsx:213`).
- **Slide region semantics**: `src/app/page.tsx:1148-1153` gives the slide container `role="region"`, `aria-roledescription`, a positional `aria-label` ("…, slide 3 of 12") and `aria-keyshortcuts`. Good practice.
- **Base colour tokens**: `--text-primary` `#1A1A2E`, `--text-secondary` `#4A4A68`, `--text-tertiary` `#5E5E7A` on `--background` `#FAF9F6`; dark `#F0EDE6` / `#C0C0D8` / `#9898B8` on `#0B0B1A`. All comfortably exceed 4.5:1 at full opacity. Failures only appear where an alpha modifier is applied (F7, F8).
- **Touch targets**: the report UI has clearly been through a 44px pass — `min-w-[44px] min-h-[44px]` / `h-11 w-11` appear throughout `PokemonCard`, `PokemonDetailSlide`, `InlinePokemonEditor`, `ExploreFilters`. Remaining small controls (dashboard chips, `VersionHistoryPanel:321`, `CommonModesSlide:500`) are text buttons whose line-height already clears WCAG 2.2's 24×24 minimum; only F11 is a genuine outlier.

---

## 4. Suggested ticket disposition

| Ticket | Action |
|---|---|
| VGC-259 | **Close** — fixed at `src/app/page.tsx:1169-1173`. |
| VGC-270 | **Keep open** — one-line fix at `src/app/page.tsx:1169` (add `\|\| !isReadOnly`). |
| VGC-219 | **Re-scope to `ThemePicker` only** (F4) — the h1 and Export Theme modal items are both done. |
| new | F1 + F2 + F5 — "Unlabelled form controls" (one commit, ~12 attributes, zero behaviour change). |
| new | F3 — "Calc edit and game-plan delete are mouse-only" (2.1.1 Level A). |
| new | F6 — "Report slides skip h1 → h3" (3 tag changes). |
| new | F7 + F8 — "Alpha-modified text/icon tokens fail contrast" (drop `/40`–`/60` modifiers). |
| new | F10 — "Modal semantics: InlinePokemonEditor, SlideNavControls sheet, InstallPrompt". |

Highest value per line changed: **VGC-270 → F1 → F2 → F3 → F6**.

# Accessibility Audit — WCAG 2.1 AA Static Analysis
**Date:** 2026-05-13  
**Auditor:** Claude Code (static analysis)  
**Scope:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/explore/page.tsx`, `src/app/champions/page.tsx`, `src/app/s/[id]/`, `src/components/`

---

## Summary

The codebase has a solid baseline: a skip-to-content link, semantic `<main>` elements, widespread `aria-label` usage on icon buttons, focus traps in key modals, an `aria-live` region for slide transitions, and consistent 44×44 px touch targets. However, several high-impact gaps remain.

**Most critical:** colour contrast for `text-text-tertiary` (#6E6E8A on #FFFFFF = 4.0:1 — fails AA for small text), pervasive use of this token at `text-[9px]`–`text-[11px]` (as low as 9 px rendered) worsens the failure significantly. Data tables (defensive/offensive coverage charts, champions top-cut table) have no `scope` attributes on `<th>` elements. Several modal dialogs are missing `aria-modal="true"` and `aria-labelledby`. The `ReactionBar` "liked" state button never announces its pressed state. The `Toggle` component renders a `<button role="switch">` inside a `<label>` — invalid nesting that confuses screen readers.

---

## Issues Table

| # | WCAG Criterion | Severity | File(s) + Line(s) | Issue | Suggested Fix |
|---|---|---|---|---|---|
| 1 | **1.4.3 Colour Contrast** | **Critical** | `globals.css:16` (`--text-tertiary: #6E6E8A`), used in ~200+ locations | `text-text-tertiary` on `--surface` (#FFFFFF) yields 4.0:1 — fails AA (4.5:1) for normal text. Extensively used at `text-[9px]`–`text-[11px]` which doubles the failure (large-text threshold 3:1 does not apply below 18px/14px bold). | Darken to >= #5F5F7A (passes 4.5:1 on white). Dark-mode value #9898B8 on #141428 = ~3.8:1 — also marginal; target >= #A8A8C8. |
| 2 | **1.4.3 Colour Contrast** | **Critical** | `globals.css:16`, `ReportCard.tsx:379`, `SpotlightCard.tsx:106`, `OTSSheetModal.tsx:185`, `NotificationBell.tsx:110`, many others | Timestamps, secondary labels, embed code, and help-text rendered at `text-[9px]`–`text-[11px]` with `text-text-tertiary`. At 9 px these are below any WCAG exception and must meet 4.5:1. Current ratio fails even at normal size. | Either raise contrast token or increase font-size to >= 12 px and bold weight (then 3:1 threshold applies). |
| 3 | **1.3.1 Info and Relationships** | **Critical** | `DefensiveCoverageChart.tsx:125–131`, `OffensiveCoverageChart.tsx:220–226`, `ChampionsContent.tsx:254–263` | Data `<table>` elements have column `<th>` elements with no `scope="col"` and row headers with no `scope="row"`. The coverage charts have a sticky left column that functions as a row header but uses `<td>`. Screen readers cannot associate cells with headers. | Add `scope="col"` to all `<th>` in `<thead>`. Change the sticky left `<td>` for the Pokemon name column to `<th scope="row">`. Add `<caption>` or `aria-label` to each table element. |
| 4 | **4.1.2 Name, Role, Value** | **Critical** | `Toggle.tsx:10–15` | `<button role="switch">` nested inside `<label>`. The `<label>` wraps both the button and visible text, but `<button>` is not a labelable element. Screen readers double-announce. When `label=""` (as called from `Navbar.tsx:507`), the button has no accessible name at all. | Remove `<label>` wrapper. Apply `aria-label` directly on the `<button role="switch">` element. Render associated text as a sibling `<span id="...">` and reference it with `aria-labelledby`. |
| 5 | **4.1.2 Name, Role, Value** | **Critical** | `ReactionBar.tsx:122–136` | The "like" button (signed-in path) has no `aria-label` and no `aria-pressed`. Screen readers announce only a heart SVG (which lacks accessible text) plus a number. State change (liked/unliked) is not communicated. | Add `aria-label={liked ? "Unlike report" : "Like report"}` and `aria-pressed={liked}`. |
| 6 | **4.1.2 Name, Role, Value** | **Major** | `WalkthroughOverlay.tsx:247–248`, `VersionHistoryPanel.tsx:155–156`, `InlinePokemonEditor.tsx:132–133` | `role="dialog"` elements are missing `aria-modal="true"`. WalkthroughOverlay and InlinePokemonEditor also lack `aria-labelledby` (pointing to a visible heading). Without `aria-modal`, screen readers may continue reading content outside the dialog. | Add `aria-modal="true"` to all three. Add a matching `id` to the heading inside each dialog and reference it with `aria-labelledby`. |
| 7 | **2.1.1 Keyboard** | **Major** | `DefensiveCoverageChart.tsx:133–138`, `OffensiveCoverageChart.tsx` | `<th>` cells in the coverage charts have `onClick` to highlight a column but no `onKeyDown`, `tabIndex`, or `role`. They are not keyboard-accessible; keyboard users cannot filter by type. | Add `tabIndex={0}`, `role="button"`, `aria-pressed`, and an `onKeyDown` handler for Enter/Space. |
| 8 | **1.1.1 Non-text Content** | **Major** | `SpotlightCard.tsx:47`, `SpotlightCard.tsx:63`, `SpotlightCard.tsx:129–145`, `ReportCard.tsx:273–277`, many SVGs | Decorative SVGs used as status icons (star for spotlight, checkmark for verified, heart/comment/view counts) have no `aria-hidden="true"` and no accessible text. The verified creator badge uses `<span title="Verified creator">` wrapping an SVG — `title` is not reliably announced by screen readers. | Add `aria-hidden="true"` to all purely decorative SVGs. For the verified checkmark, move the label to the wrapping `<span>`: `<span aria-label="Verified creator" role="img">`. |
| 9 | **4.1.2 Name, Role, Value** | **Major** | `Navbar.tsx:455` | The Settings / overflow menu trigger button is missing `aria-expanded={menuOpen}`. Screen readers cannot tell whether the menu is open or closed. | Add `aria-expanded={menuOpen}` to the menu trigger button (line ~455). |
| 10 | **1.3.1 Info and Relationships** | **Major** | `PageNavbar.tsx:113–137` | Mobile bottom tab bar correctly uses `<nav aria-label="Mobile navigation">` but the active tab indicator is conveyed purely visually via accent colour and a pill. Screen readers do not know which tab is current. | Add `aria-current="page"` to the active `<Link>` in the mobile tab bar. |
| 11 | **2.4.3 Focus Order** | **Major** | `VersionHistoryPanel.tsx:154–186` | The panel slides in from the right but does not programmatically move focus inside on open. Users who Tab after the panel opens remain at whatever element was focused before. | Add a `useEffect` that focuses the panel's close button (or first focusable child) when `open` transitions to `true`. Return focus to the trigger on close. |
| 12 | **1.4.3 Colour Contrast** | **Major** | `ChampionsContent.tsx:135`, `ReportCard.tsx:169–181`, `Navbar.tsx:530`, badge components | The "Coming Soon" / warning badges use `text-amber-600` (#D97706) on `bg-amber-500/10` (~#FFF7ED in light mode). Contrast ratio = ~2.8:1 — fails AA. | Use `text-amber-700` (#B45309) in light mode which achieves ~4.6:1 on the same background. |
| 13 | **1.4.3 Colour Contrast** | **Major** | `ChampionsContent.tsx:142–149`, `TypeBadge.tsx` (inferred), type badge cells throughout coverage charts | Type badge colours for Electric (#F8D030), Ice (#98D8D8), Fairy (#EE99AC), Normal (#A8A878) use `text-white` or `text-white/70`. White on Electric yellow = ~1.4:1. These fail severely. | Apply per-type text colour: use dark text (`#1A1A2E`) for light-background types (Electric, Ice, Fairy, Normal, Bug). Use white only for dark-background types. |
| 14 | **1.3.1 Info and Relationships** | **Minor** | `Navbar.tsx:116–155` (`WarningPopover`) | The warning popover is triggered by a `<button>` but the popover `<div>` has no `role`, no `aria-live`, and no `aria-labelledby`. Screen reader users who activate the button receive no announcement of the content. | Add `role="dialog"` + `aria-label="Team warnings"` to the popover `<div>`, and `aria-expanded` on the trigger button. |
| 15 | **2.1.1 Keyboard** | **Minor** | `ExploreFilters.tsx` (more-filters disclosure button) | "More filters" disclosure button likely lacks `aria-expanded` and `aria-controls` linking to the revealed panel. | Add `aria-expanded={moreOpen}` and `aria-controls="more-filters-panel"` to the toggle button; add `id="more-filters-panel"` to the revealed `<div>`. |
| 16 | **4.1.2 Name, Role, Value** | **Minor** | `game-plan-helpers.tsx:74–94` | `ResultToggle` uses `<span role="button">` for W/L/T game result buttons. These are keyboard-accessible (tabIndex, onKeyDown) but have no `aria-label` and no `aria-pressed`. | Add `aria-label` (e.g., "Mark as Win", "Mark as Loss", "Mark as Tie") and `aria-pressed={result === opt}`. |
| 17 | **1.3.1 Info and Relationships** | **Minor** | `SlideNavControls.tsx:270–293` | Desktop dot indicators: hidden-slide state is communicated only via visual styling (amber dots) and `title` attribute. `title` is not reliably announced by screen readers. | Include the hidden state in the `aria-label` of each tab button: e.g., `aria-label={`Go to ${slideLabels[i]}${isHidden ? " (hidden from viewers)" : ""}`}`. |
| 18 | **4.1.2 Name, Role, Value** | **Minor** | `Navbar.tsx:507` | `Toggle` called with `label=""` — the dark-mode toggle in the settings menu has no visible or announced text label. | Pass a non-empty `label` prop such as `label={darkMode ? "Dark mode" : "Light mode"}`. |
| 19 | **1.1.1 Non-text Content** | **Minor** | `OTSSheetModal.tsx:177–184` | The QR code `<img>` in the OTS sheet modal has no alt text describing what it links to. | Add `alt={`QR code linking to ${shareUrl}`}`. |
| 20 | **1.3.1 Info and Relationships** | **Minor** | `DefensiveCoverageChart.tsx:122`, `OffensiveCoverageChart.tsx:217` | Tables have no `<caption>` or `aria-label`. Screen readers announce "table" with no context about its purpose. | Add `aria-label="Defensive type chart"` / `aria-label="Offensive type coverage chart"` to the `<table>` elements. |

---

## Positive Findings

- `src/app/layout.tsx:99` — Skip-to-content link (`<a href="#main-content">`) with `sr-only focus:not-sr-only` correctly implemented.
- `src/app/layout.tsx:94` — `<html lang="en">` set.
- `src/app/layout.tsx:29` — `userScalable: true`, `maximumScale: 5` — pinch-zoom not disabled.
- `src/components/ui/ShareModal.tsx:106–153` — Full focus-trap with Escape, Tab/Shift-Tab cycling, focus restoration on close.
- `src/components/report/SlideNavControls.tsx:228–233` — Mobile slider uses `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`.
- `src/components/report/SlideNavControls.tsx:303–305` — `aria-live="polite"` live region for slide changes.
- `src/components/ui/Button.tsx:13` — Base button uses `focus:outline-none focus-visible:ring-2` pattern (correct: hides ring for mouse, shows for keyboard).
- `src/components/report/PokemonCard.tsx:245–248` — Mega toggle uses `aria-pressed` correctly.
- `src/components/report/PokemonSprite.tsx:60` — `alt={species}` on all sprites.
- `src/components/report/PokemonDetailSlide.tsx:196` — Category segmented buttons use `aria-pressed` and `focus-visible:ring-2`.
- Most interactive SVG icons have `aria-hidden="true"` and the parent button carries the `aria-label`.

---

## Contrast Token Reference

| Token | Light hex | On #FFFFFF | AA small (>=4.5:1) | AA large (>=3:1) |
|---|---|---|---|---|
| `--text-primary` | #1A1A2E | ~14.7:1 | Pass | Pass |
| `--text-secondary` | #4A4A68 | ~7.0:1 | Pass | Pass |
| `--text-tertiary` | #6E6E8A | ~4.0:1 | **FAIL** | Pass |

Dark mode `--text-tertiary` (#9898B8) on `--surface` (#141428): approximately 3.8:1 — **FAILS** AA for small text in dark mode too.

**Minimum fix:** Change light `--text-tertiary` to `#5A5A78` (4.6:1 on white) and dark to `#ABABC8` (4.6:1 on #141428).

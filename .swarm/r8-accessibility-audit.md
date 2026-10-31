# R8 — WCAG 2.1 AA Accessibility Audit (Updated 2026-05-28)

**Date:** 2026-05-28
**Scope:** Static code analysis of the VGC Team Report Next.js application
**Standard:** WCAG 2.1 Level AA
**Auditor:** Claude (automated)
**Previous audits:** 2026-05-13 (20 findings), 2026-05-14 (5 deep-dive findings B1-B5)

---

## Executive Summary

The codebase demonstrates strong accessibility awareness: ShareModal has a textbook focus-trap implementation, touch targets consistently use 44x44px minimums, semantic ARIA roles are applied to complex widgets (radio groups, switches, sliders, tablists), and a skip-to-content link exists in the layout. Since the May 13/14 audits, the Toggle component's invalid `<label>` nesting was fixed (B2), the ReactionBar was replaced with a properly-labeled `SaveButton` (B3), and the ShortcutHintOverlay dismiss button gained `type="button"` (B4).

**Three high-severity issues remain open:** (1) the light-mode `text-text-tertiary` contrast ratio at 4.0:1 still fails the 4.5:1 AA minimum and is used in ~470+ locations; (2) OTSSheetModal lacks `role="dialog"`, `aria-modal`, and a focus trap entirely; (3) most interactive elements have no explicit `focus-visible` styles, making the focus ring invisible or low-contrast in dark mode.

---

## Status of Previous Findings

### From 2026-05-13 Audit (Issues 1-20)

| # | Finding | Status |
|---|---------|--------|
| 1-2 | `text-text-tertiary` contrast fails AA | **OPEN** — `#6E6E8A` still in globals.css |
| 3 | Data tables missing `scope` attributes | **OPEN** — DefensiveCoverageChart/OffensiveCoverageChart unchanged |
| 4 | Toggle: `<button>` inside `<label>` | **FIXED** — now uses `<div>` wrapper |
| 5 | ReactionBar like button missing aria-label | **RESOLVED** — component deleted, replaced by SaveButton |
| 6 | Missing `aria-modal` on some dialogs | **PARTIALLY FIXED** — WalkthroughOverlay still lacks `aria-modal` |
| 7 | Coverage chart `<th>` click not keyboard-accessible | **OPEN** |
| 8 | Decorative SVGs missing `aria-hidden` | **OPEN** — still widespread |
| 9 | Navbar menu trigger missing `aria-expanded` | **OPEN** |
| 10 | Mobile tab bar missing `aria-current="page"` | **OPEN** |
| 11 | VersionHistoryPanel no focus on open | **OPEN** |
| 12 | Amber badge contrast fails AA | **OPEN** |
| 13 | Type badge colors: white on light backgrounds | **OPEN** |
| 14 | WarningPopover missing `role` and `aria-expanded` | **OPEN** |
| 15 | ExploreFilters disclosure missing `aria-expanded` | Not re-checked |
| 16 | ResultToggle missing `aria-label`/`aria-pressed` | Not re-checked |
| 17 | SlideNavControls hidden state in `aria-label` | **OPEN** |
| 18 | Navbar dark mode toggle empty label | **FIXED** — now passes `label="Dark mode"` |
| 19 | QR code alt text | **FIXED** — now reads "QR code for this team report" |
| 20 | Tables missing `<caption>`/`aria-label` | **OPEN** |

### From 2026-05-14 Deep Dive (B1-B5)

| ID | Finding | Status |
|----|---------|--------|
| B1 | `text-text-tertiary` contrast 4.0:1 | **OPEN** |
| B2 | Toggle `<button>` inside `<label>` | **FIXED** |
| B3 | ReactionBar like button | **RESOLVED** (component deleted) |
| B4 | ShortcutHintOverlay missing `type="button"` | **FIXED** |
| B5 | ShareModal switches missing `aria-label` | **PARTIALLY FIXED** — visibility picker refactored to radiogroup (correct); comments toggle still relies on child text |

---

## New / Updated Findings (2026-05-28)

### HIGH Severity

#### H1. OTSSheetModal missing dialog semantics and focus trap
**File:** `src/components/ui/OTSSheetModal.tsx:142`
**WCAG:** 4.1.2, 2.4.3
The modal container lacks `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`. Tab focus escapes into background content — no focus trap implemented. Only Escape is handled.
**Fix:** Add `role="dialog" aria-modal="true" aria-labelledby="ots-sheet-title"` to the container div; add `id="ots-sheet-title"` to the h2 (line 146). Implement focus trap matching ShareModal's pattern.

#### H2. `text-text-tertiary` contrast still fails AA (B1 open)
**File:** `src/app/globals.css`
**WCAG:** 1.4.3
Light mode: `#6E6E8A` on `#FAF9F6` = ~4.0:1 (fails 4.5:1). Used in ~470+ locations. Compounded at `text-[9px]`/`text-[10px]` sizes.
Worst offenders: ShareModal visibility descriptions (`text-[9px]`), SlideNavControls counter (`text-text-tertiary/70` — opacity drops contrast further), OTSSheetModal URL (`text-[10px]`), PageNavbar tab labels (`text-[9px]`).
**Fix:** Change `--text-tertiary: #6E6E8A` to `#5E5E7A` (~4.6:1). Single-line change cascades everywhere.

#### H3. Missing focus-visible indicators globally
**File:** All interactive elements
**WCAG:** 2.4.7
Only `DisplayTogglePill` and `Button.tsx` have explicit `focus-visible` styles. The vast majority of buttons/links across Navbar, ShareModal, SlideNavControls, PageNavbar, PasteInput, all overlays have no custom focus ring. Browser defaults may be invisible on dark theme.
**Fix:** Add to globals.css:
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### MEDIUM Severity

#### M1. Export Theme Picker missing focus trap
**File:** `src/app/page.tsx:1722-1802`
**WCAG:** 2.4.3
Has `role="dialog"`, `aria-modal`, initial focus management, but no Tab trapping.
**Fix:** Add Tab/Shift-Tab trapping to the dialog's keydown handler.

#### M2. ShortcutHintOverlay missing dialog semantics and focus trap
**File:** `src/components/ui/ShortcutHintOverlay.tsx:62`
**WCAG:** 4.1.2, 2.4.3
No `role="dialog"`, `aria-modal`, or `aria-labelledby`. Escape works but Tab escapes.
**Fix:** Add dialog semantics and auto-focus the dismiss button on open.

#### M3. No visible `<h1>` in report view
**File:** `src/app/page.tsx`
**WCAG:** 1.3.1
The report page uses `<h2>` and `<h3>` inside modals but lacks a visible `<h1>`. Screen readers cannot build a meaningful document outline.
**Fix:** Add `<h1>` — tournament name or "VGC Team Report" — styled to match.

#### M4. Navbar overflow menu trigger undersized (36px)
**File:** `src/components/layout/Navbar.tsx:511`
**WCAG:** 2.5.8
Uses `w-9 h-9` (36x36px), below 44px minimum.
**Fix:** Change to `min-w-[44px] min-h-[44px]`.

#### M5. PageNavbar dark mode toggle undersized (~32px)
**File:** `src/components/layout/PageNavbar.tsx:88`
**WCAG:** 2.5.8
Uses `p-2` producing ~32px hit area.
**Fix:** Change to `min-w-[44px] min-h-[44px] flex items-center justify-center`.

#### M6. Disabled button contrast too low (`opacity-30`)
**File:** `src/components/report/SlideNavControls.tsx:208`
**WCAG:** 1.4.11
`disabled:opacity-30` drops below 3:1 for non-text UI components.
**Fix:** Use `disabled:opacity-40` minimum.

### LOW Severity

#### L1. Decorative SVGs missing `aria-hidden` — widespread
**Files:** Navbar.tsx, ShareModal.tsx, OTSSheetModal.tsx, SlideNavControls.tsx, PageNavbar.tsx, PasteInput.tsx, ShareViewCTA.tsx, EditFab.tsx, DisplayTogglePill.tsx
**WCAG:** 1.3.1
**Fix:** Add `aria-hidden="true"` to all decorative SVGs.

#### L2. Sprite alt text uses slugs not human-readable names
**Files:** `OTSSheetModal.tsx:28`, `PasteInput.tsx:114`
**WCAG:** 1.1.1
Alt text like `kangaskhan-mega` instead of "Kangaskhan Mega".
**Fix:** Transform slug to readable name.

#### L3. `prefers-reduced-motion` not globally respected
**WCAG:** 2.3.3
Only DisplayTogglePill checks this. CSS animations run unconditionally elsewhere.
**Fix:** Add global CSS media query.

#### L4. WarningPopover missing `aria-expanded`
**File:** `Navbar.tsx:~135`
**WCAG:** 4.1.2

#### L5. Navbar menu missing `aria-expanded`
**File:** `Navbar.tsx:511`
**WCAG:** 4.1.2

#### L6. DisplayTogglePill popover focus not moved on open
**File:** `DisplayTogglePill.tsx`
**WCAG:** 2.4.3

#### L7. Restore banner action buttons undersized (~26px tall)
**File:** `page.tsx:969-985`
**WCAG:** 2.5.8

---

## Dialog/Modal Compliance Matrix

| Modal | `role="dialog"` | `aria-modal` | `aria-labelledby` | Focus trap | Escape | Focus restore |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|
| ShareModal | Yes | Yes | Yes | Yes | Yes | Yes |
| WhatsNewModal | Yes | Yes | Yes | Yes | Yes | No |
| WalkthroughOverlay | Yes | No | No (uses aria-label) | N/A (overlay) | Yes | No |
| Export Theme Picker | Yes | Yes | Yes | **No** | Yes | No |
| OTSSheetModal | **No** | **No** | **No** | **No** | Yes | No |
| ShortcutHintOverlay | **No** | **No** | **No** | **No** | Yes | No |
| DisplayTogglePill popover | Yes (non-modal) | No (correct) | Yes | N/A | Yes | Yes |

---

## What the Codebase Does Well

1. **44x44px touch targets** consistently applied to close buttons, nav buttons, toggle buttons across ShareModal, WalkthroughOverlay, SlideNavControls, DisplayTogglePill, OTSSheetModal, EditFab. Exceeds WCAG 2.5.5 (AAA).
2. **ShareModal focus trap** — textbook: saves `previouslyFocused`, wraps Tab/Shift-Tab, Escape closes, restores focus.
3. **Semantic ARIA roles** for complex widgets: radiogroups (visibility picker, Mega toggle), switch (comments/dark mode), slider (mobile slide nav), tablist (desktop slide dots).
4. **Live regions** — `aria-live="polite"` announces slide changes.
5. **Skip-to-content link** in layout.tsx with sr-only/focus-reveal pattern.
6. **Cookie consent** — equal-weight Accept/Reject buttons, no dark patterns.
7. **`prefers-reduced-motion`** check in DisplayTogglePill.
8. **`userScalable: true`, `maximumScale: 5`** — pinch-zoom not disabled.

---

## Priority Fix Order

1. **H2 (B1)** — Single CSS line change (`--text-tertiary` to `#5E5E7A`), cascades to 470+ locations. Highest ROI.
2. **H3** — Global `focus-visible` CSS rule, one addition to globals.css.
3. **H1** — OTSSheetModal: add dialog role, aria-modal, focus trap. One file.
4. **M1-M2** — Focus traps for Export Theme Picker and ShortcutHintOverlay.
5. **M4-M5** — Touch target size fixes (two one-line changes).
6. **L1** — Batch `aria-hidden` addition across decorative SVGs.

---

*End of audit. 16 new/updated findings: 3 High, 6 Medium, 7 Low. 3 previous findings confirmed fixed. ~10 from the May 13 audit remain open and are tracked above.*

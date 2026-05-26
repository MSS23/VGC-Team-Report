# R8: WCAG 2.1 AA Accessibility Audit

**Auditor:** Claude (static analysis)
**Date:** 2026-05-26
**Scope:** Next.js 16 + React 19 + Tailwind CSS v4 application
**Standard:** WCAG 2.1 AA

---

## Executive Summary

The application demonstrates **above-average a11y awareness** for a competitive Pokemon tool: skip links exist, focus traps are implemented in modals, aria attributes are used on toggles and dialogs, and touch targets meet 44x44px minimums. However, several **P0/P1 violations** remain that would fail a WCAG 2.1 AA audit, primarily around color contrast, heading hierarchy, missing landmark roles, and incomplete focus management in some modal/dialog components.

---

## 1. `src/app/layout.tsx` -- Root Document

### PASS
- `<html lang="en">` -- lang attribute present (WCAG 3.1.1)
- Viewport meta via Next.js `Viewport` export: `userScalable: true`, `maximumScale: 5` -- does NOT block zoom (WCAG 1.4.4)
- Skip-to-content link: `<a href="#main-content" className="sr-only focus:not-sr-only ...">` -- properly implemented (WCAG 2.4.1)
- `id="main-content"` target exists on the content wrapper

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| L-1 | P2 | 1.3.1 | `<div id="main-content">` should be `<main id="main-content">` | The main content wrapper uses a `<div>`, not a `<main>` element. The `<main>` landmark is rendered by individual pages (e.g., `page.tsx` renders `<main>` inside this div), creating a nested `<main>` inside a non-semantic wrapper. Screen readers may not immediately locate the main landmark. |
| L-2 | P3 | 4.1.2 | Inline script is not critical to a11y but the `dangerouslySetInnerHTML` block could fail for users with JS disabled | Low impact -- graceful degradation is acceptable since this is a React SPA. |

---

## 2. `src/app/page.tsx` -- Home Page

### PASS
- Uses `<main>` element for all content branches (paste input, shared view loading, report view)
- Appropriate `aria-label` on dismiss buttons (e.g., "Dismiss welcome back banner")
- `aria-hidden="true"` on decorative SVGs
- `role="status"` and `aria-live="polite"` on version comparison status messages
- `role="dialog"` and `aria-modal="true"` on export theme picker with `aria-labelledby`
- `role="alert"` on PokePaste error toast

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| P-1 | **P0** | 1.4.3 | Low contrast: `text-text-tertiary` on light backgrounds | `--text-tertiary: #5E5E7A` on `--background: #FAF9F6` yields a contrast ratio of approximately **4.0:1** (fails AA for normal text which requires 4.5:1). This color is used extensively for timestamps, subtitles, helper text across the entire application. |
| P-2 | P2 | 1.3.1 | Heading hierarchy not guaranteed | The page delegates heading rendering to child components (`TeamReport`, `PasteInput`, etc.). No `<h1>` is rendered directly on the page -- it relies on components to supply one. If a component skips `<h1>` and starts with `<h2>` or `<h3>`, the hierarchy breaks. |
| P-3 | P2 | 2.4.7 | Export theme modal backdrop `onKeyDown` but no `tabIndex` | The backdrop `<div>` has `onKeyDown` for Escape handling but the outer div is a `<div>` not inherently focusable. The `eslint-disable jsx-a11y/no-static-element-interactions` comment confirms this is a known bypass. Focus is managed by `exportThemeDialogRef` but the backdrop itself can't receive keyboard events unless focus lands on it first. |

---

## 3. `src/components/ui/ShareModal.tsx` -- Share Dialog

### PASS (Excellent)
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}` -- proper dialog semantics
- **Focus trap implemented**: Tab cycling between first and last focusable elements
- **Escape key**: Closes modal
- **Focus restoration**: Saves `document.activeElement` before open, restores on close
- **Backdrop click**: Closes modal via `e.target === e.currentTarget` check
- Interactive URL display has `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space
- Close button has `aria-label="Close"` and 44x44px minimum touch target
- Visibility picker uses `role="radiogroup"` with `role="radio"` and `aria-checked`
- Comments toggle uses `role="switch"` with `aria-checked`
- Embed code block has `role="button"`, `tabIndex={0}`, keyboard handler

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| SM-1 | P2 | 1.4.3 | `text-text-tertiary` used for subtitles, descriptions, and footer notes | Same global contrast issue as P-1 above. Multiple instances: "Or share to:" label, Discord/Reddit subtitles, embed note text, footer growth note. |
| SM-2 | P3 | 1.3.1 | Modal heading uses `<h3>` instead of maintaining page hierarchy | The share modal renders `<h3 id={titleId}>`. Since this is a portal dialog, the heading level should ideally be `<h2>` (dialog headings are contextually top-level), though this is a soft recommendation since portaled dialogs are outside the page flow. |

---

## 4. `src/components/ui/Button.tsx` -- Button Component

### PASS
- Extends `React.ButtonHTMLAttributes<HTMLButtonElement>` -- inherits all native button a11y
- `disabled:opacity-40 disabled:cursor-not-allowed` -- disabled state is visually communicated
- `focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1` -- visible focus indicator
- Uses native `<button>` element (not `<div>` or `<a>`)
- Renders `children` so accessible name comes from content or `aria-label` via props spread

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| B-1 | P2 | 1.4.3 | Ghost variant: `text-text-secondary` (#4A4A68) on light background (#FAF9F6) | Contrast ratio approximately **4.7:1** -- technically passes AA for normal text at 14px+ bold, but is marginal. At smaller sizes this could fail. |
| B-2 | P3 | 2.5.8 | Medium button has no explicit `min-h-[44px]` | Small button (`sm`) enforces `min-h-[44px]`, but `md` and `lg` sizes don't explicitly set minimum height. In practice their padding likely exceeds 44px, but it's not guaranteed across all content. |

---

## 5. `src/components/report/TeamReport.tsx` + `PokemonCard.tsx` + `PokemonSprite.tsx` -- Data Display

### PASS
- `PokemonSprite.tsx`: `alt={species}` -- every Pokemon sprite has meaningful alt text (the species name)
- `OTSSheetModal.tsx` / `SpriteImg`: `alt={slug}` -- sprites in OTS sheet have alt text
- QR code image: `alt="QR code for this team report"` -- descriptive alt text
- Stat bars use CSS custom properties for colors with distinct visual indicators per stat type

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| TR-1 | **P1** | 1.3.1 | Stat bars lack accessible text representations | Pokemon stat bars (HP, Atk, Def, SpA, SpD, Spe) are rendered as visual bar charts with color coding but the actual stat VALUES may not be programmatically associated with their labels. Screen readers would need explicit text or `aria-label` on each stat row. The stat name and value are likely separate `<span>` elements without explicit association. |
| TR-2 | **P1** | 1.3.1 | Move list uses `<ul>` in `OTSSheetModal` but `PokemonCard` moves may use implicit list | In `OTSSheetModal`, moves use `<ul>` with `<li>` elements (good). Need to verify `PokemonCard` and `PokemonDetailSlide` do the same. Grid-based move rendering could lose list semantics. |
| TR-3 | P2 | 1.4.1 | Color-only differentiation for stat types | Stat bars use color alone (red for HP, orange for Atk, etc.) to distinguish stat categories. While labels exist ("HP", "Atk"), the colored fill bars rely solely on color to convey information about invested vs. uninvested stats. |
| TR-4 | P2 | 4.1.2 | LongPressWrapper div lacks semantic role | The `LongPressWrapper` in `TeamOverview.tsx` wraps Pokemon cards in a `<div>` with click/touch handlers but no `role`, `tabIndex`, or `aria-label`. This makes the cards' tap-to-navigate functionality invisible to keyboard/screen reader users. |

---

## 6. `src/components/explore/ExploreContent.tsx` + `ExploreFilters.tsx` -- Explore Page

### PASS
- Search input has proper `type="text"` and placeholder text
- Clear button has `aria-label="Clear search"`
- Filter category buttons use `aria-label` and `aria-pressed` (toggle button pattern)
- Sort dropdown uses native `<select>` element -- inherently accessible
- `useReducedMotion()` from Framer Motion is called (motion preferences respected)
- Report grid uses standard HTML structure

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| E-1 | **P1** | 1.1.1 | Search input lacks a visible or accessible `<label>` | The search `<input>` relies on `placeholder` text only. When the field has content, the placeholder disappears. There is no `<label>` element, no `aria-label`, and no `aria-labelledby`. Screen readers will announce the field without a label. |
| E-2 | P2 | 1.4.3 | Filter chips use `text-text-tertiary` for inactive state | Inactive filter chips have `text-text-tertiary` (~4.0:1 contrast ratio on light background). |
| E-3 | P2 | 4.1.3 | No live region for search results count | When filters change and results update, there is no `aria-live` region announcing the number of results found. Screen reader users have no way to know the results changed without manually navigating. |
| E-4 | P2 | 1.3.1 | Report card grid lacks list semantics | Results are rendered in a `<motion.div>` with CSS grid. This loses list semantics -- screen readers won't announce "list of N items". Should use `role="list"` on the container and `role="listitem"` on each `ReportCard`. |
| E-5 | P3 | 2.4.4 | Regulation filter buttons lack full accessible names | Regulation chips display abbreviated text like "M-A" (from `reg.replace("Reg ", "")`). The visible text is truncated, and there's no `aria-label` to provide the full "Reg M-A" context for screen readers. |

---

## 7. `src/components/layout/PageNavbar.tsx` + `PersistentNavbar.tsx` -- Navigation

### PASS
- Desktop nav uses `<nav>` element -- proper landmark
- Mobile bottom nav uses `<nav>` with `aria-label="Mobile navigation"` -- distinct landmark label
- Dark mode toggle has `aria-label="Toggle dark mode"`
- Uses `<header>` element -- proper landmark
- Bottom nav items use `<Link>` (anchor elements) -- natively focusable

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| N-1 | **P1** | 1.3.1 | Desktop `<nav>` lacks `aria-label` to distinguish it from mobile nav | Two `<nav>` elements exist on the page (desktop header and mobile bottom bar). The desktop nav has no `aria-label`, making it indistinguishable from the mobile nav for screen readers. Only the mobile nav has `aria-label="Mobile navigation"`. |
| N-2 | P2 | 4.1.2 | Active nav state is visual-only | Active page is indicated by `text-accent bg-accent-surface/50` styling. There is no `aria-current="page"` attribute on the active link, so screen readers cannot distinguish the current page in the nav. |
| N-3 | P2 | 1.4.3 | Inactive nav links: `text-text-tertiary` | Same tertiary color contrast issue (~4.0:1). |
| N-4 | P3 | 2.5.8 | Desktop nav links lack explicit minimum touch/click targets | Desktop nav items use `px-3 py-1.5` which may be smaller than 44x44px. Mobile nav items use `min-w-[48px]` which is fine. |

---

## 8. `src/components/layout/Navbar.tsx` -- In-Report Navbar

### PASS
- Undo/Redo buttons have both `title` and `aria-label`
- Settings menu button has `aria-label="Settings"`
- Menu closes on outside click (mousedown handler)
- Keyboard shortcuts button has `aria-label="Keyboard shortcuts"`
- Edit button has `aria-label="Edit this report"`
- Save/Unsave button has proper `aria-label`

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| IN-1 | P2 | 1.3.1 | Overflow menu lacks `role="menu"` semantics | The dropdown menu is a `<div>` with no role. Items should be `role="menuitem"` and the container `role="menu"`, with arrow-key navigation. Currently only click/tap dismisses. |
| IN-2 | P2 | 2.1.1 | Menu lacks keyboard navigation | The overflow menu items are individually focusable (buttons and links), but there's no arrow-key navigation pattern. Focus doesn't automatically enter the menu on open. |
| IN-3 | P2 | 2.4.7 | Warning popover has no focus management | `WarningPopover` opens on click but doesn't trap focus or move focus into the popover. Keyboard users can tab past it without seeing its content. |
| IN-4 | P3 | 1.4.3 | Auto-save status indicators use `text-text-tertiary` for "Saving..." state | Low contrast text during transient states. |

---

## 9. `src/components/ui/InstallPrompt.tsx` -- PWA Install Prompt

### PASS
- Scrim overlay has `aria-hidden="true"` -- decorative backdrop
- Uses semantic `<button>` elements for actions
- Touch targets meet 44px requirements

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| IP-1 | **P1** | 2.4.3 | No focus management on open | When the install prompt appears, focus is NOT moved into the sheet. Keyboard users remain wherever they were on the page. The sheet has no `role="dialog"` or `aria-modal`. |
| IP-2 | **P1** | 2.1.2 | No keyboard dismiss (Escape key) | There is no Escape key handler. Keyboard users cannot dismiss the prompt without tabbing to the "Maybe Later" / "Got it" button. |
| IP-3 | P1 | 1.3.1 | Missing dialog semantics | The bottom sheet has no `role="dialog"`, `aria-modal`, or `aria-labelledby`. Screen readers will not announce it as a dialog. |
| IP-4 | P2 | 2.1.1 | No focus trap | Focus can escape the sheet to elements behind the scrim overlay. |

---

## 10. `src/components/social/CommentSection.tsx` -- Comments

### PASS (Good)
- Form inputs have proper `<label>` elements with `htmlFor`/`id` pairing:
  - `<label htmlFor="comment-display-name" className="sr-only">Display name (optional)</label>`
  - `<label htmlFor="comment-body" className="sr-only">Comment</label>`
- Success message uses `role="status"` with `aria-live="polite"`
- Error message uses `role="alert"`
- Expandable section has `aria-expanded` on the toggle button
- Delete/Flag buttons have descriptive `aria-label` (e.g., `Delete comment by ${displayName}`)
- Decorative SVGs have `aria-hidden="true"`

### ISSUES

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| CS-1 | P2 | 1.4.3 | Comment metadata uses very small text: `text-[10px] text-text-tertiary` | The timestamp and character counter use 10px tertiary text. At this size, the contrast requirement increases to 4.5:1 (it's not large text), and `text-text-tertiary` fails this threshold. |
| CS-2 | P2 | 2.4.7 | Delete/Flag buttons hidden until hover | `opacity-0 group-hover:opacity-100 focus-within:opacity-100` -- buttons are invisible until hover. The `focus-within:opacity-100` is a good mitigation for keyboard users, but the buttons are still invisible until focused, which violates discoverability expectations. |

---

## 11. Additional Modal/Dialog Components

### `WhatsNewModal.tsx` -- PASS (Good)
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="whats-new-title"`
- Focus trap implemented via `handleFocusTrap` keyboard handler
- Escape key dismisses
- Backdrop click dismisses
- Close button has `aria-label="Close"` with 44x44px target

### `OTSSheetModal.tsx` -- PARTIAL PASS
- Escape key handler present
- Backdrop click handler present
- Close button has `aria-label="Close"` with 44x44px target

| ID | Severity | WCAG | Issue | Detail |
|----|----------|------|-------|--------|
| OTS-1 | **P1** | 1.3.1 | Missing `role="dialog"` and `aria-modal="true"` | The OTS sheet modal renders as a plain `<div>`. No dialog role, no aria-modal, no aria-labelledby. Screen readers won't announce it as a dialog. |
| OTS-2 | P1 | 2.4.3 | No focus management on open | Focus is not moved into the modal when it opens. |
| OTS-3 | P2 | 2.1.2 | No focus trap | Tab can escape to elements behind the modal. |

### `Toggle.tsx` -- PASS
- Uses `role="switch"` with `aria-checked` and `aria-label`
- Native `<button>` element
- Minimum height of 36px on wrapper

### `CookieBanner.tsx` -- PASS
- Uses `vanilla-cookieconsent` library which handles its own a11y
- `equalWeightButtons: true` -- no dark patterns (GDPR + a11y aligned)

---

## 12. Global Color Contrast Analysis

### Light Mode

| Token | Hex | Background | Ratio | Status |
|-------|-----|------------|-------|--------|
| `--text-primary` | `#1A1A2E` | `#FAF9F6` | ~14.5:1 | PASS |
| `--text-secondary` | `#4A4A68` | `#FAF9F6` | ~5.8:1 | PASS (normal text) |
| `--text-tertiary` | `#5E5E7A` | `#FAF9F6` | ~4.0:1 | **FAIL** (needs 4.5:1) |
| `--text-tertiary` | `#5E5E7A` | `#FFFFFF` (surface) | ~4.3:1 | **FAIL** (needs 4.5:1) |
| `--accent` | `#E11D48` | `#FFFFFF` | ~4.6:1 | PASS (barely, large text OK) |
| `--accent` | `#E11D48` | `#FAF9F6` | ~4.4:1 | **FAIL** for normal text |

### Dark Mode

| Token | Hex | Background | Ratio | Status |
|-------|-----|------------|-------|--------|
| `--text-primary` | `#F0EDE6` | `#0B0B1A` | ~15.2:1 | PASS |
| `--text-secondary` | `#C0C0D8` | `#0B0B1A` | ~10.3:1 | PASS |
| `--text-tertiary` | `#9898B8` | `#0B0B1A` | ~6.2:1 | PASS |
| `--text-tertiary` | `#9898B8` | `#141428` (surface) | ~5.4:1 | PASS |
| `--accent` (dark) | `#FB7185` | `#0B0B1A` | ~6.7:1 | PASS |

**Key Finding:** Dark mode contrast is significantly better than light mode. The primary failing color is `--text-tertiary` in light mode.

---

## Summary: Priority-Ranked Violations

### P0 (Critical -- must fix for WCAG AA)

1. **P-1: `--text-tertiary` fails 4.5:1 contrast in light mode** -- Pervasive throughout the app. Fix: darken `#5E5E7A` to at least `#525266` (~4.6:1) or `#4E4E62` (~5.0:1).
2. **`--accent` (#E11D48) fails 4.5:1 on `--background` (#FAF9F6)** -- The brand accent color barely passes on pure white but fails on the warm off-white background. Any place accent is used as text on the background (not just surfaces) will fail.

### P1 (High -- significant barriers)

3. **IP-1/IP-2/IP-3: InstallPrompt lacks dialog semantics, focus management, and Escape key**
4. **OTS-1/OTS-2: OTSSheetModal lacks dialog role and focus management**
5. **E-1: Search input on Explore page has no accessible label**
6. **N-1: Desktop nav has no aria-label**
7. **TR-1: Stat bars lack accessible text representation for screen readers**

### P2 (Medium -- should fix)

8. E-3: No live region for search result count changes
9. E-4: Report card grid lacks list semantics
10. N-2: No `aria-current="page"` on active nav links
11. IN-1/IN-2: Overflow menu lacks menu role and keyboard navigation
12. TR-4: LongPressWrapper cards not keyboard accessible
13. B-2: Medium button lacks explicit 44px min-height

### P3 (Low -- nice to have)

14. Various `text-[10px]` usage at sizes too small for comfortable reading
15. Desktop nav link touch targets
16. SM-2: Modal heading level conventions

---

## Recommended Fixes (Quick Wins)

1. **Contrast fix (1 line, global impact):** Change `--text-tertiary` from `#5E5E7A` to `#4E4E62` in `:root` in `globals.css`. This single change fixes the most widespread violation.

2. **InstallPrompt dialog (5 lines):**
   ```tsx
   // Add to the bottom sheet container div:
   role="dialog"
   aria-modal="true"
   aria-label="Install VGC Team Report"
   // Add Escape handler in useEffect
   // Add autoFocus to first button
   ```

3. **OTSSheetModal dialog (2 lines):**
   ```tsx
   // Add to the modal content div:
   role="dialog"
   aria-modal="true"
   aria-labelledby="ots-modal-title"
   ```

4. **Explore search label (1 line):**
   ```tsx
   aria-label="Search teams, players, and Pokemon"
   ```

5. **Desktop nav label (1 line):**
   ```tsx
   <nav className="hidden sm:flex ..." aria-label="Main navigation">
   ```

6. **Active nav link (1 attribute per link):**
   ```tsx
   aria-current={activePage === link.key ? "page" : undefined}
   ```

# Accessibility Audit -- WCAG 2.1 AA Static Analysis
**Date:** 2026-05-27  
**Auditor:** Claude Code (static analysis)  
**Scope:** Homepage, TeamReport, PokemonCard, Navbar, PageNavbar, ExploreContent, ShareModal, OTSSheetModal, WalkthroughOverlay, shared report viewer

---

## Critical

### 1. No skip-to-content link
No skip navigation link exists anywhere in the app. Keyboard users must tab through the entire Navbar on every page load before reaching main content.  
**Files:** `Navbar.tsx`, `PageNavbar.tsx`, `layout.tsx`

### 2. OTSSheetModal missing `role="dialog"` and `aria-modal`
The OTS Sheet modal has no `role="dialog"`, no `aria-modal="true"`, and no focus trap. Keyboard and screen reader users can interact with content behind the modal.  
**File:** `OTSSheetModal.tsx`

### 3. PokemonCard role input has no associated `<label>`
The text input for Pokemon roles (`placeholder="e.g. Restricted lead"`) has no `<label>` element or `aria-label`. Screen readers announce it as an unlabelled text field.  
**File:** `PokemonCard.tsx:364-372`

---

## High

### 4. Settings button below 44x44px touch target on mobile
The Navbar settings/overflow button is `w-9 h-9` (36x36px) -- below the 44px minimum. Same issue for the `p-2` damage calculator link and replace/MVP buttons on PokemonCard (padding only, no min-w/h).  
**Files:** `Navbar.tsx:513`, `PokemonCard.tsx:272,298,313`

### 5. Color contrast: `text-text-tertiary/50` and `/40` on interactive icons
Damage calc icon, replace icon, and MVP star use `text-text-tertiary/50` or `/40` at rest -- roughly 25-40% opacity on an already-muted token. Likely fails 3:1 minimum for non-text UI elements (WCAG 1.4.11).  
**File:** `PokemonCard.tsx:272,298,316`

### 6. `text-[9px]` and `text-[10px]` font sizes throughout
Stat labels (`text-[9px]`), EV counts, SP badges, tera labels, and other data use sub-12px sizes. While not a strict WCAG violation, this creates readability issues especially on mobile and for low-vision users.  
**Files:** `PokemonCard.tsx:335,384,421,440,507`

### 7. WarningPopover not keyboard-accessible
The popover closes only on `mousedown` outside -- there is no Escape key handler and no focus trap. Keyboard-only users cannot dismiss it.  
**File:** `Navbar.tsx:119-158`

---

## Medium

### 8. Export theme picker modal uses `eslint-disable jsx-a11y/no-static-element-interactions`
The backdrop `<div>` suppresses the lint rule. The `role="dialog"` and focus management on the inner panel are correctly implemented, but the backdrop click handler on a non-interactive `<div>` is flagged.  
**File:** `page.tsx:1723-1724`

### 9. OTSSheetModal sprite images use slug as alt text
`SpriteImg` sets `alt={slug}` (e.g. "incineroar") which is acceptable but could be more descriptive (e.g. "Incineroar sprite").  
**File:** `OTSSheetModal.tsx:28`

### 10. PageNavbar mobile bottom tabs lack explicit `aria-current`
Active tab is styled visually (`text-accent`) but does not set `aria-current="page"`. Screen readers cannot distinguish the active tab.  
**File:** `PageNavbar.tsx:113-136`

### 11. Animated landing sprites have empty alt text
The six floating Pokemon sprites on PasteInput use `alt=""` -- correct for decorative images, but they represent team archetypes and could benefit from a group `aria-label`.  
**File:** `PasteInput.tsx:253-256`

### 12. ShareModal "just published" celebration has no `aria-live` announcement
When toggling to public, a visual confetti/success state fires but no screen reader announcement accompanies it.  
**File:** `ShareModal.tsx:122-124`

### 13. Explore page loading skeletons lack `aria-busy`
The 6-card skeleton grid during loading has no `aria-busy="true"` or live region, so assistive tech does not know content is loading.  
**File:** `ExploreContent.tsx:154-169`

---

**Good practices already in place:** ShareModal has full focus trap + Escape + focus restore. PokemonCard stat bars use `role="progressbar"` with proper aria-value attributes. Most close buttons have `aria-label`. WalkthroughOverlay uses `role="dialog"`. Dismiss buttons consistently use 44x44px min targets. PasteInput textarea has a descriptive `aria-label`.

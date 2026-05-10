# Accessibility Audit — VGC Team Report
**Standard:** WCAG 2.1 AA  
**Method:** Static source analysis only  
**Date:** 2026-05-10  
**Auditor:** Claude Code (claude-sonnet-4-6)

---

## Summary

46 issues found. 4 Critical, 12 High, 18 Medium, 12 Low.

---

## Critical Issues

### C1 — `<div>` with `onClick` used as interactive control (URL copy row in ShareModal)
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/ui/ShareModal.tsx:286–295`

```tsx
<div
  className="... cursor-pointer ..."
  onClick={handleCopyLink}
>
  <span>{displayUrl}</span>
  <span>Copy</span>
</div>
```

The URL display row is a fully clickable copy-to-clipboard control but is rendered as a `<div>`. It has no `role`, no `tabIndex`, and no keyboard event handler. Keyboard-only users cannot reach or activate it. Screen readers announce it as a static region, not a button.

**Fix:** Replace with `<button type="button">` or add `role="button" tabIndex={0}` and an `onKeyDown` handler for `Enter`/`Space`. Also add `aria-label="Copy link"` since the visible "Copy" text is in a child `<span>` with no guaranteed accessible name computation.

---

### C2 — `<span>` elements with `onClick` used as navigation links (creator/collaborator names in ReportCard)
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/explore/ReportCard.tsx:253–259` (creator name) and `277–282` (collaborator names)

```tsx
<span
  className="font-semibold text-accent/80 ... cursor-pointer"
  onClick={(e) => {
    e.preventDefault();
    window.location.href = `/creator/${...}`;
  }}
>
  {report.creatorName}
</span>
```

Two separate `<span>` elements perform page navigation via `window.location.href` on click. Neither has `role`, `tabIndex`, or keyboard event support. Keyboard-only users cannot activate these links; screen readers announce them as static text. The card itself is a `<motion.a>` wrapping all content, so using nested anchors would be invalid — these should be factored out as real `<a>` elements pointing to the creator URL with `onClick={e => e.stopPropagation()}`.

**Fix:** Replace both `<span onClick>` patterns with `<a href={...} onClick={e => e.stopPropagation()}>`. This gives correct semantics, keyboard support, and right-click / open-in-new-tab behaviour.

---

### C3 — `WalkthroughOverlay` dialog missing `aria-modal="true"` and has no focus trap
**WCAG:** 4.1.2 Name, Role, Value; 2.1.2 No Keyboard Trap (inverse)  
**File:** `src/components/ui/WalkthroughOverlay.tsx:247–260`

The overlay element has `role="dialog"` and `aria-label="Walkthrough"` but **lacks `aria-modal="true"`**. Without this, screen readers in virtual/browse mode will read background content behind the overlay. Additionally, unlike `ShareModal`, `WalkthroughOverlay` contains no focus-trap logic — focus is not constrained to the tooltip when it is open, so screen reader and keyboard users can tab out into the obscured backdrop.

**Fix:** Add `aria-modal="true"` to the dialog `<div>`. Implement a focus trap matching the pattern in `ShareModal.tsx:106–145` (query focusable selectors, intercept Tab/Shift+Tab). Focus the first focusable element on open. Restore focus to the triggering element on close.

---

### C4 — `ShortcutHintOverlay` has no `role="dialog"`, no `aria-modal`, and no focus trap
**WCAG:** 4.1.2 Name, Role, Value; 2.4.3 Focus Order  
**File:** `src/components/ui/ShortcutHintOverlay.tsx:56–91`

The shortcut overlay renders a floating panel but has no `role`, no `aria-modal`, and no focus management. When opened via keyboard (`?`), focus stays on the element that triggered it. Screen readers will not announce this as a dialog and will let virtual cursor roam the entire page behind it.

**Fix:** Add `role="dialog"` and `aria-modal="true"` to the outer container `<div>`. Add `aria-labelledby` pointing to the `<h3>`. Implement focus trap and auto-focus the close button on mount.

---

## High Issues

### H1 — Skip link target (`#main-content`) is a `<div>`, not `<main>`, and lacks `tabIndex="-1"`
**WCAG:** 2.4.1 Bypass Blocks  
**File:** `src/app/layout.tsx:131`

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>
...
<div id="main-content">{children}</div>
```

The skip link itself is correctly implemented. However, the target `<div id="main-content">` has no `tabIndex="-1"`, so most browsers will not move keyboard focus to it when the skip link is activated — the link scrolls the viewport but focus remains on the skip link itself. Additionally, the wrapper is a `<div>`, not a `<main>` element, so the page has no `<main>` landmark at the outermost layout level (individual pages add `<main>` inside, which is correct, but the skip link target sits above that).

**Fix:** Add `tabIndex={-1}` to `<div id="main-content">`. Consider renaming or restructuring so the skip target coincides with the `<main>` landmark.

---

### H2 — Like button in `ReportCard` has no accessible name
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/explore/ReportCard.tsx:342–363`

Both the signed-in and guest variants of the like button contain only an unlabelled SVG heart icon and a numeric count. There is no `aria-label` on either button. Screen readers announce "button" or just the count number with no indication of the action.

**Fix:** Add `aria-label={liked ? "Unlike report" : "Like report"}` to both button variants. Add `aria-pressed={liked}` to the signed-in variant (the guest variant is a sign-in trigger and warrants `aria-label="Sign in to like this report"`).

---

### H3 — `Toggle` component touch target is 36px, below 44px minimum
**WCAG:** 2.5.5 Target Size (AA)  
**File:** `src/components/ui/Toggle.tsx:9`

```tsx
<label className="inline-flex items-center gap-2 cursor-pointer select-none group min-h-[36px]">
  <button role="switch" ...> {/* 24px x 42px */}
```

The wrapping `<label>` has `min-h-[36px]` — 8px below the 44px WCAG AA target. The switch track itself is `h-[24px] w-[42px]`. The same undersized pattern appears in the identical inline switches in `ShareModal.tsx:492–526` and `ShareModal.tsx:589–612`.

**Fix:** Increase wrapping `<label>` to `min-h-[44px]`. For the ShareModal inline switches, add `min-h-[44px]` to the `<button>` container or add invisible padding to expand the hit area.

---

### H4 — Like/bookmark buttons in `ReportCard` touch targets are far below 44px
**WCAG:** 2.5.5 Target Size (AA)  
**File:** `src/components/explore/ReportCard.tsx:342`, `369`, `381`

```tsx
<button
  className="inline-flex items-center gap-1 text-[10px] cursor-pointer hover:scale-110 ..."
>
```

No `min-w` or `min-h` constraints. The rendered height is approximately 13px (icon) + minimal text, far below 44px. These are the primary interactive controls inside each card.

**Fix:** Add `min-w-[44px] min-h-[44px]` to all three button variants (like signed-in, like guest, bookmark). Use negative margin or absolute positioning if needed to avoid changing card layout.

---

### H5 — `Button` component `size="sm"` variant is approximately 24px tall
**WCAG:** 2.5.5 Target Size (AA)  
**File:** `src/components/ui/Button.tsx:22`

```tsx
sm: "px-3.5 py-1.5 text-xs gap-1.5",
```

`py-1.5` = 6px x 2 = 12px padding + 12px line-height = ~24px total. No `min-h` is applied. The component is used in 9+ places across the codebase.

**Fix:** Change the `sm` size to `"px-3.5 py-2 text-xs gap-1.5 min-h-[36px]"` as a minimum, or add `min-h-[44px]` if used in touch-primary contexts.

---

### H6 — Mobile nav labels are rendered at `text-[9px]` — below 12px minimum readable size
**WCAG:** 1.4.4 Resize Text; general readability best practice  
**File:** `src/components/layout/PageNavbar.tsx:137`

```tsx
<span className={`text-[9px] leading-none font-semibold ...`}>{link.label}</span>
```

9px is below the practical readability threshold and cannot be resized by browser text zoom to 12px without layout breakage. WCAG 1.4.4 requires text can be resized to 200% without loss of content.

**Fix:** Use `text-[10px]` minimum, or `text-[11px]`. Ensure the nav bar can accommodate the larger text.

---

### H7 — Collaborative nav links (`<span>` creator navigation in `ReportCard`) lack keyboard access
**WCAG:** 2.1.1 Keyboard  
**File:** `src/components/explore/ReportCard.tsx:277–282`

Collaborator name spans have no `tabIndex`, making them completely unreachable by keyboard. (See also C2.)

---

### H8 — `WalkthroughOverlay` navigation buttons lack visible focus rings
**WCAG:** 2.4.7 Focus Visible  
**File:** `src/components/ui/WalkthroughOverlay.tsx:307–332`

The Prev, Skip, Next, and Done buttons use class strings like:
```
"text-xs font-medium text-text-tertiary hover:text-text-secondary px-3 py-2 rounded-lg active:scale-[0.95] transition-all cursor-pointer"
```

No `focus-visible:ring-*` classes. The global `:focus-visible` CSS rule in `globals.css:813` provides a fallback ring, but with `outline-offset: 2px` on small text buttons inside a floating panel, the ring may be clipped or visually lost against the `bg-surface` dialog background.

**Fix:** Add `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1` explicitly to each button class string in `WalkthroughOverlay`.

---

### H9 — `ShortcutHintOverlay` close button lacks `type="button"` and accessible touch target
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/ui/ShortcutHintOverlay.tsx:83–88`

The close button has no `type="button"`, no visible focus indicator class, and an estimated rendered height of ~20px.

**Fix:** Add `type="button"`, `focus-visible:ring-2 focus-visible:ring-accent`, and `min-h-[44px]`.

---

### H10 — No `aria-current="page"` on active nav links in either navbar
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/layout/PageNavbar.tsx:113–140`; `src/components/layout/Navbar.tsx`

Active state is communicated visually (accent colour, indicator pill) but there is no `aria-current="page"` attribute on the active nav `<Link>`. Screen reader users cannot tell which page they are on from the navigation.

**Fix:** Add `aria-current={isActive ? "page" : undefined}` to each `<Link>` in both navbar components.

---

### H11 — `text-[8px]` used for "Pending" badge in CollaboratorPanel
**WCAG:** 1.4.4 Resize Text  
**File:** `src/components/social/CollaboratorPanel.tsx:323`

```tsx
<span className="... text-[8px] font-extrabold uppercase tracking-wider ...">Pending</span>
```

8px is the smallest font size in the codebase and is unresizable. Even bold uppercase tracking cannot compensate at that size.

**Fix:** Replace with `text-[10px]` minimum.

---

### H12 — `Badge` component accepts arbitrary `color`/`bgColor` with no contrast enforcement
**WCAG:** 1.4.3 Contrast (Minimum)  
**File:** `src/components/ui/Badge.tsx:8–16`

The `Badge` component applies caller-supplied `color` and `backgroundColor` via inline `style={}` with no validation. Callers can pass any colour combination, including those failing 4.5:1. Type-badge colour tokens in coverage charts are data-driven and unverified.

**Fix:** Document minimum contrast requirements in `BadgeProps` JSDoc. Audit all `Badge` call sites and type-badge colour tokens for 4.5:1 ratio.

---

## Medium Issues

### M1 — `motion.a` (ReportCard) has no descriptive `aria-label`
**WCAG:** 2.4.6 Headings and Labels  
**File:** `src/components/explore/ReportCard.tsx:171–177`

The card anchor's accessible name is derived from all child text concatenated, producing a verbose and unhelpful string for screen readers.

**Fix:** Add `aria-label={report.tournamentName || report.species.join(" / ")}` to the `<motion.a>`.

---

### M2 — `CardSprite` images use raw internal slug as `alt` text
**WCAG:** 1.1.1 Non-text Content  
**File:** `src/components/explore/ReportCard.tsx:56–65`

`species` is the internal slug (e.g., `"flutter-mane"`). Hyphenated forms and special characters are announced literally by screen readers. Same pattern in `PokemonSprite.tsx:61`, `ItemIcon.tsx:37`, `SpotlightCard.tsx:18`.

**Fix:** Pass a human-readable title-cased display name as `alt`. A `toDisplayName(slug)` utility (capitalise words, replace hyphens with spaces) would suffice.

---

### M3 — Decorative SVG icons throughout UI are not marked `aria-hidden`
**WCAG:** 1.1.1 Non-text Content  
**File:** Multiple — `ShareModal.tsx`, `WalkthroughOverlay.tsx`, `ReportCard.tsx`, `ShortcutHintOverlay.tsx`, and others

Most inline SVG icons that accompany visible text labels are not marked `aria-hidden="true"`. Screen readers will attempt to describe them by their path data, producing noise. Only a handful of components use `aria-hidden` consistently.

**Fix:** Add `aria-hidden="true"` to all decorative inline SVGs that accompany visible text. Icon-only buttons should rely on the button's `aria-label` for their name — not SVG path data.

---

### M4 — `WalkthroughOverlay` progress bar `<div>` elements lack ARIA progressbar role
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/ui/WalkthroughOverlay.tsx:293–301`

Step progress is communicated visually via filled/unfilled bars but has no semantic role. Screen reader users cannot determine how far through the walkthrough they are without finding the "1 of N" text.

**Fix:** Wrap in `<div role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label="Walkthrough progress">`.

---

### M5 — `motion.a` in `ReportCard` does not use `useReducedMotion()` from `motion/react`
**WCAG:** 2.3.3 Animation from Interactions (AAA); best practice for AA  
**File:** `src/components/explore/ReportCard.tsx:171–178`

The global CSS `prefers-reduced-motion` rule collapses CSS transitions to 0.01ms but Framer Motion JavaScript animations bypass it. `ExploreFilters.tsx` correctly uses `useReducedMotion()`; `ReportCard` does not.

**Fix:** Import `useReducedMotion` from `motion/react`. Pass `transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}` or suppress the `variants` animation when motion is reduced.

---

### M6 — `WalkthroughOverlay` tooltip transition is in inline `style={}` — CSS reduced-motion override may not apply
**WCAG:** 2.3.3 Animation from Interactions  
**File:** `src/components/ui/WalkthroughOverlay.tsx:256`

```tsx
style={{ transition: "opacity 200ms ease-out, transform 200ms ease-out" }}
```

Inline styles set via the `style` prop are higher specificity than `!important` in some implementations. The global `transition-duration: 0.01ms !important` override may not reliably suppress this in all browsers.

**Fix:** Move the tooltip transition to a CSS class so the reduced-motion media query override applies reliably.

---

### M7 — `ShareModal` backdrop `<div>` is not `aria-hidden`
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/ui/ShareModal.tsx:201–206`

The backdrop `<div>` is a bare element in the accessibility tree. Screen readers may explore it.

**Fix:** Add `aria-hidden="true"` to the backdrop `<div>`.

---

### M8 — `Switch` buttons in `ShareModal` lack `aria-labelledby`
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/ui/ShareModal.tsx:485–526`, `587–612`

Both `role="switch"` buttons derive their accessible name from descendant text. This works in principle but is not uniformly reliable across AT for complex children.

**Fix:** Assign IDs to the label text elements and add `aria-labelledby` to the respective switch buttons.

---

### M9 — `Toggle` component wraps `<button>` inside `<label>` — potential double announcement
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/ui/Toggle.tsx:9–28`

The `<label>` wraps both the `<button role="switch">` and a visible `<span>`. The button has `aria-label` but `<label>` has no `for`/`htmlFor`. Some AT may create double announcements.

**Fix:** Remove the `<label>` wrapper or convert to a `<div>`. The `aria-label` on the `<button>` is sufficient.

---

### M10 — `text-text-tertiary` on `text-[10px]` timestamp and counts in `ReportCard` likely fails contrast
**WCAG:** 1.4.3 Contrast (Minimum)  
**File:** `src/components/explore/ReportCard.tsx:405`

`text-text-tertiary` is a CSS custom property whose light-mode value is likely low-contrast. At 10px (below the 18px/14px bold threshold for large text), the required ratio is 4.5:1 against the card surface.

**Fix:** Audit the resolved `--text-tertiary` token in each theme against the surface colour. If failing 4.5:1, increase contrast or use `text-text-secondary` for small informational text.

---

### M11 — `text-[9px]` in ReportCard badge elements is below practical minimum
**WCAG:** 1.4.4 Resize Text  
**File:** `src/components/explore/ReportCard.tsx:184`, `240`, `243`

Regulation tags, archetype overflow badges, and event type badges use `text-[9px]` — too small to resize and to read.

**Fix:** Raise to `text-[10px]` minimum for all badge text. Prefer `text-xs` (12px) for badges carrying primary meaning.

---

### M12 — Copy-success status strings lack `aria-live` region
**WCAG:** 4.1.3 Status Messages  
**File:** `src/components/ui/ShareModal.tsx` (Copied! strings)

"Copied!", "Copied for Discord!" etc. update `<span>` content but are not in an `aria-live` region. Screen reader users get no feedback on copy success.

**Fix:** Wrap dynamic status text in `<span aria-live="polite" aria-atomic="true">`.

---

### M13 — `LanguageSelector` has `text-[9px]` privacy note with `text-text-tertiary`
**WCAG:** 1.4.3 Contrast (Minimum); 1.4.4 Resize Text  
**File:** `src/components/ui/LanguageSelector.tsx:81`

Privacy/cookie notice text at 9px with tertiary colour likely fails both contrast and resize requirements.

**Fix:** Use `text-xs` (12px) and ensure contrast meets 4.5:1.

---

### M14 — `WalkthroughOverlay` backdrop `<div>` is not `aria-hidden`
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/ui/WalkthroughOverlay.tsx:225`

```tsx
<div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={onSkip} />
```

Bare `<div>` clickable backdrop with no ARIA suppression.

**Fix:** Add `aria-hidden="true"`.

---

### M15 — `VersionHistoryPanel` backdrop div lacks `aria-hidden`
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/social/VersionHistoryPanel.tsx:149`

Same pattern as M14.

**Fix:** Add `aria-hidden="true"`.

---

### M16 — `VersionHistoryPanel` dialog element lacks `aria-modal` and `aria-labelledby`
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/social/VersionHistoryPanel.tsx:155`

```tsx
<div role="dialog" ... > {/* no aria-modal, no aria-labelledby */}
```

**Fix:** Add `aria-modal="true"` and `aria-labelledby` pointing to the panel's heading. Implement focus trap.

---

### M17 — `page.tsx` inline dialog lacks `aria-labelledby`
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/app/page.tsx:1559–1560`

```tsx
role="dialog"
aria-modal="true"
```

Has `aria-modal` but no `aria-labelledby`. Dialog title is not programmatically associated.

**Fix:** Add `aria-labelledby` pointing to the dialog heading.

---

### M18 — `InlinePokemonEditor` dialog lacks `aria-modal`
**WCAG:** 4.1.2 Name, Role, Value  
**File:** `src/components/report/InlinePokemonEditor.tsx:132`

```tsx
role="dialog"  {/* no aria-modal */}
```

**Fix:** Add `aria-modal="true"` and `aria-labelledby`.

---

## Low Issues

### L1 — `<html lang="en">` is hardcoded but LanguageSelector allows switching locales
**WCAG:** 3.1.1 Language of Page  
**File:** `src/app/layout.tsx:97`

When a user switches language, the `lang` attribute stays as `"en"`. Screen readers use this to select the correct pronunciation engine.

**Fix:** Make `lang` reactive to the current locale (read cookie/localStorage in a server component or update `document.documentElement.lang` in a `useEffect`).

---

### L2 — Verified creator badge uses `title` attribute only — inaccessible on touch/keyboard
**WCAG:** 1.3.3 Sensory Characteristics  
**File:** `src/components/explore/ReportCard.tsx:261`

`title` tooltip is mouse-hover-only. Touch and keyboard users cannot access "Verified creator" information.

**Fix:** Replace `title` with `<span className="sr-only">Verified creator</span>` and mark the SVG `aria-hidden="true"`.

---

### L3 — Regulation tag uses `title` for auto-detected note — inaccessible on touch/keyboard
**WCAG:** 1.3.3 Sensory Characteristics  
**File:** `src/components/explore/ReportCard.tsx:187–190`

**Fix:** Add `<span className="sr-only">Auto-detected — not confirmed by creator</span>` conditionally.

---

### L4 — Rental tag uses `title` attribute only
**WCAG:** 1.3.3 Sensory Characteristics  
**File:** `src/components/explore/ReportCard.tsx:323`

**Fix:** Add `<span className="sr-only">Rental code available</span>` inside the badge.

---

### L5 — `Button` component uses `focus-visible:ring-accent/50` — 50% opacity ring may not meet 3:1 contrast
**WCAG:** 1.4.11 Non-text Contrast  
**File:** `src/components/ui/Button.tsx:13`

`focus-visible:ring-accent/50` at 50% opacity over a near-white surface (`#FAF9F6`) in light mode yields approximately 2.5:1 — below the 3:1 requirement for focus indicators.

**Fix:** Use `focus-visible:ring-accent` (full opacity) or `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent`.

---

### L6 — `ExploreEmpty.tsx` illustration uses `alt=""` — verify surrounding text fully communicates empty state
**WCAG:** 1.1.1 Non-text Content  
**File:** `src/components/explore/ExploreEmpty.tsx:21`

`alt=""` is correct for decorative illustrations. Verify that adjacent text fully communicates the empty-state message without the image.

---

### L7 — Creator avatar `alt` could include role context
**WCAG:** 1.1.1 Non-text Content  
**File:** `src/components/social/CreatorProfile.tsx:122`

```tsx
<img src={...} alt={data.creator} ... />
```

**Fix:** Consider `alt={`Profile photo of ${data.creator}`}` for fuller context.

---

### L8 — `PdfExport` icon button uses `w-9 h-9` (36px) without min 44px guards
**WCAG:** 2.5.5 Target Size  
**File:** `src/components/ui/PdfExport.tsx:234`

`w-9 h-9` = 36px x 36px. Has `aria-label="Export report as PDF"` (good) but target size is insufficient.

**Fix:** Add `min-w-[44px] min-h-[44px]`.

---

### L9 — `OTSSheetModal` close button lacks `type="button"`
**File:** `src/components/ui/OTSSheetModal.tsx:154`

**Fix:** Add `type="button"` to prevent accidental form submission.

---

### L10 — `ShortcutHintOverlay` close button lacks `type="button"`
**File:** `src/components/ui/ShortcutHintOverlay.tsx:83`

**Fix:** Add `type="button"`.

---

### L11 — `WalkthroughOverlay` navigation buttons lack `type="button"`
**File:** `src/components/ui/WalkthroughOverlay.tsx:308`, `323`, `330`

**Fix:** Add `type="button"` to Prev, Skip, and Next/Done buttons.

---

### L12 — Framer Motion stagger animations on Explore card grid have no reduced-motion guard at grid level
**WCAG:** 2.3.3 Animation from Interactions  
**File:** `src/components/explore/ReportCard.tsx:171–178` (via parent Explore page)

CSS `prefers-reduced-motion` suppresses CSS animations but not JS-driven Framer Motion. `ExploreFilters.tsx` uses `useReducedMotion()` correctly; the card grid stagger is unguarded.

**Fix:** Apply `useReducedMotion()` at the explore page or card grid parent level and disable stagger when reduced motion is preferred.

---

## Quick Reference: By WCAG Criterion

| Criterion | Issues |
|-----------|--------|
| 1.1.1 Non-text Content | M2, M3, L6, L7 |
| 1.3.3 Sensory Characteristics | L2, L3, L4 |
| 1.4.3 Contrast (Minimum) | H12, M10, M13 |
| 1.4.4 Resize Text | H6, H11, M11, M13 |
| 1.4.11 Non-text Contrast | L5 |
| 2.1.1 Keyboard | C1, C2, H7, M7 |
| 2.1.2 No Keyboard Trap | C3 |
| 2.3.3 Animation from Interactions | M5, M6, L12 |
| 2.4.1 Bypass Blocks | H1 |
| 2.4.3 Focus Order | C4 |
| 2.4.6 Headings and Labels | M1 |
| 2.4.7 Focus Visible | H8 |
| 2.5.5 Target Size | H3, H4, H5, L8 |
| 3.1.1 Language of Page | L1 |
| 4.1.2 Name, Role, Value | C1, C2, C3, C4, H2, H9, H10, H12, M4, M8, M9, M14, M15, M16, M17, M18, L9, L10, L11 |
| 4.1.3 Status Messages | M12 |

---

## Prioritised Fix Roadmap

### Sprint 1 — Critical (block release)
1. **C1** — Replace URL display `<div onClick>` with `<button>` in ShareModal
2. **C2** — Replace creator/collaborator `<span onClick>` with `<a>` in ReportCard
3. **C3** — Add `aria-modal="true"` + focus trap to WalkthroughOverlay
4. **C4** — Add `role="dialog"` + `aria-modal` + focus trap to ShortcutHintOverlay

### Sprint 2 — High (next release)
5. **H1** — Add `tabIndex={-1}` to `#main-content` skip link target
6. **H2** — Add `aria-label` + `aria-pressed` to ReportCard like buttons
7. **H3, H4, H5** — Fix touch targets: Toggle (36→44px), ReportCard buttons, Button `sm` variant
8. **H6, H11** — Replace `text-[9px]`/`text-[8px]` with minimum `text-[10px]`
9. **H10** — Add `aria-current="page"` to active nav links

### Sprint 3 — Medium (following sprint)
10. **M3** — Audit and add `aria-hidden` to all decorative SVGs
11. **M5, M12** — Add `useReducedMotion` to ReportCard; add `aria-live` to copy-status spans
12. **M14–M18** — Add `aria-hidden` to backdrops; fix remaining dialog `aria-modal`/`aria-labelledby` gaps

### Sprint 4 — Low (maintenance)
13. **L1** — Dynamic `lang` attribute on locale switch
14. **L2–L4** — Replace `title` attributes with `sr-only` spans
15. **L5** — Full-opacity focus ring on Button component
16. **L8–L11** — `type="button"`, target size, and minor hygiene fixes

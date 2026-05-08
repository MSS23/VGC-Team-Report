# Accessibility Audit — WCAG 2.1 AA Gaps
**Date:** 2026-05-08  
**Auditor:** Static analysis (r8 agent)  
**Scope:** `/src/components/ui/`, `/src/components/explore/`, `/src/app/s/[id]/page.tsx`, `/src/app/page.tsx`, and related components surfaced by the audit.

---

## CRITICAL FINDINGS

### 1. Modals Missing `role="dialog"` / `aria-modal` / Focus Trap

**Severity: Critical** — Screen readers cannot identify modal boundaries; focus escapes to background content.

Affected files (none have `role="dialog"` or `aria-modal="true"`):

- `/src/components/ui/ShareModal.tsx:144–151` — backdrop `<div>` and inner sheet `<div>` have no dialog semantics, no `aria-labelledby` pointing to the h3 "Team shared!" heading
- `/src/components/ui/PasscodeModal.tsx:50–56` — backdrop `<div>` has no dialog role; inner div has no `aria-labelledby`
- `/src/components/ui/WhatsNewModal.tsx:92–100` — outer `motion.div` has no dialog role or label; close button at line 107 has `aria-label="Close"` but that's the only ARIA on the modal

**Comparison:** `WalkthroughOverlay` (line 247), `InlinePokemonEditor` (line 122), and `VersionHistoryPanel` (line 155) do have `role="dialog"` + `aria-label`. These three are the correct pattern.

No focus trap is implemented anywhere — focus is not constrained inside any modal. When a modal opens, keyboard users can Tab into background content.

---

### 2. Interactive `<span>` / `<div>` Elements Missing Keyboard Access

**Severity: Critical** — Elements clickable with a mouse are completely inaccessible via keyboard.

| File | Line | Element | Problem |
|------|------|---------|---------|
| `/src/components/explore/ReportCard.tsx` | 246–253 | `<span onClick>` — creator name link | Not a button/anchor, no `role`, no `onKeyDown`, not focusable |
| `/src/components/explore/ReportCard.tsx` | 269–276 | `<span onClick>` — collaborator name link | Same as above |
| `/src/components/report/PokemonDetailSlide.tsx` | 166–176 | `<span onClick>` — inline text editor trigger | Not focusable, no `role="button"`, no keyboard activation |
| `/src/components/report/MatchupPlanSlide.tsx` | 558–565 | `<span onClick>` — delete matchup plan button | Visually a button, semantically invisible |
| `/src/components/ui/WalkthroughOverlay.tsx` | 225 | `<div onClick={onSkip}>` — full-screen click-to-skip scrim | No keyboard equivalent to skip the walkthrough tour |
| `/src/components/ui/ShareModal.tsx` | 223–233 | `<div onClick={handleCopyLink}>` — URL copy area | Clickable div, no `role="button"`, no `tabIndex`, no keyboard handler |
| `/src/components/social/VersionHistoryPanel.tsx` | 149 | `<div onClick={onClose}>` — backdrop close scrim | No keyboard equivalent |

---

### 3. Form Inputs Missing Accessible Labels

**Severity: High** — Screen readers announce these fields by placeholder text only, which disappears on input. WCAG 1.3.1 / 3.3.2.

Affected inputs (no `aria-label`, no `id`+`htmlFor` pair):

- `/src/components/report/TeamOverview.tsx` lines 495, 505, 513, 520, 527, 536, 557, 571 — all tournament info fields (Team Name, Event Name, Placement, Record, Rental Code, Creator, Regulation, Event Type selects) rely solely on `placeholder` text
- `/src/components/report/TeamOverview.tsx:170` — team summary `<textarea>` (no label)
- `/src/components/report/TeamOverview.tsx:643` — notes `<textarea>` (no label)
- `/src/components/report/AddOpponentInput.tsx:85` — opponent label `<input>` (no label)
- `/src/components/report/AddOpponentInput.tsx:109` — paste `<textarea>` (no label)
- `/src/components/report/MatchupPlanSlide.tsx:681` — game plan notes `<textarea>` (no label)
- `/src/components/report/MatchupPlanSlide.tsx:742` — replay URL `<input>` (no label)
- `/src/components/social/CommentSection.tsx:200` — display name `<input>` (no label)
- `/src/components/social/CommentSection.tsx:210` — comment body `<textarea>` (no label)
- `/src/components/social/CollaboratorPanel.tsx:163` — user search `<input>` (no label)
- `/src/components/report/CalcInput.tsx:215, 357` — calc paste and replay inputs (no labels)
- `/src/components/compare/CompareContent.tsx:415, 434` — Team A/B paste areas have `<label>` but label elements lack `htmlFor` to match input IDs; no `id` on the textareas
- `/src/components/report/PokemonCard.tsx:328` — nickname/role input field (no label)
- `/src/app/dashboard/profile/page.tsx:273, 282` — Creator Name and Profile Picture labels have no `htmlFor` pointing to their associated inputs
- `/src/components/explore/ExploreFilters.tsx:205` — main search input has no `aria-label` and no `id`; `type` and `placeholder` are the only identifiers. The sort `<select>` at line 236 also has no label.

**Good examples to copy:** `/src/components/explore/ExploreFilters.tsx:401–439` uses `htmlFor` + `id` correctly.

---

### 4. `Toggle` Component — `role="switch"` Button Missing `aria-label`

**Severity: High** — The button with `role="switch"` announces state (aria-checked) but has no accessible name. NVDA/JAWS will read "switch, checked/unchecked" with no description of *what* is being toggled.

File: `/src/components/ui/Toggle.tsx:10–16`

```tsx
<button
  role="switch"
  aria-checked={checked}
  onClick={() => onChange(!checked)}
  // ← no aria-label or aria-labelledby
>
```

The visual label is in a sibling `<span>` (line 24) inside a wrapping `<label>` (line 9), but the `<button>` is itself the labelled element, not the `<input>` the `<label>` wraps. The accessible name computation does not reach the sibling `<span>` text. Fix: add `aria-label={label}` to the `<button>` or wrap differently.

---

### 5. `CommentSection` — Expand/Collapse Button Missing `aria-expanded`

**Severity: High** — The button that toggles the comment section (line 164–193) has no `aria-expanded` or `aria-controls` attribute. Screen reader users cannot know whether the section is open or closed.

File: `/src/components/social/CommentSection.tsx:164–193`

Also: `CollaboratorPanel.tsx:132–155` — the "Manage Access" toggle button has no `aria-expanded`.

---

## HIGH FINDINGS

### 6. `PokemonDetailSlide` — Inline Edit Textarea Has `outline-none` With No Focus Replacement

**Severity: High** — A keyboard user editing a notes field cannot see where focus is.

File: `/src/components/report/PokemonDetailSlide.tsx:161`

```tsx
className="... border-none outline-none resize-none ..."
```

No `focus:ring` or `focus-visible:ring` present in the class string. This is a raw `outline-none` with no replacement, unlike most other inputs in the codebase that pair it with `focus:ring-2`.

---

### 7. `ReactionBar` — Signed-In Like Button Missing `aria-label` and `aria-pressed`

**Severity: High** — The interactive like button for signed-in users (line 128–142) has no `aria-label` and no `aria-pressed` to communicate liked/unliked state to screen readers.

File: `/src/components/social/ReactionBar.tsx:128–142`

```tsx
<button type="button" onClick={toggleLike} className={...}>
  {/* no aria-label, no aria-pressed */}
```

The guest version (line 113–123) does have `aria-label="Like report"` — the signed-in path should match.

---

### 8. `ReportCard` — Like Button Missing `aria-label` and `aria-pressed`

**Severity: High** — Both the signed-in (line 300–309) and guest (line 311–322) like buttons in `ReportCard` have no `aria-label`. State change (liked/unliked) is conveyed only through SVG fill color.

File: `/src/components/explore/ReportCard.tsx:300–322`

The bookmark and save buttons at lines 327–351 do have `aria-label` — the like button should match.

---

### 9. Navbar Settings/Overflow Menu — Missing `aria-expanded` and `aria-haspopup`

**Severity: High** — The settings button (line 451–468) that opens the dropdown menu lacks `aria-expanded={menuOpen}` and `aria-haspopup="menu"`.

File: `/src/components/layout/Navbar.tsx:451–468`

Same pattern issue: `LanguageSelector` at line 28–34 opens a listbox but has no `aria-expanded`.

---

### 10. `MatchupPlanSlide` — Replay Remove Button Missing `aria-label`

**Severity: Medium** — The X button to remove a replay URL (line 723–732) has no `aria-label`. Screen readers will announce it as an unlabelled button.

File: `/src/components/report/MatchupPlanSlide.tsx:723–732`

---

## MEDIUM FINDINGS

### 11. SVG Icons Without `aria-hidden`

**Severity: Medium** — Decorative SVGs inside buttons/links that already have text or `aria-label` should have `aria-hidden="true"` to prevent double-announcement. The codebase is inconsistent: some SVGs are properly hidden (e.g., `TeamOverview.tsx:461`) but the vast majority of inline SVGs across all components are not marked `aria-hidden`.

Widespread examples:
- `/src/components/explore/SpotlightCard.tsx:47–48` — star SVG in "Spotlight" badge
- `/src/components/explore/ReportCard.tsx:221–223` — star SVG inside placement badge
- Most SVG icons in `/src/components/ui/ShareDock.tsx`, `/src/components/layout/Navbar.tsx`, etc.

---

### 12. `ThemePicker` — Label Not Associated With Any Control

**Severity: Medium** — The "Accent Theme" `<label>` at line 18 has no `htmlFor` and wraps no input. It is purely visual decoration.

File: `/src/components/ui/ThemePicker.tsx:18`

---

### 13. `Navbar` Settings Menu — Missing `aria-modal` and Escape Dismissal Announcement

**Severity: Medium** — The dropdown at line 471 closes on outside click but the escape-key handler is not present. `ShareModal` and `PasscodeModal` do implement Escape-key dismissal. The settings dropdown does not.

File: `/src/components/layout/Navbar.tsx:470`

---

### 14. Tab Panels Without `aria-labelledby`

**Severity: Medium** — `role="tabpanel"` elements in `MatchupPlanSlide.tsx` (line 389) and in `PokemonCard.tsx` (no explicit tabpanel there, just `role="tab"` buttons) do not have `aria-labelledby` linking them back to their controlling tab button. The tab buttons use `aria-controls` pointing to panel IDs but the panels themselves have no reverse link.

File: `/src/components/report/MatchupPlanSlide.tsx:389`

---

### 15. `ExploreFilters` — Search Input and Sort Select Missing Accessible Name

**Severity: Medium** — The primary search `<input>` (line 205) and sort `<select>` (line 236) have no `aria-label` and no associated `<label>`. The search category tab buttons at line ~128–150 (filter by pokemon/tournament/etc.) also lack `aria-label`.

File: `/src/components/explore/ExploreFilters.tsx:205, 236`

---

### 16. `ConnectivityStatus` — Dynamic Status Changes Lack Live Region

**Severity: Medium** — Connectivity changes (online/offline) likely update UI without announcing to screen readers. Check whether the banner uses `aria-live`.

File: `/src/components/ui/ConnectivityStatus.tsx`

---

## LOW FINDINGS

### 17. Hardcoded Colors in Interactive States

**Severity: Low** — Several brand-color hardcodes could fail contrast in certain user themes:

- `/src/components/social/CreatorProfile.tsx:158, 169, 177` — hover states use `#1da1f2` (Twitter blue), `#ff0000` (YouTube red), `#5865f2` (Discord purple) as text-on-white. Twitter blue (#1da1f2) on white fails WCAG AA (contrast 2.85:1).
- `/src/components/ui/ShareDock.tsx:128` — Reddit orange `#FF4500` as text color: contrast on dark surfaces is borderline.

These are hover-only states (resting state uses `text-text-tertiary` tokens) so impact is limited, but they represent potential AA failures.

---

### 18. `SpeedTierChart` Modifier Toggle Buttons — Title-Only Labels

**Severity: Low** — The speed modifier toggle buttons (Tailwind/Paralysis/Icy Wind, lines 115–130) have `title` attributes for tooltips but no `aria-label`. `title` is not reliably announced by screen readers.

File: `/src/components/report/SpeedTierChart.tsx:115–130`

---

### 19. `PokemonDetailSlide` — Inline Edit Span Inaccessible to Keyboard

**Severity: Low** (duplicate of #2, different mechanism) — The `<span onClick>` at line 166 that activates inline editing has no `tabIndex`, `role`, or keyboard handler. A keyboard-only user cannot activate the edit mode for individual notes entries.

File: `/src/components/report/PokemonDetailSlide.tsx:166–176`

---

### 20. Skip Link Target Present But Some Pages' `<main>` Lacks the Anchor

**Severity: Low** — The layout.tsx skip link targets `id="main-content"` on the wrapping `<div>` (line 125). Several pages render their own `<main>` element as a child without `id="main-content"` (e.g., `ExploreContent.tsx:120`, `CompareContent.tsx:391`, `FeedbackContent.tsx:114`). The skip link works at the layout level but focus lands on the wrapper div, not the `<main>`, meaning keyboard users skip past the nav but land before page-specific headings.

---

## POSITIVE FINDINGS (Do Not Regress)

- Skip link implemented in `layout.tsx:100` — visible on focus.
- `BringSelector` properly uses `role="group"`, `aria-label`, `aria-pressed`, `aria-live` — exemplary pattern.
- `SlideNavControls` has comprehensive `aria-label` coverage and an `sr-only` live region for slide changes.
- `PokemonCard` stat bars use `role="progressbar"` with `aria-valuenow/min/max`.
- `PokemonDropdown` uses `aria-haspopup="listbox"`, `aria-expanded`, `aria-label` correctly.
- Escape key closes `ShareModal`, `PasscodeModal`, and `WhatsNewModal`.
- `PdfExport` button has `aria-label="Export report as PDF"`.
- `DiffNavigator` prev/next/dismiss buttons all have `aria-label`.
- `PokemonSprite` and `ItemIcon` both have meaningful `alt` text.
- `ReportCard` and `SpotlightCard` sprite images have `alt={species}`.

---

## TOP 5 FIXES BY PRIORITY

| # | Issue | Files | WCAG Criterion |
|---|-------|-------|----------------|
| 1 | Modals missing `role="dialog"` + `aria-modal` + `aria-labelledby` + focus trap | `ShareModal.tsx`, `PasscodeModal.tsx`, `WhatsNewModal.tsx` | 1.3.1, 4.1.3 |
| 2 | Interactive `<span>/<div>` elements not keyboard-accessible | `ReportCard.tsx:246–276`, `PokemonDetailSlide.tsx:166`, `MatchupPlanSlide.tsx:558`, `ShareModal.tsx:223` | 2.1.1, 4.1.2 |
| 3 | Form inputs missing accessible labels (tournament fields, notes, search) | `TeamOverview.tsx`, `AddOpponentInput.tsx`, `CommentSection.tsx`, `ExploreFilters.tsx` | 1.3.1, 3.3.2 |
| 4 | Toggle `role="switch"` button missing accessible name | `Toggle.tsx:10` | 4.1.2 |
| 5 | Expand/collapse buttons missing `aria-expanded` | `CommentSection.tsx:164`, `CollaboratorPanel.tsx:132`, `Navbar.tsx:451` | 4.1.2 |

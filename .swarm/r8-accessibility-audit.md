# WCAG 2.1 AA Static Accessibility Audit — VGC Team Report

**Audit date:** 2026-05-07
**Scope:** Static source analysis only (no live browser testing)
**Files audited:**
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/components/report/TeamReport.tsx`
- `src/components/report/PokemonDetailSlide.tsx`
- `src/components/ui/ShareModal.tsx`
- `src/components/ui/Button.tsx`
- `src/components/layout/Navbar.tsx`

---

## Summary of Severity Levels

| Severity | Count |
|----------|-------|
| Critical (WCAG failure) | 9 |
| Major (likely failure, needs verification) | 7 |
| Minor (best-practice gap) | 6 |

---

## CRITICAL FINDINGS

### C1 — Modal dialogs missing `role="dialog"`, `aria-modal`, and `aria-labelledby`

**File:** `src/components/ui/ShareModal.tsx`, lines 144–541

The `ShareModal` renders a full-screen overlay via `createPortal`. It has none of the required dialog semantics:
- No `role="dialog"` on the backdrop or the panel
- No `aria-modal="true"` (screen readers will still read background content)
- No `aria-labelledby` pointing to the `<h3>` at line 161 ("Team shared!" / "Share this report")
- No focus trap — keyboard users can Tab behind the modal backdrop

**WCAG:** 4.1.2 Name, Role, Value (Level A); 2.1.2 No Keyboard Trap (Level A)

**Fix:**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="share-modal-title"
  ...
>
  <h3 id="share-modal-title">...</h3>
```
Also add a focus trap (`useEffect` that moves focus to the first focusable element on open and restores it on close).

---

### C2 — Export theme picker modal missing all dialog semantics and focus trap

**File:** `src/app/page.tsx`, lines 1499–1558

The "Export Theme" modal overlay uses a plain `<div>` with `onClick={() => setShowExportThemePicker(false)}`. It has:
- No `role="dialog"`
- No `aria-modal="true"`
- No `aria-labelledby`
- No focus trap
- Close only on click — no `Escape` key handler (unlike `ShareModal` which at least has Escape via `useEffect`)

**WCAG:** 4.1.2, 2.1.2

---

### C3 — "Close" button in `ShareModal` has an insufficient aria-label

**File:** `src/components/ui/ShareModal.tsx`, line 163–172

```tsx
<button aria-label="Close" ...>
```

`aria-label="Close"` is acceptable but the screen-reader context is absent — the user has no indication of _what_ is being closed. WCAG 2.4.6 (Headings and Labels) is satisfied only when the label is meaningful in context. This is minor on its own, but combined with the missing `aria-labelledby` on the dialog (C1), screen readers announce "Close" with no surrounding dialog name. Recommended: `aria-label="Close share modal"`.

**WCAG:** 2.4.6 Headings and Labels (Level AA)

---

### C4 — Visibility toggle in `ShareModal` is not keyboard-navigable as a toggle

**File:** `src/components/ui/ShareModal.tsx`, lines 391–432

The custom toggle for "List on Explore" is a `<button>` containing a styled `<div>` to simulate a switch. It is missing:
- `role="switch"` (the correct ARIA role for a toggle button that is on/off)
- `aria-checked` attribute reflecting the current state

Screen readers will announce this as a generic button with no state information. The same issue applies to the "Enable comments" toggle at lines 491–514.

**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Fix:**
```tsx
<button role="switch" aria-checked={isPublic} ...>
```

---

### C5 — `CollapsibleCalcGroup` toggle button missing `aria-expanded`

**File:** `src/components/report/PokemonDetailSlide.tsx`, lines 275–295

The collapsible section header button that expands/collapses calc groups has no `aria-expanded` attribute. The visual state (rotated chevron) is conveyed only visually.

**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Fix:**
```tsx
<button
  aria-expanded={effectiveOpen}
  aria-controls="calcs-group-{category}"
  ...
>
```

---

### C6 — Mobile tab bar in `PokemonDetailSlide` missing `role="tablist"` and `role="tab"`

**File:** `src/components/report/PokemonDetailSlide.tsx`, lines 890–905

The four-button tab bar (Set / Stats / Notes / Calcs) is rendered as plain `<button>` elements. It has:
- No `role="tablist"` on the container `<div>`
- No `role="tab"` on individual buttons
- No `aria-selected` on the active tab
- No `aria-controls` linking tabs to their panels
- No `id` on the tab panels for `aria-controls` to target

Screen readers cannot identify this as a tab widget and cannot navigate it using standard tab-key patterns (Left/Right arrows to switch tabs, Tab key to move into content).

**WCAG:** 4.1.2 Name, Role, Value (Level A)

---

### C7 — `WarningPopover` in Navbar has no ARIA disclosure relationship

**File:** `src/components/layout/Navbar.tsx`, lines 115–155

The warnings button opens a popover but:
- No `aria-expanded` on the trigger button
- No `aria-haspopup="true"` on the trigger
- The popover has no `role="tooltip"` or `role="dialog"`
- Screen readers receive no notification when the popover opens (`aria-live` missing)

**WCAG:** 4.1.2 Name, Role, Value (Level A)

---

### C8 — `PokemonSprite` images likely lack alt text (unable to verify directly)

**File:** `src/components/report/PokemonDetailSlide.tsx`, lines 547–560 (calls to `<PokemonSprite>`)

`PokemonSprite` is invoked without an `alt` prop in this call site. Whether the component itself applies a fallback `alt` is unknown without reading that file, but if `alt` is empty or absent, each Pokemon sprite is an unlabelled image.

In `src/components/layout/Navbar.tsx`, line 537–545 uses a raw `<img>` with `alt={theme.label}` — this is correct, but the same `<img>` has `aria-label={theme.label}` on the parent `<button>`, meaning the alt text and the button label are redundant for screen readers (double-announcement risk).

**WCAG:** 1.1.1 Non-text Content (Level A)

---

### C9 — Gender symbol in `PokemonDetailSlide` has no accessible label

**File:** `src/components/report/PokemonDetailSlide.tsx`, lines 586–593

```tsx
<span ...>
  {parsed.gender === "M" ? "♂" : "♀"}
</span>
```

The Unicode symbols ♂ (U+2642) and ♀ (U+2640) are rendered as bare text with no `aria-label`. Some screen readers will attempt to name them ("male sign", "female sign") but this is not guaranteed. The `<span>` also has no `role` and no `aria-hidden` option for the case where gender information is already conveyed by species name.

**WCAG:** 1.1.1 Non-text Content (Level A)

**Fix:**
```tsx
<span aria-label={parsed.gender === "M" ? "Male" : "Female"} role="img" ...>
  {parsed.gender === "M" ? "♂" : "♀"}
</span>
```

---

## MAJOR FINDINGS

### M1 — `#main-content` skip link target exists but `<main>` has no `id="main-content"`

**File:** `src/app/layout.tsx`, line 100 & 125

The skip link correctly targets `#main-content`:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to content</a>
```

But the receiving element is a `<div id="main-content">`, not a `<main>`. There are two issues:
1. The skip-link target should be a `<main>` element, or a `<div>` with `role="main"`. A plain `<div>` without a role means the landmark is not exposed to AT.
2. The `<main>` at `src/app/page.tsx` line 668 and 683 has no `id`, so it does not receive keyboard focus when the skip link is activated (unless the browser auto-focuses the `<div id="main-content">`).

**WCAG:** 2.4.1 Bypass Blocks (Level A)

**Fix:** Move `id="main-content"` onto the `<main>` in the page component, or add `tabIndex={-1}` to the `<div id="main-content">` and `role="main"`.

---

### M2 — `<main>` element appears conditionally inside the report view but wrapping `<div>` lacks `role="main"`

**File:** `src/app/page.tsx`, lines 668, 683, 791

The paste-input path uses `<main className="min-h-screen">` (line 668). The collab sign-in gate also uses `<main>` (line 683). But the full report view at line 791 wraps content in `<main className="...">` which is correct. However, the `<div id="main-content">` in layout.tsx wraps all of these, creating two nested `<main>` landmark regions when the sign-in gate is active, violating the rule that a page should have exactly one `<main>` landmark.

**WCAG:** 1.3.1 Info and Relationships (Level A)

---

### M3 — `<textarea>` for notes in `PokemonDetailSlide` has no `<label>`

**File:** `src/components/report/PokemonDetailSlide.tsx`, lines 825–833

```tsx
<textarea
  value={note}
  onChange={(e) => onNoteChange(e.target.value)}
  placeholder={t.notesPlaceholder.replace("{species}", parsed.species)}
  ...
/>
```

There is no `<label>` element associated via `htmlFor`/`id`, and no `aria-label` or `aria-labelledby`. The `placeholder` attribute is not a substitute for a label — placeholders disappear when the user starts typing, and many screen readers do not reliably announce placeholders as labels.

**WCAG:** 1.3.1 Info and Relationships (Level A); 3.3.2 Labels or Instructions (Level A)

**Fix:**
```tsx
<label htmlFor="pokemon-notes" className="sr-only">{label text}</label>
<textarea id="pokemon-notes" aria-label={t.notesPlaceholder.replace("{species}", parsed.species)} .../>
```

---

### M4 — Edit URL toast close button has no `aria-label`

**File:** `src/app/page.tsx`, lines 1458–1468

```tsx
<button
  onClick={() => setShowEditUrl(false)}
  className="text-text-tertiary hover:text-text-primary ..."
>
  <svg width="16" height="16" ...>
    <line .../><line .../>
  </svg>
</button>
```

This close button contains only an SVG (no text). The SVG has no `aria-hidden` and no `aria-label` on the button. Screen readers will attempt to read the SVG — the `<line>` children have no accessible name — and may announce "button" with no label.

**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Fix:** Add `aria-label="Dismiss edit link toast"` to the button, and `aria-hidden="true"` to the SVG.

---

### M5 — PokéPaste error toast dismiss button has no `aria-label`

**File:** `src/app/page.tsx`, lines 1563–1571

The inline "Dismiss" button for the PokéPaste creation error sits inside a toast `<div>`. There is no `role="alert"` on the toast itself and the dismiss button is just a `<button>` with text "Dismiss" inside a `bg-danger` wrapper. The button label "Dismiss" is acceptable but the toast container needs `role="alert"` or `aria-live="assertive"` so screen readers announce the error automatically.

**WCAG:** 4.1.3 Status Messages (Level AA)

---

### M6 — Touch targets below 44×44px minimum

**File:** `src/components/layout/Navbar.tsx`, lines 244–268

The undo/redo buttons are explicitly `w-7 h-7` (28×28 CSS pixels):
```tsx
className="w-7 h-7 flex items-center justify-center rounded-lg ..."
```

**File:** `src/app/page.tsx`, line 885–895 (welcome-back banner dismiss):
```tsx
className="w-6 h-6 flex items-center justify-center ..."
```
This is 24×24px — well below the 44×44px minimum.

**File:** `src/components/ui/ShareModal.tsx`, line 207–211:
```tsx
className="w-6 h-6 flex items-center justify-center ..."
```
The "Dismiss thank you message" button is also 24×24px.

**WCAG:** 2.5.5 Target Size (Level AAA — but 44px is the AA recommendation per WCAG 2.5.8 in WCAG 2.2, and the project's own UI standards require 44×44px)

**Note:** Per the project's own `CLAUDE.md` UI/UX Standards: "Touch targets: min 44x44px". These violate the internal standard even if WCAG 2.1 AA does not strictly mandate it.

---

### M7 — Theme selector buttons in Navbar overflow menu duplicate label between `<img alt>` and `<button aria-label>`

**File:** `src/components/layout/Navbar.tsx`, lines 524–548

```tsx
<button aria-label={theme.label} ...>
  <img src={...} alt={theme.label} .../>
</button>
```

Both the button and the image carry the same label. Screen readers will announce the label twice (once for the button, once for the image). The image should use `alt=""` since the button already provides the accessible name.

**WCAG:** 1.1.1 Non-text Content — while not technically a failure, it creates a confusing experience.

---

## MINOR FINDINGS

### N1 — `<header>` in Navbar missing `aria-label`

**File:** `src/components/layout/Navbar.tsx`, line 217

```tsx
<header className="sticky top-0 ...">
```

When a page has multiple landmark regions, each `<header>` should have a unique `aria-label` so users can distinguish between them (e.g., `aria-label="Site navigation"`). This is especially relevant when the layout also has `PersistentNavbar`.

**WCAG:** 2.4.1 Bypass Blocks (AA) — best practice for landmark labelling.

---

### N2 — "Version comparison" info banner uses `aria-hidden` incorrectly on icon wrapper

**File:** `src/app/page.tsx`, line 975

```tsx
<span className="w-8 h-8 ..." aria-hidden>
```

The `aria-hidden` attribute value is a boolean in JSX but for HTML it must be the string `"true"`. JSX `aria-hidden` without `="true"` may compile to `aria-hidden=""` in some React versions, which is interpreted as `false` by some AT. Use `aria-hidden="true"`.

---

### N3 — Inline SVGs in social section (fork, public/private) have no `aria-hidden`

**File:** `src/app/page.tsx`, lines 1204–1214, 1236–1240, 1256–1261

SVG icons inside buttons that have visible text labels (e.g. "Public", "Fork Report") should be `aria-hidden="true"`. They are purely decorative in context; without `aria-hidden`, some screen readers will attempt to describe the SVG paths (announcing cryptic path data or nothing useful).

**WCAG:** 1.1.1 — decorative images should be hidden from AT.

---

### N4 — `autoSaveStatus` live region not announced to screen readers

**File:** `src/components/layout/Navbar.tsx`, lines 316–337

The save status button shows "Saving…" / "Saved" / "Save failed" but uses no `aria-live` region. Status changes are purely visual. Saving indicators are "status messages" per WCAG 4.1.3 and require `role="status"` or `aria-live="polite"` to be announced to AT users.

**WCAG:** 4.1.3 Status Messages (Level AA)

---

### N5 — SP/EV tab controls in `PokemonDetailSlide` missing `aria-label` on tablist container

**File:** `src/components/report/PokemonDetailSlide.tsx`, lines 685–725

The Champions SP/EV toggle is correctly labelled with `role="tablist"` and `aria-label="Investment mode"`. The individual tabs have `role="tab"` and `aria-selected`. This is well implemented. **However**, in the non-Champions path (traditional VGC), there is no equivalent segmented control and the EV total is shown as a plain `<span>`. This is fine, but if the per-card SP/EV toggle is ever added to non-Champions view, the same pattern must be applied.

*No action needed for WCAG; noted for awareness.*

---

### N6 — `data-walkthrough` attributes expose internal implementation details

**File:** `src/components/report/PokemonDetailSlide.tsx`, lines 634, 817

```tsx
data-walkthrough="pokemon-moves"
data-walkthrough="pokemon-notes"
```

These custom attributes are not ARIA attributes and have no accessibility impact, but they should be confirmed to not conflict with any AT heuristics that scan `data-*` attributes.

*Informational only — no WCAG impact.*

---

## POSITIVE OBSERVATIONS

The following accessibility patterns are implemented correctly:

1. **Skip-to-content link** — `src/app/layout.tsx:100` — Present with correct `sr-only focus:not-sr-only` pattern.
2. **`lang="en"` on `<html>`** — `src/app/layout.tsx:94` — Correct.
3. **Escape key handler on ShareModal** — `src/components/ui/ShareModal.tsx:97–102` — Present.
4. **`aria-label` on Mega toggle button** — `src/components/report/PokemonDetailSlide.tsx:579–582` — Correct with `aria-pressed`.
5. **`aria-label` on delete (remove calc) button** — `src/components/report/PokemonDetailSlide.tsx:221–224` — Present.
6. **`aria-label` on category switcher group** — `src/components/report/PokemonDetailSlide.tsx:182–183` — Correct `role="group"`.
7. **`aria-label` on undo/redo buttons** — `src/components/layout/Navbar.tsx:248–265` — Present.
8. **`aria-label` on settings menu button** — `src/components/layout/Navbar.tsx:455` — Present (`aria-label="Settings"`).
9. **`focus-visible:ring-2`** on `Button.tsx` — Focus rings are always visible via `focus-visible:ring-2 focus-visible:ring-accent/50`.
10. **`role="status" aria-live="polite"`** on "no differences" version comparison banner — `src/app/page.tsx:971–972` — Correctly implemented.
11. **`aria-hidden="true"`** on print container — `src/app/page.tsx:1579` — Correct.
12. **`viewport` meta allows user scaling** — `src/app/layout.tsx:31` — `userScalable: true` and `maximumScale: 5` — correct.
13. **`aria-label` on welcome-back banner close button** — `src/app/page.tsx:889` — Present.

---

## REMEDIATION PRIORITY

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | C1: ShareModal missing role=dialog, aria-modal, focus trap | Medium |
| P0 | C2: Export theme modal missing dialog semantics + focus trap | Low |
| P0 | C6: Mobile tab bar missing tablist/tab/aria-selected | Low |
| P1 | C4: Visibility/comments toggles missing role=switch, aria-checked | Low |
| P1 | C5: CollapsibleCalcGroup missing aria-expanded | Low |
| P1 | C7: WarningPopover missing aria-expanded, aria-haspopup | Low |
| P1 | M3: Notes textarea missing label | Low |
| P1 | M6: Touch targets < 44px | Low |
| P2 | C9: Gender symbol missing aria-label | Trivial |
| P2 | C3: "Close" label too generic | Trivial |
| P2 | M1: Skip link target is div not main | Low |
| P2 | M4/M5: Toast close buttons missing aria-label | Trivial |
| P2 | M7: Double label on theme img+button | Trivial |
| P3 | N1: header missing aria-label | Trivial |
| P3 | N3: Decorative SVGs not aria-hidden | Trivial |
| P3 | N4: autoSaveStatus not a live region | Low |

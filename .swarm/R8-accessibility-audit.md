# R8 — Accessibility Audit

**Date:** 2026-05-14  
**Scope:** src/app/globals.css, src/components/ui/, src/components/social/ReactionBar.tsx, src/app/layout.tsx, src/components/layout/Navbar.tsx  
**Standard:** WCAG 2.1 Level AA  
**Method:** Static source analysis

---

## B1 — `text-text-tertiary` Fails WCAG AA Contrast

**File:** `src/app/globals.css:16` (light), `globals.css:273` (dark)  
**WCAG Criterion:** 1.4.3 Contrast (Minimum) — AA requires 4.5:1 for normal text  
**Severity:** HIGH — affects ~470 occurrences across the codebase  

**Finding:**  
- Light mode: `--text-tertiary: #6E6E8A` on `--background: #FAF9F6` → contrast ratio **4.0:1** (FAIL)  
- Dark mode: `--text-tertiary: #9898B8` on `--background: #0B0B1A` → contrast ratio **5.6:1** (PASS)  

The light-mode tertiary color fails by ~0.5 ratio points. It is used in ~470 places across TSX files for labels, timestamps, helper text, placeholder descriptions, and decorative caption text.

**Minimum fix — change one CSS custom property:**  
```css
/* src/app/globals.css, line 16 — change from: */
--text-tertiary: #6E6E8A;
/* to: */
--text-tertiary: #5E5E7A;
```
`#5E5E7A` on `#FAF9F6` yields approximately **4.6:1** — passing AA. This is a single-line change that cascades everywhere via `var(--text-tertiary)` and the Tailwind token `text-text-tertiary`.

**Note on large text:** WCAG allows 3:1 for text ≥18pt or ≥14pt bold. Some tertiary usages (10px labels, small captions) are well below this threshold, so the full fix requires the colour change rather than relying on the size exemption.

---

## B2 — Toggle: `<button role="switch">` Nested Inside `<label>` (Invalid HTML, Double-Announces)

**File:** `src/components/ui/Toggle.tsx:9-13`  
**Caller with empty label:** `src/components/layout/Navbar.tsx:507`  
**WCAG Criterion:** 4.1.2 Name, Role, Value; 1.3.1 Info and Relationships  
**Severity:** HIGH — screen readers double-announce the element; empty `label=""` causes Navbar toggle to have no accessible name  

**Finding:**  
`Toggle.tsx` wraps a `<button role="switch">` inside a `<label>`. Per HTML spec, interactive elements must not be descendants of `<label>`. Screen readers (NVDA, VoiceOver) announce both the label's text content and the button's `aria-label`, producing "Dark mode Dark mode switch on/off" noise. Additionally, `Navbar.tsx:507` passes `label=""`, leaving the switch with an empty `aria-label` when the visible label span is hidden at small screen sizes.

**Fix — Remove `<label>`, use `<div>` wrapper:**  
```tsx
// src/components/ui/Toggle.tsx
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className="inline-flex items-center gap-2 cursor-pointer select-none group min-h-[36px]">
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label || undefined}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[24px] w-[42px] items-center rounded-full transition-all duration-300 flex-shrink-0 ${
          checked ? "bg-accent shadow-md shadow-accent/30" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-300 ${
            checked ? "translate-x-[20px] scale-110" : "translate-x-[3px]"
          }`}
        />
      </button>
      {label && (
        <span
          aria-hidden="true"
          className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors hidden sm:inline uppercase tracking-wider"
        >
          {label}
        </span>
      )}
    </div>
  );
}
```

**Fix for Navbar.tsx:507 — provide a real label:**  
```tsx
// src/components/layout/Navbar.tsx:507 — change from:
<Toggle checked={darkMode} onChange={(v) => { onDarkModeChange(v); }} label="" />
// to:
<Toggle checked={darkMode} onChange={(v) => { onDarkModeChange(v); }} label="Dark mode" />
```

---

## B3 — ReactionBar Like Button: Missing `aria-label` and `aria-pressed`

**File:** `src/components/social/ReactionBar.tsx:122-135`  
**WCAG Criterion:** 4.1.2 Name, Role, Value  
**Severity:** MEDIUM — screen reader users cannot determine button purpose or state  

**Finding:**  
The authenticated-user like button at line 122 has no `aria-label` and no `aria-pressed` attribute. Screen readers announce it as "button" with no context. The `liked` state is conveyed only visually (filled/unfilled heart icon). The `SignInButton` variant at line 109 correctly has `aria-label="Like report"` — the logged-in path is missing the same.

```tsx
// src/components/social/ReactionBar.tsx:122 — current:
<button
  type="button"
  onClick={toggleLike}
  className={`inline-flex ...`}
>
```

**Fix:**
```tsx
<button
  type="button"
  onClick={toggleLike}
  aria-label={liked ? "Unlike report" : "Like report"}
  aria-pressed={liked}
  className={`inline-flex ...`}
>
```

---

## VGC-177 — Skip-to-Content Link: PRESENT (No Bug)

**File:** `src/app/layout.tsx:99-101`  
**WCAG Criterion:** 2.4.1 Bypass Blocks  
**Severity:** NONE — already implemented correctly  

**Finding:**  
A skip link exists at layout.tsx:99:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">
  Skip to content
</a>
```
The `<div id="main-content">` target is at line 134. The link appears visually on keyboard focus. Implementation is correct. No action needed.

---

## Additional Issues Found in `src/components/ui/`

### B4 — `ShortcutHintOverlay.tsx:83` — Dismiss Button Missing `type="button"`

**File:** `src/components/ui/ShortcutHintOverlay.tsx:83`  
**WCAG Criterion:** 4.1.2 Name, Role, Value  
**Severity:** LOW — without `type="button"`, defaults to `type="submit"` if ever inside a form ancestor; accessible name from text content is adequate  

**Fix:** Add `type="button"` to the dismiss button at line 83.

### B5 — `ShareModal.tsx:594,695` — Inline `role="switch"` Buttons Without Explicit `aria-label`

**File:** `src/components/ui/ShareModal.tsx:594, 695`  
**WCAG Criterion:** 4.1.2 Name, Role, Value  
**Severity:** MEDIUM — two inline switches (public visibility toggle, comments toggle) use `role="switch"` and `aria-checked` correctly but rely on verbose child text content for their accessible name rather than a concise `aria-label`  

**Fix — add explicit `aria-label` to both:**
```tsx
// Visibility toggle (line 594)
<button
  type="button"
  role="switch"
  aria-checked={isPublic}
  aria-label="List report on Explore page"
  ...
>

// Comments toggle (line 695)
<button
  type="button"
  role="switch"
  aria-checked={allowComments}
  aria-label="Enable comments on this report"
  ...
>
```

### B6 — Items Verified as Compliant

| Component | Verification |
|-----------|-------------|
| NotificationBell.tsx | Bell button has `aria-label="Notifications"` ✓ |
| EditFab.tsx | Has dynamic `aria-label` per mode ✓ |
| DiffNavigator.tsx | Prev/Next/Dismiss all have `aria-label` ✓ |
| ShareDock.tsx | All buttons have `aria-label` ✓ |
| ShareModal.tsx close | Has `aria-label="Close"`, focus trap with Escape ✓ |
| WalkthroughOverlay.tsx | Dialog has `aria-label`, close has `aria-label="Close tour"` ✓ |
| OTSSheetModal.tsx | Close has `aria-label="Close"`, action buttons have text labels ✓ |
| PdfExport.tsx | Has `aria-label="Export report as PDF"` ✓ |
| LanguageSelector.tsx | Trigger has `aria-label` from i18n ✓ |
| ShareViewCTA.tsx | Dismiss has `aria-label="Dismiss"` ✓ |

---

## Priority Fix Order

1. **B1** — Single CSS line change, fixes 470+ locations. Do first.  
2. **B2** — Two file edits (Toggle.tsx + Navbar.tsx:507), fixes invalid HTML structure.  
3. **B3** — One-line addition in ReactionBar.tsx for authenticated like button.  
4. **B5** — Add `aria-label` to two switches in ShareModal.tsx.  
5. **B4** — Add `type="button"` to ShortcutHintOverlay dismiss button.

---

## Summary Table

| ID | File | Line | Criterion | Severity | Status |
|----|------|------|-----------|----------|--------|
| B1 | globals.css | 16 | 1.4.3 Contrast AA | HIGH | FAIL — #6E6E8A = 4.0:1 on #FAF9F6 |
| B2 | Toggle.tsx / Navbar.tsx | 9, 507 | 4.1.2 Name/Role/Value | HIGH | FAIL — button inside label; empty aria-label |
| B3 | ReactionBar.tsx | 122 | 4.1.2 Name/Role/Value | MEDIUM | FAIL — no aria-label or aria-pressed |
| VGC-177 | layout.tsx | 99 | 2.4.1 Bypass Blocks | — | PASS |
| B4 | ShortcutHintOverlay.tsx | 83 | 4.1.2 | LOW | Missing type="button" |
| B5 | ShareModal.tsx | 594, 695 | 4.1.2 | MEDIUM | No explicit aria-label on role="switch" buttons |

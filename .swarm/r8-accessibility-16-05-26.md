# Accessibility Audit — Delta Analysis
**Date:** 2026-05-16
**Auditor:** Claude Code (static analysis)
**Baseline:** `.swarm/r8-accessibility-audit.md` (2026-05-13)
**Scope:** ShareModal.tsx, MatchTracker.tsx, page.tsx (PasteInput), ReportCard.tsx, ShareDock.tsx
**Previously fixed (not re-reported):** text-tertiary contrast (v5.14), Toggle nesting (v5.14), ReactionBar aria-label (v5.14), Bottom nav 44px tap targets (v5.12)

---

## Summary

Five components were audited. Several items from the previous audit have been **correctly addressed** (noted below). Eight new or previously-unlogged issues were found.

---

## Resolved Since Last Audit (Confirmed Fixed)

| Component | What was fixed |
|---|---|
| `ShareModal.tsx` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}` all present (lines 260–263). Full focus trap + escape handler intact (lines 110–157). Close button has `aria-label="Close"` and `min-h-[44px] min-w-[44px]` (line 279). |
| `ReportCard.tsx` | Like button now has `aria-label={liked ? "Unlike report" : "Like report"}` and `aria-pressed={liked}` (lines 317–318). Bookmark button has `aria-label` (line 349). SVGs have `aria-hidden="true"`. |
| `ShareDock.tsx` | All icon-only buttons have `aria-label` and `w-11 h-11` (44×44 px) touch targets (lines 139, 152, 164). Native share button is `h-11` (line 120). |

---

## New / Previously Unlogged Issues

### Issue A — `ShareModal.tsx` · Lines 565–579 · **WCAG 4.1.2 · Major**

**Public-confirm "Yes, publish it" / "Keep Private" buttons are undersized.**

The two confirmation buttons inside the public-confirm panel use `px-3.5 py-1.5 text-xs`, which renders roughly 28–30 px tall — well below the 44 px minimum touch target required for mobile users.

```tsx
// line 566–571
className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-accent text-white ..."
// line 573–579
className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-text-tertiary ..."
```

**Quick fix:** Add `min-h-[44px]` to both buttons, or wrap the action row in a taller flex container.

---

### Issue B — `ShareModal.tsx` · Lines 677–682 · **WCAG 4.1.2 · Minor**

**"Dismiss" link for server-side `publishError` is a `<button>` rendered at ~16 px height with no minimum touch target.**

```tsx
// line 677
className="mt-1 text-[10px] font-semibold text-red-600/80 ..."
```

No `min-h-[44px]` or padding is applied. This is the only control that can clear a persistent error state.

**Quick fix:** Add `min-h-[44px] px-2 inline-flex items-center` to the dismiss button.

---

### Issue C — `MatchTracker.tsx` · Lines 433–448 · **WCAG 2.4.3 · Major**

**Delete confirmation buttons are 32 px tall (`min-h-[32px]`) — below the 44 px touch target minimum.**

The pending-delete confirmation group renders "Delete" and "Cancel" at `min-h-[32px]`, which is deliberately compact for density but fails AA for touch targets on mobile.

```tsx
// line 436–437
className="min-h-[32px] px-2 text-[10px] font-bold rounded bg-red-500/10 ..."
// line 442–443
className="min-h-[32px] px-2 text-[10px] font-bold rounded bg-surface-alt ..."
```

**Quick fix:** Change `min-h-[32px]` to `min-h-[44px]` on both confirm/cancel buttons inside the delete flow.

---

### Issue D — `MatchTracker.tsx` · Line 453–455 · **WCAG 2.4.3 / 2.4.7 · Major**

**Initial delete trigger button is keyboard-invisible by default.**

The trash button is `opacity-0 group-hover:opacity-100 focus:opacity-100`. While `focus:opacity-100` makes it visible on focus, the button is only 12×12 px (`p-1`) in effective hit area — less than 44 px. There is no surrounding padding that enlarges the tap zone, making it essentially inaccessible on touch devices regardless of visibility.

```tsx
// line 455
className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 p-1 rounded ..."
```

**Quick fix:** Replace `p-1` with `min-w-[44px] min-h-[44px] flex items-center justify-center` to meet the 44 px minimum while keeping the icon visually small.

---

### Issue E — `MatchTracker.tsx` · Lines 237–255 · **WCAG 4.1.2 · Major**

**Result toggle buttons (Win / Loss / Tie) have no `aria-pressed` attribute.**

The three result buttons convey selection state only via colour (`resultBg`). Screen readers cannot determine which result is currently selected.

```tsx
// lines 243–249
<button
  key={r}
  type="button"
  onClick={() => setResult(r)}
  className={`flex-1 py-2 text-xs font-bold rounded-lg ...`}
>
  {r}
</button>
```

No `aria-pressed={result === r}` is present.

**Quick fix:** Add `aria-pressed={result === r}` to each result button. Consider also adding `aria-pressed` to the Game Count buttons at lines 263–270 for the same reason.

---

### Issue F — `PasteInput.tsx` · Lines 397–425 · **WCAG 1.3.1 · Major**

**`<textarea>` has no `id`, `aria-label`, or associated `<label>` element.**

The main paste input is the primary interactive element on the landing page. It has no programmatic label. Screen readers will announce it as an unlabelled text area.

```tsx
// line 397
<textarea
  value={paste}
  onChange={...}
  onKeyDown={handleKeyDown}
  ...
  // No id, no aria-label, no aria-labelledby
/>
```

The `<motion.p>` above it (line 376–383) renders hint text (`t.appInputHint`) but has no `id` that could be referenced via `aria-labelledby`.

**Quick fix:**
```tsx
<textarea
  id="paste-input"
  aria-label="Paste your Showdown export or PokéPaste URL"
  ...
/>
```
Or add `id="paste-label"` to the `<motion.p>` and use `aria-labelledby="paste-label"`.

---

### Issue G — `PasteInput.tsx` · Lines 451–460 · **WCAG 4.1.3 · Major**

**Validation error message (`fetchError` / `validationError`) has no `aria-live` region.**

When the user clicks "Analyze" with invalid content, the error renders at line 455 via `<motion.p className="text-sm text-danger ...">`. There is no `role="alert"` or `aria-live="assertive"` on this element, so screen reader users will not be notified of the error.

Compare: the paste hint at line 443 correctly uses `aria-live="polite"` — the error should use `role="alert"` (implicit `aria-live="assertive"`) since it is an error that blocks form submission.

**Quick fix:** Add `role="alert"` to the error `<motion.p>` at line 453.

---

### Issue H — `ReportCard.tsx` · Lines 168–182 · **WCAG 1.3.1 / 4.1.2 · Minor**

**Regulation badge uses `title` for the auto-detected tooltip — not reliably announced.**

```tsx
// line 173–176
<span
  ...
  title={report.tags.regulationAutoDetected
    ? "Auto-detected from team composition — not confirmed by the creator"
    : undefined}
>
```

`title` attributes are not consistently announced by screen readers (especially on mobile, where hover is unavailable). The "auto" sub-badge (line 179) renders at `text-[8px]` — 8 px, the smallest text in the codebase — which also fails contrast requirements.

**Quick fix:** Replace `title` with `aria-describedby` pointing to a visually-hidden `<span>` containing the tooltip text. Change `text-[8px]` to at minimum `text-[10px]`.

---

## Touch-Target Audit Summary

| Component | Element | Current size | Min required | Pass? |
|---|---|---|---|---|
| ShareModal | Close button | 44×44 px | 44×44 px | Pass |
| ShareModal | "Yes, publish it" / "Keep Private" | ~28×30 px | 44×44 px | **Fail** |
| ShareModal | "Dismiss" (publish error) | ~16 px tall | 44×44 px | **Fail** |
| MatchTracker | "Log Match" toggle | ~30 px tall | 44×44 px | **Fail (borderline)** |
| MatchTracker | Delete confirm / cancel | 32 px | 44×44 px | **Fail** |
| MatchTracker | Delete trigger (trash icon) | ~28 px | 44×44 px | **Fail** |
| ReportCard | Like / Bookmark buttons | ~26 px | 44×44 px | **Fail** |
| ShareDock | X, Reddit, Discord icon buttons | 44×44 px | 44×44 px | Pass |
| ShareDock | "Copy link" pill | 36 px (`h-9`) | 44×44 px | **Fail** |

> **ShareDock "Copy link"** (`h-9` = 36 px, line 182): the pill is the primary CTA in the dock but falls 8 px short of the 44 px minimum. Change to `h-11` to match the native share button.

---

## Issues Table

| # | File | Lines | WCAG | Severity | Issue | Quick Fix |
|---|---|---|---|---|---|---|
| A | `ShareModal.tsx` | 565–579 | 2.5.5 Touch Target | Major | "Yes, publish it" / "Keep Private" buttons ~28–30 px tall | Add `min-h-[44px]` to both |
| B | `ShareModal.tsx` | 677–682 | 2.5.5 Touch Target | Minor | "Dismiss" publish-error link ~16 px tall | Add `min-h-[44px] px-2 inline-flex items-center` |
| C | `MatchTracker.tsx` | 433–448 | 2.5.5 Touch Target | Major | Delete confirm/cancel buttons `min-h-[32px]` | Change to `min-h-[44px]` |
| D | `MatchTracker.tsx` | 453–455 | 2.5.5 Touch Target | Major | Delete trigger button `p-1` — ~28 px effective hit area | Replace `p-1` with `min-w-[44px] min-h-[44px] flex items-center justify-center` |
| E | `MatchTracker.tsx` | 237–255 | 4.1.2 Name/Role/Value | Major | Win/Loss/Tie result buttons have no `aria-pressed` | Add `aria-pressed={result === r}` |
| F | `PasteInput.tsx` | 397–425 | 1.3.1 Info & Relationships | Major | `<textarea>` has no accessible name | Add `aria-label` or associate a `<label>` |
| G | `PasteInput.tsx` | 451–460 | 4.1.3 Status Messages | Major | Error message not in a live region | Add `role="alert"` to error `<p>` |
| H | `ReportCard.tsx` | 168–182 | 1.3.1 Info & Relationships | Minor | Auto-detected regulation tooltip uses `title`; "auto" badge is 8 px | Use `aria-describedby` + visually-hidden span; raise to `text-[10px]` |
| I | `ShareDock.tsx` | 182 | 2.5.5 Touch Target | Minor | "Copy link" pill is `h-9` (36 px) | Change to `h-11` |

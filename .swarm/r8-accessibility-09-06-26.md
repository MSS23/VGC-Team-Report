# R8 Accessibility Audit — 2026-06-09

Static WCAG 2.1 AA audit of `src/components/**` and `src/app/**`. Excludes
already-improved areas from prior runs (OTSSheetModal, navbar settings,
dark mode toggle, navbar overflow menu, PokemonCard role input,
SlideNavControls toggle, calc collapse buttons, changelog filter tabs,
notifications feed, Champions Regionals table, Explore filter chips) and
the conflict-risk files listed in the task brief.

Findings are grouped by component for batch-fixable items.

---

## HIGH PRIORITY — Modal / dialog gaps

### 1. `InstallPrompt` — full-screen bottom sheet with no dialog semantics
**File:** `src/components/ui/InstallPrompt.tsx:112-205`
**WCAG:** 4.1.2 Name/Role/Value (A), 2.1.2 No Keyboard Trap (A), 2.4.3 Focus Order (A)
**Current:** The component renders a scrim + sheet but the sheet container is
just `<div className="...">`. There is no `role="dialog"`, no
`aria-modal="true"`, no `aria-labelledby`, no Escape handler, no focus
trap, and focus is never moved into the dialog when it opens. The scrim
`<div>` uses `onClick={handleDismiss}` but has no keyboard handler — non-
mouse users can only dismiss by tabbing through the page until they reach
the buttons inside.
**Fix:** Wrap the sheet container in `<div role="dialog" aria-modal="true"
aria-labelledby="install-prompt-title">` with an `id` on the heading, add
an Escape `keydown` listener that calls `handleDismiss`, and on mount move
focus to the first action button. Mirror the focus-trap pattern already
used in `WhatsNewModal` (lines 80-107). Add `<button>` semantics to the
scrim or convert it to a non-interactive element with `aria-hidden="true"`.
**Scope:** ~20 lines.

### 2. `ShortcutHintOverlay` — keyboard shortcuts dialog missing dialog role
**File:** `src/components/ui/ShortcutHintOverlay.tsx:56-93`
**WCAG:** 4.1.2 Name/Role/Value (A), 2.4.3 Focus Order (A)
**Current:** Outer `<div>` lacks `role="dialog"`, `aria-modal="true"`,
`aria-labelledby`. No focus trap, no autofocus on open. Escape works (line
38-47) but click-outside uses an interactive `<div onClick>` with no
keyboard alternative.
**Fix:** Add `role="dialog" aria-modal="true" aria-labelledby="shortcut-title"`
on the inner card, give the `<h3>` an id, focus the close button on mount,
and add `tabIndex={-1}` + ref so Escape can return focus to the trigger.
**Scope:** ~15 lines.

### 3. `VersionHistoryPanel` — side panel with role="dialog" but no aria-modal / focus trap
**File:** `src/components/social/VersionHistoryPanel.tsx:164-199`
**WCAG:** 4.1.2 (A), 2.4.3 (A)
**Current:** Has `role="dialog" aria-label="Version history"` but no
`aria-modal="true"`. No focus trap — Tab leaves the panel into the page
behind. Focus is not moved to the panel on open and not restored to
trigger on close. The scrim uses `role="button"` (line 150-161) which is a
correct fallback but a focus-trap on the panel itself is missing.
**Fix:** Add `aria-modal="true"` and on open `panelRef.current?.focus()`
(set `tabIndex={-1}` on the container). Use the focus-trap pattern from
`ShareModal.tsx:137-183`.
**Scope:** ~12 lines.

### 4. `InlinePokemonEditor` — dialog missing aria-modal
**File:** `src/components/report/InlinePokemonEditor.tsx:128-134`
**WCAG:** 4.1.2 (A)
**Current:** `role="dialog" aria-label="Replace Pokemon"` set, but no
`aria-modal="true"`. No Tab focus trap. Escape closes (lines 102-119) and
autofocus is correct.
**Fix:** Add `aria-modal="true"` and a Tab focus trap mirroring
`ShareModal.tsx`.
**Scope:** ~10 lines.

### 5. `WalkthroughOverlay` — dialog tooltip OK, but scrim button is an "unbordered" close target
**File:** `src/components/ui/WalkthroughOverlay.tsx:225-237`
**WCAG:** 2.5.5 Target Size (AAA — but this is a hidden trap), 4.1.2 (A)
**Current:** `<div role="button" tabIndex={0} aria-label="Close walkthrough">`
filling `inset: 0` with `zIndex: 9998`. Sighted users tap to dismiss; SR
users hear "Close walkthrough button" overlapping the actual tooltip. The
tooltip has `role="dialog"` (line 259) but `aria-label="Walkthrough"`
ignores `step.title` — screen reader announces only "Walkthrough" rather
than the step heading.
**Fix:** Switch the dialog to `aria-labelledby="walkthrough-step-title"`
with an `id` on the `<h3 className="text-base font-bold...">` at line 294.
Lower-priority: replace the giant scrim "button" with a separate visually-
hidden close affordance announced after the tooltip content.
**Scope:** ~6 lines.

---

## MEDIUM — Disclosure / form patterns

### 6. `LanguageSelector` — dropdown trigger missing aria-expanded / aria-haspopup; items not menuitems
**File:** `src/components/ui/LanguageSelector.tsx:28-89`
**WCAG:** 4.1.2 (A)
**Current:** Trigger button has `aria-label` but no `aria-expanded` or
`aria-haspopup`. Dropdown is a `<div>` (no `role="menu"`), inner items
are `<button>` without `role="menuitem"`. Inner `py-2` items are ~36px
tall — under 44px touch target.
**Fix:** Add `aria-expanded={isOpen} aria-haspopup="listbox"` on the
trigger. Add `role="menu"` to the container and `role="menuitem"` to each
button, or convert to a `<select>`-style combobox.
**Scope:** ~8 lines.

### 7. `NotificationBell` trigger — under-spec haspopup
**File:** `src/components/ui/NotificationBell.tsx:103-121`
**WCAG:** 4.1.2 (A)
**Current:** `aria-haspopup="true"`. The popup is `role="dialog"` so
spec-correct value is `"dialog"`. Button uses `p-2` (8px padding) around
a 16px svg → roughly 32x32px — under the 44x44 mobile guideline.
**Fix:** Change to `aria-haspopup="dialog"` and bump button to
`min-w-[44px] min-h-[44px]` like the rest of the navbar.
**Scope:** 2 lines.

### 8. `ConnectivityStatus` — toasts not announced
**File:** `src/components/ui/ConnectivityStatus.tsx:78-125`
**WCAG:** 4.1.3 Status Messages (AA)
**Current:** "You're offline" / "Back online" / "Offline — viewing cached
version" all render visually with no `role="status"` / `aria-live`.
Screen readers will silently miss the connectivity transition.
**Fix:** Add `role="status" aria-live="polite"` on the toast container
(`<div className="fixed top-4 ...">`). For the persistent banner, add
`role="status"`.
**Scope:** 2 lines.

### 9. `CollaboratorPanel` — user-search input has no label
**File:** `src/components/social/CollaboratorPanel.tsx:211-237`
**WCAG:** 1.3.1 Info and Relationships (A), 3.3.2 Labels or Instructions (A), 4.1.2 (A)
**Current:** `<input>` has only `placeholder="Search users to invite..."`.
No `aria-label`, no associated `<label htmlFor>`. The component never
announces what the field does to SR users.
**Fix:** Add `aria-label="Search users to invite"` (or render a sr-only
label). Also adding `role="search"` to the wrapper helps.
**Scope:** 1 line.

### 10. `ThemePicker` — label without htmlFor; theme buttons rely on `title`
**File:** `src/components/ui/ThemePicker.tsx:17-83`
**WCAG:** 1.3.1 (A), 4.1.2 (A)
**Current:** `<label className="...">Accent Theme</label>` (line 18) has
no `htmlFor` — orphaned. The theme `<button>`s rely on `title={theme.name}`
for the accessible name; the visual swatch + 10px name span aren't
programmatically associated with a button label, and `title` is unreliable
for screen readers (and invisible on touch).
**Fix:** Either drop the `<label>` (since this is a group of buttons, not
a single form field) or change to a `<fieldset><legend>`. Add
`aria-label={theme.name}` to each theme button; mark the swatch and inner
visual `<span>` with `aria-hidden="true"`. Use `aria-pressed={isSelected}`
on each button.
**Scope:** ~10 lines.

### 11. `EditFab` — toggle button missing aria-pressed
**File:** `src/components/ui/EditFab.tsx:16-36`
**WCAG:** 4.1.2 (A)
**Current:** Button toggles edit/view mode. Has `aria-label` and `title`
but no `aria-pressed` so SR users can't tell the current state.
**Fix:** Add `aria-pressed={creatorMode}`.
**Scope:** 1 line.

### 12. `FollowButton` — toggle missing aria-pressed; touch target
**File:** `src/components/social/FollowButton.tsx:48-77`
**WCAG:** 4.1.2 (A), 2.5.5 Target Size (AAA — best practice)
**Current:** Button toggles between "Follow" and "Following" — classic
press-state pattern. No `aria-pressed`. `px-3 py-1.5` with `text-xs` is
~28-32px tall.
**Fix:** Add `aria-pressed={following}` and bump to `min-h-[44px]`.
**Scope:** 2 lines.

### 13. `CommentSection` disclosure missing aria-controls
**File:** `src/components/social/CommentSection.tsx:158-200`
**WCAG:** 4.1.2 (A) — improvement only
**Current:** `aria-expanded` set, but `aria-controls` not linked to the
collapsed panel. Same for the `EditChangelog` and `Navbar.WarningPopover`
disclosure buttons.
**Fix:** Add `aria-controls="comment-panel"` on the trigger and an
`id="comment-panel"` on the collapsed `<div>`. Small but improves SR UX.
**Scope:** 4 lines across three components.

### 14. `EditChangelog` disclosure missing aria-controls (same as 13)
**File:** `src/components/social/EditChangelog.tsx:66-91`
**Scope:** 2 lines.

### 15. `PokemonDropdown` listbox items are not options
**File:** `src/components/report/PokemonDropdown.tsx:107-160`
**WCAG:** 4.1.2 (A)
**Current:** Outer panel has `role="listbox"` but inner `<button>` items
have no `role="option"` and no `aria-selected`. Screen reader sees a
listbox with no options.
**Fix:** Wrap each option `<button>` (or replace with `<li role="option"
aria-selected={isSelected}>`) and set `aria-activedescendant` on the
trigger button when applicable. Minimum fix: `role="option" aria-selected={isSelected}`
on each existing button.
**Scope:** ~6 lines.

---

## MEDIUM — Form input labels

### 16. `AddOpponentInput` — input + textarea unlabeled
**File:** `src/components/report/AddOpponentInput.tsx:85-115`
**WCAG:** 1.3.1 (A), 3.3.2 (A), 4.1.2 (A)
**Current:** Both the opponent-label `<input>` and the paste `<textarea>`
have only `placeholder` — no `<label>`, no `aria-label`.
**Fix:** Add `aria-label={t.opponentLabelPlaceholder}` to the input and
`aria-label={t.pasteOpponentPlaceholder}` to the textarea, OR add visible
`<label htmlFor>` blocks above each.
**Scope:** 2 lines.

### 17. `CalcInput` single-input field unlabeled
**File:** `src/components/report/CalcInput.tsx:359-371`
**WCAG:** 1.3.1 (A), 3.3.2 (A)
**Current:** `<input type="text">` for the calc-entry field has only
placeholder text. No `aria-label`. The paste-mode `<textarea>` (line 215-
227) is similarly unlabeled.
**Fix:** Add `aria-label="Damage calc text"` and `aria-label="Paste calcs"`
respectively.
**Scope:** 2 lines.

### 18. `MatchTracker` form — labels not associated
**File:** `src/components/match-tracker/MatchTracker.tsx:233-336`
**WCAG:** 1.3.1 (A)
**Current:** Four `<label>` elements (Opponent Archetype, Result, Games
Played, Tournament, Notes) have no `htmlFor`. Inputs have no `id` to
match.
**Fix:** Add `id="mt-archetype"` etc. on each input and `htmlFor` on the
corresponding label. For the toggle-button groups (Result, Games Played),
wrap in `<fieldset><legend>` so the group label is announced.
**Scope:** ~12 lines.

### 19. `Profile` avatar URL input — label without htmlFor association
**File:** `src/app/dashboard/profile/page.tsx:282-310`
**WCAG:** 1.3.1 (A)
**Current:** "Profile Picture" `<label>` has no `htmlFor`. The URL input
below has no `id` or `aria-label`. Other fields in the same form (Bio,
Twitter, Discord, YouTube) ARE correctly associated.
**Fix:** Add `id="profile-avatar"` + `htmlFor="profile-avatar"` on the URL
input, or `aria-label="Avatar URL"`.
**Scope:** 2 lines.

### 20. `Feedback` type selector — buttons missing aria-pressed
**File:** `src/app/feedback/FeedbackContent.tsx:196-223`
**WCAG:** 4.1.2 (A)
**Current:** Type cards (`Feature Request`, `Bug Report`, `Improvement`,
`Other`) act as a single-select radio group but render as plain `<button>`
without `role="radio"` or `aria-pressed`.
**Fix:** Wrap in `role="radiogroup"` with `aria-label="Feedback type"`,
add `role="radio" aria-checked={type === t.value}` per button.
**Scope:** ~6 lines.

---

## MEDIUM — Touch targets

### 21. `Toggle` switch height — 24px
**File:** `src/components/ui/Toggle.tsx:7-28`
**WCAG:** 2.5.5 Target Size (AAA — best practice on mobile)
**Current:** The switch button is `h-[24px] w-[42px]`. The wrapper has
`min-h-[36px]` but the button itself is the click target.
**Fix:** Either wrap with a `<label>` whose tap surface is min 44x44, or
add an invisible padded hit area on the button (`p-2` with negative
margin). At minimum bump switch wrapper to `min-h-[44px]`.
**Scope:** 1 line.

### 22. `ReportCard` like / save buttons — 32px tall
**File:** `src/components/explore/ReportCard.tsx:313-369`
**WCAG:** 2.5.5 (AAA)
**Current:** Like button: `min-h-[32px]`. Save button: `min-h-[32px]`.
Both render inside a card-link, where mis-tap → unintended navigation.
**Fix:** Bump to `min-h-[44px]` and increase `gap` so the two buttons
don't overlap.
**Scope:** 2 lines.

### 23. `PageNavbar` desktop nav links — ~30px
**File:** `src/components/layout/PageNavbar.tsx:53-65`
**Current:** `px-3 py-1.5 text-xs` → ~28-32px.
**Fix:** Add `min-h-[44px]` to nav links (only matters on touch laptops).
**Scope:** 1 line.

### 24. `LanguageSelector` dropdown items — 36px
**File:** `src/components/ui/LanguageSelector.tsx:52-78`
**Current:** `py-2 text-sm` rows ≈ 36px tall.
**Fix:** Bump to `py-2.5` or `min-h-[44px]`.
**Scope:** 1 line.

---

## LOW — Polish

### 25. `Button` — md / lg sizes lack min-h-[44px]
**File:** `src/components/ui/Button.tsx:21-26`
**Current:** Only `sm` has `min-h-[44px]`. `md` is `py-2.5 text-sm` ≈ 40px,
`lg` is `py-3 text-base` ≈ 48px (passes). The `md` default many call sites
rely on may be under target on small fonts.
**Fix:** Add `min-h-[44px]` to `md`.
**Scope:** 1 line.

### 26. `PokemonDropdown` listbox missing aria-activedescendant flow
**File:** `src/components/report/PokemonDropdown.tsx:107-160`
**Current:** Listbox does not support keyboard navigation (arrow keys,
Enter to select). Only mouse click works.
**Fix:** Add `onKeyDown` to the trigger to navigate `aria-activedescendant`,
mirroring `InlinePokemonEditor`. (Larger scope — flag, don't necessarily
do this run.)
**Scope:** ~40 lines (skip if >30-line limit).

### 27. `DiffNavigator` — no live announcement of change navigation
**File:** `src/components/ui/DiffNavigator.tsx:62-118`
**Current:** "1/N" counter updates and scrolls a target into view, but
nothing is announced to SR users about the new context (e.g. "Now showing
change 2 of 5: Iron Hands moves").
**Fix:** Add a visually-hidden `aria-live="polite"` region inside the
component that updates when `index` changes.
**Scope:** ~6 lines.

### 28. `ShareModal` — embed snippet `<div role="button">` lacks focus ring
**File:** `src/components/ui/ShareModal.tsx:651-657`
**Current:** The URL display row and embed snippet box are `<div
role="button" tabIndex={0}>` with handlers but no visible focus state.
Tabbing through hits an invisible focus.
**Fix:** Add `focus-visible:ring-2 focus-visible:ring-accent/40
focus-visible:outline-none` to the wrapper.
**Scope:** 2 lines.

### 29. `PullToRefresh` — visual indicator not announced
**File:** `src/components/ui/PullToRefresh.tsx:72-99`
**Current:** Refreshing state is purely visual. No `role="status"` for SR
users.
**Fix:** Add `role="status" aria-live="polite"` and a visually-hidden
"Refreshing" message when `refreshing` is true.
**Scope:** 3 lines.

---

## TOP 5 HIGHEST-IMPACT (per task brief)

Each is ≤30 lines of change and addresses critical SR/keyboard gaps:

1. **InstallPrompt → real dialog** (finding #1). The most visible recurring
   modal on the site fully lacks dialog semantics. ~20 LoC.
2. **ConnectivityStatus → live region** (finding #8). Two `<div>` toasts
   silently appear; trivial fix unlocks important offline signal for SR. 2 LoC.
3. **AddOpponentInput + CalcInput → input labels** (findings #16, #17). Two
   power-user inputs with placeholder-only labels; combined ~4 LoC.
4. **ShortcutHintOverlay → dialog role + focus management** (finding #2).
   Keyboard-shortcut help is keyboard-essential UI; ironically inaccessible
   today. ~15 LoC.
5. **ThemePicker → real button labels + pressed state** (finding #10).
   `title` is unreliable for SR + touch; ~10 LoC.

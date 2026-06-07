# Wave 1 R8 — Accessibility Audit (Fresh Eyes)

Static analysis only. Project has done a11y passes in v5.13, v5.14, v5.18, v5.19, v5.20, v5.22 — these findings are issues those passes did not catch.

Scope: `src/components/**`, `src/app/**/page.tsx`, `src/app/**/*Content.tsx`. WCAG 2.1 AA.

---

## HIGH IMPACT (one fix = many users helped)

1. **`src/app/dashboard/privacy/page.tsx:136`** — Account deletion confirmation modal has no `role="dialog"`, no `aria-modal`, no `aria-labelledby`, no focus trap, no focus restore. The `<h3>` title at line 138 ("Permanently delete your account?") is not associated with the dialog.
   - Fix: add `role="dialog" aria-modal="true" aria-labelledby="delete-modal-title"` to the inner container at line 137; give the `<h3>` `id="delete-modal-title"`; capture `document.activeElement` on open and `.focus()` it on close; trap Tab inside the modal.
   - This is the most dangerous modal in the app (irreversible action) and is the least accessible. Screen reader users get no announcement that a dialog has opened.
   - WCAG: 1.3.1 Info and Relationships, 2.4.3 Focus Order, 4.1.2 Name, Role, Value
   - Effort: 15 minutes

2. **`src/components/ui/InstallPrompt.tsx:112`** and **`src/components/ui/ShortcutHintOverlay.tsx:57`** — Both are full-screen modal overlays with NO `role="dialog"`, no `aria-modal`, no `aria-labelledby`, no focus management.
   - Fix: wrap each modal container with `role="dialog" aria-modal="true" aria-labelledby="..."` and give the heading inside an id. Restore focus to the triggering element on dismiss.
   - InstallPrompt blocks the entire UI; assistive tech users may not even know it appeared.
   - WCAG: 4.1.2 Name, Role, Value; 2.4.3 Focus Order
   - Effort: 10 minutes each

3. **`src/components/report/InlinePokemonEditor.tsx:132`, `src/components/social/VersionHistoryPanel.tsx:167`, `src/components/ui/NotificationBell.tsx:126`, `src/components/ui/WalkthroughOverlay.tsx:259`, `src/components/report/SlideNavControls.tsx:419`** — Dialogs have `role="dialog"` and `aria-label` but are missing `aria-modal="true"`. Most also lack focus restore on close.
   - Fix: add `aria-modal="true"` to every `role="dialog"` element. Add `previouslyFocusedRef` pattern (capture on open, focus on close) — already implemented correctly in `ShareModal.tsx` and `OTSSheetModal.tsx`, so copy that pattern.
   - WCAG: 4.1.2 Name, Role, Value; 2.4.3 Focus Order
   - Effort: 20 minutes total

4. **`src/components/compare/CompareContent.tsx:415` and `:434`** — Two large textarea inputs for pasting Team A / Team B paste data. Each has a visual `<label>` above (lines 405, 424) but with NO `htmlFor` and the `<textarea>` has no `id`, no `aria-label`, no `aria-labelledby`. The visual association is invisible to screen readers.
   - Fix: add `id="paste-team-a"` / `id="paste-team-b"` to the textareas; add matching `htmlFor` to the labels at lines 405 and 424.
   - WCAG: 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions
   - Effort: 2 minutes

5. **Multiple unlabeled large content textareas**:
   - `src/components/input/PasteInput.tsx:395` (the main team paste input on the homepage)
   - `src/components/report/TeamOverview.tsx:170` (URL/paste editor) and `:649` (team summary)
   - `src/components/report/CalcInput.tsx:215` (bulk calc paste) and `:359` (single calc input)
   - `src/components/report/AddOpponentInput.tsx:109` (opponent paste)
   - `src/components/report/MatchupPlanSlide.tsx:681` (game plan notes), `:742` (replay URL)
   - `src/components/report/PokemonDetailSlide.tsx:147, :855` (edit and notes)
   - None of these have `aria-label`, `aria-labelledby`, or an associated `<label htmlFor>`. Placeholder text is not a substitute (WCAG explicitly excludes placeholder as an accessible name).
   - Fix: add `aria-label="Paste team data"` / `"Team notes"` / etc. to each textarea/input.
   - WCAG: 4.1.2 Name, Role, Value; 3.3.2 Labels or Instructions
   - Effort: 5 minutes per textarea (~30 minutes total)

6. **`src/components/ui/Toggle.tsx:15`** — The switch button is `h-[24px] w-[42px]` = 24×42px. This is the only tap target; the surrounding wrapper is `min-h-[36px]` (still under 44px). Used 4× on `/dashboard/notifications`, plus inside `ShareModal` allowComments, and likely elsewhere.
   - Fix: enlarge hitbox to 44×44 with `before` pseudo-padding, OR wrap the entire row in a clickable button. Don't shrink the visual switch — just expand the touch area.
   - WCAG: 2.5.5 Target Size (AAA, but commonly enforced at AA)
   - Effort: 5 minutes

7. **`src/components/explore/ExploreFilters.tsx:244`** — "Clear search" button is `w-6 h-6` = 24×24px. Critical control on Explore search field.
   - Fix: bump to `min-w-[44px] min-h-[44px]` with the icon centered inside.
   - WCAG: 2.5.5 Target Size
   - Effort: 1 minute

## MEDIUM IMPACT

8. **Heading hierarchy: h1 → h3 with no h2** on multiple pages.
   - `src/app/dashboard/DashboardContent.tsx`: `<h1>` at line 130 ("Dashboard"), next heading is `<h3>` at line 609 (report card titles) and 1143 (collection names). No `<h2>` to introduce sections like "Your Reports" / "Collections".
   - `src/components/compare/CompareContent.tsx`: `<h1>` at line 394 then `<h3>` at line 481 (Team A / Team B). Also a stray `<h4>` at line 224 with no preceding h3.
   - `src/app/dashboard/profile/page.tsx`: `<h1>` at line 245 then `<h3>` for the creator name preview at line 107 (rendered inside the preview card).
   - Fix: replace the first `<h3>` in each section with `<h2>`, OR add a visually-hidden `<h2 className="sr-only">` per section ("Your Reports", "Collections", "Team A").
   - WCAG: 1.3.1 Info and Relationships, 2.4.6 Headings and Labels
   - Effort: 10 minutes

9. **Report grid uses non-semantic container** — `src/components/explore/ExploreContent.tsx:191` renders the list of `ReportCard` items inside `<motion.div className="grid ...">`. Same for the dashboard grids at `DashboardContent.tsx` (lines ~600+).
   - Fix: use `<ul>` + `<li>` (or `role="list"` + `role="listitem"` on the motion components). Helps screen-reader users get item count and "list of N reports".
   - Also the "delete confirm" two-button group in DashboardContent (lines 701-716) is a `<div>` — fine, but the bookmark/like toolbar in `ReportCard` (lines 312-356) should be a `role="group" aria-label="Report actions"`.
   - WCAG: 1.3.1 Info and Relationships
   - Effort: 10 minutes

10. **Unlabeled inputs on dashboard/profile**:
    - `src/app/dashboard/privacy/page.tsx:142` — "Type DELETE to confirm" input has only placeholder, no label/aria-label.
    - `src/app/dashboard/profile/page.tsx:304` — avatar URL input has only placeholder, no label/aria-label.
    - `src/components/social/CollaboratorPanel.tsx:212` — "Search users to invite" input lacks `aria-label`.
    - `src/components/report/InlinePokemonEditor.tsx:162` — Pokemon search lacks `aria-label`.
    - Fix: add `aria-label` to each.
    - WCAG: 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value
    - Effort: 5 minutes total

---

## Summary

Most of the audit's old wins held up — div/span misuse is largely absent (only intentional `role="button"` + `tabIndex={0}` + `onKeyDown` patterns remain in 5 spots and those are correctly implemented). Buttons consistently have `type="button"`, `aria-label`, and reasonable touch targets in newer code.

The remaining gaps cluster around (a) modals that escaped the OTSSheet/ShareModal pattern — privacy delete, InstallPrompt, ShortcutHintOverlay, InlinePokemonEditor, NotificationBell, VersionHistoryPanel, WalkthroughOverlay, SlideNavControls overflow sheet — most lack `aria-modal`, focus trap, or focus restore; and (b) freeform content inputs (the textareas where users paste team data, write notes, etc.) where placeholder text was assumed to function as a label. Two touch-target violations exist (Toggle switch, Explore clear-search button). Heading hierarchy on Dashboard, Compare, and Profile skips h2.

Highest priority: the **dashboard/privacy delete-account modal** (#1) — it controls an irreversible destructive action and is the least accessible modal in the codebase. Fix that, then sweep `aria-modal` onto the other dialogs (#3) and add labels to the content textareas (#5).

# R8 Accessibility Audit — VGC Team Report

Static analysis only. Surveyed: `src/components/report/*`, `src/components/social/*`, `src/components/ui/*`, plus key app routes. Target: WCAG 2.1 AA.

## Top 5 Actionable Bugs

### 1. `<textarea>` strips its focus ring entirely
**File:** `src/components/report/PokemonDetailSlide.tsx:156`
The inline calc-edit textarea uses `bg-transparent border-none outline-none` with **no** `focus-visible` replacement. Keyboard users get zero focus indication while editing — fails WCAG 2.4.7.
**Fix (<5 min):** Append `focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded` (or a left border highlight) to the class string.

### 2. Remove-matchup icon button missing accessible name
**File:** `src/components/report/MatchupSheetRow.tsx:113-125`
Icon-only delete button has `title={t.removeMatchup}` but no `aria-label`. Screen readers announce it as "button" only — `title` is unreliable on touch/SR.
**Fix (<5 min):** Add `aria-label={t.removeMatchup}` to the `<button>`.

### 3. Modal backdrop divs swallow clicks with no keyboard equivalent
**Files:** `src/components/ui/WalkthroughOverlay.tsx:225`, `src/components/social/VersionHistoryPanel.tsx:149`
A bare `<div onClick={onClose/onSkip}/>` with no `role`, `tabIndex`, or key handler. Keyboard users can't dismiss; SRs don't see it.
**Fix (<15 min):** Add `role="button" aria-label="Close" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') onClose(); }}` — or rely solely on the existing Escape handler (`ShareModal` and `OTSSheetModal` already do this correctly).

### 4. TeamOverview inputs/selects have no `<label>` (visible or sr-only)
**File:** `src/components/report/TeamOverview.tsx:495-575`
Team name, tournament name, placement, record, rental code, creator name, Regulation/EventType selects — all rely on `placeholder` text only. Placeholder is **not** an accessible label (WCAG 1.3.1, 4.1.2). Six+ form fields affected on the primary creator surface.
**Fix (<20 min):** Wrap each input with `<label className="sr-only" htmlFor="...">…</label>` matched by an `id`, or add `aria-label="Team name"` etc. — the feedback page (`FeedbackContent.tsx:234-301`) already shows the right pattern.

### 5. Category/delete buttons on calc entries are 32x32 px on mobile
**File:** `src/components/report/PokemonDetailSlide.tsx:196, 219`
Class `h-8 w-8 sm:h-9 sm:w-9` = 32 px below `sm:` breakpoint. Apple HIG / WCAG 2.5.5 AAA recommends 44 px; AA target-spacing rule requires ≥24 px **plus** adequate spacing — these sit shoulder-to-shoulder in a segmented control with `gap-0.5`, well under the 24 px clearance.
**Fix (<10 min):** Promote to `h-11 w-11 sm:h-9 sm:w-9` (matches the `min-h-[44px]` pattern already used in `MatchupSheetRow`, `OTSSheetModal`, `WhatsNewModal`).

## Broader Recommendations

**A. Introduce a reusable `<IconButton>` primitive.** Codebase has 40+ ad-hoc icon buttons; size, focus-ring, and `aria-label` requirements are inconsistently applied (`EditFab` is great; `MatchupSheetRow` and `PdfExport.tsx:234` are not). A single component enforcing `min-h-[44px] min-w-[44px]`, `focus-visible:ring-2`, and a required `aria-label` prop would eliminate an entire bug class. Co-locate with existing `Button.tsx`.

**B. Add a `<FormField>` wrapper for labelled inputs.** Every input in `TeamOverview`, `AddOpponentInput`, `CalcInput`, `CommentSection`, and `CollaboratorPanel` (search) lacks a label. A `<FormField label="…" srOnly>` wrapper that emits a `<label htmlFor>` + `id` on the child would fix ~15 fields and prevent regressions. Already partially modelled on the Feedback page — extract and reuse.

**C. Audit text-on-text-tertiary stacking.** `text-text-tertiary` appears on `bg-surface-alt`, on `text-text-tertiary/30` thumbs (SlideNavControls:291), and on `text-text-tertiary/70` (PokemonDetailSlide:682). Without resolving the token values you can't be sure, but a single token-contrast probe (one matrix render in Storybook or a CI check using `@axe-core/playwright` on `/`, `/explore`, `/champions/…`) would catch borderline pairings cheaply. The `/api/sprite` proxy already gives you a clean DOM target.

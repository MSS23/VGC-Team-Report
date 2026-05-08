# WCAG 2.1 AA Static Accessibility Audit — VGC Team Report

**Audit date:** 2026-05-07
**Scope:** Static source analysis only (no live browser testing)
**Standard:** WCAG 2.1 Level AA
**Auditor:** Automated static analysis (Claude)

**Files audited:**
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/s/[id]/page.tsx`
- `src/app/explore/page.tsx` + `src/components/explore/ExploreContent.tsx`
- `src/components/ui/ShareModal.tsx`
- `src/components/ui/Button.tsx`
- `src/components/social/ReactionBar.tsx`
- `src/components/social/SaveButton.tsx`
- `src/components/social/CreatorLink.tsx`
- `src/components/social/ViewCount.tsx`
- `src/components/social/CommentSection.tsx`
- `src/components/social/CollaboratorPanel.tsx`
- `src/components/social/FollowButton.tsx`
- `src/components/social/VersionHistory.tsx`
- `src/components/social/EditChangelog.tsx`

---

## Severity legend

| Level | Meaning |
|-------|---------|
| **Critical** | Clear WCAG 2.1 AA failure; blocks AT users |
| **High** | Very likely failure; requires manual verification to confirm |
| **Medium** | Best-practice gap; degraded but not blocked AT experience |
| **Low** | Minor / informational; no direct AT blocker |

---

## Findings

---

**[WCAG 4.1.2 Name, Role, Value / 2.1.2 No Keyboard Trap]** `src/app/page.tsx:1527–1586` — Export theme picker modal rendered as a plain `<div>` with no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby`, and no focus trap. Backdrop click closes it but `Escape` key does not (no keydown handler). Screen readers will read background content; keyboard users cannot navigate within the modal or dismiss it without a mouse. — Severity: **Critical**

**[WCAG 1.3.1 Info and Relationships / 4.1.2 Name, Role, Value]** `src/components/social/CommentSection.tsx:199–228` — The comment form contains two unlabelled inputs: the `<input type="text">` for display name (line 200) and the `<textarea>` for the comment body (line 210). Neither has a `<label>`, `aria-label`, or `aria-labelledby`. The `placeholder` attribute is not a substitute for a label per WCAG. — Severity: **Critical**

**[WCAG 4.1.2 Name, Role, Value]** `src/components/ui/ShareModal.tsx:435–475` — The "List on Explore" toggle and the "Enable comments" toggle (lines 536–561) use `<button role="switch" aria-checked={...}>` — these are implemented correctly. However, the toggle buttons use `disabled` in combination with `role="switch"`, and when `disabled` the `aria-checked` state is still present but interaction is blocked without announcing the reason. The `title` attribute on the public/private button at `src/app/page.tsx:1206` is used as a tooltip for mouse users but is not reliably exposed by all screen readers as an accessible description. — Severity: **High**

**[WCAG 4.1.2 Name, Role, Value]** `src/app/page.tsx:1487–1494` — Edit URL toast close button contains only an SVG (X icon) with no `aria-label` and no `aria-hidden` on the SVG. Screen readers will announce "button" with no name. Fix: add `aria-label="Dismiss edit link toast"` and `aria-hidden="true"` on the SVG. — Severity: **High**

**[WCAG 4.1.3 Status Messages]** `src/app/page.tsx:1589–1600` — PokéPaste error toast is rendered as a plain `<div>` with no `role="alert"` and no `aria-live="assertive"`. The error message will not be announced to screen reader users when it appears dynamically. Fix: add `role="alert"` to the toast container. — Severity: **High**

**[WCAG 1.3.1 Info and Relationships]** `src/components/explore/ExploreContent.tsx:122` — The `<main>` landmark is placed inside a `<div class="min-h-screen">` wrapper. In the same rendering tree, `src/app/layout.tsx:127` wraps all children with `<div id="main-content">` (no role). When `ExploreContent` renders its own `<main>`, it becomes a nested `<main>` inside the layout wrapper, which already contains a `<main>` from other routes. A page should have exactly one `<main>` landmark. The layout wrapper `<div id="main-content">` should carry `role="main"` instead, and individual page components should not add another `<main>`. — Severity: **High**

**[WCAG 2.4.1 Bypass Blocks]** `src/app/layout.tsx:100,127` — The skip link targets `#main-content` which resolves to a `<div id="main-content">`. This `<div>` has no `tabindex="-1"`, so browsers that do not natively focus plain `<div>` targets will silently skip the skip link. Additionally, the `<div>` has no `role="main"`, so it is not a landmark region. Fix: add `tabIndex={-1}` to `<div id="main-content">` or move the `id` to the `<main>` element inside each page. — Severity: **High**

**[WCAG 4.1.2 Name, Role, Value]** `src/components/social/CollaboratorPanel.tsx:246–251` — The "Remove" button for a collaborator carries only the text "Remove" with a `title="Remove access"`. When multiple collaborators are listed the buttons are identical in accessible name — screen reader users cannot distinguish which user each button removes. Fix: `aria-label={`Remove ${collab.name}`}`. — Severity: **High**

**[WCAG 4.1.2 Name, Role, Value]** `src/components/social/CommentSection.tsx:256–261` — Per-comment "Delete" and "Flag" buttons carry only text labels ("Delete", "Flag") with no accessible context identifying which comment they act on. When multiple comments are listed, screen reader users cannot distinguish between buttons. Fix: `aria-label={`Delete comment by ${comment.displayName}`}` and `aria-label={`Report comment by ${comment.displayName}`}`. — Severity: **High**

**[WCAG 2.5.5 Target Size / Project UI standards (44×44px min)]** `src/app/page.tsx:892` — Welcome-back banner close button is `w-6 h-6` (24×24 CSS px). `src/components/ui/ShareModal.tsx:249–259` — "Dismiss thank you message" button is also sized as `min-w-[44px] min-h-[44px]` — this one is correct. However, at `src/app/page.tsx:1487` the edit URL toast close button has no explicit size constraints. The project's own UI/UX standards mandate 44×44px minimum. — Severity: **High**

**[WCAG 4.1.3 Status Messages]** `src/components/social/CommentSection.tsx:230–235` — The "Comment posted!" success message and "Failed to post comment" error message are rendered with `animate-fade-in` but no `role="status"` or `aria-live`. Screen reader users will not be notified when a comment is successfully posted or when posting fails. Fix: wrap in a `<div role="status" aria-live="polite">` for success, `role="alert"` for error. — Severity: **Medium**

**[WCAG 1.1.1 Non-text Content]** `src/components/social/ViewCount.tsx:11–14` — The eye/view icon SVG inside `<ViewCount>` has no `aria-hidden="true"`. The parent `<span>` has no accessible label contextualising that the number is a view count. A screen reader will announce the SVG path data (or nothing) followed by the count number. Fix: add `aria-hidden="true"` to the SVG and `aria-label={`${count} views`}` to the outer `<span>`. — Severity: **Medium**

**[WCAG 1.1.1 Non-text Content]** `src/components/social/CreatorLink.tsx:14–17` — The user icon SVG inside `<CreatorLink>` has no `aria-hidden="true"`. Because the adjacent `<span>` contains the creator name as visible text, the link already has an accessible name from its text content. The SVG is purely decorative here and should be `aria-hidden="true"`. — Severity: **Medium**

**[WCAG 4.1.2 Name, Role, Value]** `src/components/social/CollaboratorPanel.tsx:133–154` — The "Manage Access" toggle button does not carry `aria-expanded` to reflect whether the panel is open or closed. The chevron rotation is a visual-only affordance. Fix: add `aria-expanded={open}`. — Severity: **Medium**

**[WCAG 4.1.2 Name, Role, Value]** `src/components/social/EditChangelog.tsx:67–90` — The "Version History" toggle button does not carry `aria-expanded`. Same issue as CollaboratorPanel. Fix: add `aria-expanded={open}`. Also applies to `src/components/social/VersionHistory.tsx:82–93` (the collapsed button) and `src/components/social/CommentSection.tsx:164–193` (comments accordion). — Severity: **Medium**

**[WCAG 4.1.2 Name, Role, Value]** `src/components/social/FollowButton.tsx:49–78` — The Follow/Unfollow button uses `disabled` + opacity for the loading state but does not communicate the loading state to AT. When loading, `aria-busy="true"` or an `aria-label` update would inform screen reader users that an action is in progress. — Severity: **Low**

**[WCAG 1.1.1 Non-text Content]** `src/components/social/CollaboratorPanel.tsx:183` — The user avatar `<img src={user.imageUrl} alt="" .../>` correctly uses empty `alt` for a decorative avatar. This is correct. However, the avatar initials fallback `<div>` at line 225 has no `aria-hidden`, so screen readers may announce the single letter character as content. Fix: `aria-hidden="true"` on the initials `<div>` since the name is already exposed in the adjacent `<span>`. — Severity: **Low**

**[WCAG 2.4.6 Headings and Labels]** `src/components/ui/ShareModal.tsx:208–211` — The close button has `aria-label="Close"`, which is acceptable per WCAG but provides no context about what is being closed. Because the modal now has a correct `aria-labelledby` linking to the dialog title, AT users do receive context from the dialog role itself. This is a low-priority polish item; `aria-label="Close share modal"` is more descriptive. — Severity: **Low**

**[WCAG 1.3.1 Info and Relationships]** `src/app/page.tsx:975` — `aria-hidden` attribute written as bare JSX boolean (`aria-hidden` without `="true"`). In React this compiles to `aria-hidden={true}` which is correct, but it is worth noting that the string form `aria-hidden="true"` is the canonical HTML form. No runtime impact in React 19. — Severity: **Low**

**[WCAG 2.4.3 Focus Order]** `src/components/social/CommentSection.tsx:254–275` — Comment action buttons ("Delete", "Flag") are only visible on hover (`opacity-0 group-hover:opacity-100`). They are still in the tab order when hidden (no `tabIndex={-1}` applied when invisible). Keyboard-only users will focus invisible buttons, which is a confusing and broken experience. Fix: conditionally apply `tabIndex={-1}` when the buttons are visually hidden, or always show them (perhaps smaller) so they are consistently focusable. — Severity: **High**

---

## Positive observations (correctly implemented)

- `lang="en"` on `<html>` — `src/app/layout.tsx:94` — correct.
- Skip-to-content link — `src/app/layout.tsx:100` — present with correct `sr-only focus:not-sr-only` pattern.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` and full focus trap on `ShareModal` — `src/components/ui/ShareModal.tsx:189–193,100–138` — well implemented.
- `role="switch"` + `aria-checked` on visibility and comments toggles in ShareModal — correct.
- `role="status" aria-live="polite"` on version comparison "no differences" banner — `src/app/page.tsx:971–972` — correct.
- `aria-hidden="true"` on PDF print container — `src/app/page.tsx:1607` — correct.
- `viewport` meta allows user scaling — `userScalable: true`, `maximumScale: 5` — correct.
- `aria-label` on welcome-back banner close button — `src/app/page.tsx:892` — present.
- `aria-label` on SaveButton authenticated state — `src/components/social/SaveButton.tsx:98` — present.
- `aria-label="Like report"` on guest ReactionBar — `src/components/social/ReactionBar.tsx:117` — present.
- `Button.tsx` has `focus-visible:ring-2 focus-visible:ring-accent/50` — focus ring always applied to primary interactive component.
- `rel="noopener noreferrer"` on all external `target="_blank"` links in ShareModal — correct.
- Escape key handler in ShareModal closes the dialog — `src/components/ui/ShareModal.tsx:111–115` — correct.

---

## Remediation priority

| Priority | Finding | File:approx-line | Effort |
|----------|---------|-------------------|--------|
| P0 | Export theme picker modal: missing dialog semantics + focus trap | `page.tsx:1527` | Medium |
| P0 | Comment form inputs: no labels | `CommentSection.tsx:200,210` | Low |
| P0 | Comment action buttons focusable when visually hidden | `CommentSection.tsx:254` | Low |
| P1 | Edit URL toast close button: no aria-label | `page.tsx:1487` | Trivial |
| P1 | PokéPaste error toast: no role=alert | `page.tsx:1589` | Trivial |
| P1 | Multiple `<main>` landmarks (layout + ExploreContent) | `layout.tsx:127 / ExploreContent.tsx:122` | Low |
| P1 | Skip link `<div>` target missing tabindex=-1 | `layout.tsx:127` | Trivial |
| P1 | Collaborator "Remove" buttons: non-unique accessible names | `CollaboratorPanel.tsx:246` | Trivial |
| P1 | Comment "Delete"/"Flag" buttons: non-unique accessible names | `CommentSection.tsx:256` | Trivial |
| P1 | Welcome-back banner close: 24×24px touch target | `page.tsx:892` | Low |
| P2 | Comment posted/failed: no live region | `CommentSection.tsx:230` | Low |
| P2 | ViewCount SVG not aria-hidden; span lacks accessible label | `ViewCount.tsx:11` | Trivial |
| P2 | CreatorLink SVG not aria-hidden | `CreatorLink.tsx:14` | Trivial |
| P2 | CollaboratorPanel toggle: missing aria-expanded | `CollaboratorPanel.tsx:133` | Trivial |
| P2 | EditChangelog / VersionHistory / CommentSection toggles: missing aria-expanded | multiple | Trivial |
| P3 | Collaborator initials fallback div: missing aria-hidden | `CollaboratorPanel.tsx:225` | Trivial |
| P3 | FollowButton: no aria-busy during loading | `FollowButton.tsx:49` | Trivial |
| P3 | ShareModal close button: generic "Close" label | `ShareModal.tsx:208` | Trivial |

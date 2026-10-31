## Source
`.swarm/r8-accessibility-26-10-26.md` SERIOUS #4.

## Finding
`src/components/report/SlideNavControls.tsx:426-442` renders `role="dialog"` with:
- no focus move on open
- no focus trap
- no focus return on close
- no `aria-modal`
- and it is rendered **before** its own trigger in DOM order, so keyboard and screen-reader users reach the dialog before the control that opens it

It matters more than a typical dialog because **on mobile this is the only route to the Base/Mega toggle** — a keyboard or screen-reader user has no other way to switch forms.

## Fix
Port the focus trap that already exists and is correct in `src/components/home/HomePageClient.tsx:381-422`. Reusing that implementation keeps the two consistent and is less work than writing a new one; consider extracting it so there is one trap in the codebase rather than two.

## Related, same report
`SpeedTierChart.tsx` has 11 toggles and zero `aria-pressed` (:124, :473, :489) — toggle state is conveyed by colour alone, which makes the speed numbers meaningless to a screen-reader user. Worth folding into the same pass.

---
*Filed automatically by the overnight swarm, run 26-10-26.*

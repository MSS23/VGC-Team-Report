# [A11y] Focus rings measure 1.49-3.05:1 across 49 controls that clear the default outline

- **Priority:** Urgent
- **Labels:** auto-research, Accessibility
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/r8-accessibility-02-11-26.md` — one of 6 blocking WCAG 2.1 AA failures found this run. Filed separately from VGC-315/316 because it is an independent cause with an independent fix.

## Finding

**49 controls** use `focus:outline-none` and replace the browser default with a ring whose contrast against its adjacent background measures **1.49:1 to 3.05:1**. WCAG 2.1 AA requires **3:1** for focus indicators (SC 1.4.11 Non-text Contrast), so effectively all 49 fail or sit on the boundary.

This matters more than a typical contrast miss: a keyboard user who cannot see the focus ring cannot tell where they are on the page at all. The project's own UI standards in `CLAUDE.md` require visible focus rings.

## Fix direction

Introduce a single focus-ring token that is guaranteed to clear 3:1 against every surface it lands on, in both light and dark mode, and apply it at all 49 sites instead of per-component ring colours. The audit report has the measured ratios per control.

**Sequence this after VGC-316** (`@custom-variant dark`), for the same reason that ticket gives: until the `dark:` variant is wired to `[data-dark-mode]`, any `dark:`-qualified ring colour is applied under the wrong condition, so measuring or fixing dark-mode rings first would be wasted work.

## Verification caveat

The swarm container has no browser, so the ratios are computed from the resolved CSS custom-property values rather than observed on screen. The arithmetic is reliable; the visual result still wants one human pass with a keyboard.

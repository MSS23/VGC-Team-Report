# [Bug] Collaborative sync status is plumbed through three layers and then never rendered

- **Priority:** High
- **Labels:** auto-research, Bug, Web App
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/c1-dead-code-02-11-26.md` — found as an apparently-unused variable, but it is a **missing feature**, not dead code. Do not delete it.

## Finding

`syncStatus` is threaded `useCollaborativeSync` -> `useHomePage` -> `HomePageClient:925` -> `Navbar.tsx:68,186` and then **never rendered**.

So on a collaborative report, the user has **no indication of sync state at all** — no "saving", no "synced", no "reconnecting", no "offline". On a feature whose whole premise is two people editing the same report, silence about whether your changes have landed is a real usability gap, and it is the kind of thing that erodes trust in an editor.

The plumbing is already there; only the presentation is missing.

## Fix

Render it in the navbar at the existing `syncStatus` call site. Needs a small design decision on the states to show and their wording, which is why this is a ticket and not a swarm auto-fix.

Should respect `prefers-reduced-motion` (no spinner for users who opt out) and carry an `aria-live` region so screen-reader users get the same information, per the project's UI standards.

## Siblings

The same audit found `onResultChange` and `selectedTemplate` in the same state — already ticketed, still unfixed. Worth handling the three together as one "plumbed but unrendered" pass.

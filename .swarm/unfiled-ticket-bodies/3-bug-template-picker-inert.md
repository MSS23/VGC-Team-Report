## Source
`.swarm/c1-dead-code-26-10-26.md`. Same class as the MatchupPlanSlide `onResultChange` finding filed alongside this.

## Finding
`src/components/input/PasteInput.tsx` (lines ~90-91 and ~120) destructures `selectedTemplate` and `onTemplateSelect` and never uses either. The parent passes real values.

**Symptom for a user: the template picker appears functional and does nothing when used.**

This is on the app's primary entry surface — the paste box is the first thing a new user touches — so a visibly inert control here is worse than it looks.

## Fix
Wire the props to the paste box's content, or remove the picker deliberately. Check the parent to see what `selectedTemplate` is meant to contain before deciding.

---
*Filed automatically by the overnight swarm, run 26-10-26.*

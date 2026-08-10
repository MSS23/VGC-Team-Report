# Merge Conflict Log — swarm-nightly-2026-05-28
No conflicts at branch creation (cut fresh from main).

# Swarm run 2026-08-10

## ⚠️ Intra-run file overlap — MY DISPATCH ERROR, must be reconciled at integration

VGC-262 (EV→SP converter) returned `conflict_risk: true` and listed three files that the still-running
VGC-258 agent also owns:

- `src/app/sitemap.ts`
- `src/app/champions/ChampionsContent.tsx`
- `src/components/layout/PageFooter.tsx`

Cause: I told the VGC-262 agent to "link it from somewhere discoverable" and "add it to sitemap.ts"
WITHOUT constraining which files it could use, while separately telling the VGC-258 agent to edit the
footer, the sitemap and ChampionsContent. That violates the file-overlap control in the run spec —
the two agents were dispatched against overlapping file sets. VGC-262's own report caught it; the
dispatch design should have.

Both agents do read-modify-write against the SAME working tree, so whichever wrote last wins and the
earlier agent's edit to that file can be silently lost.

RECONCILIATION REQUIRED once VGC-258 reports — verify in the integrated tree that ALL of these
survived, and re-apply by hand if not:
1. `sitemap.ts` contains BOTH the `/tools/ev-to-sp` entry (VGC-262) AND the Reg M-B champions
   routes (VGC-258).
2. `PageFooter.tsx` contains BOTH the `/tools/ev-to-sp` link (VGC-262) AND the `/champions`
   link (VGC-258).
3. `ChampionsContent.tsx` contains BOTH the converter callout (VGC-262) AND the M-B index grid plus
   the Indianapolis past-tense fix (VGC-258).

This is exactly why the sequential commit loop re-gates from the integrated tree rather than trusting
each agent's isolated green run.

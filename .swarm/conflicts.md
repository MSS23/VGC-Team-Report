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

## RESOLVED — verified in the integrated tree at 02:0x, 2026-08-10

The VGC-258 agent reconciled the overlap itself and reported both agents' edits surviving. The
orchestrator re-verified INDEPENDENTLY rather than trusting that report, by grepping the integrated
tree:

1. `src/app/sitemap.ts` — HAS BOTH: `/tools/ev-to-sp` (line 17, VGC-262) AND
   `getRegMBMegasWithSprites` import + mapping (lines 3, 29, VGC-258). ✅
2. `src/components/layout/PageFooter.tsx` — HAS BOTH: `/champions` (line 15, VGC-258) AND
   `/tools/ev-to-sp` labelled "EV → SP" (line 17, VGC-262). ✅
3. `src/app/champions/ChampionsContent.tsx` — HAS ALL THREE: the converter callout
   (`href="/tools/ev-to-sp"`, line 470, VGC-262), the M-B grid grouping
   ("New in Regulation M-B", line 60, VGC-258), and the Indianapolis paragraph now in PAST tense
   ("format played at ... Indianapolis Regionals (May 29-31)", line 163). ✅

No re-application needed. Outcome was luck as much as design — the two agents happened to edit
disjoint regions of each file. The dispatch error stands as a real process bug: the file-overlap
control exists precisely so this does not depend on luck, and I did not apply it when I told the
VGC-262 agent to "link it from somewhere discoverable".

**Lesson for the next run:** when an implementation agent is told to "link this from somewhere" or
"add it to the sitemap", the dispatcher must name the exact files it may touch and cross-check them
against every other agent's file set BEFORE dispatch — a vague instruction silently expands an
agent's file footprint beyond what the overlap check was run against.

## Unclaimed working-tree artifact — quarantined, not committed

`VGC-Team-Project` — a BROKEN SYMLINK to `/home/user/VGC-Team-Project` (a path that does not exist),
timestamped 00:38, which predates this run's 01:14 start. Not in any agent's `files_changed`, not
gitignored, and would have been committed by a careless `git add .`.

Most likely residue from an isolated-verification tree attempt (one agent reported a Turbopack
"symlink points out of filesystem root" panic when symlinking instead of hardlinking node_modules).

Moved to the session scratchpad rather than deleted, so it is recoverable. Not committed.

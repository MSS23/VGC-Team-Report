# Merge Conflict Log — swarm-nightly-2026-05-24

No rebase conflicts. Branch was cut fresh from origin/main (0 behind, 0 ahead at start).

One minor in-flight edit overlap:
- src/app/api/migrate/route.ts was modified by F3 (timing-safe bearer) while I was preparing a separate C2 TS audit edit (any → unknown). I deferred the TS edit; F3's diff is the source of truth.

No other conflicts.
# Merge-Conflict Notes — 22 May 2026 swarm

- Step 0A: branch was 0 commits ahead and 0 behind `origin/main` at start (fresh branch, normal case).
- Step 0B: no rebase required.
- Step 4 pre-commit sync: working tree clean before each commit; `grep '<<<<<<\|=======\|>>>>>>>'` returned no conflict markers in any staged file.
- Step 5 push: see push step below.

W1 reported that `src/components/report/PokemonCard.tsx` overlaps `.swarm/main-changed-files.md` (the file was edited on main in the last 7 days). The W1 edits are small, focused, and behave identically — overlap recorded for awareness; no actual conflict occurred.

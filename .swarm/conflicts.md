# Merge-Conflict Notes — 22 May 2026 swarm

- Step 0A: branch was 0 commits ahead and 0 behind `origin/main` at start (fresh branch, normal case).
- Step 0B: no rebase required.
- Step 4 pre-commit sync: working tree clean before each commit; `grep '<<<<<<\|=======\|>>>>>>>'` returned no conflict markers in any staged file.
- Step 5 push: see push step below.

W1 reported that `src/components/report/PokemonCard.tsx` overlaps `.swarm/main-changed-files.md` (the file was edited on main in the last 7 days). The W1 edits are small, focused, and behave identically — overlap recorded for awareness; no actual conflict occurred.

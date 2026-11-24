# Merge conflicts — run 23-11-26

## None. Zero conflicts at any stage.

| Stage | Result |
|---|---|
| Step 0A branch cut | `REMOTE_EXISTS=0`, fresh branch from `main` at `10dfd74`. Clean. |
| Step 0B sync with main | `BEHIND=0` — nothing to bring in. No rebase, no merge needed. |
| Step 4 commit loop | No conflict markers in any staged file (checked per commit with `grep -lE '^(<<<<<<< \|>>>>>>> )'`). |
| Step 4 post-commit sync | `git merge origin/main` → "Already up to date." `main` has had **zero commits in 7 days**, so nothing moved under the branch all night. |
| Step 5 push | All four pushes fast-forward. No rejection, no force, no history rewrite. |

No stash was needed: the working tree was clean at Step 0B, and every file
modified during the run was claimed by a subagent report.

## How conflicts were PREVENTED rather than resolved

The run's defining constraint was that PRs #91, #92 and #93 are all open,
unmerged, and cut from this same commit, and own **152 files** between them.
Every file touched tonight was checked against `.swarm/pr-owned-files.txt` by
exact-line match before editing, by the orchestrator and again by each
implementing agent. Nothing tonight touches an owned file.

Two cases where that constraint changed the work rather than just filtering it:

- **VGC-343** — the ticket's prescribed fix site (`url-codec.ts:140`) is owned by
  #91, and the normaliser it wanted to reuse (`src/lib/utils/calc-category.ts`)
  does not exist on `main` at all — it is on unmerged #93. The fix went to the
  validation boundary in the free `url-codec.schemas.ts` instead, which is
  arguably where it belonged.
- **VGC-343's test** — `url-codec.test.ts` is owned by #92, so the regression
  test went into a new file.

File-overlap control across concurrent agents also held: the three implementation
agents running simultaneously touched disjoint sets (7 i18n locales /
weekly-digest + share-flow / the secret guard), so no two ever had the same file
open.

## The one conflict this branch WILL cause, by necessity

`src/app/changelog/data.ts`. Tonight's v5.33 entry is the fourth November entry;
#91, #92 and #93 add 5.30, 5.31 and 5.32. All four open with identical
`{` / `date: "November 2026"` lines, so git conflicts **inside one object
literal** and naive marker deletion produces duplicate keys that will not
compile.

This is unavoidable — the Updates-page append is mandatory for the run, and the
file is append-at-top by design. It is mitigated by the version numbering
(5.33 collides with nothing) and by merging in date order, which makes every
resolution a pure prepend. Verified recipe in
`.swarm/merge-order-plan-23-11-26.md` §3.1.

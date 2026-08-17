# Board reconciliation — 17-08-26

Every one of the 23 tickets sitting in **In Review** was traced to real git state.
This is the highest-value output of tonight's run: **16 of them are already live on
`main`** and are only waiting for a human to move them to Done.

Method: `git merge-base --is-ancestor`, plus file-level content checks on `main`, plus
GitHub PR state. Note PR #73 was **squash-merged** (`bdbbfac`), so its individual
commits are NOT ancestors of `main` even though its content is — a naive
`git log origin/main | grep VGC-` misses all eight of its tickets. Verified by content
instead (e.g. `src/app/tools/ev-to-sp/` exists on `main` => VGC-262 shipped).

---

## A. SHIPPED — on `main` now. Move these 16 to Done.

| Ticket | How it landed |
|---|---|
| VGC-64  | direct commit on main |
| VGC-219 | direct commit on main |
| VGC-243 | direct commit on main |
| VGC-264 | `b865fa2` on main |
| VGC-266 | `1db8419` on main |
| VGC-267 | `9897389` on main |
| VGC-272 | `164fb87` on main |
| VGC-274 | `a099f97` on main |
| VGC-254 | PR #73, squashed into `bdbbfac` |
| VGC-256 | PR #73, squashed into `bdbbfac` |
| VGC-257 | PR #73, squashed into `bdbbfac` |
| VGC-258 | PR #73, squashed into `bdbbfac` |
| VGC-259 | PR #73, squashed into `bdbbfac` (verified: sr-only h1 present on main) |
| VGC-260 | PR #73, squashed into `bdbbfac` |
| VGC-261 | PR #73, squashed into `bdbbfac` |
| VGC-262 | PR #73, squashed into `bdbbfac` (verified: `src/app/tools/ev-to-sp/` on main) |

The swarm is forbidden from setting Done, so these were left In Review by design.
**This table is the click-list.**

## B. BLOCKED ON ONE OPEN PR — 4 tickets

**PR #72 — "swarm: nightly improvements 03-08-26" — open as a DRAFT since 3 August.**
Head `claude/loving-sagan-t7immy`, 25 commits, not merged.

Contains: **VGC-181, VGC-224, VGC-245, VGC-251** — plus a large amount of unticketed
work that exists nowhere else, including:
- ILIKE injection fix, creator-identity takeover fix, CORS lookalike-origin fix
- GDPR regression: consent gating restored before analytics initialise
- dead code removal including a latent CORS bypass
- per-locale move-name catalogue split (this is half of **VGC-268**, tonight's perf ticket)
- Reg M-B mega pages + FAQ SP-budget corrections

Merging PR #72 is the single highest-value action available. It closes 4 tickets and
ships security and GDPR fixes that are currently only on that branch.

## C. STATUS IS WRONG — 3 tickets

| Ticket | Reality |
|---|---|
| **VGC-242** | "speed tiers now reflect Mega base stats" — implemented as `886119a`, but that commit lives ONLY on `swarm-nightly-2026-06-22` / `-06-29`, whose PRs (#65, #66) were **closed without merging**. The work is orphaned. In Review is misleading: nothing shipped, and the branches are 2 months stale. Either re-open/cherry-pick, or move back to Todo. |
| **VGC-246** | "Enforce true private reports + visibility-toggle hardening" — no commit anywhere in the repo references it. Nothing was implemented. Should be Todo, not In Review. |
| **VGC-247** | "Update PostHog SDKs" — no commit anywhere references it. Should be Todo, not In Review. |

VGC-246 is a **privacy** ticket parked in a state that implies it is done. Worth
correcting promptly.

## D. Nightly-branch backlog — the VGC-265 picture, corrected

VGC-265 claims "~30 unmerged branches and 10 tickets stuck In Review — the swarm is
re-fixing already-fixed bugs". Partly right, and worth restating accurately:

- ~35 `swarm-nightly-*` / `claude/*` branches exist on origin.
- Of the last 12 swarm PRs, **exactly one (#73) was merged**. #72 is still open.
  #62–#71 were all **closed without merging** — their work is orphaned, VGC-242 being
  a concrete casualty.
- But merge throughput is **not** zero, and it improved recently: #73 merged 11 Aug,
  and a further nine hand-authored fixes landed directly on `main` on 11–13 Aug.

So the accurate diagnosis is not "nothing gets merged" — it is **"work merges only when
it goes onto a branch someone actually opens and reviews; everything else is
silently closed and lost."** Closing a swarm PR without merging discards real fixes,
and nothing on the board records that it happened. That is why the same defects keep
being rediscovered.

### Recommendation
Prefer **one long-lived swarm branch** that is merged or rebased weekly, over a new
orphan branch every night. Failing that, when a swarm PR is closed unmerged, move its
tickets back to Todo in the same action so the board stops asserting work is done when
it was thrown away.

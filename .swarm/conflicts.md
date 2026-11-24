# Merge-conflict log — run 09-11-26

## Pre-run (Step 0B)

- Branch `swarm-nightly-2026-11-09` cut fresh from `origin/main` @ `10dfd74`.
- `git rev-list --count HEAD..origin/main` = **0 behind**, 0 ahead. No sync needed.
- `main` has had **no commits in the last 7 days**, so `.swarm/main-changed-files.md`
  is empty. Conflict risk *from main moving* is therefore nil this run.
- Working tree was clean at Step 0B. Nothing stashed.

## KNOWN, EXPECTED CONFLICT with open PR #91 — one file

**File: `src/app/changelog/data.ts`** (the in-app Updates page)

PR #91 (`swarm-nightly-2026-11-02`, draft, open since 2 Nov, 21 commits) adds a
`November 2026 / v5.30` section via commit `aa90b25`, inserted immediately after
`export const ENTRIES: ChangelogEntry[] = [` (line 18).

Tonight's run must also append to the current month's section (November 2026) per the
mandatory Updates-page step, and inserts at the **same line**. Git will flag this as a
conflict when the second of the two PRs is merged.

**It is a pure insertion collision, not a semantic one. Resolution is trivial:**

> Keep BOTH entries. Order them newest-first inside the `November 2026` month:
> tonight's `v5.31` block above PR #91's `v5.30` block. Delete neither. Do not
> renumber. The surrounding October 2026 (v5.29, v5.28) entries are untouched by
> both branches.

Whichever PR merges first will apply cleanly; the second will need this one-minute
manual resolution.

**Avoiding it entirely:** merge PR #91 first, then this branch picks it up on the next
sync. Nothing else in tonight's diff touches any file PR #91 touches.

## During the run

(Nothing further — see the commit log section below if any entry appears.)

## Post-commit sync with origin/main

Recorded at the end of the run in `.swarm/run-meta.md`.

---

## REVISED: the full unmerged-work picture (discovered mid-run)

The initial Step 0B assessment was incomplete in two ways, both corrected here.

### 1. The clone was shallow

`git rev-parse --is-shallow-repository` returned **true** — only 78 commits were present.
Any history-based analysis run before this was unreliable. `git fetch --unshallow`
brought the real total to **834 commits**. Two consequences:

- A first pass at classifying the In Review queue produced a wildly inflated "46 tickets
  have no commit anywhere" figure. The real figure is 20, and 38 are already on `main`.
- A first check of VGC-305 (the P0 Discord-token-in-history issue) found **zero** matches
  and looked clean. On full history it finds **two**. Anyone verifying that ticket from a
  shallow clone will wrongly conclude it is resolved.

### 2. There are TWO unmerged branches, not one — and only one has a PR

| Branch | Commits ahead of `main` | PR | Age |
|---|---|---|---|
| `swarm-nightly-2026-11-02` | 21 | **#91 (draft)** | open 7 days, unreviewed |
| `ccr-643ddaf1-yj2dyf` | 1 | **none** | no PR at all |

`ccr-643ddaf1-yj2dyf` carries `2f4ec31 fix: harden Discord webhook handling after a
compromised webhook` — a substantial security commit (centralised webhook helper with
URL validation against official Discord hosts, token redaction in logs, a
`DISCORD_WEBHOOKS_DISABLED` kill switch, 22 new unit tests) written after a **real
webhook abuse incident**. It has no pull request, so nothing is tracking it and nobody is
reviewing it. **That is the single most at-risk piece of work in the repository.**

Its message also records that the leaked webhook "is confirmed deleted on Discord's
side", which — if accurate — makes the token still sitting in public history inert and
largely resolves VGC-305. That claim is on an unmerged branch, so it has never been
reviewed.

### 3. Tonight's audits re-discovered work already fixed on those branches

Direct evidence for VGC-265's thesis that the bottleneck is review throughput, not
implementation capacity:

- **C4's top NEW security finding** — "the og:image Blob cache isn't revoked when a
  report is flipped private" — is already fixed by `d0b0ac9 fix: making a report private
  now revokes its public og:image card` on PR #91. Not re-implemented tonight.
- **C3's top perf deferral** — defer `CookieBanner` off the shared first-load chunk
  (15.3 KB gz x 22 routes) — is already done by `5859aff` on PR #91. Not re-implemented.
- **VGC-243** ("Speed-Tiers not adapting to Mega selection") is almost certainly fixed by
  `87503db fix: Mega speed tiers read the Mega's own ability, not the base form's` on
  PR #91, which never cites the ticket.
- Three of the four tickets dispatched for implementation tonight (VGC-226, VGC-260,
  VGC-261) turned out to be **already complete on `main`**.

### Merge-order recommendation, to minimise conflicts

1. **`ccr-643ddaf1-yj2dyf` first** — 1 commit, touches `src/lib/discord-webhook.ts`,
   the feedback/PostHog routes and `.env.example`. No overlap with either other branch.
   It needs a PR opened for it; the swarm did not open one, because the one-PR-per-run
   rule covers only tonight's own branch and opening a PR for someone else's branch is
   not the swarm's call.
2. **PR #91 next** — 21 commits, 134 files.
3. **This run's branch last** — it is small (see the PR body) and its only overlap with
   PR #91 is the one-line changelog insertion documented above.

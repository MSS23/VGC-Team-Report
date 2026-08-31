# UNFILED LINEAR TICKET (draft)

> **Not filed.** The Linear workspace returned `USAGE_LIMIT_EXCEEDED` — the free
> active-issue limit is reached, so `issueCreate` is rejected for every new ticket.
> File this by hand after closing stale issues, or paste it straight into Linear.

**Title:** [INFRA] Delete the 25 pre-rewrite orphan branches, and fix branch-counting to treat a failed git diff as "unrelated\

**State:** Backlog · **Priority:** 2 · **Labels:** auto-research, see below
**Project:** Tech Debt & Polish

---

## Source

Nightly swarm 31-08-26, agent B1. Full report: `.swarm/b1-branch-reconciliation-31-08-26.md` on https://github.com/MSS23/VGC-Team-Report/pull/76. Concrete follow-up to **VGC-265**.

## Finding

`origin/main`'s history was **rewritten on 2026-07-04** (root commit `0825946`). **25 of the 34 remote branches share no merge base with `main`.**

For those branches `git merge` refuses ("unrelated histories") and `git diff origin/main...BRANCH` **exits non-zero** instead of returning an empty diff.

## Two distinct actions

### 1. Fix the counting bug (do this first)

Any script that decides "is this branch merged?" from `git diff` output must treat a **non-zero exit** as *unrelated*, never as *empty/merged*. Conflating them is the most likely reason VGC-265's ~30-branch figure has never moved — a failed diff reads as "no differences".

### 2. Delete the 25 relics

They cannot be merged and never will be. Spot-check each for unique work worth cherry-picking onto current `main`, then delete. Only **9** branches share history with `main` and are genuinely mergeable; those 9 are the real queue.

## Care needed — one known trap

**VGC-242's fix exists only on unrelated history** and must be re-implemented before its branch is deleted. (Its commits and VGC-243's carry swapped identifiers on the June branches; VGC-243 is correctly on `main`, VGC-242 is not.) Check for others before bulk-deleting.

## Related structural fix

`.swarm/*.md` is the conflict source on **5 of the 9** live branches and `src/app/changelog/data.ts` on **3**. Gitignoring `.swarm/` would remove the single most common cause of nightly branches conflicting with one another.

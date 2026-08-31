# Research synthesis — swarm run 31-08-26

Sources: `.swarm/{b1-branch-reconciliation,c1-dead-code,c2-typescript,c3-perf,c4-security,c5-commit-review,r8-accessibility,l0-triage}-31-08-26.md`

---

## 0. The headline: the board is lying, and now we know exactly how

`b1-branch-reconciliation-31-08-26.md` is the most important artefact of this run.

**16 of the 32 "In Review" tickets are already merged into `main`.** Every one was verified
with `git merge-base --is-ancestor` against the landing commit — not inferred. They are:

> VGC-64, VGC-219, VGC-243, VGC-254, VGC-256, VGC-257, VGC-258, VGC-259, VGC-260,
> VGC-261, VGC-262, VGC-264, VGC-266, VGC-267, VGC-272, VGC-274

**These are safe for a human to close right now.** Per the swarm's own guardrail, no agent
touched their status — Done is the human's signal.

Eight of the sixteen were invisible to a normal search because they landed via squash PR #73
and their identifiers appear only in the commit *body*, not the subject. Grepping `%s`
misses them; `%B` finds them.

### Why VGC-265's count never drops — root cause found

`origin/main`'s history was **rewritten on 2026-07-04** (root commit `0825946`, 50 commits).
**25 of 34 branches share no merge base with main at all.** For those, `git merge` refuses
outright ("unrelated histories") and `git diff origin/main...BRANCH` *errors* rather than
returning an empty diff. Any tooling that reads a failed-or-empty diff as "fully merged"
silently miscounts — which is very likely why the ~30-unmerged-branch figure never moves.

Those 25 branches are relics of the pre-rewrite history. They cannot be merged and are not
worth resolving; they should be deleted after spot-checking for unique work.
Only **9** branches share history with main, and all 9 currently conflict.

### Two traps flagged before anyone re-implements something

1. **VGC-242 / VGC-243 identifiers are swapped** on the June branches. VGC-243's fix is
   genuinely on main; **VGC-242's fix exists only on unrelated history and must be
   re-implemented from scratch.** Closing VGC-242 as "done" would be wrong.
2. **VGC-225 / VGC-232** are class B (branch-only), yet their files already exist on main
   under non-VGC commit subjects. Verify scope before rebuilding either.

**Conclusion for GOAL A:** the constraint on this project is merge throughput, not
implementation capacity — exactly as VGC-265 states. Tonight's run therefore deliberately
kept its PR small and low-conflict rather than maximising ticket count. A 4th large
unmerged PR would have made the measured problem worse.

---

## 1. Top 5 highest-leverage opportunities

1. **Drain the review queue.** Close the 16 verified-on-main tickets, then merge PRs in the
   order B1 recommends: `claude/loving-sagan-zs6xpl` (#75 — 1 behind, 1 conflict, carries a
   P0) then `claude/loving-sagan-853anq` (#74 — 9 tickets). Then delete the 25 relic branches.
   Highest leverage available on this project by a wide margin, and it costs no engineering.
2. **Unblock the swarm's inputs.** VGC-255 (egress) and VGC-220 (PostHog creds) between them
   make ~40% of the board un-actionable by any agent and forced 6 of tonight's 13 planned
   research agents to be cancelled. Until fixed, every future nightly run is capped at
   code-only work.
3. **`/compare` is the worst route in the app** — 1205.7 kB raw / 344.1 kB gz initial JS.
   VGC-271 (rescoped to `/compare`) removes ~72 kB gz, 21% of the route, via one dynamic import.
4. **Client-bundle weight on `/`** — 1152.1 kB / 349.9 kB gz, the worst gzipped route.
   `motion` is 38.4 kB gz eager across 7 route groups (VGC-268, still valid); Clerk is
   **58.1 kB gz** eager on `/` and is not tracked by any ticket.
5. **Two unauthenticated data-exposure paths** (see §2) — both are privacy defects in a
   product whose entire value proposition is controlling who sees your team before an event.

## 2. Top 5 quick-win bugs (all verified against current code)

1. **P1 IDOR — `api/team-graphic/route.tsx:96`** renders private reports for unauthenticated
   callers and bypasses redaction. → dispatched.
2. **Broken Tailwind classes — `SpeedTierChart.tsx:132,482,500`**: `min-h-11text-[10px]`.
   Missing space means *neither* utility is emitted, so the 44px touch target that commit
   `0024679` exists to deliver never applies. → dispatched.
3. **Clarity consent race — `ClarityProvider.tsx:20-37`**: withdrawing consent mid-import is a
   no-op against a `null` binding while the in-flight `start()` proceeds to `consent(true)`.
   Session recording begins *after* opt-out. Contradicts the privacy policy. → dispatched.
4. **`extractSpecies` duplicated and stale — `opengraph-image.tsx:44`**: headers counted as
   species, real 6th Pokemon dropped from share-preview cards; the shared helper drops a
   Pokemon whenever a header is glued to the first one. → dispatched.
5. **VGC-270 a11y** — edit-mode slide 0 has no `<h1>` at all; both headings sit behind
   `isReadOnly` and the page-level fallback excludes slide 0. One-line fix. → dispatched.

## 3. Tickets that are already done and should simply be closed

Beyond B1's 16, agents independently verified these while working:

- **VGC-221** — 0 high advisories remain; Clerk 7.5.9 ships js-cookie 3.0.7. Resolved.
- **VGC-248** — claims "12 moderate"; actual is **8**, all one advisory
  (GHSA-8988-4f7v-96qf, OTel core <2.8.0, CVSS 5.3). Needs rescoping, not implementing.
- **VGC-261** — landed in `bdbbfac` (2026-08-11), and it was **5** flags, not 4.
- **VGC-257, VGC-256** — perf work confirmed already on main (C3 traced the import graphs).
- **VGC-259** — sr-only h1 confirmed present at `page.tsx:1169-1173`.
- **VGC-264** — zero routes parse the raw header; all IPs go through `getClientIp`
  (`input-validation.ts:75-103`), enforced by a regression test.
- Two `no-claude` tickets are already implemented in code: **Levitate** Ground immunity
  (`type-chart.ts`, ability passed at both call sites) and **mega speed tiers**
  (`megaStates` in `SpeedTierChart.tsx`).

## 4. Blockers that stopped work this run

- **Egress denied** (VGC-255): reddit.com, google.com and the production domain all fail
  CONNECT; only registry.npmjs.org and api.github.com resolve. Cancelled R1–R5, R7.
- **No PostHog credentials** (VGC-220): no error-frequency, rage-click, funnel or feedback
  data. Every `posthog_signal` field in this run is `false` for lack of data, not lack of signal.
- **No Vercel token/MCP**: could not read the Production env var or webhook invocation logs.
- **No DB access**: blocks ~10 tickets outright.
- **`gh` CLI absent**: GitHub operations went through the GitHub MCP server instead.
- **`.claude/agents/` and `.claude/skills/` are absent** in this container (`.claude/` is
  gitignored and only `scripts/` was cloned), so `verification-gate`, `ui-checklist-reviewer`,
  `linear-discord-updater` and the `ui-ux-pro-max` skill were unavailable. The gate was run
  inline instead — cold `tsc`, full vitest, and a real `next build` before every commit.

## 5. High-conflict-risk files (flagged by C1–C5 AND changed on main recently)

Tonight's branch was cut clean from `main` (0 ahead / 0 behind at start), so intra-run
conflict risk was low. The forward risk is at merge time:

- **`.swarm/*.md`** — the conflict source on **5 of the 9** live branches. These are working
  notes with no build impact; resolve with "take both" or delete. They should arguably be
  gitignored to stop them blocking real merges.
- **`src/app/changelog/data.ts`** — conflict source on **3 of 9** branches, and every nightly
  run appends to it by design. Structurally guaranteed to conflict; resolve by keeping both
  entry sets.
- `src/app/page.tsx` and `src/components/report/TeamOverview.tsx` — touched by tonight's
  VGC-270 fix and large enough to attract concurrent edits.

## 6. Findings worth filing as new tickets (GOAL B — deliberately restrained)

The board already carries 100 open issues and its top-priority process ticket says bloat is
the problem. Filing 5–10 speculative research tickets tonight would work against that, and
most research channels were blocked anyway. Only genuinely new, evidence-backed, code-local
findings are proposed:

1. **Clerk is 58.1 kB gz eager on `/`** across 3 chunks (`page.tsx:50`) — larger than the
   `motion` cost VGC-268 already tracks, and untracked by any ticket. (C3)
2. **Creator identity is keyed on the editable display name** (`api/user/profile/route.ts:84-86`,
   `api/explore/route.ts:323`) → profile takeover and verified-badge spoofing. Closely
   related to existing **VGC-253**; add as evidence there rather than filing a duplicate. (C4)
3. **`/api/oembed` is undiscoverable** — no `<link rel="alternate" type="application/json+oembed">`
   exists anywhere, so no unfurler can ever find it. The endpoint is built but inert; the fix
   is to wire it up, not delete it. (C1)
4. **`sendEmail` and `postFeedbackEmbed` infer `Promise<any>`** (`lib/email.ts:32`,
   `lib/discord-bot.ts:60`) — the only two of 129 exported `src/lib` functions where a missing
   return type actually leaks `any`. (C2)
5. **`main`'s history rewrite of 2026-07-04 orphaned 25 branches** — needs a one-time
   deliberate cleanup decision, and any branch-counting tooling needs to treat a *failed*
   `git diff` as "unrelated", never as "empty/merged". (B1)

# Swarm run meta — 16 Nov 2026

- Branch: `swarm-nightly-2026-11-16`
- REMOTE_EXISTS at start: 0 (fresh branch, cut from origin/main @ 10dfd74)
- Existing open PR for branch: none
- Mode: rebase allowed until first push; merge-only after
- Session start branch was `claude/loving-sagan-35mnyp`; switched to nightly branch per routine Step 0A.

## Preflight integration status
- LINEAR_API_KEY: present (Linear MCP also available)
- DISCORD_BUILDS_WEBHOOK: present
- DISCORD_BOT_TOKEN: MISSING (webhook method only)
- POSTHOG_API_KEY / POSTHOG_PROJECT_ID: **MISSING** → PostHog data pull skipped for the whole run
- VERCEL_TOKEN / Vercel MCP: **MISSING** → Vercel env-var + log inspection skipped for the whole run
- GitHub: MCP tools available

## ⚠️ Orchestrator finding: the bottleneck is merge throughput, not implementation

Verified this run, not assumed:

- GitHub has exactly **two open PRs**, both unmerged swarm drafts:
  - **#92** → `swarm-nightly-2026-11-09` — 5 commits, 21 source files (VGC-291, VGC-261, dead-code deletion)
  - **#91** → `swarm-nightly-2026-11-02` — 21 commits, **110 source files, +7,550 lines** (VGC-295, VGC-316,
    VGC-315, VGC-317, VGC-300, VGC-253 and ~10 unticketed fixes)
- The Linear board has **61 issues in "In Review"** against those 2 unmerged PRs. The statuses and the
  code are badly out of sync.
- `#91` and `#92` touch **14 of the same files** — they already conflict with each other. Tonight's
  branch is the third in that queue.
- Concrete proof of the duplication loop: `statForm` (VGC-291) is **not on main** but is implemented on
  **#92**. VGC-301 is the follow-up to VGC-291 and its description asserts VGC-291 "landed in PR #82" —
  it did not. So VGC-301 is **unimplementable tonight**: its prerequisite is on an unmerged branch.
- Counter-evidence worth recording: some older swarm work **has** landed. Reg M-C support is on main
  (so **VGC-289 "Reg M-C is entirely unsupported" is stale and should be closed**), and VGC-265's cited
  symptom — the string `"8th consecutive fix proposal — please merge!"` in `changelog/data.ts` — is gone
  from main. So the queue is ~2 runs deep, not the ~30 branches VGC-265 feared.

### How this changed tonight's plan

1. Built an exclusion list of the **117 source files** already touched by #91/#92
   (`.swarm/unmerged-branch-files-16-11-26.txt`) and gave it to every implementation agent as a
   do-not-touch list, to keep tonight's diff mergeable alongside them.
2. **Dropped dead-code deletion entirely**, even though C1 was asked to audit it: #91 and #92 *both*
   already delete dead code from the same files (`dex-subset.ts`, `tags.ts`, `discord-bot.ts`,
   `damage-calculator.ts`). A third deletion of the same lines is a guaranteed three-way conflict for
   zero added value.
3. **Dropped the tickets that are deliberately blocked on a human ruling** rather than flipping them:
   VGC-330 (248-EV = 31 or 32 SP), VGC-290 (do Champions regs allow restricteds), VGC-289 (M-C dex —
   now stale anyway), VGC-301 (needs VGC-291 on main first), VGC-236 (needs Vercel env verification),
   VGC-305 (needs a human to rotate a Discord webhook in Discord's UI). VGC-330 documents three runs
   flipping the same assertions back and forth; adding a fourth flip is the documented failure mode,
   so this run does not touch those assertions.
4. Spent a dispatch on **board reconciliation** (agent B1) instead of a 10th implementation, so the
   human gets a list of tickets they can close immediately.

### The recommendation for the human

Merging **#91 and #92** (in that order — #91 is far larger) unblocks more board movement than any
amount of further nightly implementation. Until that queue drains, each night's run adds conflict
surface faster than it adds landed value. This is exactly what **VGC-265** says, and it is still true.

## Stale tickets found by the orchestrator directly (evidence on `origin/main`)

The board is carrying work that is already shipped. Verified by reading main, not inferred:

| Ticket | Claim | Reality on main | Evidence |
|---|---|---|---|
| **VGC-289** (P2) | "Reg M-C is the live format and is **entirely unsupported**" | Fully supported | `src/lib/data/tags.ts:9` lists `"Reg M-C"` in `REGULATIONS`; `:23` `isChampions()` accepts it; changelog v5.28 ships it |
| **VGC-226** (P2) | Needs a rental-code field + copy button | Fully shipped | editor input `TeamOverview.tsx:576`; copy handler `:410-411`; monospace + QR `:457-474`; `ShareModal.tsx:286-296` with a `share_rental_code_copied` event; persisted via `api/share/route.ts` |
| **VGC-79** (P2) | Needs an inline damage calculator on detail slides | Fully shipped | `components/report/InlineDamageCalculator.tsx`, lazy-loaded from `pokemon-detail/CalcsPanel.tsx:12,94`, mounted at `PokemonDetailSlide.tsx:11,24` |
| **VGC-265** (P1) | Cites `changelog/data.ts:70` reading "8th consecutive fix proposal — please merge!" | String is gone from main | `grep -rn "please merge" src/` → no match |

VGC-226's implementation agent was therefore **redirected mid-flight** to a full backlog staleness
audit instead of writing a duplicate feature. That audit is the run's main GOAL-A deliverable:
a list of tickets the human can close on sight.

**Read across to VGC-255/VGC-220:** several of these tickets were filed by earlier swarm runs that
could not reach an authoritative source and so filed a ticket rather than guess. That was the right
call each time, but nothing has since re-checked them against a tree that moved on. The board needs a
periodic staleness sweep, not just new tickets. Filing that as a ticket this run.

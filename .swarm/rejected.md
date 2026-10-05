# Rejected / dropped changes — run of 05 Oct 2026

## Nothing was rejected at the build gate
Every agent change that reached the integration step passed `npm run typecheck`,
`npm test` and `npm run build` from the integrated tree. No `git checkout --` revert
was needed and no commit was dropped for a red gate.

## Deliberately NOT attempted (judgement, not failure)

- **VGC-236** — standardise on `LINEAR_WEBHOOK_SIGNING_SECRET`, drop the legacy
  `LINEAR_WEBHOOK_SECRET` fallback. A two-line change, held back because this container has
  no Vercel access to confirm which name Production actually holds. Shipping it blind could
  cause exactly the webhook outage the ticket exists to prevent.
- **Reg M-C support** — the live format since 9 Sep 2026, entirely unsupported. Not guessed:
  the authoritative M-C legal-Mega list is not in the repo, and a fabricated dex would put
  wrong legality rulings in front of players. Ticketed instead.
- **VGC-200** — notification preferences persist to `localStorage` only (so unchecking an
  email preference does not stop the email). Needs a schema migration plus an API route,
  neither verifiable without a database.
- **Account-deletion satellite purge** (C5's HIGH finding) — `src/app/api/user/delete/route.ts`
  never purges `comment_flags`, `share_versions`, `edit_changelog`, `collection_items`,
  `notifications` by share_id, or `match_logs`. A data-protection gap and a real fix, but an
  untested `DELETE` on the account-deletion path is not something to ship blind. Ticketed Urgent
  with the exact fix (reuse `purgeSatellites` from `cleanup/route.ts`).
- **C6 items 5 and 7** — `Tera Type: Stellar` parsing, and three components computing Champions
  stats with the EV formula (Dragapult 182 vs 213 Speed on the same report). Real bugs, but they
  touch files outside the owning agent's scope this run. Ticketed.
- **C3's three perf wins** (~70 KB gz on `/compare`, de-motion on 72 SSG pages, gate `MOVE_NAMES`
  on non-English) — all sound, all deferred to keep tonight's diff reviewable. Ticketed.
- **~81 further contrast sites and the remaining a11y findings** outside the six files the a11y
  agent owned. Ticketed.

## Pre-existing test fragility found and fixed, not worked around

`src/hooks/__tests__/useTeamReport.test.ts` passed in the full suite but **failed when run on its
own** — at pristine `HEAD`, before any of tonight's work (verified in a detached worktree: full
suite 417/417 green, that file alone 9/10). `vi.waitFor` inherits vitest's 5s test timeout, and
`parseTeam`'s first call in a fresh worker cold-loads the analyze-team chunk, which can exceed it;
in the full suite another file has already warmed the module cache. Tonight's six new test files
changed the work distribution and surfaced it intermittently.

Fixed properly by giving both `vi.waitFor` calls an explicit budget, with the reason in a comment.
The test was **not** skipped, disabled, quarantined, or weakened, and the global `testTimeout` was
deliberately not raised (that would mask slowness everywhere else). It is now order-independent:
passes alone and in the suite.

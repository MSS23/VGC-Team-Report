## Source

`.swarm/c4-security-23-11-26.md` §3, structural note on finding H-2 (overnight swarm, 23 Nov 2026).

## The pattern worth fixing

Private-field redaction for shared reports is applied independently by each reader of share data. There are now **three** readers that each had to remember:

* `src/app/api/share/[id]/route.ts` — applies it correctly.
* the team-graphic path — applies it correctly.
* `src/app/api/share/[id]/fork/route.ts` — **forgot it**, which is the live privacy leak described below.

Three independent implementations of one security control, and the third one got it wrong. That is a structural problem, not a one-off bug: the next reader will forget too.

## Context — the leak itself is already fixed, but only on an unmerged branch

On `main` today, `src/app/api/share/[id]/fork/route.ts` contains **zero** `redact` calls and spreads `...sourceData` verbatim, copying `paste` and `privateFields` intact. Any signed-in user presses Fork on a public report, becomes `owner_id` of the new row, and `GET /api/share/{forkId}` takes the owner branch — which does not redact — exposing the item/EV/IV/nature fields the creator deliberately hid before an event.

Commit `29810d5` fixes this (8 `redact` references in that file), but it exists **only on branch `swarm-nightly-2026-11-16` / PR #93**, which is unmerged. So the leak is live in production until #93 lands. Merging #93 is the fix; this ticket is about making sure it cannot recur.

## Suggested action — after #93 merges

Promote the redaction control to a single call site: move `applyPrivateFieldRedaction` into `src/lib/sharing/redact-paste.ts` and have every reader of share data go through one function, so "did this reader remember to redact?" stops being a question anyone has to ask per route.

Consider a test that enumerates the share-data read paths and asserts each one redacts for a non-owner — a guard that fails when a fourth reader is added without redaction.

## Priority note

The leak is urgent; this ticket is the follow-up. Do not let this ticket's lower priority delay merging #93.

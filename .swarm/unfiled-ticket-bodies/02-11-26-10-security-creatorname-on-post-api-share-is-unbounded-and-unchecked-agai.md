# [Security] creatorName on POST /api/share is unbounded and unchecked against the authenticated user

- **Priority:** High
- **Labels:** auto-research, Infrastructure
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/c4-security-02-11-26.md`, found alongside the `creator_profiles` takeover path (VGC-253, fixed on branch `swarm-nightly-2026-11-02`).

## Finding

`src/app/api/share/route.ts` validates `creatorName` as `z.string().optional()` — with **no length cap** and **no check against the authenticated identity**.

So a public report can be published under **any creator name**, including a well-known player's. Combined with the public creator pages, that is an impersonation surface on a public site.

## Why it was not fixed with VGC-253

VGC-253's fix binds `creator_profiles` rows to a `user_id`, which closes the **profile takeover**. This is a **separate file and a separate path** — `src/app/api/share/route.ts` was held by another agent this run (zod bounds), and parallel edits to one file are forbidden by the swarm's conflict protocol. Deliberately deferred.

## Fix

1. Add a length cap consistent with the other bounded fields in that schema.
2. Decide the identity rule and enforce it: either `creatorName` must match the authenticated user's claimed creator identity, or it must be clearly presented as a free-text attribution that carries no verified standing. The current state — free text rendered on a page that can show a **verified badge** — is the problematic combination.
3. Worth checking whether a verified badge can currently be made to appear next to an arbitrary `creatorName`. If so, that raises the priority.

## Note

VGC-253's residual risk is related and should be read alongside this: legacy `creator_profiles` rows carry `user_id = NULL` and are **claimable by the first authenticated caller** using that name. The swarm deliberately did not guess ownership for a backfill.

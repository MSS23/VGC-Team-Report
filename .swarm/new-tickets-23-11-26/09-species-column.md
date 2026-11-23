## Source

Found while converting `src/app/api/share/__tests__/share-flow.test.ts` to run against PGlite in the nightly swarm run of 23-11-26 (commit `7d5ba55`).

## The finding

The `shares` table has two sources of truth for its schema, and they disagree:

* `ensureTable()` in `src/lib/db.ts` — the programmatic provisioner.
* `src/lib/db/migrations/add-species-column.sql` — a loose migration file.

**`shares.species text[]` exists only in the migration file and is absent from `ensureTable()`.** So a database provisioned by `ensureTable()` alone lacks a column that the share INSERT path writes to. Anything standing up a fresh environment — a new preview branch, a local dev DB, a restored instance — gets a table the application cannot write to, and the failure surfaces as a runtime INSERT error rather than at provisioning time.

Production is fine: the migration was applied there by hand.

## Why it surfaced now

`share-flow.test.ts` previously never ran (it was `skipIf(!DATABASE_URL)` and CI sets none). Now that it runs against an embedded Postgres, its `CREATE TABLE` has to mirror the real schema **by hand** — which forced someone to reconcile the two sources and notice the gap.

That hand-mirroring is itself the residual risk documented in the test file: schema drift between the PGlite fixture and Neon is the one thing that suite cannot catch.

## Fix

Fold `species text[]` (and audit every other column in `src/lib/db/migrations/*.sql` the same way) into `ensureTable()` so there is one source of truth. Then have `share-flow.test.ts`'s fixture derive from it rather than restating it, which removes the drift risk at the same time.

Scope: S.

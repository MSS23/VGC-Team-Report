# [TECH-DEBT] Replace ad-hoc `ensureTable` with a real migration runner

**Priority:** High
**Labels:** tech-debt, auto-research

## Context

C5 commit review (12-06-2026) flagged commit `29f5431` ("Fix shared-team 500s: add is_unlisted to ensureTable schema") as a band-aid fix. The root issue: there is no migration runner. Every time a new column is added, the next user-facing 500 outage class reproduces because `ensureTable` is not run reliably and new columns aren't present in prod schema.

## Proposal

Introduce a minimal migration system:
- `src/lib/db/migrations/` directory with timestamped SQL files.
- A `src/lib/db/migrate.ts` runner that tracks applied migrations in a `schema_migrations` table.
- Run on cold-start of every API route (cached for the lambda lifetime).
- OR: a Vercel cron that runs migrations on deploy.

## Source

`.swarm/c5-commit-review-12-06-26.md` — finding F1.

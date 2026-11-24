# [Test gap] VGC-235's 227-line share-flow suite is skipIf(!DATABASE_URL) and CI sets none - it has never run

- **Priority:** High
- **Labels:** auto-research, Infrastructure
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/c5-commit-review-02-11-26.md`.

## Finding

The share-flow test suite added by **VGC-235** is **227 lines** and guarded by `skipIf(!DATABASE_URL)`. CI (`.github/workflows/ci.yml`) sets **no** `DATABASE_URL`, so the suite is **skipped on every run** — it has, in practice, never executed.

It is counted among the project's passing tests while asserting nothing. That is worse than having no suite, because it reads as coverage of the share flow — the product's primary acquisition path.

## Options

1. **Run it against `@electric-sql/pglite`**, already a dev dependency in this repo, so the suite executes in CI with no external database and no secrets. This is the preferred route — it also unblocks the explore-pagination tie tests, which want real SQL ordering behaviour.
2. Provision a throwaway Neon branch for CI. More faithful, but adds a secret and a dependency on Neon's free-tier limits.
3. If neither is wanted, **delete the suite** and stop counting it — an honestly absent test is better than a decorative one.

## Related

The same report notes `src/lib/email-html.ts`, attributed to VGC-234, **does not exist** in the tree, and a claimed `List-Unsubscribe-Post` header is absent — so at least one merge message is not an accurate record of what landed. Worth a brief audit of recent merge messages against the tree while here. (HTML escaping itself is fine, via `escapeHtml`.)

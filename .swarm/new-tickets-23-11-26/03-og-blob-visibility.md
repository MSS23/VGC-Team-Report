## Source

`.swarm/c5-commit-review-23-11-26.md` finding #1 (overnight swarm, 23 Nov 2026).

## Finding

`e4d9354` added a pre-rendered `og:image` card pushed to Vercel Blob at `og/<id>.png`, and `0c6f94e` made report visibility owner-only. The two do not meet:

`PATCH /api/user/reports/[shareId]` — the visibility toggle — **never calls `removeShareOgImage`**. So turning a shared report **private** leaves its OG card publicly fetchable at the blob URL indefinitely. Anyone who still has (or guesses) that URL keeps seeing the card for a report the owner has since made private.

Worse, the cleanup has a time bomb: `removeShareOgImage` early-returns once the 90-day Redis key that tracks the blob has expired. After that window the blob is **unremovable through the app** — no code path can find it to delete it.

## Why it matters

This undercuts the privacy guarantee `0c6f94e` was added to provide, and it is the same class of leak as the team-graphic issue fixed in v5.29 ("Private graphics are now owner-and-collaborator only… an unlisted report's graphic is no longer held in a shared cache for a day after you make it private"). The OG path was missed in that sweep.

## Fix

1. Call `removeShareOgImage` from the visibility-toggle path in `PATCH /api/user/reports/[shareId]` whenever a report moves to private or unlisted.
2. Make blob cleanup not depend on a 90-day Redis key as the only record of the blob's existence — derive the blob path from the share id so it stays deletable for as long as the share row exists.
3. Audit the other paths that can change visibility (delete, account deletion) for the same gap.

## Files

`src/app/api/user/reports/[shareId]/route.ts` is modified by an unmerged PR, so the swarm filed this rather than fixing it. Do after the open PRs merge.

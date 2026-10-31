# Research Synthesis — 22-05-26 Swarm

## Top 5 Opportunities (for future runs)

1. **C3 — dedupe @pkmn/dex client bundle.** The build emits two byte-identical 1.75 MB chunks of abilities/moves/species plus a separate 3.05 MB pkmn learnset chunk. Pre-extracting a 300 KB species+types+stats subset would save ~6.55 MB raw / ~1.4 MB gzipped — single biggest perf win available. Estimated 2 h, but touches dex helpers that need careful audit. Backlog ticket filed.

2. **R6 — per-species EV-spread landing pages** are the largest keyword gap vs Pikalytics. The species data + usage stats already exist in the codebase; structured pages would capture a large evergreen long-tail query bucket.

3. **C5 #1 — owner_id corruption (17-18 May).** A column-position mismatch in `/api/share` POST swapped `is_unlisted` into the owner_id column for shares created in that window. Fixed in code (b1e95df) but `.swarm/drafts/vgc195-db-repair.sql` was never run against production. **Human action required** — file ticket flagged for repair.

4. **R6 — noindex `?key=` collab URLs.** Implemented this run (5bb4668). Listed here as a model for the kind of audit-driven fix that should be a recurring sweep.

5. **C5 #4 — `shares.species[]` write-only column.** Migration added a column + GIN index "to remove the 6-CTE regex chain"; the chain was then shipped anyway. Either route queries through the column or drop the migration to avoid confusion.

## Top 5 Quick Wins (most landed tonight)

- ✅ Webhook signature header fix (committed: f2121c3)
- ✅ Rental code in ShareModal (committed: c4dcdce)
- ✅ Pikalytics dead code (committed: da4ab79)
- ✅ Save button race fix (committed: 9b63c8f)
- ✅ Weekly digest cross-product (committed: 5e5ce29)

## Conflict-Risk Files (touched on main in last 7d, mentioned by Wave 1)

From `.swarm/main-changed-files.md` overlaps:
- `src/components/report/PokemonCard.tsx` — W1 touched this file (acceptable: small, contained change). Overlap recorded; no actual conflict during commit.
- `src/lib/linear.ts`, `src/lib/email.ts`, `src/lib/discord-bot.ts` — C2 flagged `res.json()` return-any patterns; deferred (file-level overlap, dedicated ticket recommended).

## PostHog signal

POSTHOG_API_KEY not available in the swarm container. No PostHog data was pulled this run. Future-runs ticket TBD.

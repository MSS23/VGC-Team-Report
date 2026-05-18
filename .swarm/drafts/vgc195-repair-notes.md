# VGC-195 DB Repair — Human Review Notes

**Status:** Draft — do not execute without review  
**Bug window:** ~2026-05-17 00:00 UTC → 2026-05-18 06:00 UTC (approximate)  
**Fix commit:** 303e6fc (deployed 2026-05-18)  
**Script:** `.swarm/drafts/vgc195-db-repair.sql`

---

## What went wrong

The 2026-05-17 deploy shipped a broken INSERT into the `shares` table that swapped two values:

| Column | Should have received | Actually received |
|---|---|---|
| `owner_id` | Clerk user ID (string) | `is_unlisted` cast to text → `'false'` |
| `search_vector` | Computed tsvector | Clerk user ID string |

Every share created after that deploy and before the fix (303e6fc) is corrupted in the same way.

---

## Recovery approach

The `edit_changelog` table has a separate INSERT that was **not** affected. Its `editor_id` column on the first version entry (`version = 1`) holds the real Clerk user ID that belongs in `shares.owner_id`.

The `search_vector` cannot be recovered directly — it must be rebuilt from the `shares.data` JSONB column using `to_tsvector`, which is what the correct INSERT always did.

---

## Script walkthrough (4 steps)

### Step 1 — Identify affected rows (safe, read-only)

Runs two SELECTs:
- Counts corrupted rows (`owner_id = 'false'`) inside the timestamp window.
- Previews what the recovered `owner_id` values will look like by JOINing `edit_changelog`.

**Run this first.** Adjust the `BETWEEN` timestamps using the actual Vercel deploy timestamps if you have them — the window in the script is intentionally wide.

### Step 2 — Repair (wrapped in a transaction, commented out by default)

Runs an UPDATE with a JOIN to `edit_changelog`:
- Sets `owner_id = ec.editor_id` (the recovered Clerk user ID).
- Rebuilds `search_vector` from `data->>'creatorName'`, `tournamentName` (weight A), `paste` (weight B), `teamSummary` (weight C) — matching the correct INSERT logic.

The UPDATE block is commented out with `/* … */`. **Uncomment it only when you are ready to run it.** It includes an inline verification SELECT before the `COMMIT` so you can inspect results before finalising. Replace `COMMIT` with `ROLLBACK` if anything looks wrong.

### Step 3 — Check for unrecoverable rows

After the UPDATE, re-runs the corrupted-row SELECT. Any rows that still show `owner_id = 'false'` had no matching `edit_changelog` entry (anonymous sessions, deleted changelog rows, etc.).

Options for unrecoverable rows:
- Set `owner_id = NULL` (treats them as anonymous — safest fallback, a commented-out UPDATE is provided).
- Leave them and investigate individually via `edit_token` / share URL / Clerk dashboard.

### Step 4 — Final verification

Confirms zero corrupted rows remain and spot-checks that `search_vector` was rebuilt (non-zero length).

---

## Before you run this

- [ ] Pull actual deploy timestamps from the Vercel dashboard and tighten the `BETWEEN` window.
- [ ] Run Step 1 in a read-only connection / staging DB first if possible.
- [ ] Confirm the `edit_changelog` schema: column name `editor_id`, `share_id`, `version`. Adjust if different.
- [ ] Confirm the `shares.data` JSONB field names (`creatorName`, `tournamentName`, `paste`, `teamSummary`) match production.
- [ ] Run the full repair in a transaction (Step 2 is already wrapped in `BEGIN … COMMIT`).
- [ ] Notify the team in Discord #builds after the repair is confirmed.

---

## Risk assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Timestamp window too wide — touches legitimate rows | Low | Legitimate rows have `owner_id` as a Clerk ID string, not `'false'`. The WHERE clause is safe. |
| Timestamp window too narrow — misses corrupted rows | Medium | Step 3 will catch any survivors. Widen the window if needed. |
| edit_changelog missing for a share | Low–Medium | Step 3 identifies these. Fallback: set `owner_id = NULL`. |
| search_vector rebuilt incorrectly | Low | Uses identical logic to the correct INSERT. Verify with a full-text search after repair. |
| Transaction timeout on large datasets | Low | The window is ~30 hours of traffic. Unlikely to be millions of rows. |

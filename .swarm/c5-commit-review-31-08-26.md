# Commit review — last 20 commits on `main` (2026-08-31)

Scope: `0f73ba3 … 70c4633` (20 commits, `git show` on each). Read-only review.
Baseline: `vitest run` → 41 files / 417 tests, all green. Every finding below is
invisible to that suite.

Verdict: the batch is mostly high-quality — real bugs, real regression tests,
honest commit messages. Four defects are worth fixing; the rest is noise-level.
No regression found in the Champions SP logic itself (`stat-calculator.ts` /
`convertToChampionsSp` were not touched; the SP budget constants 66 / 32 are
used correctly everywhere they appear in this range, and `1db8419` genuinely
corrects the 600/200 myth in the user-facing docs and pins it with a drift test).

---

## 1. HIGH — Three broken Tailwind classes ship a visible UI regression

Commit `0024679` ("mobile touch and layout fixes across report UI").

`src/components/report/SpeedTierChart.tsx:132`
```tsx
className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 min-h-11text-[10px] sm:text-xs font-semibold …`}
```
`src/components/report/SpeedTierChart.tsx:482` and `:500`
```tsx
className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-11text-xs font-semibold …`}
```

A missing space glued `min-h-11` to the font-size class. `min-h-11text-[10px]`
and `min-h-11text-xs` are not classes Tailwind emits, so **both** utilities are
dropped.

Failure scenario:
- Open any report → Speed Tiers section. The "Mega Forms" and "Meta Threats"
  buttons (482 / 500) lose `text-xs`; their label falls back to the inherited
  font size (~14–16px instead of 12px) on **desktop and mobile**, next to a
  12×12 SVG icon the same commit added — the buttons render visibly oversized
  and mismatched against every neighbouring pill.
- The speed-modifier pills (132) lose `text-[10px]` on mobile, so a row of
  pills that was tuned for a 375px viewport now renders at inherited size and
  wraps/overflows.
- All three lose the 44px `min-h-11` — i.e. the accessibility fix this very
  commit exists to deliver never applied. `ui-checklist-reviewer` would have
  been satisfied by the diff text while the built CSS has neither rule.

This is the clearest "committed to look right in the diff rather than to be
correct" defect in the batch: no test can see it and the diff reads fine.

Minimal fix: insert the missing space in all three — `min-h-11 text-[10px]`,
`min-h-11 text-xs`, `min-h-11 text-xs`. Worth a grep guard for
`/min-h-\d+[a-z]/` in the UI checklist.

---

## 2. MEDIUM-HIGH — Clarity consent race: revoking consent mid-load still starts session replay

Commit `6cec919` ("cut initial JS on every route and the homepage").

`src/components/providers/ClarityProvider.tsx:20-37`
```tsx
let started = false;
let clarity: typeof import("@microsoft/clarity").default | null = null;

const start = async () => {
  if (started) return;
  started = true;
  const { default: Clarity } = await import("@microsoft/clarity");
  clarity = Clarity;
  Clarity.init(id);
  Clarity.consent(true);
};

if (hasAnalyticsConsent()) void start();

return onConsentChange((accepted) => {
  if (accepted) void start();
  else if (started) clarity?.consent(false);
});
```

Before this commit `Clarity` was a static binding, so `Clarity.consent(false)`
always had something to call. Now the withdrawal path depends on a variable
that is only assigned *after* the ~46KB dynamic import resolves.

Failure scenario: a visitor accepts analytics (or arrives with consent already
stored, so `start()` fires during hydration) and then withdraws consent within
the import window — clicking "Reject" in the cookie banner, or toggling
analytics off in privacy settings on a slow/3G connection. `started` is already
`true`, so `clarity?.consent(false)` is a no-op against `null`; the in-flight
`start()` then resolves and runs `Clarity.init(id); Clarity.consent(true)`.
Session replay begins **after** the user opted out and stays on for the rest of
the session, with nothing left to turn it off. The file's own doc comment ("If
consent is withdrawn later in the session we call Clarity.consent(false)") is
now false. This is a consent/GDPR-shaped bug, not just a UX one.

Minimal fix: track the desired state rather than the module handle, e.g.

```tsx
let consentRevoked = false;
const start = async () => { … const { default: C } = await import(…);
  clarity = C; if (consentRevoked) return; C.init(id); C.consent(true); };
… else if (started) { consentRevoked = true; clarity?.consent(false); }
```

Same missing-guard pattern (no `.catch`, no in-flight cancellation) exists on
the other dynamic imports added in `415a281` — `useTeamReport.parseTeam` and
`page.tsx`'s `hasMegaCapable` effect — but those are mitigated by
`ChunkErrorReloader`'s `unhandledrejection` handler. See §5.

---

## 3. MEDIUM — Incomplete refactor: the `=== header ===` fix landed in 2 of 3 copies, and the shared copy still drops a Pokémon

Commits `1b14f3b` (parser) and `82f9210` (extract-species + SQL replica).

`1b14f3b` correctly established that pastes exist where a `=== … ===` header is
**not** followed by a blank line, and fixed the parser by stripping headers
*before* splitting into blocks:

```ts
const withoutHeaders = normalized.replace(/^===.*===[ \t]*$/gm, "");
```

Eleven days later `82f9210` fixed the same bug class in `extract-species.ts`
with a weaker strategy — skip the whole *block*:

`src/lib/utils/extract-species.ts:8-9`
```ts
// Showdown backup format wraps teams in "=== [format] Name ===" headers
if (firstLine.startsWith("===")) continue;
```

Failure scenario A (shared copy, all consumers): paste
`=== [gen9vgc2026regj] Worlds Team ===\nGarchomp @ Life Orb\n…` (header glued
to the first mon — exactly the shape `1b14f3b` documents). Header and Garchomp
are one block, so the whole block is skipped and **Garchomp is dropped from the
species list**. `extractSpecies` feeds the explore/dashboard/saved/feed card
sprite rows, `/s/[id]` SEO metadata and JSON-LD, `/embed/[id]`, the champions
meta counter, and `isDifferentTeam`. The report renders six Pokémon while every
card, preview and meta count shows five, missing the lead.

Failure scenario B (missed copy): `src/app/s/[id]/opengraph-image.tsx:44` has a
private duplicate of `extractSpecies` that `82f9210` never touched — it has no
`===` skip at all. For any backup-format paste (header *with* a blank line, the
common case), the OG social card treats `=== [gen9vgc2026] My Team ===` as
species #1 — a failed sprite lookup in the preview image — and, because of
`.slice(0, 6)`, silently drops the real 6th Pokémon. Every Twitter/Discord
preview of such a report is wrong. The commit message enumerates "extractSpecies
(and its SQL replica in champions/meta)" — the third copy simply wasn't
searched for.

Minimal fix: strip headers before splitting in `extract-species.ts`
(`paste.replace(/^===.*===[ \t]*$/gm, "")`, mirroring the parser), delete the
duplicate in `opengraph-image.tsx` in favour of the shared import, and add the
header-glued-to-first-mon case to `extract-species.test.ts` — the test added in
`82f9210` only covers the blank-line-after-header case and therefore certifies
the half of the bug that was fixed.

---

## 4. MEDIUM — The explore cursor `date_trunc` "fix" is a no-op on two paths and introduces duplicates on the third

Commit `82f9210`, claim: "explore cursor pagination compared microsecond
timestamps against ms-truncated cursors, skipping same-ms rows at page
boundaries".

`src/app/api/explore/route.ts:193` (popular), `:207` (views)
```sql
AND (COALESCE(rc.like_count, 0), date_trunc('milliseconds', s.created_at)) < (${c.value}, ${c.createdAt}::timestamptz)
```
`src/app/api/explore/route.ts:222-226` (chronological)
```sql
AND (date_trunc('milliseconds', ${col}), s.id) < (${chronologicalCursor.timestamp}::timestamptz, ${chronologicalCursor.id})
…
AND date_trunc('milliseconds', ${col}) < ${chronologicalCursor.timestamp}::timestamptz
```

The cursor constant is always millisecond-aligned (it is produced by
`Date.toISOString()` — `serializeChronologicalCursor`, and `parseCompositeCursor`
passes it straight through). For an ms-aligned constant `C`,
`date_trunc('milliseconds', x) < C` is **exactly equivalent** to `x < C`.

- popular (`:193`), views (`:207`), and the no-id chronological branch (`:226`):
  the truncation changes nothing. A row created at `10:00:00.005400` when the
  page's last row was `10:00:00.005900` (cursor serialises to `…005`) is still
  excluded by `< …005`, i.e. it is still **silently dropped** from the results.
  The bug named in the commit message is not fixed on these paths.
- the id-tiebreak branch (`:223`) *does* change behaviour, and asymmetrically:
  ordering is `ORDER BY col DESC, s.id DESC` on the untruncated column while the
  cursor predicate compares the truncated one. A row already returned on page 1
  (later in the same millisecond, e.g. `…005950`) whose id sorts *below* the
  cursor id now satisfies `(…005, 'aaa') < (…005, 'mmm')` and is returned
  **again** on page 2 — a duplicated report card and a duplicate React key.

Failure scenario: two reports published in the same millisecond (bulk import,
fork storm, or a seed script) land on a page boundary; the user hits "Load more"
and either loses a report entirely (popular/views/newest without id) or sees one
twice (newest/updated with id). Secondary cost: wrapping the column in
`date_trunc` makes the predicate non-sargable, so `idx_shares_public_updated`
(`src/lib/db.ts:28`) can no longer satisfy the filter directly.

Minimal fix: stop truncating in SQL and stop truncating the cursor — serialise
full microsecond precision (e.g. emit `created_at` from Postgres as text rather
than round-tripping through a JS `Date`), then keep the plain
`(col, id) < (ts, id)` tuple comparison, which is both correct and sargable.

---

## 5. LOW-MEDIUM — The chunk-error recovery component is now itself behind a chunk

Commit `6cec919` moved `ChunkErrorReloader` (and `ServiceWorkerRegistration`,
`InstallPrompt`, `ConnectivityStatus`) from static imports in
`src/app/layout.tsx` into `src/components/ui/DeferredLayoutExtras.tsx` behind
`dynamic(..., { ssr: false })`.

`ChunkErrorReloader` is the only thing that recovers a stale tab after a deploy
(it reloads once on a `ChunkLoadError` / `unhandledrejection`). It now loads
from a chunk that a stale tab may itself 404 on. Failure scenario: a tab left
open across a Vercel deploy; the deferred chunk 404s; the reloader never mounts;
the user then clicks Analyze, whose `import("@/lib/analysis/analyze-team")`
(`415a281`) also 404s with no `.catch` — the button does nothing, forever, with
no error UI and no auto-reload. Before these two commits, both halves worked.

Minimal fix: keep `ChunkErrorReloader` a static import in `layout.tsx` (it is
~1KB and has no dependencies); defer only the other three. Independently, give
the `parseTeam` / `hasMegaCapable` / `detect-*` dynamic imports a `.catch` that
surfaces a retry affordance.

---

## 6. LOW — Silent behaviour changes worth knowing about (no fix necessarily needed)

- `src/lib/cache.ts:75` (`fd0aa6f`) — `cacheSetIfAbsent` now returns `false` on
  a Redis **error**, not just when unconfigured. Deliberate and documented, but
  the consequence is unstated: during an Upstash outage
  `src/app/api/views/[shareId]/route.ts:37` treats every request as a repeat
  view, so view counts **freeze entirely** for the duration rather than
  over-counting. Fine as a trade-off; should be said out loud in the comment.
- `src/app/api/reactions/[shareId]/route.ts:77-80` (`fd0aa6f`) — the new
  existence check `AND deleted_at IS NULL` also covers the un-like path, so a
  user who liked a report that was later trashed gets a 404 when un-liking; with
  `a1255c1`'s new `if (!res.ok) throw`, the heart visibly snaps back to filled.
  Niche, but it is a user-visible interaction that used to succeed.
- `src/app/api/creator/[name]/route.ts:60` (`fd0aa6f`) — `LIMIT 100` with no
  pagination: a creator with >100 public reports silently loses the tail of
  their profile. Bounding the payload is right; there is no "load more".
- `src/lib/validation/champions-legality.ts:15-16` — the file header still says
  "traditional EV spreads are validated against 512/252" after `1b14f3b`
  corrected the code to 510. Doc drift only, but it is the same drift class
  `1db8419` just added a test to prevent.
- `src/lib/analysis/detect-archetype.ts:88-93` (`1b14f3b`) — `isSpScale` infers
  the scale from "every mon's EV total ≤ 66". Correct for the two common cases
  (real SP pastes; all-zero spreads), but a classic-EV team where every member
  carries only a token spread (e.g. six `EVs: 32 Atk / 32 Spe` mons) is read as
  SP and scaled by `32/252`, so a 64-EV team gets tagged "Hyper Offense". Low
  confidence that this shape occurs in the wild; noted, not recommended for a
  fix. Nothing here touches the 66/32 budget constants themselves.

---

## Checked and found clean

- `convertToChampionsSp` / `stat-calculator.ts` — untouched in this range; no SP
  regression. `1db8419`'s `sp-docs-drift.test.ts` correctly pins llms.txt and the
  FAQ to `CHAMPIONS_TOTAL_SP` / `CHAMPIONS_MAX_SP_PER_STAT`.
- `getSpeciesClauseKey` (`1b14f3b`) — verified against `dex-subset.json`:
  Kangaskhan-Mega→Kangaskhan, Rotom-Wash/Heat→Rotom, Zygarde-10%→Zygarde,
  Terapagos-Terastal→Terapagos, Ninetales-Alola→Ninetales all resolve, so the
  regex fallback is genuinely just a fallback. EV cap 512→510 is right.
- `champions/meta` SQL (`82f9210`) — `row_number()` renumbering is correct;
  Postgres applies `WHERE` before window functions, so the `block_num <= 6`
  filter downstream sees a gapless sequence.
- `44f780c` — the `allowCommentsRef` is written through the exported setter and
  the hydration path (`useHomePage.ts:625`) uses that same setter, so the ref
  cannot go stale on a loaded report.
- `d44b93a` / `b865fa2` — `getClientIp` migration is complete; the tripwire test
  actually scans `src/app/api/**/route.ts`.
- `9897389`, `a099f97`, `0242253`, `164fb87`, `c4c6c75`, `fd0aa6f` (cleanup /
  comments-visibility / publish-tag rule), `70c4633` (`readRestorableDraft`) —
  all reviewed; no defect found. `9897389` and `a099f97` in particular update a
  test that had pinned the buggy behaviour, which is the right move and is
  called out in the message.
- No `TODO`/`FIXME` introduced; two `ponytail:` follow-up notes
  (`useTeamReport.ts` draft TTL, linear webhook delivery-id dedupe) are honest
  scope markers, not abandoned work.
- No test was weakened or deleted to make a build pass.

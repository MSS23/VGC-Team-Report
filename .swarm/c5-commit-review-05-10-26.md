# Retrospective review — last 20 commits on `origin/main`

Range: `0f73ba3` (2026-08-11) → `70c4633` (2026-08-24). Every finding below was
re-verified against the working tree, not just the diff.

**Still-present findings: 11** — 1 High, 5 Medium, 5 Low.
(Plus 4 already-fixed / non-issues noted at the end.)

Overall quality is high: the commits are tightly scoped, almost every fix carries
a named regression test, and the comment-to-code ratio makes intent auditable. The
problems cluster in two places: (a) a fix applied to the cron path but not to the
parallel account-deletion path, and (b) a UI commit that shipped a broken Tailwind
class string.

---

## F1 — HIGH — `user/delete` was not updated with `purgeSatellites`' table list

**Commit:** `fd0aa6f` *"fix: API hardening — … orphan rows, cleanup gaps"*
**STILL PRESENT.**

`fd0aa6f` widened the cron cleanup's satellite purge
(`src/app/api/cleanup/route.ts:29-45`) to cover `comment_flags`,
`collection_items`, `collaborators`, `notifications` and to NULL
`match_logs.share_id`. The **parallel hard-delete path**, the GDPR account
deletion in `src/app/api/user/delete/route.ts:52-82`, was never given the same
list. It hard-`DELETE`s `shares WHERE owner_id = userId` (line 77) but leaves
behind, for those share ids:

| Table | `cleanup/route.ts` | `user/delete/route.ts` |
|---|---|---|
| `comment_flags` | purged (`:32`) | **missing** |
| `share_versions` by `share_id` | purged (`:38`) | only `editor_id = userId` (`:59`) |
| `edit_changelog` by `share_id` | purged (`:39`) | only `editor_id = userId` (`:58`) |
| `collection_items` by `share_id` | purged (`:40`) | only own collections (`:54`) |
| `notifications` by `source_share_id` | purged (`:42`) | only `user_id` (`:71`) |
| `match_logs` | `share_id` NULLed (`:44`) | **not touched at all** |

Two consequences:

1. **Storage** — `share_versions` / `edit_changelog` rows written by a
   *collaborator* on a deleted user's share survive forever with no parent row.
   That is the exact shape of the July 2026 incident CLAUDE.md records
   (`share_versions` snapshots at 447MB on a 512MB Neon free tier).
2. **Privacy** — `match_logs` is `user_id`-keyed personal match history
   (`src/lib/db.ts:258-268`) and is never deleted by the account-deletion
   endpoint, so a GDPR erasure request leaves it behind.

`comment_flags` has no FK (`src/lib/db.ts:62-70`), so nothing cascades; every
delete site must purge explicitly. Three of four do (`cleanup/route.ts:32`,
`comments/[shareId]/[commentId]/route.ts:79`, `comments/flag/route.ts:67`) —
`user/delete/route.ts:65` is the one that does not.

**Minimal fix** — inside the existing `if (shareIds.length > 0)` block at
`src/app/api/user/delete/route.ts:64`, before the `comments` delete:

```ts
statements.push(sql`DELETE FROM comment_flags
  WHERE comment_id IN (SELECT id FROM comments WHERE share_id = ANY(${shareIds}::text[]))`);
statements.push(sql`DELETE FROM share_versions   WHERE share_id = ANY(${shareIds}::text[])`);
statements.push(sql`DELETE FROM edit_changelog   WHERE share_id = ANY(${shareIds}::text[])`);
statements.push(sql`DELETE FROM collection_items WHERE share_id = ANY(${shareIds}::text[])`);
statements.push(sql`DELETE FROM collaborators    WHERE share_id = ANY(${shareIds}::text[])`);
statements.push(sql`DELETE FROM notifications    WHERE source_share_id = ANY(${shareIds}::text[])`);
```

and, unconditionally, `statements.push(sql`DELETE FROM match_logs WHERE user_id = ${userId}`)`.
(Note the semantics differ deliberately: the cron NULLs `match_logs.share_id`
to preserve a surviving user's history; account deletion should delete the rows.)
All statements go in the existing single `sql.transaction([...])`, ordered before
the `shares` delete.

**Good follow-up commit tonight?** Yes — one file, additive, inside an existing
transaction. Pair it with a test asserting the two purge lists agree (e.g. a
tripwire that both route files mention the same satellite table names), which is
exactly the regression-test style this repo already uses in
`no-raw-forwarded-for.test.ts` and `homepage-eager-imports.test.ts`.

---

## F2 — MEDIUM — three broken Tailwind class strings: `min-h-11text-…`

**Commit:** `0024679` *"fix: mobile touch and layout fixes across report UI"*
**STILL PRESENT.**

A missing space concatenated the new touch-target utility onto the font-size
utility, producing a class that matches nothing in Tailwind. Both utilities are
therefore dead:

- `src/components/report/SpeedTierChart.tsx:132` — `min-h-11text-[10px] sm:text-xs`
- `src/components/report/SpeedTierChart.tsx:482` — `min-h-11text-xs`
- `src/components/report/SpeedTierChart.tsx:500` — `min-h-11text-xs`

So the commit's stated fix ("speed-chart modifier pills and overlay toggles now
meet the 44px touch minimum") **did not ship** for these three controls, and as
collateral damage the mobile font size regressed to the inherited default on the
modifier pills and the Mega Forms / Meta Threats buttons. `grep -rn "min-h-11[a-z]" src/`
returns exactly these three lines and nothing else, so the blast radius is bounded.

Tailwind silently ignores unknown classes and ESLint has no rule for it, which is
why the pre-commit gate (tsc / vitest / build) passed. CLAUDE.md requires
`ui-checklist-reviewer` after touching any `.tsx`; a diff review against the 44×44
touch-target standard would have caught this.

**Minimal fix** — insert the missing space in all three lines:
`min-h-11 text-[10px]`, `min-h-11 text-xs`, `min-h-11 text-xs`.

**Good follow-up commit tonight?** Yes — the single best candidate. One file,
three characters, zero behavioral risk, and it restores an intended accessibility
fix. Worth a quick visual check that `min-h-11` (2.75rem = 44px) does not blow out
the pill row's wrapping on a narrow viewport.

---

## F3 — MEDIUM — explore cursor: `ORDER BY` still compares raw timestamps while the cursor predicate compares millisecond-truncated ones

**Commit:** `82f9210` *"…explore search"* ("cursor pagination compared microsecond
timestamps against ms-truncated cursors")
**STILL PRESENT.**

The cursor value is produced by JS `Date.toISOString()`
(`src/app/api/explore/route.ts:334`), which is millisecond precision, while
Postgres `timestamptz` keeps microseconds. `82f9210` fixed this by truncating in
the **`WHERE`** clause but left the **`ORDER BY`** on the raw column, so the two
no longer agree:

- `:193` filter `date_trunc('milliseconds', s.created_at)` vs `:194`
  `ORDER BY COALESCE(rc.like_count,0) DESC, s.created_at DESC`
- `:207` / `:208` — same mismatch on the `views` branch
- `:223`/`:225` filter vs `:228` `ORDER BY ${col} DESC, s.id DESC`

Within a single millisecond the rows are ordered by raw microseconds, but the
cursor predicate excludes (or admits) the whole millisecond as a unit. If a page
boundary falls inside a shared millisecond, rows are **skipped** on the next page
(chronological branch: or **duplicated**, since the tuple tie-break `s.id` can
re-admit a row that raw-ordering already returned). The original bug was traded
for a narrower one rather than eliminated.

It is genuinely narrow — it needs two public shares created in the same
millisecond landing on a page boundary — hence Medium, not High.

**Minimal fix** — make `ORDER BY` use the same expression as the predicate, and
give the two composite branches a final id tie-break:

```sql
ORDER BY COALESCE(rc.like_count, 0) DESC, date_trunc('milliseconds', s.created_at) DESC, s.id DESC
ORDER BY date_trunc('milliseconds', ${col}) DESC, s.id DESC
```
(The cleaner alternative is to stop truncating anywhere and serialize the cursor
from Postgres' own full-precision text instead of a JS `Date`, but that changes
the cursor wire format and is not a small commit.)

**Good follow-up commit tonight?** Borderline. The `ORDER BY` edit is three lines,
but it changes index usage on the hot `/api/explore` path (a `date_trunc`
expression is not covered by a plain `created_at` index), so it wants an `EXPLAIN`
before shipping. Not a blind quick fix.

---

## F4 — MEDIUM — new `src/lib` logic in `detect-archetype.ts` shipped with no test

**Commits:** `1b14f3b` (SP-scale thresholds + real mega-stone lookup), `415a281`
(module moved to the lazy path)
**STILL PRESENT.**

CLAUDE.md: *"New logic in `src/lib/` gets a vitest test beside it (`__tests__/`);
regressions get a test that names the bug."* `1b14f3b` added genuinely non-obvious
logic to `src/lib/analysis/detect-archetype.ts:82-92` — an `isSpScale` heuristic
and an `evScale` multiplier applied at three thresholds (`:96`, `:111`, `:128`) —
and added **no test**. `src/lib/analysis/__tests__/` contains only
`item-boosts.test.ts`, `sp-docs-drift.test.ts`, `stat-calculator.test.ts`. The
same commit *did* add regression tests for its type-chart, parser and legality
changes, so this is an isolated omission rather than a pattern.

The untested heuristic also has a real false-positive path
(`src/lib/analysis/detect-archetype.ts:86-91`):

```ts
const isSpScale = pokemon.length > 0 && pokemon.every((p) => {
  const evs = p.parsed.evs;
  if (!evs) return true;
  return Object.values(evs).reduce((a, b) => a + (b ?? 0), 0) <= CHAMPIONS_TOTAL_SP;
});
```

Any classic-format team where *every* member happens to total ≤ 66 EVs — most
importantly **a paste with no `EVs:` line at all**, which
`src/lib/parser/showdown-parser.ts` yields as an all-zero spread — is classified
as SP scale, and `evScale` becomes `32/252 ≈ 0.127`. For all-zero spreads the
inline comment is right that nothing fires either way, but a lightly-invested
classic team (e.g. six mons at 4 EVs) would be scored against SP-scale thresholds
of ~25 instead of 200 and could be mis-tagged Hyper Offense.

**Minimal fix** — add `src/lib/analysis/__tests__/detect-archetype.test.ts`
covering: (a) a Champions SP spread crossing the scaled threshold; (b) a classic
252/252 spread still tagged Hyper Offense; (c) an Eviolite holder **not** tagged
Mega Offense (the bug `1b14f3b` fixed, named in the test); (d) an all-zero-EV team
producing no investment-based archetype. If (d) or a 4-EV team shows a wrong tag,
tighten `isSpScale` to also require `total > 0` on at least one member.

**Good follow-up commit tonight?** Yes — test-only, no production risk, and it
satisfies a hard CLAUDE.md rule. Do this one before F3.

---

## F5 — MEDIUM — `handleAnalyze` uses `analysis` as a "team is loaded" probe, but `analysis` became async

**Commits:** `0f73ba3` (introduced the probe), `415a281` (made `analysis` async)
**STILL PRESENT.**

`src/hooks/useHomePage.ts:774`:

```ts
if (draftId && (!analysis || isDifferentTeam(analysis.pokemon.map((p) => p.parsed.species), teamPaste))) {
  clearDraft();
}
```

When `0f73ba3` wrote this, `analysis` was a synchronous `useMemo`, so `!analysis`
meant "genuinely no team loaded". `415a281` converted it to
`useState` + an effect that `await import("@/lib/analysis/analyze-team")`
(`src/hooks/useTeamReport.ts:110-130`), so `analysis` is now `null` for the whole
duration of a ~190KB lazy-chunk fetch. `loadDraft`
(`src/hooks/useHomePage.ts:714-726`) sets `draftId` via `setActiveDraft(id)` and
then calls `parseTeam`, so during that window `draftId` is set while `analysis` is
still `null`. A user who hits Analyze in that window — plausible on a slow
connection after opening a draft from `/dashboard` — takes the
`!analysis ⇒ clearDraft()` branch and **detaches their existing dashboard draft**;
the 4s autosave then creates a second draft. That is the same class of silent data
loss `0f73ba3` set out to prevent.

**Minimal fix** — compare against the paste rather than the analysis, which is
synchronous and needs no dex:

```ts
import { extractSpecies, isDifferentTeam } from "@/lib/utils/extract-species";
// ...
if (draftId && isDifferentTeam(extractSpecies(paste), teamPaste)) clearDraft();
```

`isDifferentTeam` already returns `false` for an empty previous team
(`src/lib/utils/extract-species.ts:23`), so the `!analysis` special case
disappears and the cold-start behavior is unchanged. `extractSpecies` is already
imported in this file and is pure string work, so it does not reintroduce an
eager heavy import (`homepage-eager-imports.test.ts` stays green —
`@/lib/utils/extract-species` is not on its forbidden list).

**Good follow-up commit tonight?** Yes — one hook, two lines, and it is testable
with the existing `extract-species` test harness. Add a case pinning "same team,
no analysis yet ⇒ draft kept".

---

## F6 — MEDIUM — `parseTeam` is an uncancellable async write; `reset()` can be undone by an in-flight parse

**Commit:** `415a281`
**STILL PRESENT.**

`src/hooks/useTeamReport.ts:106-110`:

```ts
const parseTeam = useCallback((input: string) => {
  void import("@/lib/analysis/analyze-team").then(({ parseShowdownPaste }) => {
    setParsedTeam(parseShowdownPaste(input));
  });
}, []);
```

The sibling `analysis` effect two lines below got a `cancelled` flag
(`:120-129`); `parseTeam` did not. Two consequences:

1. `reset()` (`:163-166`) sets `parsedTeam = null`, `paste = ""` and calls
   `evictStoredDraft()`. A `parseTeam` promise still in flight resolves
   afterwards and re-sets `parsedTeam`, at which point the persist effect
   (`:88-102`) re-writes `STORAGE_KEY` with the now-empty `paste`. Self-limiting
   — `readRestorableDraft` rejects a blank paste at `:56` — but it leaves the
   hook showing a team the user just cleared.
2. Two `parseTeam` calls in quick succession have no ordering guarantee beyond
   promise-resolution order. Same-module resolution makes out-of-order delivery
   unlikely in practice, which is why this is Medium and not High.

**Minimal fix** — add a monotonic generation ref and drop stale resolutions:

```ts
const parseGenRef = useRef(0);
const parseTeam = useCallback((input: string) => {
  const gen = ++parseGenRef.current;
  void import("@/lib/analysis/analyze-team").then(({ parseShowdownPaste }) => {
    if (gen === parseGenRef.current) setParsedTeam(parseShowdownPaste(input));
  });
}, []);
```
and bump `parseGenRef.current` in `reset()` so a pending parse cannot resurrect
cleared state.

**Good follow-up commit tonight?** Yes — single file, and `useTeamReport.test.ts`
already has the jsdom + `vi.waitFor` scaffolding to test "reset during a pending
parse leaves no team".

---

## F7 — LOW — four `ponytail:` markers: deferred work that no marker grep finds

**Commits:** `a099f97`, `70c4633`, plus two older
**STILL PRESENT.**

`TODO`, `FIXME`, `HACK`, `XXX`, `@ts-ignore`, `@ts-expect-error` and
`@ts-nocheck` are all **zero** across `src/` — genuinely clean. But there are four
`ponytail:` comments doing a TODO's job, in a word that no conventional marker
grep, lint rule or CI check will ever hit:

- `src/app/api/webhooks/linear/route.ts:66` — *"no delivery-id dedupe — within the
  window a replay is possible; add a seen-id cache if this webhook ever mutates
  state."* Accurate and currently harmless (the handler is read-only), but it is
  the known limit of a security fix (`a099f97`) with no tracking.
- `src/hooks/useTeamReport.ts:25` — *"30-day draft TTL … Server-side check if this
  ever hurts."* The acknowledged residual hole in `70c4633`: a publish from
  another device cannot flip this device's marker, so a published team can still
  resurface as a local draft for up to 30 days.
- `src/lib/data/type-chart.ts:189` — *"Dry Skin's extra Fire weakness isn't
  modeled — immunities only."* A real domain gap in defensive coverage output.
- `.github/workflows/ci.yml:22` — *"35 pre-existing lint errors (react-hooks etc.)
  — non-blocking."* `eslint` runs in CI but cannot fail the build. This is why F2
  and other class-string mistakes have no automated backstop.

**Minimal fix** — either rename all four to `TODO:` so the standard grep finds
them, or file them as Linear issues and reference the issue id in the comment.

**Good follow-up commit tonight?** Yes if done as a pure rename (4 comment lines,
no logic). The underlying work items are separate, larger tickets. The CI lint
item deserves its own decision: 35 errors is a real backlog, and leaving `eslint`
advisory is what let F2 ship.

---

## F8 — LOW — stale `512/252` doc comments survive the 510 fix

**Commit:** `1b14f3b`
**STILL PRESENT.**

The code was corrected from 512 to 510 (`src/lib/validation/champions-legality.ts:277-287`)
but two comments in the same file still teach the wrong number:

- `:15` — *"traditional EV spreads are validated against 512/252"* (module header)
- `:255` — *"Traditional EV spreads (512 total, 252 per stat) are still accepted"*

This is exactly the doc-drift class that `VGC-266` built
`src/lib/analysis/__tests__/sp-docs-drift.test.ts` to prevent for the SP docs —
the same discipline was not applied to the file being changed.

**Minimal fix** — change both comments to `510/252`.

**Good follow-up commit tonight?** Yes — comment-only, zero risk. Ideal to
piggyback onto F2 or F4 so the commit is not docs-only (CLAUDE.md's Ignored Build
Step gotcha: a docs-only tip commit cancels the whole Vercel build).

---

## F9 — LOW — `postToBuildsChannel` logs a bad status but still rejects on a network error

**Commit:** `0242253`
**STILL PRESENT.**

`src/lib/discord-webhook.ts:22-36` now checks `res.ok` and logs non-2xx, which was
the point of the commit. But `await fetch(...)` itself is unguarded, so a DNS or
TLS failure rejects and propagates into the caller. All three cron routes
`await` it at top level of their handlers
(`src/app/api/cron/daily-ops/route.ts:320`,
`src/app/api/cron/weekly-report/route.ts:152`,
`src/app/api/cron/posthog-errors/route.ts:283` and `:300`). The commit's own
rationale — *"a deleted (410) or rate-limited (429) webhook left the crons looking
healthy"* — applies equally to a network failure, and there the cron now fails
outright instead of completing its real work.

**Minimal fix** — wrap the fetch so notification failure can never fail the job:

```ts
let res: Response;
try {
  res = await fetch(url, { /* … */ });
} catch (e) {
  console.error("Discord builds webhook unreachable:", e);
  return;
}
if (!res.ok) console.error(`Discord builds webhook failed: ${res.status} ${await res.text().catch(() => "")}`);
```

**Good follow-up commit tonight?** Yes — one function, clearly scoped, and it
finishes the job `0242253` started.

---

## F10 — LOW — `markPastePublished` snapshots `localStorage`, not the in-memory paste

**Commit:** `70c4633`
**STILL PRESENT.**

`src/hooks/useTeamReport.ts:146-157` reads `localStorage.getItem(STORAGE_KEY)` and
writes that value to `STORAGE_PUBLISHED_KEY`. The persist effect (`:88-102`) is
what populates `STORAGE_KEY`, and it only runs when `parsedTeam` is non-empty and
the path is not `/s/…`. If a publish fires before that effect has flushed the
latest edit, the published snapshot is one revision stale — so `readRestorableDraft`
(`:63`, `stored !== published`) sees a difference that is an artifact of ordering
rather than a real user edit, and the just-published team restores as a "draft"
again. This is the narrow residual of the bug `70c4633` was fixing, and the
`ponytail:` note at `:25` acknowledges a related hole.

**Minimal fix** — snapshot the authoritative in-memory value. Either accept it as
an argument, `markPastePublished(paste)`, writing `paste` to both keys, or have
the publish effect in `useHomePage.ts:328-333` pass the paste it just sent to the
server.

**Good follow-up commit tonight?** Marginal. The change is small but it touches
the draft-restore state machine that two of the last twenty commits already
revised; it deserves its own test pass rather than a quick patch.

---

## F11 — LOW — commit-message convention: `perf:` is not an allowed prefix

**Commits:** `6cec919`, `415a281`
**STILL PRESENT (history).**

CLAUDE.md specifies `VGC-XX: description` for Linear work and
`fix:`/`chore:`/`ci:` otherwise. `perf:` appears twice. Harmless and arguably an
improvement in expressiveness — but it is a documented convention, so either the
commits or CLAUDE.md should change. Recommend adding `perf:` to the allowed list
in CLAUDE.md rather than rewriting history.

**Good follow-up commit tonight?** Only as a one-line CLAUDE.md edit bundled with
another change (never as a docs-only tip commit).

---

## Verified correct — no action needed

Recorded so a later reviewer does not re-open them:

- **`JsonLd` escaping (`d44b93a`)** — `JSON.stringify(data).replace(/</g, "\\u003c")`
  at `src/components/seo/JsonLd.tsx:7` is correct: `<` is a valid JSON string
  escape, `<` only ever appears inside JSON strings, and the replacement contains
  no `$` pattern. `grep -rn "application/ld+json" src/` returns this one file, so
  there is **no unfixed sibling emitter** — the fix is complete.
- **`getClientIp` migration (`d44b93a` + `b865fa2`)** — no raw `x-forwarded-for`
  parsing remains anywhere in `src/` outside `src/lib/security/input-validation.ts`
  and its tests. The `b865fa2` tripwire scans only `src/app/api`, but a
  whole-tree grep confirms there is nothing for it to miss today. Widening its
  scan root to `src/` would make it future-proof; optional.
- **`item-boosts` ability case fix (`82f9210`)** — the lowercase
  `BOOSTER_ABILITIES` comparison at `src/lib/analysis/item-boosts.ts:9,36` is the
  only case-sensitive ability comparison in the codebase; grep for
  `Protosynthesis`/`Quark Drive` finds only data tables and comments elsewhere. No
  sibling call site was missed.
- **Orphan-insert guards (`fd0aa6f`)** — the reactions POST existence check at
  `src/app/api/reactions/[shareId]/route.ts:76-80` has a proper sibling:
  `src/app/api/user/saved/route.ts:95-98` already validates accessibility before
  inserting. Not a gap.
- **`comment_flags` delete ordering** — `cleanup/route.ts:30-34` comments that
  flags must be purged "before the comments they point at are gone", while
  `comments/[shareId]/[commentId]/route.ts:79` and `comments/flag/route.ts:66-67`
  delete flags *after* the comment. Harmless: `comment_flags` has no foreign key
  (`src/lib/db.ts:62-70`), so the ordering rationale in that comment is
  misleading but nothing breaks. Consider correcting the comment.
- **`cacheSetIfAbsent` fail-closed flip (`fd0aa6f`)** — the `catch { return false }`
  at `src/lib/cache.ts:74-76` looks like a swallowed error but is a deliberate,
  well-documented fail-closed choice protecting the write path. Correct.
- **Champions / SP conventions** — no commit in this range reintroduced EV
  assumptions into a Champions path, and nothing re-reads a pasted `Level:` line.

## Leftover-marker sweep (whole `src/` tree)

| Marker | Count | Notes |
|---|---|---|
| `TODO` | 0 | |
| `FIXME` | 0 | |
| `HACK` | 0 | |
| `XXX` | 0 | |
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | 0 | |
| `ponytail:` | 4 | **F7** — deferred work in a word no grep finds |
| `console.log` | 1 | `src/app/api/cron/weekly-digest/route.ts:373` — an intentional cron completion line (`[weekly-digest] Done — sent:… skipped:… errors:…`). Fine; `console.error` is used idiomatically elsewhere. |
| `catch {}` (empty) | 6 | All legitimate `localStorage`/`matchMedia` guards with explanatory comments: `src/components/providers/PostHogProvider.tsx:45,100`, `src/hooks/useDarkMode.ts:22,49`, `src/hooks/useTheme.ts:131,182`, plus the inline no-flash script in `src/app/layout.tsx:100`. Not findings. |
| `eslint-disable` | 15 | 7 are `@next/next/no-img-element` on deliberate raw `<img>` (sprite CDN with `onError` fallback chains); 5 are `react-hooks/exhaustive-deps`; 1 is `jsx-a11y/no-static-element-interactions` (`src/app/page.tsx:1673`). The `react-hooks` suppressions in `src/hooks/useExploreUrlSync.ts:138` and `src/hooks/useHomePage.ts:91,220` are the ones worth revisiting, given F5/F6 are both deps/ordering bugs in the same hooks. |

## Suggested order for tonight

1. **F2** — broken Tailwind classes (3 chars, restores a shipped-but-dead a11y fix).
2. **F4** — `detect-archetype` test (hard CLAUDE.md rule; test-only).
3. **F1** — `user/delete` satellite purge (highest impact; storage + GDPR).
4. **F5** — `handleAnalyze` paste-based team comparison.
5. **F9** — webhook fetch guard. **F8** + **F7** rename ride along as comment-only
   changes — but make sure the **tip** commit of any push carries real code, or
   Vercel cancels the whole build.

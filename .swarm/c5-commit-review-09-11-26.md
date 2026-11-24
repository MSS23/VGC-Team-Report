# C5 — Review of recent history for rushed / hacky / incomplete work

- **Date:** 2026-11-09
- **Branch:** `swarm-nightly-2026-11-09` (cut from `origin/main` @ `10dfd74`)
- **Scope A:** last 20 commits on `origin/main` — `10dfd74` back to `83fc12f`
- **Scope B:** the 21 **unmerged** commits on `origin/swarm-nightly-2026-11-02` (`origin/main..origin/swarm-nightly-2026-11-02`), `f73802c` → `d36f77f`, pending human review
- **Mode:** strictly read-only. No source file created, edited or deleted. The only write is this file.
- **Prior report read first:** `.swarm/c5-commit-review-26-10-26.md` (20 commits back to `d031232`, ending at `68796c5`). That window and this one **barely overlap** — `68796c5` is now 39 commits back — so almost everything below is NEW. Previously-reported items are tracked in a dedicated section with their current status.
- **PostHog / Vercel:** credentials absent per `.swarm/run-meta.md`; **skipped for the whole run**. Nothing below is inferred from production telemetry — every claim is read off a diff or the current tree.
- **Verification actually run:** full `vitest run` on main → **82 files passed / 1 skipped, 795 tests passed / 3 skipped, 42.5s**. Plus a targeted run of `stat-calculator.test.ts` + `sp-docs-drift.test.ts` → 66 passed. No typecheck/build (read-only audit; not needed for these findings).

---

## Summary

**12 real defects**, 1 regression on a previously-reported finding, 0 new TODO/FIXME/HACK markers anywhere, 0 deleted test files across all 41 commits.

The headline is not sloppiness — the branch work is some of the best in this repo's history (see *Verified clean*). The headline is a **cherry-pick that dropped the source half of a fix while keeping the message that describes it**, and **three live copies of one domain rule that are now actively diverging**.

| # | Severity | Where | Class |
|---|---|---|---|
| D1 | **HIGH** | `b14c717` + `f223d3e` | overclaiming message + assertions re-pinned to unfixed code |
| D2 | **HIGH** | 3 files | duplicated logic, actively drifting |
| D3 | MED-HIGH | `cache.ts:68` | catch swallows error as success |
| D4 | MED-HIGH | `og-image.ts:68` | privacy control does not revoke |
| D5 | MEDIUM | `10dfd74` | message overclaims ~3.5 PRs |
| D6 | MEDIUM | `1fa2e4a` | wrong ability on Mega speed rows |
| D7 | MEDIUM | `share-flow.test.ts:60` | test gate that never runs |
| D8 | MEDIUM | `useShareUrl.ts:281` | phantom conflict |
| D9 | LOW-MED | `layout.tsx:97` | duplicated palette, no pin |
| D10 | LOW-MED | `useShareUrl.ts:99` | symptom fix, root cause left |
| D11 | LOW | `useShareUrl-collaboration.test.ts:13` | fixed sleep to settle a race |
| D12 | LOW | `delete/route.ts:124` | enabling work landed, dependent fix did not |

**D3, D4, D6, D8 and D11 are all already fixed on the unmerged branch.** Merging it closes five of the twelve. **D1, D2, D7, D9, D10 and D12 survive the merge.**

---

# Findings — worst first

## D1 — HIGH — NEW — `b14c717`'s message describes a fix that is not in its diff, and `f223d3e` then re-pinned the tests to the unfixed behaviour

**Commits:** `b14c717` (cherry-pick of `5dfb730`), `f223d3e`
**Files:** `src/lib/analysis/stat-calculator.ts:131-141`, `:149-156` · `src/lib/analysis/__tests__/stat-calculator.test.ts:326-331`, `:357-363`
**Status:** this is the VGC-330 case I was asked to *verify, not re-derive*. Confirmed, and it is worse than "assertions were flipped across runs".

### What actually happened

`b14c717`'s message opens with:

> *"The EV->SP ladder handed out the 32nd Stat Point too cheaply. A special case returned 32 SP for anything from 248 EVs up … **Deleting the guard is the whole fix** — the general formula was already exact."*

`git show b14c717 -- src/lib/analysis/stat-calculator.ts` contains **no change to `evToChampionsSp`**. The cherry-pick brought over `isSpFormSpread`, the `convertToChampionsSp` fast path, the natures fix and the `extract-species` fix — and dropped the two-line change the message leads with. The guard is still there at `stat-calculator.ts:141`:

```ts
export function evToChampionsSp(ev: number): number {
  if (ev <= 0) return 0;
  if (ev >= 248) return CHAMPIONS_MAX_SP_PER_STAT;        // <- the "deleted" guard
  return Math.min(CHAMPIONS_MAX_SP_PER_STAT, Math.max(1, Math.ceil(ev / 8)));
}
```

The **test half of the cherry-pick did land**, flipping two assertions to 252. That left the suite red, and `f223d3e` fixed the suite by flipping them back:

```diff
-  it("reaches the 32 SP cap only at a full 252 EVs", () => {
-    // Was "caps at 32 SP from 248 EVs upward" … cost(n) = 8n - 4, so cost(31) = 244
-    // and cost(32) = 252. 248 EVs is 4 short of the 32nd point …
+  it("caps at 32 SP from 248 EVs upward", () => {
     expect(evToChampionsSp(244)).toBe(31);
-    expect(evToChampionsSp(248)).toBe(31);
+    expect(evToChampionsSp(248)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
```

`f223d3e` is titled `test:` and its message is candid (*"the swarm runs disagreed with each other on it, so that half was left out"*). So this is **not** a disguised gate-pass — but the net effect is the textbook shape: **the code was never changed, the tests were, twice, and the two explanatory comments that recorded the reasoning were deleted.** Both directions now have zero commentary in the test file.

### The rule is internally self-contradictory today

`stat-calculator.ts:131-138` documents the curve as:

```
 *  - any investment   → at least 1 SP (so the usual 4-EV chip costs 1 SP)
 *  - otherwise        → ceil(EV / 8), i.e. every further 8 EVs buys 1 more SP
 *  - 248+ EVs         → the 32 SP per-stat cap
```

`ceil(248 / 8) = 31`. Line 3 contradicts line 2 by exactly one point, and the `championsSpToEv` doc at `:151` asserts the ladder "1 SP = 4 EVs … 32 SP = 248 EVs — the first SP costs 4 EVs and each one after it costs 8", which arithmetically terminates at `4 + 31×8 = 252`.

`sp-docs-drift.test.ts` cannot catch this, by construction:

- `:38` derives `CAP_EV_COST = championsSpToEv(32)` **from the code**, so it agrees with whatever the code says.
- `:101` walks the 8-EV step only for `sp = 2 … 31` — it stops one short of the disputed step.
- `:103-106` was amended (`e19fcc3`, one commit outside this window) with a comment that *rationalises* the exception: *"The final step is the one exception, and the docs say so."*

So the system is **consistent at 248 everywhere** and the suite is green — which is precisely why nobody notices that the stated formula and the implemented formula disagree.

### User-visible consequence (if 252 is the correct rule)

248 is one of the most common single-stat EV values in real VGC pastes (the standard HP bulk-optimising trick). Every surface would be one SP generous per 248-stat:

- `PokemonCard.tsx:443-448` / `StatsPanel.tsx:44-49` — the `n/66 SP` counter reads e.g. 66/66 on a 248/248/4/8 spread when the truth is 64/66, i.e. "fully allocated" where 2 SP are actually spare.
- `PokemonCard.tsx:474` "Over budget by N SP" and `champions-legality.ts:284-293` — off by one per 248-stat, both directions.
- **Publicly taught as fact** on `/tools/ev-to-sp`: `page.tsx:77`, `:92` (*"the classic 248 HP bulk-optimising trick converts to exactly the same Stat Point cost as a full 252 investment"*), `:191`, `:201-202`, `:269`.
- **Taught to AI crawlers**: `public/llms.txt:29` and `public/llms-full.txt:92`, `:116` all state "32 SP = 248+ EVs".

**Assessment: real defect** — not the 248-vs-252 value (that is a domain question I cannot settle from the repo, and `8ea894b` on the branch explicitly and correctly declines to settle it either), but the **self-contradictory specification**, the **absent source change behind a message that claims it**, and the **two rounds of assertion-flipping with no surviving rationale**.

**Follow-up:** settle VGC-330 against a cited Champions source, then change `evToChampionsSp`, `championsSpToEv`'s doc, the `evToChampionsSp` doc, `tools/ev-to-sp/page.tsx` (5 sites), `llms.txt`, `llms-full.txt` (2 sites) and the two assertions **in one commit**; extend `sp-docs-drift.test.ts:101`'s loop to `sp <= 32` so the ladder can never again contain an undocumented exception. Separately: amend or revert-and-recommit `b14c717`'s message, because it is the only record of a fix that does not exist.

### No other commit does this

I scanned all 41 commits for removed/weakened test assertions, `.skip`/`.todo`/`.only`, and deleted test files:

```
f223d3e  2 assertions flipped back          <- the only true flip-to-match-code
b14c717  2 assertions flipped forward + 1 guard relaxed (the other half of the same event)
b90cc48  1 assertion removed — REPLACED by a strictly stronger one (see Verified clean)
004a8be  3 assertions changed exact->objectContaining — justified (normalisation adds fields)
```

Zero deleted test files. Zero `.skip` introduced. One pre-existing conditional skip (→ D7).

---

## D2 — HIGH — NEW — the EV-vs-SP unit heuristic exists in **three** copies today, and they are diverging

**Answer to the question asked: 3 copies, on both `main` and the branch.**

| # | Location | Rule | Scope |
|---|---|---|---|
| 1 | `src/lib/analysis/stat-calculator.ts:271` `isSpFormSpread` | per-stat magnitude only (`every <= 32`); **branch `8ea894b` widens it to 3 ordered rules** incl. a `% 4 !== 0` tell | per-Pokémon |
| 2 | `src/components/compare/CompareContent.tsx:133-143` `looksLikeChampionsTeam` | `total <= 66` **AND** `every <= 32` | **whole team** |
| 3 | `src/lib/analysis/detect-archetype.ts:87-91` `isSpScale` | `total <= 66` only, no per-stat check, `if (!evs) return true` | whole team |

`isSpFormSpread` is shared correctly between `convertToChampionsSp` (`stat-calculator.ts:301`) and `champions-legality.ts:283` — exactly as `b14c717`'s message claims:

> *"One shared isSpFormSpread helper decides units by per-stat magnitude, and legality imports it, **so display and validation cannot drift apart**."*

That is true for 2 of the 4 sites. Copies 2 and 3 were never touched, and **copy 2 is the precise predicate the same commit message identifies as the bug**:

> *"The old predicate asked 'is this spread already legal as SP?' (`total <= 66 && every value <= 32`), so an over-budget SP spread failed the test and was run through the EV→SP conversion a second time."*

`CompareContent.tsx:139-140` is that predicate, verbatim, still live.

### User-visible consequence

`EVs: 32 HP / 32 Atk / 3 Spe` (67 SP — the exact fixture `b14c717` shipped a regression test for):

- **Report page** → `isSpFormSpread` true → passthrough → `calculateChampionsStat` → Incineroar at **202 HP**, "Over budget by 1 SP" shown. Correct.
- **`/compare`** → `looksLikeChampionsTeam` sees total 67 > 66 → returns `false` → `isChampions` false (`CompareContent.tsx:182`) → `calculateAllStats` treats 32 as **EVs**. Wrong stats, no warning.

And because copy 2 is **team-wide**, one over-budget Pokémon flips **all six** to EV maths. The same paste shows two different stat blocks on two pages of the same site, and `/compare` exists specifically to compare stat blocks.

Copy 3's divergence is milder: `isSpScale` has no per-stat cap check and returns `true` for a missing `evs`, so a classic team whose every member totals ≤66 EVs scales the 100/200 archetype thresholds by `32/252` and can mislabel the archetype. Low impact, but it is a third definition of the same question.

**Assessment: real defect** (copy 2), real drift risk (copy 3). `8ea894b` on the branch makes copy 1 strictly cleverer and leaves 2 and 3 alone, so **merging the branch increases the divergence**.

**Follow-up:** delete copies 2 and 3 and call `isSpFormSpread`. For `/compare`, decide team-wide Champions detection as `parsed.pokemon.some(p => isSpFormSpread(p.evs))` rather than `every(... legal ...)`. Add a test asserting the same paste yields identical stats on the report path and the compare path. The real exit is VGC-301 (explicit `statForm: "ev" | "sp"` on `ParsedPokemon`), which both `b14c717` and `8ea894b` name as the actual fix — three heuristics is a strong argument for finally doing it.

---

## D3 — MEDIUM-HIGH — NEW — `cacheSetIfAbsent` returns `false` on a Redis error, and the Clerk webhook reads `false` as "already processed"

**Commit:** `10dfd74` (VGC-230 half) · **Files:** `src/lib/cache.ts:68-77` · `src/app/api/webhooks/clerk/route.ts:49-56`
**Fixed on the branch by `5a201e3`. Live on main.**

```ts
// cache.ts:68
export async function cacheSetIfAbsent(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const r = getRedis();
    if (!r) return true;
    const res = await r.set(key, 1, { ex: ttlSeconds, nx: true });
    return res === "OK";
  } catch {
    return false;          // <- indistinguishable from a genuine dedupe hit
  }
}
```

```ts
// clerk/route.ts:51
const isNew = await cacheSetIfAbsent(`clerk:svix:${svixId}`, 300);
if (!isNew) {
  console.info("Clerk webhook duplicate detected — skipping", { svixId });
  return NextResponse.json({ ok: true, deduped: true });
}
```

A `user.created` delivery arriving during an Upstash blip gets **HTTP 200 `{deduped:true}`**. Clerk marks it delivered and never retries. The welcome email is lost permanently. A transient infrastructure error is converted into permanent data loss — the strongest instance of the "catch returning success" pattern in the tree.

The doc comment at `cache.ts:64-66` justifies the fail-closed choice entirely in terms of the `/api/views` caller (*"failing open there would turn an Upstash outage into one dedup-free DB write per pageview"* — the `share_versions` 447MB incident shape). That reasoning is correct for views and wrong for the webhook; the webhook caller inherited a policy written for a different call site.

Secondary: `:54` logs the raw `svix-id` delivery identifier.

`5a201e3` resolves both properly — `cacheSetIfAbsentResult` returning `"acquired" | "exists" | "error"`, the webhook failing **open**, views staying fail-**closed** with the reason recorded, and error logs carrying the key *namespace* only. **This is the right fix and it is not on main.**

---

## D4 — MEDIUM-HIGH — NEW — making a report private does not revoke its public og:image card

**Commit:** `e4d9354` · **Files:** `src/lib/sharing/og-image.ts:68-78`, `:101-106` · `src/app/api/user/reports/[shareId]/route.ts` (PATCH)
**Fixed on the branch by `d0b0ac9`. Live on main.**

`og-image.ts:101-104` uploads to a **deterministic, public, suffix-free** path:

```ts
const { url } = await put(blobPath(shareId), png, {   // `og/<shareId>.png`
  access: "public",
  addRandomSuffix: false,
```

so the URL is **constructible**, not merely recoverable from a cached unfurl. The card renders species, items, abilities, tera types, tournament name, placement, creator name and record.

Two independent holes on main:

1. **PATCH `/api/user/reports/[shareId]`** — the dashboard visibility toggle — writes `is_public`/`is_unlisted` and invalidates the share cache but never calls `removeShareOgImage`, while the DELETE handler does. Flipping a report to Private leaves the PNG serving, even though `/s/<id>` and `GET /api/share/<id>` correctly 404.
2. **`removeShareOgImage` early-returns when the Redis pointer is missing** (`:71 if (!card) return;`). The pointer has a 90-day TTL (`:29`, flagged by the one `// shortcut:` marker in the tree) and is lost on an expiry, an unconfigured Upstash or a `cacheSet` that never landed. So even the *correct* DELETE path can orphan a public PNG.

`d0b0ac9` fixes both — PATCH derives the resulting state from the UPDATE's `RETURNING` row (so a single-flag PATCH is handled) and `del` falls back to the constructed `blobPath(shareId)` when the pointer is absent, with the right principle stated: *"The Blob is the source of truth for exposure; Redis must not be the only index of it."*

**Residual that survives `d0b0ac9`** and deserves its own ticket: `og-image.ts:72-77` logs and swallows a `del` failure and then `cacheDel`s the pointer anyway. A transient Blob API error leaves a private report's card **publicly readable forever, with nothing indexing it and no retry path**, and the PATCH returns success to the user. The pointer should survive a failed delete so a later call can retry.

---

## D5 — MEDIUM — NEW — `10dfd74` claims seven PRs; three are verifiably absent from the tree and a fourth half-landed

**Commit:** `10dfd74` (subject `Merge claude-dev: VGC-230 …`). It has **one parent** (`git log -1 --format=%P` → `e4d9354`) — a squash, not a merge — and its diff is **6 files / 464 insertions**.

Checked each claim against HEAD:

| Claim in the message | Reality |
|---|---|
| VGC-234: *"Add `src/lib/email-html.ts` with html`` tagged template … Migrate email.ts + weekly-digest to use html``"* | `src/lib/email-html.ts` **does not exist**. Zero references repo-wide. |
| VGC-229: *"Add ArticleJsonLd + SportsTeamJsonLd components, wire into /s/[id]"* | Neither component exists. `s/[id]/page.tsx:226,243` emit `CreativeWork` + `WebApplication`. |
| VGC-230: *"Export buildWelcomeEmailHtml for direct use without the error-swallowing wrapper"* | Not exported (`email.ts:206`, bare `function`). The wrapper was kept and made to return its result instead. |
| VGC-231: *"List-Unsubscribe **and List-Unsubscribe-Post** headers"* | Only `List-Unsubscribe` is sent (`weekly-digest/route.ts:361`). |
| VGC-231: *"NotificationsContent.tsx … syncs weeklyDigest=false → publicMetadata.digestUnsubscribed=true"* | Nothing in `src/` writes `digestUnsubscribed` — `weekly-digest/route.ts:305` is its **only** reference. |
| VGC-223 focus trap, VGC-233 OTS PDF, VGC-235 share test | Present and correct. |

**Mitigations, to be fair:** the missing `html`` ` helper is **not** a live XSS — `email.ts` already escapes via `escapeHtml` from `@/lib/utils/sanitize` at `:149`, `:154`, `:159`, `:240`, `:350-352`. And the digest unsubscribe **does work**, via a mechanism the message does not mention: `weekly-digest/route.ts:251-254` excludes users whose `user_preferences.preferences->>'weeklyDigest' = 'false'`, which is what `NotificationsContent.tsx:19,90` actually writes (`/api/user/preferences` → Neon `user_preferences`).

**Two real consequences:**

1. `weekly-digest/route.ts:305` (`if (user.publicMetadata?.digestUnsubscribed === true)`) is **dead code that reads as the live unsubscribe gate**. Anyone maintaining this path will reason about the wrong store. Delete it, or wire it.
2. `List-Unsubscribe` **without** `List-Unsubscribe-Post: List-Unsubscribe=One-Click` does not satisfy the Gmail/Yahoo bulk-sender one-click requirement the commit cites CAN-SPAM for — and the URL points at `/dashboard/notifications`, which is Clerk-gated, so a mail client following it lands on a sign-in wall. The compliance claim is not met.

**Assessment: real defect** — and the process risk is the bigger half, because tickets are moved to In Review on the strength of these messages (per the CLAUDE.md Linear workflow). VGC-229 and VGC-234 are almost certainly sitting in In Review having never landed.

---

## D6 — MEDIUM — NEW — Mega speed-tier rows compute from the base form's ability

**Commit:** `1fa2e4a` · **File:** `src/components/report/SpeedTierChart.tsx:264` (and the primary `teamEntries` row when a card's own Mega toggle is on)
**Fixed on the branch by `87503db`. Live on main.**

`1fa2e4a` added the `Ability ×2` toggle and `hasSpeedDoublingAbility`. The Mega overlay rows are built with:

```ts
ability: mon.parsed.ability,     // the BASE form's ability
```

so the doubling test runs against the wrong Pokémon, in both directions:

- Venusaur @ Venusaurite with `Ability: Chlorophyll` → the **Mega Venusaur** row doubles, though Mega Venusaur has Thick Fat. At L50 / 252 Spe the row reads **290 instead of 145**.
- Swampert @ Swampertite → the Mega Swampert row never doubles in rain, despite Mega Swampert's own Swift Swim. **122 instead of 244**.

A wrong speed tier is the error class this tool exists to prevent — a player plans a lead around it and loses.

**The maths `1fa2e4a` added is otherwise correct** and I verified it independently: the Showdown boost table is reproduced exactly (`stage >= 0 ? floor(speed * (2 + stage) / 2) : floor(speed * 2 / (2 - stage))` gives ×1.5 at +1, ×2 at +2, ×2/3 at −1, ×0.5 at −2), the ability ×2 chains into the single multiply before `pokeRound`, paralysis applies last, and `SpeedTierChart.tsx:79` correctly drops the item boost for Unburden. `compareTurnOrder` is right. The defect is confined to which ability string is passed in.

`87503db` consolidates it into one `resolveMegaAbility` in `effective-typing.ts`, catches the primary-row instance the audit had missed, and ships 4 tests verified to fail pre-fix. Good fix.

---

## D7 — MEDIUM — NEW — VGC-235's integration suite never runs in CI, and nothing says so

**Commit:** `10dfd74` · **Files:** `src/app/api/share/__tests__/share-flow.test.ts:16`, `:60` · `.github/workflows/ci.yml`

```ts
const SKIP = !process.env.DATABASE_URL;
...
describe.skipIf(SKIP)("shares INSERT/UPDATE/dedup — SQL column correctness", () => {
```

`ci.yml` runs `npm ci` → `npm run typecheck` → `npm run lint` → `npm test` and **sets no environment at all**. So the suite is skipped on every push and every PR, silently (a skip is not a failure). My local run confirms the shape: `82 passed | 1 skipped (83)`.

Its own header states what it guards:

> *"Two past regressions motivate this suite: 17-05: INSERT column/value mismatch **silently corrupted owner_id**; 24-05: dedup SELECT omitted is_unlisted, **silently demoting unlisted → private**."*

Both are prod data-integrity regressions. The commit message presents the suite as coverage for them; it gates nothing anywhere.

**Assessment: real defect (process).** The test itself is well written and the lazy `getDb()` in `beforeAll` is the right pattern. **Follow-up:** either add a Neon branch / PGlite-backed variant to CI (`16f89e1` on the branch already proves PGlite works in this repo's tests), or make the skip loud — fail CI when `DATABASE_URL` is unset on a `main` push so the gap cannot be invisible.

---

## D8 — MEDIUM — NEW — the conflict baseline is captured from the raw, pre-validation payload

**Commits:** `282dbed`, `f223d3e` · **File:** `src/hooks/useShareUrl.ts:281` vs `:285`
**Fixed on the branch by `fc173e2`. Live on main.**

```ts
versionRef.current = Number(_v) || 1; baselineRef.current = state as ShareableState;   // :281
...
const validated = await parseFetchedShareState(state);                                 // :285
```

The baseline is taken four lines before validation. `ShareableStateSchema` strips unknown keys and `reportFingerprint` enumerates all keys, so the baseline carries keys the working state does not, the fingerprints differ, and `receiveRemote` raises a **spurious conflict** — telling a user their report clashed with a remote change when nothing diverged. Reports saved by older releases carry exactly such leftover fields. On the failure path main also keeps both the raw object and its version behind the corrupt-link screen.

`fc173e2` assigns both from `validated`, sets version 0 / null baseline on rejection, removes the `as ShareableState` rather than relocating it, and is explicit that it checked every `baselineRef` reader. It also states that `fetched-share-state.test.ts:152` was deliberately **not** changed because it tests intended stripping — the right call, and worth noting as an author who distinguishes "test demonstrates the divergence" from "test pins the bug".

---

## D9 — LOW-MEDIUM — NEW — the 9 generation palettes are duplicated into an inline `<script>` string with nothing pinning the two together

**Files:** `src/hooks/useTheme.ts:17` (`GEN_PRESETS`) · `src/app/layout.tsx:97` (inline no-flash script)
**Introduced before this window; `2d0806e` on the branch rewrote both halves by hand.**

`layout.tsx:97` is a minified blocking script that hard-codes all 9 themes × 5 hexes as `{a,l,s,ad,sd}` so the accent is set before first paint. That is a legitimate no-flash technique — but it is a **second copy of the palette table**, and I confirmed **no test anywhere** reads `layout.tsx` and asserts agreement with `GEN_PRESETS` (`grep` for `GEN_PRESETS` / `vgc-gen-theme` in test files → nothing).

Both copies are in sync right now, on main (`gen1: #8b5cf6` in both) and on the branch (`gen1: #8256e6` in both) — `2d0806e` did the manual update correctly. That is the problem: it worked because one author happened to remember.

**Consequence of a one-sided edit:** the pre-hydration frame paints the stale accent. For `2d0806e` specifically — which darkened every light accent *to fix contrast* — a missed inline update would have left the pre-paint frame at the old 2.77:1 CTA contrast, i.e. the accessibility fix silently half-applied in exactly the frame nobody tests.

**Follow-up:** a 20-line vitest that reads `src/app/layout.tsx` as text and asserts every `GEN_PRESETS` accent / light / surface / accentDark / accentSurfaceDark value appears in it (and that the count matches, so a removed theme also fails). Cheap, and it makes the duplication safe rather than requiring it to be eliminated.

---

## D10 — LOW-MEDIUM — NEW — the share-payload tolerance list treats a symptom; the schema disagreement behind it is untouched

**Commit:** `282dbed` · **File:** `src/hooks/useShareUrl.ts:99-115`

```ts
// Retry once with the legacy-tolerant keys removed, but only when every
// complaint is about one of them.
const offending = parsed.error.issues.map((issue) => issue.path[0]);
const onlyTolerable = offending.length > 0 && offending.every(...LEGACY_TOLERANT_KEYS...);
if (!onlyTolerable) return null;
const relaxed = { ...raw }; for (const key of LEGACY_TOLERANT_KEYS) delete relaxed[key];
```

The commit message is honest about why:

> *"One deliberate tolerance, because the write schema is looser than the read schema for two keys: POST /api/share stores `hiddenSlides` as number|string and `spriteSettings` as unknown, while the read schema demands string[] and a shaped record."*

The guard is well built — structural complaints still fail closed, and the two keys really are inert view preferences. But **the root cause is that the write path and the read path validate the same document against different schemas**, and nothing was done about that. The tolerance list is the kind of thing that grows a third and fourth entry, each one a key the reader quietly discards.

**Assessment: real but low-severity** — a dropped `hiddenSlides` means a shared report re-shows slides the author hid. **Follow-up:** tighten the write schema at `POST /api/share` to the read schema's shape, backfill or normalise the two keys in `normalizeReportData`, then delete `LEGACY_TOLERANT_KEYS`.

Adjacent, same function: `useShareUrl.ts:297` `.catch(() => settle(null))` routes a **network** failure into the "corrupt link" screen, so a flaky connection tells the user their report is broken. Stylistic-to-low, but it is the same handler conflating two causes.

---

## D11 — LOW — NEW — `f223d3e` settled a race with a fixed 50 ms sleep

**Commit:** `f223d3e` · **File:** `src/hooks/__tests__/useShareUrl-collaboration.test.ts:13`

```diff
-  await act(async () => { hook = renderHook(useShareUrl); await new Promise(r => setTimeout(r, 0)); });
+  await act(async () => { hook = renderHook(useShareUrl); await new Promise(r => setTimeout(r, 50)); });
```

The cause is real (`parseFetchedShareState` now `await import()`s the zod schemas), but 50 ms is a guess about machine speed, and a cold vitest worker transforming zod regularly exceeds it. Same family as `759bcb6` ("give the cold-import draft persistence test a 5s wait") flagged in the 10-08 report — this repo has a recurring habit of sleeping past dynamic imports in tests.

**Both correct fixes already exist in this history**, which is what makes this worth filing rather than shrugging at:
- `004a8be` warms the lazy module in `beforeAll` (`await import("@/lib/sharing/url-codec.schemas")`), then flushes one macrotask.
- `fc173e2` replaces this exact 50 ms with a bounded poll on `hook.current.isSharedView || hook.current.decodeFailed`, with a comment saying why.

Main still has the 50 ms. Merging the branch fixes this file; the pattern is worth a lint-style convention so the next one does not reappear.

---

## D12 — LOW — NEW — VGC-253 ships the `user_id` column the delete route says it needs, and the delete route is left unchanged

**Commits:** `66854cf` (main, the guard + marker) and `16f89e1` (branch, the column) · **File:** `src/app/api/user/delete/route.ts:105-134`

`delete/route.ts:121-123` records the residual:

```
// ponytail: a victim who holds a creator_profiles row but currently has no
// shares under that name is still exposed. Closing that needs the owner
// column from VGC-253; this guard covers every case reachable today.
```

`16f89e1` on the branch **adds exactly that column** (`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id TEXT`, plus `src/lib/db/migrations/add-creator-profile-user-id.sql`). Its file list is `creator/[name]/route.ts`, `user/profile/route.ts`, `lib/db.ts`, the migration and two test files — **`user/delete/route.ts` is not among them**, and I confirmed the delete statement on the branch is byte-identical to main's, still keyed on `LOWER(name)` with the `NOT EXISTS (… shares …)` guard.

So after the merge: the enabling column exists, the dependent one-clause fix does not, and the route's comment (*"creator_profiles is keyed on that name alone, with no owner column"*) is **stale and will mislead the next reader into thinking the column still doesn't exist**.

Live consequence: publish a share carrying a victim's `creatorName`, then delete your own account. If the victim holds a `creator_profiles` row but no surviving share under that name, the `NOT EXISTS` passes and their bio, socials and avatar are hard-deleted. Narrow (the victim must have zero shares under the name — soft-deleted ones still count, which `66854cf` got right) but irreversible and cross-tenant.

**Follow-up:** add `AND (user_id IS NULL OR user_id = ${userId})` to the `DELETE FROM creator_profiles`, remove the `ponytail:` marker, and correct the comment. One line plus a test; the hard part already landed.

---

# Markers introduced recently

Full-tree scan of `src/` for `TODO` / `FIXME` / `HACK` / `XXX` / `for now` / `ponytail:` / `shortcut:` / `workaround` / `temporarily`:

| Marker | Location | Status |
|---|---|---|
| `ponytail:` | `src/hooks/useTeamReport.ts:25` — 30-day draft TTL, no cross-device invalidation | ALREADY-REPORTED (10-08, 26-10), still open |
| `ponytail:` | `src/app/api/webhooks/linear/route.ts:79` — no delivery-id dedupe | ALREADY-REPORTED, still correctly scoped (handler mutates nothing) |
| `ponytail:` | `src/lib/data/type-chart.ts:189` — Dry Skin's Fire weakness unmodelled | ALREADY-REPORTED, still open |
| `ponytail:` | `src/app/api/user/delete/route.ts:121` — creator-profile residual | **NEW** (`66854cf`) → **D12** |
| `shortcut:` | `src/lib/sharing/og-image.ts:27` — 90-day Redis TTL on the card pointer | **NEW** (`e4d9354`) → feeds **D4** |

**Zero** `TODO` / `FIXME` / `HACK` / `XXX` / `for now` anywhere in `src/`, on main or on the branch. The 21 branch commits introduce **no new markers at all** — I diffed `origin/main..origin/swarm-nightly-2026-11-02` over `src/*` specifically for added marker lines and got nothing. That is unusually disciplined for a 103-file, 3807-insertion branch.

One "for now" appears in a **commit message** only — `6f40680`: *"ESLint no-unused-vars stays a warning for now. Promoting it to error would CI-enforce the rest of these, but requires clearing all 24 findings first or CI goes red immediately."* Correctly scoped and honestly stated; worth a small follow-up ticket (24 findings), not a defect.

---

# Previously-reported findings — current status

From `.swarm/c5-commit-review-26-10-26.md`:

| Prior | Status today | Evidence |
|---|---|---|
| F1 — random accent ignores dark mode (HIGH, 12 pages) | **FIXED** | `72bb956` rewrote `random-accent.ts` to write only `--random-accent-*` DATA props and never shadow `--accent`; the fix's doc comment names `c4938de` as the regression it undoes |
| F6 / ticket 2 — no test for `random-accent.ts` | **FIXED** | `src/lib/utils/__tests__/random-accent.test.ts` now exists |
| F7 #4 / ticket 5 — lint not a gate | **PARTIALLY FIXED** | `d8aba62` dropped `continue-on-error`; `ci.yml:22` now blocks. **But** `package.json:64-66` still pins `eslint-plugin-react-hooks` to `7.0.1`, which is what hides the other 52 errors — so the gate is only as strong as the pin. And of the 36 cleared, **9 were real fixes and 27 were one-line `eslint-disable-next-line`** (all with a stated reason, and the commit message says so plainly — not a dishonest commit, but the headline "clear the 36 lint errors" is doing some work). Ticket 5 should be re-scoped to "unpin react-hooks and clear the 52". |
| F7 #1 — `useTeamReport.ts:25` draft TTL | **STILL OPEN** | marker unchanged |
| F7 #2 — Linear webhook delivery-id dedupe | **STILL OPEN**, still harmless | `webhooks/linear/route.ts:79`; handler still mutates nothing |
| F7 #3 — Dry Skin Fire weakness | **STILL OPEN** | `type-chart.ts:189` |
| F5 / ticket 7 — finish the emoji→SVG sweep | **REGRESSED** | `SpeedTierChart.tsx:64-67` still emoji **and `1fa2e4a` added two more**: `plus1: icon "⬆️"`, `plus2: icon "⏫"` (`:68-69`). `AddOpponentInput.tsx:12-21` unchanged. The ticket is now bigger than when it was filed. |
| F2 / F3 / F4 — `PokemonSprite` progressive loading | **not re-checked** | `68796c5` is 39 commits back, outside this window, and no commit in it touches `PokemonSprite.tsx` or `sprite-url.ts` |
| F9 — `/notifications` vs `/dashboard/notifications` | **not re-checked** | out of window |

---

# Verified clean — good work worth recording

Recorded so the next audit does not re-spend effort, and because "the recent history is rushed" turned out to be substantially false.

**`b90cc48` is the counter-example to this whole report.** It found that **VGC-293's perf fix was cosmetic** — `de242c3` replaced two flagged dex imports with `resolveEffectiveForm` from a new `lib/utils/effective-form.ts`, *whose own first two lines import exactly those modules*. Same chunks, same 81 KB gz, green test, because `homepage-eager-imports.test.ts` only inspected **direct** imports. `b90cc48` then rebuilt that test as a real BFS import-graph walk (alias + relative resolution, `.ts/.tsx/.js/.jsx/.mts/.json` + `index.*`, cycle-safe, dynamic `import()` and type-only imports as non-eager boundaries, shortest offending chain reported as `a.ts → b.ts → pokemon.ts`) and added **two anti-vacuity self-checks** — one classifying eager-vs-lazy-vs-erased imports, one asserting the walker finds a known-real chain so the guards cannot pass empty. It verified the guard catches the bug by reverting and re-applying. The one removed assertion was replaced by a strictly stronger one. **This is the only commit in 41 that strengthened a test it could have quietly left alone, and it is the reason D2 and D1 are worth taking seriously — that failure mode is proven to happen here.**

Also genuinely good, with the pattern worth naming: **`004a8be`, `fc173e2`, `5a201e3`, `d0b0ac9`, `87503db`, `8ea894b`, `e2c4f90`, `f2a570b`, `16f89e1` all (a) ship regression tests the author verified fail on the pre-fix code, (b) state what they deliberately did *not* fix, and (c) explain why the narrow scope was the right call.** Specific highlights:

- **`8ea894b`** declines to resolve the 248-vs-252 ladder and says so explicitly (*"Deliberately stayed out of the unresolved 248-EV / 31-vs-32 SP ladder question (now VGC-330)"*), and notes `champions-legality.ts` is a **comment-only** change. Exactly the right instinct — it would have been easy to silently "fix" D1 inside an unrelated commit.
- **`6f40680`** refused to delete `serializeMetricCursor`/`parseMetricCursor` despite zero production callers, because they were the correct half of an unfinished fix — and **`f2a570b` then wired them up**, finding the real root cause (`date_trunc('milliseconds')` on one side only: a JS-Date cursor carries ms, `NOW()` stores µs). Two commits on one branch, correctly sequenced. It also explicitly records *"No test was deleted or weakened to make anything look dead"* with the reasoning.
- **`f2a570b`** handles legacy cursors by degrading to the 2-column predicate for one request rather than bouncing readers to page 1, and keeps every value a bound parameter.
- **`e2c4f90`** uses invocation counts as the regression guard (306 `getEffectiveness` calls before and after three taps; reverting gives 612 and fails) and adds **staleness** guards, which is the failure mode a memo introduces.
- **`2d0806e`** lists three regressions *it would itself have introduced* and fixed them pre-emptively — including a print rule matching `[class*="text-accent"]` that would also have matched `text-accent-foreground` and made every CTA label vanish in PDFs.
- **`5859aff`** reports a measured result **below** the audit's estimate and labels it *"Honest note"*.
- **`16f89e1`** states two residual risks it deliberately did not guess at, including why inferring ownership of legacy rows would be worse than leaving them claimable.

Other negative checks performed: no test file deleted in any of the 41 commits; no `.skip`/`.only`/`.todo` introduced (one pre-existing conditional skip → D7); full suite green on main; `1fa2e4a`'s boost-table and `pokeRound` maths independently re-derived and correct; `jspdf` (VGC-233) is a real dependency behind a dynamic `import()`; `d8aba62`'s 27 lint disables all carry a `--` reason and the commit message discloses the split.

---

# Worth a Linear ticket

### 1. `fix: settle the 248-EV / 32-SP ladder (VGC-330) and make the code, docs and tests agree in one commit`
**Priority: P1 (bug).** `evToChampionsSp` still carries `if (ev >= 248) return 32` at `stat-calculator.ts:141`, directly contradicting the `ceil(EV / 8)` rule documented three lines above it, which yields 31. `b14c717`'s message states the guard was deleted as "the whole fix" — the diff contains no change to that function, so the cherry-pick dropped the source half and kept the claim; `f223d3e` then flipped the two tests back to match the unfixed code and deleted both explanatory comments, leaving no record of the dispute in the test file. `sp-docs-drift.test.ts` cannot catch it because it derives the cap cost from the code and its 8-EV-step loop stops at `sp < 32`. Decide the rule against a cited Champions source, then change `evToChampionsSp`, both doc comments, the five sites in `tools/ev-to-sp/page.tsx`, `llms.txt:29`, `llms-full.txt:92,116` and the two assertions atomically, and extend the drift test's loop to `sp <= 32` so an undocumented exception can never hide there again. If 252 is correct, every 248-EV stat — one of the most common values in real pastes — currently over-reports by one Stat Point on the `n/66` counter, the over-budget warning and the legality sheet.

### 2. `fix: one EV-vs-SP unit discriminator — /compare and detect-archetype still carry their own copies`
**Priority: P1 (bug).** Three implementations of "are these six numbers EVs or Stat Points?" are live today: `isSpFormSpread` (`stat-calculator.ts:271`), `looksLikeChampionsTeam` (`CompareContent.tsx:133-143`) and `isSpScale` (`detect-archetype.ts:87-91`). Copy 2 is `total <= 66 && every <= 32` — the exact predicate `b14c717` identified as the original bug — so `EVs: 32 HP / 32 Atk / 3 Spe` renders Incineroar at 202 HP on the report page and with EV maths on `/compare`, and because copy 2 is team-wide one over-budget Pokémon flips all six. `b14c717`'s message claims the shared helper means "display and validation cannot drift apart", which is true for 2 of the 4 call sites. Delete copies 2 and 3, have `/compare` detect Champions as `some(p => isSpFormSpread(p.evs))`, and add a test asserting one paste yields identical stats on both paths. Note that `8ea894b` widens copy 1 to three rules without touching the others, so merging the pending branch increases the divergence rather than reducing it.

### 3. `fix: a Redis error must not be read as a webhook duplicate (welcome emails are lost permanently)`
**Priority: P1 (bug).** `cacheSetIfAbsent` returns `false` from a bare `catch` at `cache.ts:74-76`, which is indistinguishable from a genuine dedupe hit, and `webhooks/clerk/route.ts:51-56` treats `false` as "already processed" and answers `200 {deduped:true}`. A `user.created` delivery arriving during an Upstash blip is therefore marked delivered by Clerk, never retried, and the welcome email is lost forever — a transient infrastructure error converted into permanent data loss. The fail-closed policy documented at `cache.ts:64-66` was written for the `/api/views` caller and the webhook silently inherited it. `5a201e3` on the pending branch already implements the right fix (`cacheSetIfAbsentResult` returning `"acquired" | "exists" | "error"`, webhook fails open, views stay fail-closed with the reason recorded, logs carry the key namespace only); if that branch is not merging soon, cherry-pick it. Also stop logging the raw `svix-id` at `route.ts:54`.

### 4. `fix: a failed Blob delete must not orphan a private report's public og:image card`
**Priority: P2 (bug).** Even after `d0b0ac9` lands, `og-image.ts:72-77` logs and swallows a `del` failure and then `cacheDel`s the Redis pointer regardless, so a transient Vercel Blob error leaves the public PNG at the constructible path `og/<shareId>.png` serving a report the owner just made private — with nothing indexing it, no retry path, and a success response to the user. The card renders species, items, abilities, tera types, tournament name, placement, creator name and record, so this is a privacy-control bypass rather than a cosmetic leak. Keep the pointer when the delete fails so a later `removeShareOgImage` or a cron sweep can retry, and surface the failure rather than only `console.error`. Separately, the 90-day `OG_TTL_SECONDS` marked `// shortcut:` at `og-image.ts:27` should move to a DB column or be reconciled by a sweep, because Redis is being used as the only index of a public artifact.

### 5. `chore: reconcile VGC-229, VGC-230 and VGC-234 — the work claimed in 10dfd74 is not in the tree`
**Priority: P2.** The squash commit `10dfd74` lists seven PRs, and three are verifiably absent at HEAD: `src/lib/email-html.ts` (the VGC-234 escape-by-default `html``` helper) does not exist, `ArticleJsonLd`/`SportsTeamJsonLd` do not exist and `s/[id]/page.tsx:226,243` still emit `CreativeWork` + `WebApplication`, and `buildWelcomeEmailHtml` is not exported. VGC-231 half-landed: `List-Unsubscribe` is sent at `weekly-digest/route.ts:361` but `List-Unsubscribe-Post: List-Unsubscribe=One-Click` is not, so the Gmail/Yahoo one-click requirement the commit cites is not met, and the URL points at a Clerk-gated page. Audit the Linear board for tickets moved to In Review on the strength of this message and move them back. No live XSS results from the missing helper — `email.ts` already escapes via `@/lib/utils/sanitize` at `:149,154,159,240,350-352`.

### 6. `fix: Mega speed-tier rows read the base form's ability`
**Priority: P2 (bug).** `1fa2e4a` added the `Ability ×2` toggle but passes `ability: mon.parsed.ability` into the Mega overlay rows at `SpeedTierChart.tsx:264`, and the same wrong ability applies to the primary row when a card's own Mega toggle is on. Venusaur @ Venusaurite with Chlorophyll shows the Mega Venusaur row at 290 instead of 145 (Mega Venusaur has Thick Fat); Swampert @ Swampertite never doubles in rain despite Mega Swampert's own Swift Swim, reading 122 instead of 244. A wrong speed tier is the error class this tool exists to prevent. `87503db` on the pending branch fixes it properly by consolidating into one `resolveMegaAbility` in `effective-typing.ts` and catching the primary-row instance too; merge or cherry-pick it. The rest of `1fa2e4a`'s maths — the Showdown boost table, the single chained multiply, `pokeRound`, paralysis last, Unburden dropping the item boost — is correct and was independently re-derived.

### 7. `chore: delete the dead digestUnsubscribed check in the weekly digest`
**Priority: P2.** `weekly-digest/route.ts:305` gates every recipient on `user.publicMetadata?.digestUnsubscribed === true`, and nothing in `src/` ever writes that flag — it is the only reference in the repo. The real, working gate is the SQL at `:251-254`, which excludes users whose `user_preferences.preferences->>'weeklyDigest'` is `'false'`, matching what `NotificationsContent.tsx:19,90` actually saves. So unsubscribes are honoured, but the code reads as though a Clerk-metadata flag is the control, and `10dfd74`'s message asserts that it is. Anyone maintaining the unsubscribe path will reason about the wrong store; delete the check or wire it, and fix the comment above it.

### 8. `test: run the shares INSERT/UPDATE/dedup suite in CI, or make the skip loud`
**Priority: P2.** `share-flow.test.ts:60` is `describe.skipIf(SKIP)` with `SKIP = !process.env.DATABASE_URL` at `:16`, and `.github/workflows/ci.yml` sets no environment, so the suite is skipped on every push and every PR — silently, because a skip is not a failure (a full local run reports `82 passed | 1 skipped`). Its own header says it guards two prod regressions that each caused silent data corruption: an INSERT column/value mismatch that corrupted `owner_id`, and a dedup SELECT that demoted unlisted reports to private. It currently gates nothing. Either back it with a PGlite harness — `16f89e1` on the pending branch already proves PGlite works in this repo's tests — or fail CI when `DATABASE_URL` is unset on a `main` push so the gap cannot stay invisible.

### 9. `test: pin layout.tsx's inline theme script to GEN_PRESETS`
**Priority: P3.** The 9 generation palettes are duplicated between `useTheme.ts:17` and the minified no-flash `<script>` at `layout.tsx:97` (45 hex values), and no test reads `layout.tsx` to check they agree. Both copies are in sync today only because `2d0806e` updated them by hand. A one-sided edit paints the stale accent in the pre-hydration frame, which matters most for `2d0806e` itself: it darkened every light accent specifically to fix contrast, so a missed inline update would have left the first-paint CTA at the old 2.77:1 while all 85 of its new assertions still passed. Add a vitest that reads `src/app/layout.tsx` as text and asserts every `GEN_PRESETS` accent / light / surface / accentDark / accentSurfaceDark value appears in it, with a count check so a removed theme fails too.

### 10. `fix: align the share write schema with the read schema and delete LEGACY_TOLERANT_KEYS`
**Priority: P3.** `useShareUrl.ts:99-115` re-parses a rejected share payload with `hiddenSlides` and `spriteSettings` deleted whenever every zod complaint is confined to those two keys. The guard itself is careful — structural complaints still fail closed — but it exists because `POST /api/share` stores `hiddenSlides` as `number|string` and `spriteSettings` as `unknown` while the read schema demands `string[]` and a shaped record, and that disagreement was left in place. The tolerance list is the kind that grows, and each entry is a key the reader silently discards (a dropped `hiddenSlides` re-shows slides the author hid). Tighten the write schema to the read schema, normalise the two keys in `normalizeReportData`, then remove the list. While in the file, split `useShareUrl.ts:297`'s `.catch(() => settle(null))` so a network failure does not tell the user their report is corrupt.

### 11. `fix: delete creator_profiles by user_id now that VGC-253 provides the column`
**Priority: P3 (bug).** `delete/route.ts:121-123` records that a victim holding a `creator_profiles` row with no surviving shares under that name can still have it destroyed, and says closing it needs VGC-253's owner column. `16f89e1` on the pending branch adds exactly that column and migration, but does not touch the delete route — the statement at `:124-134` is byte-identical to main's and still keyed on `LOWER(name)`. After the merge the enabling work exists, the dependent one-clause fix does not, and the route's comment ("keyed on that name alone, with no owner column") is stale and will mislead the next reader. Add `AND (user_id IS NULL OR user_id = ${userId})`, drop the `ponytail:` marker, correct the comment, and add a test for the victim-with-no-shares case.

### 12. `chore: unpin eslint-plugin-react-hooks and clear the 52 hidden errors`
**Priority: P3.** `d8aba62` correctly made lint blocking by dropping `continue-on-error` from `ci.yml`, but `package.json:64-66` still pins `eslint-plugin-react-hooks` to `7.0.1` precisely because `7.1.1` surfaces 52 more errors — so the gate is only as strong as the pin, and the debt is frozen rather than paid. Of the 36 errors `d8aba62` cleared, 9 were real fixes and 27 were `eslint-disable-next-line` with a stated reason; most of those reasons are legitimate (client-only reads after hydration, fetch loading flags, per-team storage reloads on a key change) but they are now the dominant form of compliance in the hooks rules. Unpin, triage the 52, and fold in `6f40680`'s related note that `no-unused-vars` stays a warning pending 24 findings. Also finish the emoji→SVG sweep while in these files: ticket 7 from the 26-10 report has *regressed*, since `1fa2e4a` added `plus1: "⬆️"` and `plus2: "⏫"` to `SpeedTierChart.tsx:68-69` alongside the three already there.

---

# Review notes for the pending branch

**Overall: this is strong work and should merge.** 21 commits, 103 files, +3807/−558, zero new TODO/FIXME/HACK/`for now` markers, every substantive commit carrying regression tests the author verified fail on the pre-fix code, and several commits explicitly stating what they deliberately left alone and why. Merging it closes five defects that are live on main today (D3 welcome-email loss, D4 og:image privacy bypass, D6 Mega speed tiers, D8 phantom conflict, D11 the 50 ms sleep). The notes below are where to spend review attention, not objections.

**1. It contains a schema migration.** `16f89e1` runs `ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id TEXT` from `ensureTable()` in `lib/db.ts`, with a matching `src/lib/db/migrations/add-creator-profile-user-id.sql`. Per CLAUDE.md this is the category that warrants a feature branch and deliberate review. It follows the existing add-unlisted-column pattern and is idempotent, but confirm the `ensureTable()` path actually executes in production before relying on the ownership gate, and note it adds no index (correct, per the Neon free-tier guardrail).

**2. `16f89e1`'s two stated residuals are real and should be ticketed, not waved through.** Legacy `creator_profiles` rows keep `user_id` NULL and are **claimable by the first authenticated caller using that name** — so the takeover vector the commit fixes is narrowed, not closed, for every pre-existing row. And `ON CONFLICT (name)` targets the exact-case key, so a different-casing attacker still INSERTs a separate row; the new `ORDER BY` prefers the owned row, which means an *unclaimed* victim row can still lose to a *claimed* attacker row. The commit is admirably honest about both; the honesty should become tickets.

**3. `16f89e1` adds the column that `delete/route.ts` says it needs, and does not use it there.** See D12 / ticket 11. This is the one place on the branch where two commits should have been one. Easy to fix before or right after merge; the stale comment is the part most likely to cost someone an hour later.

**4. `8ea894b` deliberately leaves VGC-330 open — and that is the right call, but it means D1 survives the merge.** The commit is explicit: *"Deliberately stayed out of the unresolved 248-EV / 31-vs-32 SP ladder question (now VGC-330): evToChampionsSp, championsSpToEv and trimSpToBudget are untouched."* Do not let the merge create an impression that the SP maths is now settled. Also worth a close read on its own terms: rule 3 keeps the SP reading on "a value that is not a multiple of 4" because EVs only pay out in fours. That is a sharp observation and probably correct, but it is a **heuristic resolving a genuinely ambiguous input**, and `11 Def` being "an indefensible EV value" is a judgement about what real pastes contain. If you disagree with that judgement, this is the commit to push back on — and VGC-301 (explicit `statForm` from the parser) is the thing that deletes the argument.

**5. `8ea894b` widens `isSpFormSpread` without touching the two other copies.** See D2 / ticket 2. Post-merge there are still three definitions of the rule and they are further apart than before, so `/compare` and the report page disagree on more inputs, not fewer.

**6. `2d0806e` is the largest-blast-radius commit on the branch.** One line — `@custom-variant dark (&:where([data-dark-mode], [data-dark-mode] *))` — re-points every `dark:` utility in the codebase, plus `--accent-foreground` applied at **70 of 73 sites** and all nine light accents darkened a shade. The commit claims proof from the compiled CSS (zero `prefers-color-scheme` in built chunks, `data-dark-mode` 82 times) and 85 assertions across 34 accent/mode pairs. **Worth independently re-running the compiled-CSS check and eyeballing the 3 sites it did not convert**, because this is the change where a missed spot is a contrast failure rather than a crash. Note it also hand-edited the duplicated palette in `layout.tsx:97` — correctly, but see ticket 9.

**7. `b90cc48` changes runtime behaviour on `/compare`, not just the test.** The dex now loads via a module-scope memoised dynamic import, `analyzePaste` takes the resolver as a parameter, two `useMemo`s gate on it, and `handleCompare` awaits it before flipping `compared`. The claim is that the chunk is warmed as soon as either paste box has content, so behaviour is identical. **Verify the slow path by hand**: paste into a box and click Compare immediately (or with a throttled connection) and confirm the input-to-results transition is still a single render rather than a flash of empty results. The test rebuild in the same commit is excellent and I would not change it.

**8. `5859aff` moves the cookie banner behind `next/dynamic ssr:false`.** The consent-gating argument is four-way and convincing (`hasAnalyticsConsent()` reads the cookie every call and caches nothing; both providers default to not starting; listener ordering strictly improves because the banner now mounts after both providers subscribe). Still, **this is a consent-notice timing change on a live site** — confirm on a true first-time visitor, in a clean profile, that the notice actually appears and that no analytics request precedes it.

**9. `f2a570b` changes Explore pagination SQL for all four sort modes.** The root cause it identifies is subtle and worth understanding before approving: cursor timestamps are ISO strings minted from the driver's JS `Date` and carry **milliseconds**, while stored `timestamptz` holds **microseconds** from `NOW()`, so comparing a truncated cursor against an untruncated `ORDER BY` skipped and duplicated rows. Both sides now compare `date_trunc('milliseconds', ...)`. Check the `ORDER BY` and the page predicate are the same tuple in all four modes — a mismatch between them is the entire bug — and that legacy cursors really do degrade to the 2-column predicate for one request rather than resetting readers to page 1.

**10. `32c3dac` removes structured data from 82 URLs.** `FAQPage` and `HowTo` off the homepage, `FAQPage` off all 81 SSG mega guides, and `/feedback` flipped to `noindex` with its sitemap row removed. The justification is sound (JSON-LD describing absent content carries manual-action risk; the homepage's prerendered body is 787 bytes / 39 visible characters) and the commit cites built-HTML evidence. But `src/app/champions/[pokemon]/` is flagged SEO-critical in CLAUDE.md, so **this is the commit where a wrong call costs organic traffic**. Confirm you agree the mega-guide FAQ content really is gone from the rendered page (the commit says it was deliberately deleted from `MegaLandingContent` earlier), and note the good side-effect: `items` is now a **required** prop on `FAQPageJsonLd`/`HowToSchema`, so no caller can emit FAQ markup it does not own.

**11. Two commits are docs/metadata only and sit at the tip.** `d36f77f`, `aa90b25`, `592768f` are swarm notes and a changelog section. Per the CLAUDE.md Ignored Build Step gotcha, **if the tip commit of the push is docs-only the entire Vercel build cancels** — reorder so a code commit is the tip, or expect `CANCELED`.

**12. Nothing on this branch weakens a test.** I checked all 21 commits for removed assertions, skips and deleted test files. The only removed assertion is `b90cc48`'s, replaced by a strictly stronger one, and `004a8be`'s three exact-match assertions relaxed to `objectContaining` because server-side normalisation legitimately adds fields. `fc173e2` goes out of its way to state that `fetched-share-state.test.ts:152` was **not** changed, with the reasoning that it demonstrated the divergence rather than pinning the bug. That is the standard the rest of the repo should be held to.

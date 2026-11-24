# C5 — Post-merge review of the last 20 commits on `origin/main`

- **Date:** 2026-11-02
- **Branch:** `swarm-nightly-2026-11-02`, cut from `main` @ `10dfd74`
- **Scope:** `git log --oneline -20 origin/main` → `10dfd74` back to `83fc12f`
- **Mode:** strictly read-only. No source edits, no commits, no pushes. The only write is this file.
- **Verification run:** `vitest run src/lib/analysis/__tests__ src/lib/sharing/__tests__ src/lib/validation/__tests__` → **16 files, 204 tests, all passing**. `npm run lint` → **0 errors, 66 warnings**. No typecheck/build run (read-only audit; not needed for these findings).
- **No PostHog / network.** Egress is blocked, so nothing below is inferred from production telemetry. Every finding is read off the diff and the current tree; where I say "the user sees X" it is derived from code.
- `CONFLICT-RISK` marks files listed in `.swarm/main-changed-files.md`.

---

## Newer than the 26-10-26 review

**All 20 commits are newer. There is zero overlap.** The prior review's window was `68796c5`…`d031232`; `68796c5` now sits at position **39** in `origin/main`, nineteen commits behind the oldest commit in this window. Nothing in this report re-treads `c5-commit-review-26-10-26.md`.

Two of that review's items resurface here only as cross-references, and both have since been *actioned on main*, which is worth recording:

| Prior finding | Status now |
|---|---|
| F1 — random accent ignores dark mode | Fixed by `72bb956` ("stop the random accent shadowing dark mode's accent tokens"), position 27. Outside this window. |
| F2/F3 — progressive sprites double every request; `onError` stale guard | Fixed by `6abb665` ("make PokemonSprite animation opt-in and fix its stale error guard"), position 26. Outside this window. |
| F7 #4 — `ci.yml` lint is `continue-on-error` | Addressed by `d8aba62` **in this window**. Verified genuinely green (0 errors), but see FU-6 — the version pin that hides the rest is untouched. |

Commits reviewed, oldest last:

```
10dfd74 Merge claude-dev: VGC-230/231/233/235 (#90)
e4d9354 feat: pre-render the shared-report og:image card to Vercel Blob (#89)
2886c78 fix: /champions/[species] redirects to the Mega guide instead of 404ing (#88)
d8aba62 chore: clear the 36 lint errors and make lint blocking in CI (#87)
1fa2e4a feat: speed tiers model +1/+2 stages, doubling abilities and Trick Room order (#86)
f223d3e test: keep the 248-EV SP cap assertions and let the share fetch validation settle
b14c717 fix: Champions SP maths — the 32nd Stat Point, over-budget spreads, lowercase natures
282dbed fix: validate the fetched share payload, and stop handing out an undefined type
c8fae06 fix: Mega Evolutions show their real type chart, and the column filters work by keyboard
0c6f94e fix: visibility is owner-only, and fork lineage respects the source's privacy
060a095 fix: anonymous flags could hard-delete any comment via IPv6 rotation
66854cf fix: account deletion could destroy another creator's profile
13dcffc VGC-WEBHOOK: acknowledge stale Linear payloads with 200 so retries stop failing
7b85e8f test: fail the build if a real credential reaches the tracked tree
babe700 a11y: mark the 31 shared icons decorative
544d02a fix: honour analytics opt-out that arrives mid-import
46018fc fix: remove swarm-internal plea from the public changelog
e147d8d swarm: add v5.29 to the changelog for tonight's fixes
d539c6a swarm: run notes, unfiled tickets, and the Linear free-cap blocker
83fc12f feat: give signed-out mobile viewers a no-auth path off a shared report
```

**Headline:** 7 real bugs. The security/privacy commits in the middle of this window (`0c6f94e`, `060a095`, `66854cf`, `13dcffc`, `544d02a`) are high-quality work and I found nothing wrong with them. Every bug below is concentrated in the four most recent feature commits (`1fa2e4a`, `d8aba62`, `e4d9354`, `10dfd74`) plus the SP-units change in `b14c717`. One commit, `f223d3e`, is a test-only commit that reverted a correctness fix's assertions to match the code and deleted the comments explaining why they were wrong — that is the one that looks gamed.

---

# Real bugs (with triggering input)

## B1 — HIGH — Mega speed-tier rows use the **base form's** ability, so the new "Ability ×2" toggle is wrong in both directions

- **Commit:** `1fa2e4a`
- **File:** `src/components/report/SpeedTierChart.tsx:265` — `ability: mon.parsed.ability` inside `teamMegaEntries`
- `CONFLICT-RISK` (`src/components/report/SpeedTierChart.tsx` is in `main-changed-files.md`)

`1fa2e4a` adds a per-side "Ability ×2" toggle and threads an `ability` field onto every chart entry. For the ordinary team rows that is correct. For the **Mega overlay rows** it passes `mon.parsed.ability` — the ability written in the paste, which is by definition the *base* form's. The row is labelled and priced as the Mega form but its ability is the base form's.

**False negative.** `Swampert @ Swampertite` on a Reg M-C team. Mega Swampert's own ability is Swift Swim (`src/lib/data/mega-pokemon.ts:651`, legal since Reg M-B, therefore legal in M-C since the regs are nested supersets). Open the Speed Tiers slide, enable **Mega Forms** and **Ability ×2** on your side. `hasSpeedDoublingAbility("Torrent")` is `false`, so the Mega Swampert row is **not** doubled while every other doubling-ability row is. A rain team's entire speed-control read is taken off this chart, and the row that matters most for it is the one that does not move.

**False positive — the worse direction.** `Venusaur @ Venusaurite` with `Ability: Chlorophyll` (Chlorophyll is a legal base-Venusaur ability and the reason people run it). Mega Venusaur's ability is **Thick Fat** (`src/lib/data/mega-pokemon.ts:93`) and it *cannot* have Chlorophyll. With Ability ×2 on, the Mega Venusaur row doubles anyway and the chart places it at **2× its real speed**, above threats it never outspeeds. Same shape for any Mega whose base form can run a weather-speed ability.

The correct resolution already exists in this codebase and landed four commits earlier: `resolveEffectiveTyping` (`src/lib/utils/effective-typing.ts:38-55`, from `c8fae06`) returns `megaEntry.ability` precisely so "the coverage charts and the speed-tier chart cannot disagree about which form is displayed". `1fa2e4a` did not use it. The `megaKey`/`megaData` the row is built from is already in scope at `SpeedTierChart.tsx:250`, so `MEGA_BY_KEY.get(megaKey)?.ability` is a one-line fix.

## B2 — MEDIUM-HIGH — Trick Room alone makes **every** row report a false position change

- **Commit:** `1fa2e4a`
- **File:** `src/components/report/SpeedTierChart.tsx:368-385` (`positionChanges`), against `:361` (`allEntries` sort)
- `CONFLICT-RISK`

`1fa2e4a` makes two changes that do not agree with each other:

```js
// :361 — the DISPLAYED order now flips under Trick Room
return combined.sort((a, b) => compareTurnOrder(a.displaySpeed, b.displaySpeed, trickRoom));

// :171 — and Trick Room now counts as "a modifier is active"
const hasAnyModifiers = yourModifiers.size > 0 || opponentModifiers.size > 0 || trickRoom;

// :385 — but the BASELINE order is still hard-coded fastest-first
].sort((a, b) => b.speed - a.speed);
```

`positionChanges` diffs the baseline against `allEntries` by index. Under Trick Room the baseline is fastest-first and `allEntries` is slowest-first, so the two are near-exact reverses of each other and almost every row's index differs.

**Trigger:** open the Speed Tiers slide on any team and click **only** the Trick Room toggle, touching no other modifier. Every row now shows a position-change delta — the top row claims roughly `+N`, the bottom roughly `-N`, for an N-row chart. This is false: Trick Room changes no Speed value at all, and the commit's own tooltip says so in as many words (`:513`): *"Speed values stay the same; only the turn order flips."* The feature contradicts its own help text on first click.

Fix: sort the baseline with `compareTurnOrder(a.speed, b.speed, trickRoom)`, the same comparator the displayed list uses. (`trickRoom` is also absent from the `positionChanges` dependency array at `:385`, but `allEntries` is present and changes with it, so the memo does recompute — the comparator is the whole bug.)

## B3 — MEDIUM-HIGH — `isSpFormSpread` dropped the total check, so small **real EV lines** are now read as illegal SP spreads

- **Commit:** `b14c717`
- **File:** `src/lib/analysis/stat-calculator.ts:244-248`
- `CONFLICT-RISK`

`b14c717` fixed a genuine bug (an over-budget SP spread was being silently re-converted through the EV ladder and rendered as a legal-looking one) and the fix direction is right. But it changed the unit discriminator from

```js
totalInput > 0 && totalInput <= CHAMPIONS_TOTAL_SP && !anyOverMax   // old
```

to magnitude only:

```js
if (stats.every((s) => evs[s] <= 0)) return false;
return stats.every((s) => evs[s] <= CHAMPIONS_MAX_SP_PER_STAT);     // new
```

Dropping the `total <= 66` clause opened a new window: **every value ≤ 32 but total > 66**.

**Trigger:** a Reg M-C report whose paste carries `EVs: 28 HP / 28 Def / 20 SpD`. That is a real EV-unit partial spread — 4-EV steps, the shape people write for a specific bulk benchmark — with every value ≤ 32 and a total of 76.

- **Before:** 76 > 66 ⇒ read as EVs ⇒ `evToChampionsSp` gives `4 / 4 / 3` SP (11 SP).
- **Now:** read as SP and returned verbatim ⇒ **76 SP**. `PokemonCard`, `TeamStats`, `SpeedTierChart` and `PokemonDetailSlide` all compute from **28 SP in HP instead of 4**, and `validateChampionsTeam` (`src/lib/validation/champions-legality.ts:268-274`) raises a red `error`: *"76/66 SP — over budget by 10 SP"* for a spread that is a perfectly legal EV spread.

This is the product's worst failure mode: a silently wrong report, plus a confident legality error against the user. The function's doc comment documents only the *single*-value residual (`EVs: 33 HP / 10 Atk`) and explicitly argues the total should not be consulted — *"a total above 66 means the spread is an **illegal** SP spread, not an EV spread"* — which is true for genuine SP pastes and false for small EV lines. The regression test pins the new behaviour (`isSpFormSpread({hp:32,atk:32,def:32,spa:32})` → `true`, 128 SP) without covering the harmful case, so the window is locked in by a test.

The commit names the real fix correctly: an explicit `statForm: "ev" | "sp"` on `ParsedPokemon`, set by the parser. Until then, restoring a *one-sided* total guard (treat `total > 66` as EVs **only when no single value exceeds the largest plausible SP value**) would narrow this without reopening the bug `b14c717` closed.

## B4 — MEDIUM-HIGH — a Redis blip makes the Clerk webhook silently drop a new user's welcome email, permanently

- **Commit:** `10dfd74` (VGC-230)
- **Files:** `src/app/api/webhooks/clerk/route.ts:50-57` · `src/lib/cache.ts:68-77`
- `CONFLICT-RISK` on `src/app/api/webhooks/clerk/route.ts` (`src/lib/cache.ts` is **not** in the list)

```js
// cache.ts:68-77
export async function cacheSetIfAbsent(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const r = getRedis();
    if (!r) return true;                                  // not configured ⇒ "first time"
    const res = await r.set(key, 1, { ex: ttlSeconds, nx: true });
    return res === "OK";
  } catch {
    return false;                                         // ANY error ⇒ indistinguishable from a collision
  }
}
```

```js
// clerk/route.ts:50-57
const isNew = await cacheSetIfAbsent(`clerk:svix:${svixId}`, 300);
if (!isNew) {
  console.info("Clerk webhook duplicate detected — skipping", { svixId });
  return NextResponse.json({ ok: true, deduped: true });   // 200 ⇒ Clerk will never retry
}
```

`cacheSetIfAbsent` returns `false` on a Redis **error**, not only on a key collision, and the webhook cannot tell the two apart. A transient Upstash error therefore makes a brand-new signup look like a duplicate delivery.

**Trigger:** any `user.created` delivery that arrives while Upstash returns an error, rate-limits, or times out. The new user gets **no welcome email, ever**, the response body claims `{ok: true, deduped: true}`, and because it is a 200 Clerk does not retry. Nothing surfaces to a human except a `console.info` that says "duplicate detected", which is the wrong diagnosis.

The asymmetry is stark against the line 20 below it, which was added in the *same* PR and deliberately returns 500 so Clerk *does* retry on a send failure — and even releases the dedupe key first so the retry is not swallowed. The dedupe path fails the opposite way from the send path. Fix: have `cacheSetIfAbsent` distinguish error from collision (return `null` on throw, or a `{ok, acquired}` pair) and treat an error as "not deduped" here; an extra welcome email is strictly better than a missing one.

Same `catch { return false }` is consumed by `scheduleOgImageBackfill` (`src/lib/sharing/og-image.ts:135`), where a Redis error silently skips the backfill. Much lower stakes — the next page view retries — but it is the same latent shape.

## B5 — MEDIUM — the og:image fingerprint can never match across the jsonb round-trip, so every save renders the card twice forever

- **Commit:** `e4d9354`
- **Files:** `src/lib/sharing/og-image.ts:60-76` (`ogCardFingerprint`) · `src/app/api/share/route.ts:67-74, 350, 418, 471, 512, 577` · `src/app/s/[id]/page.tsx:56, 126-129`
- `CONFLICT-RISK` on `src/lib/sharing/og-image.ts`, `src/app/api/share/route.ts`, `src/app/s/[id]/page.tsx`

The fingerprint is a plain `JSON.stringify` over an array that includes two **objects**:

```js
const input = JSON.stringify([
  data.paste ?? "", data.tournamentName ?? "", data.placement ?? "",
  data.creatorName ?? "", data.record ?? "",
  data.tags ?? null,            // <-- object
  data.privateFields ?? null,
]);
```

`JSON.stringify` of an object is key-order dependent, and the two call sites feed it objects with **different key order**:

- **Save path** (`share/route.ts:418, 577`) fingerprints the zod-parsed request body. Zod builds its result in schema-declaration order, which for `tags` is `tournamentUrl, tournamentDate, tournamentPlayers, tournamentRegion, regulation, eventType, archetype, regulationAutoDetected` (`route.ts:67-74`). Confirmed by running zod directly.
- **Read path** (`s/[id]/page.tsx:56`) fingerprints `rows[0].data`, read back out of a **`jsonb`** column (`route.ts:350, 471, 512` all store `${JSON.stringify(state)}::jsonb`). Postgres `jsonb` does not preserve object key order — it normalises keys (by length, then bytewise), so `{regulation, eventType, archetype}` comes back as `{archetype, eventType, regulation}`.

Different byte string ⇒ different FNV-1a hash ⇒ `fp_save !== fp_read`, always.

**Trigger:** publish any report **with tags** — and tags are **mandatory** to publish publicly (`route.ts:327-336` returns *"Cannot publish to the public as there are no tags on this report"*), so this is essentially every public shared report. Then save it again, or simply view `/s/<id>` once and save again:

1. Save → stores `fp_save`, renders + `put`s the card.
2. `/s/<id>` view → `ogCard.fp !== ogCardFingerprint(data)` → `scheduleOgImageBackfill` → renders + `put`s **again**, stores `fp_read`.
3. Next save → `existing.fp` (`fp_read`) `!== fp_save` → renders + `put`s **again**, stores `fp_save`.
4. …oscillates for the life of the report.

So the commit's headline optimisation — *"autosaves that don't change the card skip the render"* — **never fires** for any report with tags. Every autosave pays a full Satori render of a 1200×400 sprite-bearing PNG plus a Blob write, and each one is followed by a second render from the share page. On a report being actively edited with autosave on, that is the opposite of what the commit claims, and it is exactly the Vercel-minutes/Blob-write cost that CLAUDE.md's cost guardrails are about.

The test cannot catch it: `src/lib/sharing/__tests__/og-image.test.ts:29` uses `const data = { paste, creatorName }` with **no `tags` and no `privateFields`**, and never round-trips through jsonb. Fix: fingerprint a canonically key-sorted serialisation (a small stable-stringify, or `JSON.stringify(x, Object.keys(x).sort())` per object), and add a test that fingerprints the same payload with its `tags` keys in two different orders and asserts the hashes are equal.

## B6 — MEDIUM — a failed Blob delete leaves a public team card live forever, with no pointer left to retry

- **Commit:** `e4d9354`
- **File:** `src/lib/sharing/og-image.ts:84-94`
- `CONFLICT-RISK`

```js
export async function removeShareOgImage(shareId: string): Promise<void> {
  if (!ogImageEnabled()) return;
  const card = await getShareOgCard(shareId);
  if (!card) return;
  try {
    await del(card.url.split("?")[0]);
  } catch (err) {
    console.error("og image delete failed:", err);     // swallowed
  }
  await cacheDel(cardKey(shareId));                    // runs regardless
}
```

The `del` failure is logged and then discarded, and the Redis pointer — the only record that the Blob exists — is deleted anyway.

**Trigger:** a user flips a public shared report to **private** (`/api/share` POST with `isPublic: false, isUnlisted: false` → `publishShareOgImage` → `removeShareOgImage`), or deletes it (`/api/user/reports/[shareId]` DELETE), at a moment when the Vercel Blob API errors or rate-limits. The card PNG — which renders the full team: species, held items, abilities, Tera types, moves and spreads — stays publicly fetchable, and `put` was called with `addRandomSuffix: false` so the path is the deterministic `og/<shareId>.png`. Anyone who ever saw the URL (an unfurled Discord/X embed caches it) keeps access indefinitely. Because `cacheDel` already ran, no later save, no later page view and no later delete will ever try again, and nothing anywhere records that an orphan exists.

This is a privacy regression hiding behind a `console.error`, and it is the one place in this file where swallowing is *not* the right call — the sibling `publishShareOgImage` catch (`:117`) is correctly fire-and-forget because a failed render just means a text-only unfurl. Fix: only `cacheDel` when `del` resolved; on failure leave the pointer in place (or write a tombstone key) so the next visibility change or a sweep can retry.

## B7 — LOW-MEDIUM — `InlinePokemonEditor` ArrowDown jumps to the **last** row once the result list narrows

- **Commit:** `d8aba62`
- **File:** `src/components/report/InlinePokemonEditor.tsx:102, 110`
- `CONFLICT-RISK`

To clear a `react-hooks/set-state-in-effect` error, `d8aba62` replaced the clamping effect

```js
useEffect(() => { if (highlighted >= results.length) setHighlighted(0); }, [results.length, highlighted]);
```

with a derived value (`:102`):

```js
const activeIndex = highlighted < results.length ? highlighted : 0;
```

The render and the Enter handler both read `activeIndex`, which is correct. But the arrow handlers still mutate the raw, now-unclamped `highlighted` (`:105, :108`), so the two drift apart.

**Trigger:** open the replace-Pokémon editor, press **ArrowDown ~10 times** on the unfiltered list (`highlighted` = 10), then type `garch` to narrow the list to, say, 5 results. The highlight correctly displays on row 0. Press **ArrowDown once**: `Math.min(10 + 1, 4)` = **4**, so the highlight leaps straight to the *last* row, skipping rows 1-3. Press **ArrowUp** instead and nothing moves for six presses, until `highlighted` decrements back under 5. Previously the effect snapped `highlighted` to 0 and ArrowDown moved to row 1, as a listbox should.

Mouse hover also sets raw `highlighted` (`:188`), so hovering a low row on a long list and then narrowing reproduces it too. Fix: clamp inside the setter — `setHighlighted(h => Math.min((h < results.length ? h : 0) + 1, Math.max(0, results.length - 1)))` — or keep the effect and give it the `set-state-in-effect` disable with a reason, the way the same commit did eight other times.

---

# Follow-up tickets worth filing

| # | Proposed title | Priority | Why |
|---|---|---|---|
| FU-1 | `fix: Mega speed-tier rows must use the Mega's own ability, not the paste's` | **P1 (bug)** | B1. `SpeedTierChart.tsx:265`. Mega Swampert's Swift Swim never fires; Mega Venusaur doubles on a Chlorophyll it cannot have, showing 2× its real speed. Use `resolveEffectiveTyping` / `megaEntry.ability` so the chart matches the coverage charts. `CONFLICT-RISK` |
| FU-2 | `fix: Trick Room reports a false position change on every row` | **P1 (bug)** | B2. `SpeedTierChart.tsx:385` baseline is fastest-first while the display is slowest-first. One click on Trick Room, no other modifier, and every row shows a bogus delta — contradicting the feature's own tooltip. `CONFLICT-RISK` |
| FU-3 | `fix: a sub-32 EV line (28 HP / 28 Def / 20 SpD) is read as a 76 SP illegal spread` | **P1 (bug)** | B3. `stat-calculator.ts:244-248`. Wrong stats everywhere plus a false "over budget by 10 SP" error on a legal EV spread. Carries the `statForm` parser work as the real fix. `CONFLICT-RISK` |
| FU-4 | `fix: cacheSetIfAbsent cannot distinguish a Redis error from a dedupe hit` | **P1 (bug)** | B4. `cache.ts:74` + `clerk/route.ts:50`. A Redis blip silently and permanently drops a new user's welcome email behind a 200. Return `null` on throw and fail open at the webhook. `CONFLICT-RISK` on the route |
| FU-5 | `fix: og:image fingerprint must be key-order stable across the jsonb round-trip` | **P2** | B5. `og-image.ts:60`. Two renders + two Blob writes per save on every tagged report, forever; the commit's "skip unchanged" optimisation never fires. `CONFLICT-RISK` |
| FU-6 | `fix: a failed Blob delete orphans a public team card with no retry path` | **P2 (bug)** | B6. `og-image.ts:84-94`. A report made private can keep a publicly fetchable PNG of the whole team at a deterministic URL, with the only record of it deleted. `CONFLICT-RISK` |
| FU-7 | `decide the Champions EV→SP ladder: is the 32nd Stat Point 248 or 252 EVs?` | **P2** | FU-9 below / §"gamed". `stat-calculator.ts:141` vs `:136-137` and `llms-full.txt:92` state both answers in one sentence. A product decision, not another test flip. Blocks closing the cherry-pick cleanly. `CONFLICT-RISK` |
| FU-8 | `fix: VGC-231 is half-landed — no List-Unsubscribe-Post, and the URL is auth-gated` | **P2** | `weekly-digest/route.ts:361`. Not RFC 8058 one-click, so Gmail/Yahoo bulk-sender rules are unmet, and the unsubscribe link lands a recipient on a Clerk login wall. Do not close VGC-231. `CONFLICT-RISK` |
| FU-9 | `ci: run the share-flow integration suite, or stop counting it as coverage` | **P2** | `share-flow.test.ts:60` is `describe.skipIf(!DATABASE_URL)` and `ci.yml` sets no `DATABASE_URL`, so all 227 lines are skipped on every push and PR. Also: it writes real rows, so wherever `DATABASE_URL` *is* set, `npm test` mutates that database. `CONFLICT-RISK` |
| FU-10 | `fix: ArrowDown jumps to the last row after the species list narrows` | **P3 (bug)** | B7. `InlinePokemonEditor.tsx:102`. Keyboard nav regressed while clearing a lint error. `CONFLICT-RISK` |
| FU-11 | `chore: unpin eslint-plugin-react-hooks now that lint is blocking` | **P3** | `package.json:64-66` still pins `7.0.1`, which the 26-10 review recorded as hiding ~52 further errors in `7.1.1`. Lint is now a real gate but against a deliberately older rule set, and `d8aba62`'s message does not mention the pin. `CONFLICT-RISK` |
| FU-12 | `chore: VGC-234 did not land — reconcile the merge's PR list with the tree` | **P3** | `src/lib/email-html.ts` does not exist and `weekly-digest/route.ts:3` still imports `escapeHtml`. **Not a security hole** (escaping is applied everywhere), but `10dfd74`'s message is not a record of what merged, so tickets closed off it need re-checking. |
| FU-13 | `fix: OTS PDF silently drops the 7th+ Pokemon` | **P4** | `OTSSheetModal.tsx` hardcodes `NUM_ROWS = 6`; a longer paste loses rows from the PDF with no warning. `CONFLICT-RISK` |
| FU-14 | `fix: /champions/Mega-Garchomp 404s instead of redirecting` | **P4** | `mega-pokemon.ts:1041` lowercases only the species branch; `MEGA_BY_SLUG.has(slug)` is case-sensitive, so a cased real Mega slug falls through to `mega-mega-garchomp` → null → 404. Cosmetic, SEO-adjacent. `CONFLICT-RISK` |

---

# Missing tests

Per CLAUDE.md: *new logic in `src/lib/` gets a vitest test beside it in `__tests__/`; regressions get a test that names the bug.*

**Test discipline in this window is genuinely good** and worth saying plainly. Every one of these shipped `src/lib` logic *with* a test in the same commit: `og-image.ts` + `og-image.test.ts`, `effective-typing.ts` + `effective-typing.test.ts`, `natures.ts` `getNature` + `natures.test.ts`, `extract-species.ts` + `extract-species.test.ts`, `mega-pokemon.ts` `megaSlugForSpecies` + `mega-slug-redirect.test.ts`, the `stat-calculator.ts` speed/SP additions + 42 new lines in `stat-calculator.test.ts`, `parseFetchedShareState` + `fetched-share-state.test.ts` (154 lines). I found **no** new `src/lib` logic that arrived with no test file at all.

The gaps are in *coverage of the specific failing input*, not in the existence of tests:

| Gap | Where it belongs | Which finding it would have caught |
|---|---|---|
| Fingerprint stability across key reordering — the existing fixture has no `tags`/`privateFields` and never round-trips jsonb | `src/lib/sharing/__tests__/og-image.test.ts:29` | **B5**. One assertion: `ogCardFingerprint({tags:{regulation:"Reg M-C",eventType:"Regional"}})` === `ogCardFingerprint({tags:{eventType:"Regional",regulation:"Reg M-C"}})`. |
| A spread with every value ≤ 32 but total > 66 that is genuinely EVs | `src/lib/analysis/__tests__/stat-calculator.test.ts:452` | **B3**. The existing regression test pins the *opposite* case (`{hp:32,atk:32,def:32,spa:32}` → SP) and never asks what happens to `28/28/20`. |
| `cacheSetIfAbsent` error-vs-collision, and the webhook's behaviour on each | `src/lib/__tests__/cache.test.ts` (does not exist) and `src/app/api/webhooks/clerk/__tests__/` (does not exist) | **B4**. VGC-230 shipped with no test for the webhook at all, despite adding the dedupe branch that drops mail. The sibling `webhooks/linear/__tests__/route.test.ts` (156 lines, from `13dcffc`) is the model to copy. |
| `removeShareOgImage` when `del` rejects | `src/lib/sharing/__tests__/og-image.test.ts` | **B6**. The file has a *"never lets a Blob failure escape"* test, but only for `put`. The `del`-rejects case — does the Redis pointer survive? — is untested, and the answer today is "no". |
| Mega-row ability resolution; Trick Room position changes | would move into `src/lib` with the FU-1 fix | **B1, B2**. `calcBattleSpeed`, `hasSpeedDoublingAbility` and `compareTurnOrder` are all well covered in `src/lib`; the *wiring* in `SpeedTierChart.tsx` is not, and both bugs live entirely in the wiring. Strictly these are component-level, so CLAUDE.md's `src/lib` rule does not bite — but extracting the row builder would put them where it does. |
| `megaSlugForSpecies` case sensitivity | `src/lib/data/__tests__/mega-slug-redirect.test.ts` | **FU-14**. The test covers `"Kangaskhan"` (which works) but not a cased real Mega slug. |

**And the inverse — coverage that is nominal only.** `src/app/api/share/__tests__/share-flow.test.ts` (227 lines, VGC-235) is `describe.skipIf(!process.env.DATABASE_URL)` at `:60`, and `.github/workflows/ci.yml` sets no `DATABASE_URL`. The suite is skipped on every push and every PR. Its own header names the two regressions it exists to prevent (`17-05` INSERT column mismatch corrupting `owner_id`; `24-05` dedup SELECT omitting `is_unlisted` and demoting unlisted → private) — both of which it would still not catch today. See FU-9.

---

# Clean commits (brief)

Fourteen of the twenty. The security and privacy cluster is the strongest work in the window.

- **`0c6f94e`** — visibility owner-only + fork lineage privacy. Collapsing the `isPublic`-only guard into one `visibilityChangeRequested` predicate is exactly right: `isUnlisted` *is* a visibility decision, a collaborator echoing stored flags back still passes, and the 403 body is unchanged. The read-time re-check (`share/[id]/route.ts:94`, `explore/route.ts:266`) correctly treats attribution as a side channel. The lineage lookup stays inside its own try/catch so a missing column cannot 500 `/s/{id}`. Nothing to add.
- **`060a095`** — IPv6-rotation comment deletion. `COUNT(*) FILTER (WHERE session_id LIKE 'user:%')` is the right shape; anonymous flags are still recorded as signal but cannot trigger the hard delete. It also fixed the `FLAG_THRESHOLD` comment that claimed "auto-hide" when the code has always hard-deleted, and refused to smuggle a `hidden_at` migration in. Good restraint.
- **`66854cf`** — cross-tenant creator-profile destruction. The `NOT EXISTS … owner_id IS DISTINCT FROM` guard is correct and, as the comment notes, stays correct even if statement order changes. Collecting every `DISTINCT` creator name instead of `userShares[0]` fixes a second, quieter bug (aliases left behind) in the same pass. Residual honestly marked.
- **`13dcffc`** — Linear webhook 401→200 on stale payloads. The reasoning is right: dropping the event enforces replay protection, the status code only tells Linear whether to retry, and a replay can never become fresh. The freshness check is kept. 156 lines of regression tests including the two stale cases verified red before / green after. (Note: CLAUDE.md says the Linear-webhook-fix P0 is stale and merged since May — this is a *different*, later fix to the same route, so it is not the stale item.)
- **`544d02a`** — Clarity consent mid-import. I traced all four orderings (withdraw-during-import, re-grant-during-import, teardown-during-import, withdraw-after-init) and the `wanted` / `initialised` / `loading` / `cancelled` split is correct in every one; `clarity` is captured before the re-check so a later withdrawal can still call `consent(false)`, and `init` cannot double-run. The only nit is the bare `catch { return }` on the dynamic import with no log — defensible for analytics.
- **`282dbed`** — `parseFetchedShareState`. Closes a real hole (the fetch path was an unchecked cast while the URL path had been `safeParse`-ing since VGC-146). The legacy tolerance is tightly scoped — it retries *only* when every zod issue is on `hiddenSlides`/`spriteSettings`, and the test *"does not let the legacy tolerance smuggle a structurally broken report through"* pins that. Gating the edit-session refs on successful validation is the right call. The `await import()` is deliberate, with the bundle reason recorded.
- **`c8fae06`** — Mega type charts. The phantom Gengar Ground immunity is a textbook example of the worst error class this product has, and delegating form resolution to `resolveSpeedTierForm` so the charts cannot disagree with the speed tiers is the right architecture. (Ironic that `1fa2e4a`, four commits later, reintroduced exactly that disagreement for abilities — B1.)
- **`babe700`** — `aria-hidden` + `focusable="false"` before the prop spread, so a caller that needs a labelled icon still wins; a test that iterates the module namespace so new icons are covered automatically. Clean pattern.
- **`7b85e8f`** — secrets gate. Shape-specific rules keyed off vendor prefixes rather than path exclusions (so `DISCORD_PUBLIC_KEY` and the SHA-256 fixtures cannot match by construction), nothing allowlisted including `.env.example`, and failures report file and line but never the value — correct, since the output lands in public CI logs. The recorded methodology note about `git grep --all` producing false negatives is genuinely useful.
- **`2886c78`** — `/champions/[species]` → Mega guide. `permanentRedirect` is correct for SEO, multi-Mega species (Charizard X/Y) correctly stay 404, `generateMetadata` returns `{}` rather than throwing so it cannot fight the redirect, and `generateStaticParams` is unaffected. Shipped with a test. Only the cosmetic case-sensitivity nit (FU-14).
- **`83fc12f`** — mobile no-auth CTA + oEmbed discovery. Keeps one primary CTA, real anchor so it is tab-reachable, contrast stated and plausible, `min-h-[44px]`, `aria-hidden` on the arrow. The oEmbed `alternates.types` link is correctly gated on `isPublic` because `/api/oembed` filters `is_public = TRUE`. Its claim that the `images: []` suppression is "untouched and now pinned by a test" was true then and was deliberately superseded by `e4d9354` three days later — and `e4d9354` **extended** that test rather than deleting it (see below).
- **`d8aba62`** — verified honest on its headline: `npm run lint` is now `0 errors, 66 warnings`, and the `continue-on-error` is genuinely gone from `ci.yml`. The eight `set-state-in-effect` disables it added all carry a specific reason. `InstallPrompt`'s use-before-declare was a real bug. Only B7 and FU-11 against it.
- **`46018fc`**, **`e147d8d`**, **`d539c6a`** — changelog and swarm notes. `46018fc` removes a swarm-internal *"8th consecutive fix proposal — please merge!"* that had been shipping to every `/changelog` visitor; I grepped the rest of `data.ts` and found no other internal text. `e147d8d` is accurate about what landed, explicitly lists what it omits and why, and its ordering note (tip must carry a code change or Vercel cancels the build) correctly applies CLAUDE.md's Ignored Build Step gotcha.

**Explicitly checked and *not* a problem:** `e4d9354` did **not** weaken the test that `83fc12f` had used to pin `images: []`. It renamed it from *"keeps the deliberate image suppression on the share route"* to *"keeps images empty when no card has been pre-rendered"*, kept both assertions intact, and added two new cases (card present → Blob URL + `summary_large_image` + no backfill; card absent → backfill queued with the right visibility). That is a correct narrowing of a now-conditional invariant, not a weakening. Recording it so the next audit does not re-spend the effort.

---

# Does any commit look like it was gamed to pass the gate?

**Yes — one: `f223d3e`.**

It is a `test:`-only commit. It touches no source. It reverts two assertions that `b14c717` had just corrected, back to the pre-fix values, and **deletes the comments that explained why they were wrong**:

```diff
-  it("reaches the 32 SP cap only at a full 252 EVs", () => {
-    // Was "caps at 32 SP from 248 EVs upward", asserting evToChampionsSp(248)
-    // === 32. That expectation encoded the `if (ev >= 248) return 32` guard,
-    // not the documented ladder: cost(n) = 8n - 4, so cost(31) = 244 and
-    // cost(32) = 252. ... 248 HP is one of the most common values in real VGC pastes.
+  it("caps at 32 SP from 248 EVs upward", () => {
     expect(evToChampionsSp(244)).toBe(31);
-    expect(evToChampionsSp(248)).toBe(31);
+    expect(evToChampionsSp(248)).toBe(CHAMPIONS_MAX_SP_PER_STAT);
```

The commit message is candid about the reason, which is to its credit — *"main's sp-docs-drift test and converter page pin 248, and the swarm runs disagreed with each other on it, so that half was left out"* — but candour is not resolution. The cherry-pick was split: the SP-units half of `b14c717` landed, the ladder half did not, and the tests were edited to agree with whichever code survived.

**What the tree asserts now is self-contradictory, and the contradiction is pinned by a passing test:**

- `stat-calculator.ts:136-137` documents `ceil(EV / 8)` **and** `248+ EVs → the 32 SP cap`. For `ev = 248`, `ceil(248/8) = 31`. The guard at `:141` (`if (ev >= 248) return 32`) is the only thing producing 32, and it overrides the formula stated two lines above it.
- `public/llms-full.txt:92` states both answers **in a single sentence**: *"the first SP in a stat costs 4 EVs and every SP after that costs 8 (so 32 SP = 248+ EVs) … SP = ceil(EVs / 8) … giving the ladder 4 EVs = 1 SP, 12 EVs = 2 SP … 248 EVs = 32 SP"*. The stated ladder (`cost(n) = 8n − 4`) gives `cost(32) = 252`, not 248.
- `sp-docs-drift.test.ts` papers over it rather than resolving it, with a comment calling it *"the final step … the one exception, and the docs say so"* — a test rationalising a number it derives from the code it is supposed to be checking.

**Why it matters, not just an aesthetic complaint.** `248 HP` is one of the most common values in real VGC pastes. By the documented ladder the guard hands out the 32nd Stat Point four EVs early, so a `248 HP / 248 Atk / 4 Def / 8 Spe` paste reads **`66/66 SP` — fully allocated, nothing left** when the ladder says 64/66. That is a wrong number presented to the user as fact, in the exact place the product cannot afford one. It needs a product decision on what the Champions ladder actually is (FU-7) — and then *one* of the code, the docs and the tests changed to match, rather than a third test flip.

**Second, smaller item in the same commit:** `useShareUrl-collaboration.test.ts:13` changes `await new Promise(r => setTimeout(r, 0))` to `setTimeout(r, 50)` to wait out the new `await import()` in the validation path. A fixed wall-clock sleep standing in for an await is flaky by construction and will go red on a loaded CI runner at some unrelated future moment. `vi.waitFor(() => expect(hook.current.…).toBeDefined())` is the fix.

**Everything else in the window is honest.** `d8aba62` really did clear the errors (verified: 0). `e4d9354` strengthened the test it inherited rather than loosening it. No `it.skip`/`it.todo`/`xit` was introduced anywhere in `src/`. The only pre-existing skip is `share-flow.test.ts`'s `skipIf(!DATABASE_URL)`, which predates nothing in this window — it arrived *with* VGC-235 in `10dfd74` — and is better described as coverage that was never wired up (FU-9) than as a test weakened to go green.

---

## CONFLICT-RISK summary

Every file I recommend changing appears in `.swarm/main-changed-files.md` **except `src/lib/cache.ts`**:

`src/components/report/SpeedTierChart.tsx` · `src/lib/analysis/stat-calculator.ts` · `src/lib/sharing/og-image.ts` · `src/app/api/share/route.ts` · `src/app/s/[id]/page.tsx` · `src/app/api/webhooks/clerk/route.ts` · `src/components/report/InlinePokemonEditor.tsx` · `src/app/api/cron/weekly-digest/route.ts` · `src/app/api/share/__tests__/share-flow.test.ts` · `.github/workflows/ci.yml` · `package.json` · `src/components/ui/OTSSheetModal.tsx` · `src/lib/data/mega-pokemon.ts` · `src/lib/sharing/__tests__/og-image.test.ts` · `src/lib/analysis/__tests__/stat-calculator.test.ts`

Coordinate before touching any of them. `src/lib/cache.ts` (FU-4) is the one clean file, which makes it the safest place to land that fix.

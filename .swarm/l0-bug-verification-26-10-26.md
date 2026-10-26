# L0-VERIFY — Bug verification against `main`
**Swarm run:** 26-10-26 · **Branch:** `swarm-nightly-2026-10-26` · **Agent:** L0-VERIFY (read-only)

`git diff origin/main..HEAD` touches only `.swarm/*.md` — **`src/` on this branch is byte-identical to `origin/main` (68796c5)**, so every verdict below is a verdict about production code.

Linear "In Review" was confirmed to be unreliable: **6 of the 10 tickets verified are already fixed on main** and should be closed, not re-fixed.

## Verdict table

| Ticket | Pri | Linear | Verdict | Key evidence |
|---|---|---|---|---|
| VGC-251 Champions paste / 32 HP 32 Atk | P1 | In Review | **FIXED_ON_MAIN** | `src/lib/analysis/stat-calculator.ts:224-253` — no-padding + proportional trim; regression tests at `stat-calculator.test.ts:135,158,194` |
| VGC-243 Speed tiers ignore Mega | P1 | In Review | **FIXED_ON_MAIN** | `SpeedTierChart.tsx:172`, `src/lib/utils/speed-tier-form.ts:25-60`; Floette-named test `speed-tier-form.test.ts:15` |
| VGC-242 Manage Access visual flashes | P1 | In Review | **FIXED_ON_MAIN** | `CollaboratorPanel.tsx:37,66-75` (fetch-once ref) and `:38,42-47` (collaboratorsRef) |
| VGC-245 Modes section not saving | P1 | In Review | **FIXED_ON_MAIN** | `src/app/api/share/route.ts:27-49`; `url-codec.schemas.ts:63-83` (drafts path) |
| VGC-288 Account deletion leaves rows | P1 | In Review | **STILL_BROKEN** | `src/app/api/user/delete/route.ts:52-82` — 6 satellite purges missing |
| VGC-292 EV formula in 3 components | P2 | In Review | **STILL_BROKEN** | `analyze-team.ts:21-22`, `TeamStats.tsx:23`, `TournamentMode.tsx:86`, `MatchupPlanSlide.tsx:171` |
| VGC-267 keepalive on all draft saves | P2 | In Review | **FIXED_ON_MAIN** | `src/hooks/useAutoDraft.ts:91-96` — `keepalive: opts?.exitFlush === true` |
| VGC-260 version-diff `pokemon:<index>` | P3 | In Review | **FIXED_ON_MAIN** | `src/lib/utils/version-diff.ts:32-41,59-104`; test suite literally named `VGC-260` (`version-diff.test.ts:75`) |
| VGC-295 Explore keyset pagination | P3 | In Review | **STILL_BROKEN** | `src/app/api/explore/route.ts:194/195, 208/209, 223-228` — `date_trunc` in WHERE, raw column in ORDER BY |
| VGC-181 Indy top-cut placeholder data | P2 | In Review | **STILL_BROKEN** (hard-blocked) | `src/data/indy-top-cut.ts:15-80` — all 8 `player: "TBD"`; sources 403 via proxy |

Carried forward from the orchestrator (not re-verified): **VGC-293 STILL_BROKEN**, **VGC-294 STILL_BROKEN**, **VGC-289 STALE**.

Tests run locally as corroboration: `stat-calculator.test.ts` + `speed-tier-form.test.ts` = 51 passed; `version-diff.test.ts` = 26 passed.

---

# Per-ticket evidence

## VGC-251 — Champions Paste Not Working — FIXED_ON_MAIN

Reported symptom: "The SP allocations are not showing up right for champions, everyone is getting 32hp 32atk".

Both root causes are fixed in `src/lib/analysis/convertToChampionsSp`:

1. **The padding step is gone.** `src/lib/analysis/stat-calculator.ts:246-252`:
   > `// There is deliberately NO padding step. Topping invested stats up to the`
   > `// 66 SP budget is what produced 32 HP / 32 Def from a 252 HP / 4 Def paste`
2. **The over-budget trim is no longer array-order biased** (`trimSpToBudget`, largest-remainder with atomic tie groups, documented at `:139-176`): the old stable sort over `["hp","atk",…]` zeroed HP every time.
3. **SP-form pastes pass through** (`:234-238`) instead of being re-divided by 8.

Regression tests name the shipped symptom verbatim:
- `src/lib/analysis/__tests__/stat-calculator.test.ts:135` — `"returns all zeros for a zero-EV spread (regression: was fabricating 32 HP / 32 Atk / 2 Def)"`
- `:158` — `"regression: convertToChampionsSp inflated minimum-investment stats to 32 SP"`
- `:194` — `"regression: over-budget trim was biased by stat array order and gutted HP"`

Changelog corroboration: `src/app/changelog/data.ts:52` — "252 HP / 4 Def now correctly reads 32 HP / 1 Def instead of 32 HP / 32 Def".

**Action: close as fixed.**

## VGC-243 — Speed tiers not adapting to Mega (Floette) — FIXED_ON_MAIN

`src/components/report/SpeedTierChart.tsx:172` now resolves the form before computing Speed:
```
const form = resolveSpeedTierForm(mon, speciesKeys[i], megaStates?.[i] === true);
…
baseSpe = calculateChampionsStat("spe", form.data.baseStats.spe, sp.spe, mon.parsed.nature);
```
`src/lib/utils/speed-tier-form.ts:25-60` returns the Mega's `dataKey` + base stats when the Mega form is selected, and can also flip an already-Mega import back to base. `megaStates` is plumbed index-keyed from `HomePageClient.tsx:238-246` (`resolvedMegaStates`) → `TeamReport.tsx:273` → chart.

A regression test names the reporter's exact Pokémon: `src/lib/utils/__tests__/speed-tier-form.test.ts:15-23` asserts `mega.data?.baseStats.spe !== base.data?.baseStats.spe` for Floette/Floettite.

The UI also now pre-empts the misread for Megas that genuinely share base Speed (`SpeedTierChart.tsx:474`, `:537`): "A Mega that shares its base form's Speed shows the same number — that's expected, not a bug."

**Action: close as fixed.**

## VGC-242 — Manage Access "visual flashes" — FIXED_ON_MAIN

Two flash sources, both fixed with refs, both documented in code:

1. `src/components/social/CollaboratorPanel.tsx:66-75`:
   > `// Fetch exactly once per open. Guarding on collaborators.length caused a`
   > `// re-fetch loop for shares with zero collaborators (the GET legitimately`
   > `// returns []), which flipped 'loading' repeatedly and flashed the`
   > `// spinner ↔ content swap. A ref tracks whether we've already fetched.`
2. `:42-47` — `collaboratorsRef` keeps the search debounce off the `collaborators` array identity:
   > `// (a new reference every fetch/add/remove would otherwise retrigger the debounce and churn the UI)`

The spinner ↔ list swap at `:278-281` is now driven by a single `loading` transition per open.

*Caveat:* "visual flashes" is a subjective runtime report. There is no browser or runtime in this container, so this is a code-level verdict: both documented mechanisms are gone and nothing else in the component flips `loading`. If the reporter still sees flashing, it is a new/different defect and needs a fresh repro.

**Action: close as fixed, ask the reporter to confirm.**

## VGC-245 — Modes section not saving — FIXED_ON_MAIN

Root cause was a zod `.strip()` dropping an unlisted key. Both save paths now list `commonModes`, including the structured `combinations` array:

- Share path: `src/app/api/share/route.ts:27-49`, with the root cause spelled out at `:25-27`:
  > `// MUST be listed here — the schema strips unknown keys, so omitting this`
  > `// silently dropped the entire Modes section on every save (the client`
  > `// showed "saved" but the DB never stored it).`
- Draft path (the reporter's "private report I keep iterating"): `src/app/api/user/drafts/route.ts:15` uses `ShareableStateSchema`, which carries `commonModes` with `combinations` + the 5 legacy text fields at `src/lib/sharing/url-codec.schemas.ts:63-83`.

Changelog corroboration: `src/app/changelog/data.ts:102` — "Modes section now saves reliably on shared and draft reports — it was silently failing to persist changes."

**Action: close as fixed.**

## VGC-288 — Account deletion leaves rows behind — STILL_BROKEN

`src/app/api/user/delete/route.ts:52-82` builds the purge transaction. Compared with the proven `purgeSatellites` in `src/app/api/cleanup/route.ts:29-45`, the delete path is missing **six** purges. The route deletes the user's shares at `:78`:
```
statements.push(sql`DELETE FROM shares WHERE owner_id = ${userId}`);
```
but never purges these satellites by `share_id`:

| Row set | cleanup/route.ts | user/delete/route.ts |
|---|---|---|
| `comment_flags` (via comment ids) | `:31-34` | **absent** |
| `share_versions` by `share_id` | `:38` | only `editor_id = userId` (`:59`) |
| `edit_changelog` by `share_id` | `:39` | only `editor_id = userId` (`:58`) |
| `collection_items` by `share_id` | `:40` | only via the user's own collections (`:54-55`) |
| `notifications` by `source_share_id` | `:42` | only `user_id = userId` (`:71`) |
| `match_logs` | `:44` (`SET share_id = NULL`) | **absent entirely** |

`match_logs` is the sharpest point: `src/lib/db.ts:304-315` shows `match_logs(user_id TEXT NOT NULL, …, notes, tournament_name)` — the user's own match history, including free-text notes, survives account deletion with their `user_id` intact. That is the GDPR exposure, not just orphan bloat.

Neither table declares a real FK (`comment_flags.comment_id INTEGER NOT NULL` at `src/lib/db.ts:79-86`, `match_logs.share_id TEXT` at `:304`), so the `DELETE FROM shares` does **not** error — the rows are silently orphaned. That is why this has gone unnoticed and why it is a storage risk on the 512 MB Neon tier.

**Implementability tonight: HIGH.**
- Files: `src/app/api/user/delete/route.ts` (primary). Optionally lift `purgeSatellites` out of `src/app/api/cleanup/route.ts` into a shared `src/lib/db/purge-satellites.ts` so the two paths cannot drift again — that is the ticket's own recommendation and gives the new logic a natural `src/lib/db/__tests__/` home.
- **Test IS addable without a database.** The ticket's "needs a DB" caveat is out of date given the house pattern: `src/app/api/share/__tests__/route.test.ts:1-13` mocks `@/lib/db`'s `getDb` with a tagged-template fake and asserts against the SQL text. A test can assert the transaction contains DELETEs for all six missing row sets. `src/app/api/collaboration/__tests__/postgres.test.ts` is a second precedent.
- Blast radius on stored user data: **this is the one ticket tonight that writes DELETEs.** All added statements must be scoped to `${userId}` / `${shareIds}` and must go inside the existing `sql.transaction([...])` at `:84`. Keep the `match_logs` decision explicit: `cleanup` nulls `share_id` (keeps the row) because the share died, but on *account* deletion the rows must be **deleted**, not nulled — a reviewer should confirm that intent.
- Order note: `comment_flags` must be purged **before** `comments` (which are deleted at `:65`), matching `cleanup/route.ts:31-34`.
- Conflict risk: **none** — neither route is on `.swarm/main-changed-files.md`.

## VGC-292 — Three components compute Champions stats with the EV formula — STILL_BROKEN

The shared origin is `src/lib/analysis/analyze-team.ts:21-22`, which has no regulation parameter:
```
const calculatedStats = data
  ? calculateAllStats(data.baseStats, parsed.ivs, parsed.evs, parsed.level, parsed.nature)
  : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
```
Every consumer of `AnalyzedPokemon.calculatedStats` therefore gets EV-formula numbers. The three flagged components:

- `src/components/report/TeamStats.tsx:23` — `.map((p) => p.calculatedStats.spe)` drives the "N–M speed" range.
- `src/components/report/TournamentMode.tsx:86` — `value: statView === "stats" ? (calculatedStats[key] ?? 0) : evs[key]`. **Both halves are wrong in Champions:** the stats view uses the EV formula, and the "EVs" view prints raw `evs[key]` rather than the SP spread, so a Champions paste shows EV-looking numbers against an SP budget.
- `src/components/report/MatchupPlanSlide.tsx:171` — recomputes opponent stats directly and unconditionally: `calculateAllStats(data.baseStats, p.ivs, p.evs, p.level, p.nature)`.

The divergence reproduces the ticket's numbers exactly. Dragapult, base Spe 142, Timid, level 50:
- SP path (`calculateChampionsStat`, 32 SP): **213**
- EV path misreading the SP value `32` as 32 EVs: `floor((2·142+31+8)·50/100 + 5) · 1.1` = **182**

Contrast with the components that are already correct: `PokemonCard.tsx:150-156` and `SpeedTierChart.tsx:177-181` both do `convertToChampionsSp(parsed.evs)` → `calculateAllChampionsStats` / `calculateChampionsStat`. So the same report genuinely prints 182 in three places and 213 in the others.

**Implementability tonight: HIGH — this is the best first ticket.**
- Recommended narrow fix (matches CLAUDE.md "focused diffs; follow existing patterns"): add one regulation-aware helper to `src/lib/analysis/spread-builder.ts` (which already imports both `isChampionsFormat` and `convertToChampionsSp`, at `:3,:5`), e.g.
  `displayStats(parsed, baseStats, regulation)` → `isChampionsFormat(regulation) ? calculateAllChampionsStats(baseStats, convertToChampionsSp(parsed.evs), parsed.nature) : calculateAllStats(…)`.
  Mirror `PokemonCard`'s `calculateAllChampionsStats` path, **not** `spreadStats`/`createCalcPokemon` — the latter goes through `@smogon/calc` gen 0 and can disagree with the local dex base stats the cards use.
- Files that would change: `src/lib/analysis/spread-builder.ts` (new helper), `src/components/report/TeamStats.tsx`, `src/components/report/TournamentMode.tsx`, `src/components/report/MatchupPlanSlide.tsx`, plus `src/components/report/TeamReport.tsx:368` and `src/components/ui/PdfExport.tsx:146` to pass a new `regulation` prop into `MatchupPlanSlide` (it has none today; see its props at `MatchupPlanSlide.tsx:28-49`). `TeamStats` and `TournamentMode` **already receive `regulation`** (`TeamStats.tsx:8`, `TournamentMode.tsx:23`, used for `hideTera`), so no plumbing needed there.
- Do **not** change `analyzeTeam`'s signature (the audit's broader suggestion). It has exactly one caller, `src/hooks/useTeamReport.ts:124`, but regulation there comes from user-settable tags + auto-detection, so threading it in is a larger, riskier refactor than tonight warrants.
- Test addable: **yes** — `src/lib/analysis/__tests__/spread-builder.test.ts` already exists; add a case named for the bug asserting Dragapult 213 (Champions) vs 182 (EV misread).
- Blast radius on stored user data: **none.** This is display-side derivation only; no persisted field changes. User-visible numbers on existing Champions reports will change (correctly) — same class of change the team already shipped and disclosed in `changelog/data.ts:52`.
- **Conflict risk: YES.** All four `.tsx` files (`TeamStats`, `TournamentMode`, `MatchupPlanSlide`, `TeamReport`) are on `.swarm/main-changed-files.md`. The edits are small and surgical, but this ticket must not share an agent with any other UI work.
- Also run `ui-checklist-reviewer` — `.tsx` files are touched.

## VGC-295 — Explore keyset pagination skip/duplicate — STILL_BROKEN

The `WHERE`/`ORDER BY` inconsistency the ticket describes is intact in `src/app/api/explore/route.ts`.

Chronological branch (`:217-227`):
```
${chronologicalCursor?.id
  ? sql`AND (date_trunc('milliseconds', ${col}), s.id) < (${chronologicalCursor.timestamp}::timestamptz, ${chronologicalCursor.id})`
  : …}
ORDER BY ${col} DESC, s.id DESC
```
`WHERE` compares `date_trunc('milliseconds', col)`; `ORDER BY` sorts on the raw `col`. The cursor is necessarily millisecond-precision because it is built from `serializeChronologicalCursor` → `toISOString()` (`src/lib/explore/chronological-cursor.ts:19-21`, called at `route.ts:337-338`). So for two rows inside the same millisecond but with different sub-millisecond values, the sort order and the filter order disagree: a row ordered *after* the page's last row can still fail `(trunc(ts), id) < (cursor_ts, cursor_id)` when its `id` sorts above the cursor's, and is dropped.

Same mismatch in the `popular` (`:194-195`) and `views` (`:208-209`) branches — `date_trunc('milliseconds', s.created_at)` in `WHERE`, bare `s.created_at DESC` in `ORDER BY` — and those two branches have **no `id` tiebreaker at all** (`parseCompositeCursor` returns only `{value, createdAt}`, `:163-170`), so an exact millisecond tie across a page edge can skip or duplicate regardless of truncation.

**Implementability tonight: PARTIAL — the ticket's own gate cannot be satisfied.**
- The ticket says *"Needs `EXPLAIN` before changing, not a blind edit"* on a hot, cached path. `DATABASE_URL` is **unset** in this container and there is no `.env.local` (only `.env.example`), so no `EXPLAIN` is possible. Honour the gate: do not blind-edit the SQL tonight.
- What *is* safely doable tonight: move the composite cursors onto `(timestamp, id)` in `src/lib/explore/chronological-cursor.ts` / `parseCompositeCursor`, with pure unit tests in the existing `src/lib/explore/__tests__/chronological-cursor.test.ts` — logic that needs no DB. Leave the `WHERE`/`ORDER BY` truncation change for someone with a database.
- Files: `src/app/api/explore/route.ts` (gated), `src/lib/explore/chronological-cursor.ts` (safe).
- Test addable: yes, for the cursor module.
- Blast radius on stored user data: none (read path). But it is a **cached** path — `route.ts:43-45` keys the cache on the cursor string, so changing the cursor format silently invalidates existing cached pages and any cursor a client is mid-pagination on. Make the parser tolerate the legacy format, as `parseCompositeCursor:167-169` already does.
- Conflict risk: **none** — `src/app/api/explore/route.ts` is not on the changed-files list (`src/app/explore/page.tsx` and the `components/explore/*` files are, but the API route is not).

## VGC-181 — Indianapolis Regionals top-cut table — STILL_BROKEN, hard-blocked

The placeholder data still ships. `src/data/indy-top-cut.ts:15-80`: all eight entries carry `player: "TBD"`, fabricated archetype rosters (`["Charizard","Garchomp","Incineroar","Amoonguss","Tapu Fini","Rillaboom"]` etc.), and every `limitlessUrl` points at the generic index `https://play.limitlesstcg.com/tournaments` rather than the event.

Partial mitigation already on main: the table is now labelled honestly — `src/app/champions/ChampionsContent.tsx:334` renders a "Sample — May 29-31, 2026" badge, `:339` says "representative archetypes", `:342` says "Real results will be published on Limitless TCG once the tournament concludes". So the trust risk the ticket describes is reduced. But the event finished on 31 May 2026 and today is 26 Oct 2026, so that disclaimer is now itself false on production.

**Implementability tonight: BLOCKED — do not assign.** This needs real external tournament data and all three sources are unreachable from this container. `curl` to `play.limitlesstcg.com:443` and `victoryroadvgc.com:443` both return no response, and `$HTTPS_PROXY/__agentproxy/status` reports them explicitly:
```
{"kind":"connect_rejected","detail":"gateway answered 403 to CONNECT (policy denial or upstream failure)","host":"play.limitlesstcg.com:443"}
{"kind":"connect_rejected","detail":"gateway answered 403 to CONNECT (policy denial or upstream failure)","host":"victoryroadvgc.com:443"}
```
`.swarm/r-indy-research-16-05-26.md` recorded the same 403s against Limitless, Victory Road, RK9 and the official site back in May. Fabricating plausible names would be far worse than leaving "TBD".

- If a human wants a safe interim step: update the now-false "once the tournament concludes" copy at `ChampionsContent.tsx:342`, or drop the section until real data exists. Both are judgement calls for the user, not swarm work.
- Files if unblocked: `src/data/indy-top-cut.ts`, `src/app/champions/ChampionsContent.tsx`.
- Conflict risk: **YES** — `src/app/champions/ChampionsContent.tsx` is on `.swarm/main-changed-files.md`.
- Test addable: not meaningfully (static content data).

---

## Recommended disposition

**Close as already-fixed on main (6):** VGC-251, VGC-243, VGC-242, VGC-245, VGC-267, VGC-260.
**Also close:** VGC-289 (stale, per orchestrator).
**Work tonight, in order:** VGC-292 → VGC-288 → VGC-294 → VGC-293 → VGC-295 (cursor-module half only).
**Do not assign:** VGC-181 (no data access).

Note for the orchestrator: VGC-293 touches `src/components/compare/CompareContent.tsx`, which is on the changed-files list; and its suggested fix references `src/lib/utils/effective-typing.ts`, which does not exist on main (unmerged PR #81), so that fix must be written from scratch rather than ported.

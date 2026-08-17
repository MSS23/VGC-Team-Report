# C5 — Commit Review of the Last 20 Commits on `origin/main`

**Date:** 2026-08-17 · **Agent:** C5 (overnight audit swarm) · **Mode:** READ-ONLY (no source file edited, no mutating git command run)
**Branch under audit:** `claude/loving-sagan-853anq` · **Range reviewed:** `d962cc6..5d456cd` (`git log origin/main -20`)
**Prior report:** `.swarm/c5-commit-review-10-08-26.md` (range `cba0832..a70d924`) — every finding re-verified below.

```
5d456cd chore: changelog v5.27 — saves, drafts, and the security sweep
0242253 chore: surface Discord webhook failures; ignore .agents/.codex tool dirs
a099f97 VGC-274: Linear webhook replay window + drop CORS Allow-Credentials
164fb87 VGC-272: robots.txt named groups un-blocked /api/; /compare was noindex yet sitemapped
1db8419 VGC-266: correct SP definition in llms.txt and FAQ
b865fa2 VGC-264: regression test — no API route may parse x-forwarded-for directly
9897389 VGC-267: keepalive only on the exit flush
d44b93a fix: security hardening — Next 16.3.0 CVEs, spoofable client-IP parsing, JSON-LD escaping
bc7dffd fix: published reports no longer resurface as a local draft for signed-out visitors
c4c6c75 fix: welcome-back banner is signed-in only
a1255c1 fix: client cleanups — explore render loop, optimistic UI honesty, dead code
1b14f3b fix: domain correctness — type chart, parser headers, archetypes, legality
44f780c fix: allowComments and commonModes.combinations were silently dropped on every save
fd0aa6f fix: API hardening — creator ILIKE dump, orphan rows, SSE lambda-warming, cleanup gaps
0f73ba3 fix: analyzing a new team starts a fresh draft
9829faf fix: defensive coverage respects ability immunities
80d232a fix: Levitate shows Ground immunity on defensive type chart
bdbbfac swarm: nightly improvements 10-08-26 (#73)   [merge — 63 files]
a70d924 fix: swarm container connections
d962cc6 chore: changelog entry (5.25)
```

**Gate status at review time:** `vitest` **402/402 passing across 39 files**. `npm run lint` → **33 errors, 62 warnings** (non-blocking in CI). `next build` deliberately not run (shared working tree).

---

## Verdict up front

This is the strongest week in the last three C5 reviews. The Champions-SP cluster that dominated the 10-08 report — five findings, three of them HIGH — has been **genuinely and completely fixed** by `bdbbfac`, not papered over: `convertToChampionsSp` now has no padding step at all, over-budget spreads go through a real largest-remainder `trimSpToBudget` with atomic tie groups, the tests pin exact spreads instead of budget invariants, and changelog 5.26 openly discloses the retroactive display change to users. `9897389` likewise closed the `keepalive` 64 KiB finding.

Two things keep this from a clean bill of health:

1. **A stale-debt tail that nobody is paying.** Eight of fifteen prior findings are still exactly where they were. The CI lint gate is still `continue-on-error` with 33 errors (was 35 — net one fixed, one added), `CLAUDE.md:56` still tells future agents that eslint *is* a gate, and the sitemap `lastModified` revert (VGC-273) is confirmed and untouched.
2. **The `ponytail:` marker convention is spreading.** Two new ones landed this week in shipped source. See N1.

---

## Requested verification: the VGC-273 sitemap revert

**CONFIRMED, and STILL-PRESENT.** Verified against the real diffs, not the ticket text.

- `83d195a` (§7.6, 2026-07-05) added exactly one line: `lastModified: now` on the `getRegMAMegasWithSprites()` mega entries in `src/app/sitemap.ts:24`.
- `fe70914` (VGC-64, 2026-07-17) removed `lastModified` from **all eleven static entries and from the mega entries** — a strictly larger revert than the ticket describes. Its commit message is entirely about `export const revalidate = 3600` and never mentions the removal.

**Current state of `src/app/sitemap.ts` (origin/main):**

| Entry group | `lastModified`? |
|---|---|
| 11 static pages (`/`, `/explore`, `/champions`, `/faq`, `/tools/ev-to-sp`, …) — `sitemap.ts:13-26` | **NO** |
| Champion mega pages (72 URLs via `getRegMBMegasWithSprites()`) — `sitemap.ts:31-35` | **NO** |
| Public share pages (`/s/{id}`, ≤5000) — `sitemap.ts:48` | YES — real `shares.updated_at` |
| Creator pages (≤5000) — `sitemap.ts:62` | YES — real `MAX(updated_at)` |

So the answer to the orchestrator's question: **the sitemap currently has per-route `lastModified` only on the two DB-driven groups. Every static route and every SEO-critical `/champions/{slug}` mega guide page ships with no `lastModified` at all.** The DB-driven halves were *improved* by the same commit (`ORDER BY updated_at`, `LIMIT 5000` on the previously unbounded creator query), which is why the regression went unnoticed.

Removing an always-`new Date()` timestamp was defensible — crawlers learn to ignore a sitemap where everything changed one second ago. But the right end state for `/champions/*` is a real per-page timestamp (deploy time, or the mega-list content hash date), not the absence of the field. `164fb87` touched this exact file five days ago and did not restore it.

> **Ticket (VGC-273, already filed):** restore a meaningful `lastModified` on the static + champion sitemap entries. Severity **MEDIUM** (SEO-critical per CLAUDE.md). Not trivial — needs a real timestamp source, so ticket, not fix-now.

---

## Requested sweep: `// ponytail:` markers

**Three in shipped source. Two are NEW this week.** They are not a real convention — they read as an agent's leftover scratch marker that has now been copied forward three times. Nothing else in the repo uses the word; no tooling consumes it; no ticket references it.

| # | File:line | Commit | Status | Text |
|---|---|---|---|---|
| 1 | `.github/workflows/ci.yml:22` | `53395ca` | **STILL-PRESENT** | `# ponytail: 35 pre-existing lint errors (react-hooks etc.) — non-blocking` |
| 2 | `src/lib/data/type-chart.ts:189` | `80d232a` (added), reworded in `9829faf` | **NEW** | `// ponytail: Dry Skin's extra Fire weakness isn't modeled — immunities only.` |
| 3 | `src/app/api/webhooks/linear/route.ts:66` | `a099f97` | **NEW** | `// ponytail: no delivery-id dedupe — within the window a replay is possible` |

Two further occurrences are quotations inside `.swarm/c5-commit-review-10-08-26.md:217,227` and `.swarm/new-tickets-10-08-26.md:84` — those are this review's own prior output, not leakage.

Note the content of #2 and #3 is *useful* — both are honest known-limitation notes that deserve to survive. Only the `ponytail:` token is noise.

> **N1 — LOW — fix now, it's trivial.** Rename all three to a real convention (`// NOTE:` or `// LIMITATION:`), or adopt `ponytail:` deliberately and document it in CLAUDE.md. Right now it is neither. One-line suggested fix: `sed -i 's|// ponytail:|// NOTE:|; s|# ponytail:|# NOTE:|' <the three files>` — but the CI one should also gain a ticket reference (see S2).

---

## NEW findings

Severity: **HIGH** (wrong output/data reaching users) · **MEDIUM** (real defect or meaningful risk) · **LOW** (loose end) · **INFO**.

### N2 — MEDIUM — `detect-archetype.ts` shipped substantial new logic with **zero** tests

- **Commit:** `1b14f3b` · **File:** `src/lib/analysis/detect-archetype.ts:56-58, 87-92`

CLAUDE.md: *"New logic in `src/lib/` gets a vitest test beside it (`__tests__/`); regressions get a test that names the bug."* `1b14f3b` was scrupulous about this for four of its five files — `type-chart.ts`, `showdown-parser.ts`, `champions-legality.ts` all got named regression tests in the same commit. `detect-archetype.ts` got none, and **`src/lib/analysis/__tests__/detect-archetype.test.ts` does not exist at all** — this module has never had a test.

What went in untested:
- Line 58: the Mega Offense detector swapped a string-suffix match for `detectMegaFromItem()`, a real dex lookup with a Charizard-X/Y dual-stone branch. The stated bug (Eviolite tagged as Mega Offense) has no test naming it.
- Lines 87-92: a brand-new `isSpScale` heuristic and `evScale = 32/252` multiplier now rescale **four** separate threshold comparisons (lines 96, 111, 128). This is the archetype label every report displays.

> **Ticket:** `VGC-XX: add detect-archetype tests — Eviolite ≠ Mega Offense, Champions SP thresholds, mixed-scale teams`. Severity MEDIUM. Ticket, not fix-now (needs `AnalyzedPokemon` fixtures).

### N3 — MEDIUM — Linear webhook replay protection is opt-in and fails open silently

- **Commit:** `a099f97` · **File:** `src/app/api/webhooks/linear/route.ts:67-72`

```ts
if (typeof body.webhookTimestamp === "number") {
  const ageMs = Math.abs(Date.now() - body.webhookTimestamp);
  if (ageMs > 60_000) return NextResponse.json({ error: "Stale webhook" }, { status: 401 });
}
```

The whole control is gated on the field being present **and** typed `number`. If Linear ever serialises `webhookTimestamp` as a string, renames it, or omits it for a payload variant, the replay window silently stops existing — no log, no metric, no test. A security control that can disable itself without telling anyone is the shape that gets discovered during an incident, not before. The commit added no test for this route (contrast `a099f97`'s own careful CORS test in the same commit).

Also worth noting: the file's own `ponytail:` comment concedes there is no delivery-id dedupe, so within the 60s window replay is still possible. Harmless today (the handler is a no-op that returns `{ok:true}`), dangerous the day it mutates state — which is exactly what the comment says.

> **Fix now (trivial):** invert the guard — `if (typeof body.webhookTimestamp !== "number") return 401`, since Linear always sends it on signed events. **Ticket** for the dedupe cache, gated on the handler ever doing work.

### N4 — MEDIUM — The Linear webhook `catch` swallows every error with no logging and returns 200

- **Commit:** pre-existing, but `a099f97` added new throwing code (`JSON.parse`, arithmetic) underneath it · **File:** `src/app/api/webhooks/linear/route.ts:79-82`

```ts
} catch {
  // Return 200 so Linear does not auto-disable the webhook on a transient error.
  return NextResponse.json({ ok: true });
}
```

Returning 200 to keep Linear from auto-disabling is a legitimate choice. Discarding the error entirely is not. A malformed body, a crypto failure, or any future handler bug now produces an indistinguishable `{ok:true}` — and CLAUDE.md records that this exact webhook has a history of silent breakage ("The Linear-webhook-fix P0…"). `0242253`, two commits later, fixed precisely this anti-pattern for the Discord webhook; the same reasoning was not applied here.

> **Fix now (trivial):** `} catch (e) { console.error("Linear webhook error:", e); return NextResponse.json({ ok: true }); }`

### N5 — MEDIUM-LOW — Ref written during render, in the same commit that praises avoiding it

- **Commit:** `a1255c1` · **File:** `src/hooks/useNotifications.ts:25`

```ts
const notificationsRef = useRef<Notification[]>([]);
notificationsRef.current = notifications;   // ← render phase
```

This is a bare ref assignment in the component body. It is a **new eslint error** (`Error: Cannot access refs during render` at `useNotifications.ts:25`) that did not exist before this commit — confirmed by running lint. Commit `3c895f1` (previous range) was specifically commended for *fixing* render-phase ref mutation as a React 19 correctness issue; `a1255c1` reintroduces the pattern two hooks over. It works today under the current render model, but it is exactly the class of thing that breaks under concurrent re-render / Strict double-invoke, and it is invisible because lint is non-blocking (see S2 — the two findings compound).

> **Fix now (trivial):** move into an effect — `useEffect(() => { notificationsRef.current = notifications; }, [notifications]);`. The value is only read inside async callbacks, so an effect write is sufficient.

### N6 — MEDIUM-LOW — `purgeSatellites` is ten sequential statements with no transaction

- **Commit:** `fd0aa6f` · **File:** `src/app/api/cleanup/route.ts:29-46`

The commit grew `purgeSatellites` from 5 deletes to 9 deletes + 1 update, all awaited serially and none wrapped in `BEGIN`/`COMMIT`. If statement 6 throws (a missing `collection_items` table on a lagging environment, a lock timeout, a Neon connection blip on the free tier), statements 1–5 have already committed: the report's reactions, comments and saved-report rows are gone while the `shares` row itself survives. The outer `try` at line 21 catches and 500s, so the cron reports failure — but the half-purge is not retried idempotently against a share that now looks alive. This runs against a 512 MB Neon instance where CLAUDE.md already records one 447 MB orphan incident.

> **Ticket:** `VGC-XX: wrap cleanup purgeSatellites in a transaction (or make the share delete the first statement)`. Severity MEDIUM-LOW.

### N7 — LOW — `src/lib/cache.ts` fail-open→fail-closed flip shipped with no test and no log

- **Commit:** `fd0aa6f` · **File:** `src/lib/cache.ts:71-76`

`cacheSetIfAbsent` changed its Redis-error return from `true` to `false`. This is a **behaviour inversion on the hottest dedup path** (view counting) and the reasoning in the new docstring is sound — an Upstash outage failing open would mean one DB write per pageview. But:

1. `src/lib/cache.ts` has **no test file anywhere** (`find src -name "*cache*"` → only the source). A `src/lib/` behaviour change with no sibling test is a CLAUDE.md violation.
2. The `catch { return false; }` is bare — no `console.error`. An Upstash outage now silently suppresses every view count with zero signal, which is the mirror-image failure of the one being fixed and is equally invisible.

> **Fix now (trivial):** add `console.error` to the catch. **Ticket:** add `src/lib/__tests__/cache.test.ts` covering unconfigured-vs-errored Redis.

### N8 — LOW — Two endpoints gained a hard `LIMIT 100` with no pagination and no truncation signal

- **Commit:** `fd0aa6f` · **Files:** `src/app/api/creator/[name]/route.ts:60`, `src/app/api/user/saved/route.ts:37`

Both queries were genuinely unbounded and needed a cap — good catch. But the cap is silent: a creator with 101+ public reports has their profile page quietly truncated, and a user with 101+ saved reports simply stops seeing the older ones, with no `hasMore` flag, no cursor, and no UI affordance. `/api/explore` in the same codebase already implements keyset pagination (`chronological-cursor.ts`), so the pattern exists to copy.

> **Ticket:** `VGC-XX: paginate creator profile and saved-reports lists instead of silently truncating at 100`. Severity LOW today, rises with any power user.

### N9 — LOW — The `next` version pin was loosened to a caret range inside the security commit

- **Commit:** `d44b93a` · **File:** `package.json:33`

```diff
-    "next": "16.2.6",
+    "next": "^16.3.0",
```

The project deliberately exact-pinned Next (`16.2.6`, no range) while every other dependency carries `^`. The CVE-clearing commit changed it to `^16.3.0` in passing, unmentioned in a commit message that otherwise itemises every advisory. `npm ci` still installs from the lockfile so CI and Vercel are deterministic, but any `npm install` now floats the framework across minors — on a project whose deploy model is "push, then promote", a framework minor arriving unannounced is not what you want. The same commit also documents 8 unresolved moderate advisories in the opentelemetry chain with no tracking ticket.

> **Fix now (trivial):** restore the exact pin `"next": "16.3.0"` if the exactness was deliberate — worth confirming with the user, since it may have been intentional. **Ticket:** `VGC-XX: opentelemetry moderate advisories — breaking exporter bump, plan the upgrade`.

### N10 — LOW — `isSpScale` mis-scales mixed-notation Champions teams

- **Commit:** `1b14f3b` · **File:** `src/lib/analysis/detect-archetype.ts:87-92`

`isSpScale` requires **every** Pokémon's raw spread total to be ≤ 66. A Champions team where five mons carry SP-form spreads and one was pasted in EV form (a completely normal mixed import) fails `every`, so `evScale` falls back to `1` and the five SP mons can never trip a 100/200 threshold — the exact "everything falls through to Goodstuffs" bug the commit set out to fix, just narrowed rather than eliminated. The proportional scaling itself is sound (100/510 ≈ 12.7/66; 100/252 ≈ 12.7/32 — consistent both ways); it's the all-or-nothing team-level detection that's brittle.

The commit's own comment acknowledges the all-zero case is benign, which is correct — 0 trips nothing on either scale. The mixed case is not mentioned.

> **Ticket:** `VGC-XX: scale archetype thresholds per-Pokemon (or off detectRegulation) instead of an all-or-nothing team heuristic`.

### N11 — LOW — The new XFF regression test is a substring scan over whole files

- **Commit:** `b865fa2` · **File:** `src/lib/security/__tests__/no-raw-forwarded-for.test.ts:20-24`

`/x-forwarded-for/i.test(readFileSync(file, "utf8"))` matches **anywhere in the file, including comments and strings**. A future route that legitimately documents *"reads the client IP via getClientIp, never raw x-forwarded-for"* fails the test; a route that reads the header via a computed key (`headers.get(H)`) passes it. Good intent, blunt instrument — and its brittleness will train people to edit the test rather than the code.

> **Fix now (trivial):** narrow the regex to the actual call shape, e.g. `/headers\s*\.\s*get\(\s*["'`]x-forwarded-for/i`, and keep the current broad check as a warning.

### N12 — LOW — `postToBuildsChannel`'s `fetch` itself is still unguarded

- **Commit:** `0242253` · **File:** `src/lib/discord-webhook.ts:22-33`

The commit correctly added an `!res.ok` log, which fixes the 410/429 blind spot. But `await fetch(...)` remains outside any `try` — a DNS failure or connection reset still **throws out of `postToBuildsChannel`** and into the cron route. Whether that 500s `daily-ops`/`weekly-report` depends on each caller's own error handling. The commit message says the goal is that "the crons look healthy while #builds hears nothing" should stop happening; the network-failure half of that is untouched, and now fails in the opposite direction (loud crash instead of silence). `src/lib/discord-webhook.ts` also has no test file.

> **Fix now (trivial):** wrap in `try/catch` and `console.error` the throw, matching the non-ok branch.

### N13 — LOW — Sitemap DB failure silently drops up to 10,000 URLs

- **Commit:** pre-existing; relevant because `fe70914`/`164fb87` both edited this file without addressing it · **File:** `src/app/sitemap.ts:67-70`

```ts
} catch (e) {
  console.error("Sitemap generation error:", e);
  return staticPages;
}
```

A transient Neon error during the hourly `revalidate` regenerates the sitemap with **only the 83 static entries** — every `/s/{id}` and `/creator/{name}` URL vanishes for the next hour, and the cached bad copy is what crawlers fetch. It logs, at least, but nothing alerts and nothing prevents the degraded version being cached. On a free-tier Neon that sleeps, this is not hypothetical.

> **Ticket:** `VGC-XX: on sitemap DB failure, serve the previous good sitemap or fail the revalidation rather than caching a stripped one`.

### N14 — INFO — First lint escape hatch of the year

- **Commit:** `a1255c1` · **File:** `src/hooks/useExploreUrlSync.ts:138,152`

`/* eslint-disable react-hooks/exhaustive-deps */` around twelve `useCallback(makeSetter(k), [])` calls. Prior C5 reviews recorded **zero** `eslint-disable` in the range; this is the first. It is functionally correct — `useCallback` keeps the first closure and `makeSetter` is pure over a literal key — and the surrounding comment explains the render-loop bug it fixes well. Flagged only because it is a precedent, and because the block-disable style would also hide any *future* dep bug added between those lines. A per-line `// eslint-disable-next-line` would scope it properly.

### N15 — INFO — Publish marker is only re-armed by editing the raw paste

- **Commit:** `bc7dffd` · **Files:** `src/hooks/useTeamReport.ts:88-97`, persist effect at `:36-47`

`markPastePublished()` writes `"published"`; the persist effect that writes `"user"` back is keyed on `[paste, parsedTeam, persist]`. Post-publish edits made in the **report UI** (notes, calcs, matchup plans, common modes) never touch `paste`, so the marker stays `"published"` and `useHomePage`'s mount-restore *evicts* the local copy entirely. That is the intended design — the server draft is canonical and `useAutoDraft` covers it — but the commit message's claim that "Post-publish edits re-mark it 'user'" is only true for edits typed into the paste textarea. Worth knowing before anyone reasons about this again. No action needed.

---

## STILL-PRESENT from the 10-08-26 report

| Prior | Summary | Status | Evidence |
|---|---|---|---|
| F1 | `convertToChampionsSp` inflates min-investment stats to 32 SP | ✅ **FIXED** | `bdbbfac` — padding step deleted; `stat-calculator.ts:227-231` docstring and code now agree; `stat-calculator.test.ts:161` asserts `252 HP/4 Def → 32 HP/1 Def` exactly |
| F2 | Over-budget trim biased by stat declaration order, guts HP | ✅ **FIXED** | `bdbbfac` — new `trimSpToBudget` (`stat-calculator.ts:118-187`), largest-remainder with atomic tie groups; permutation-invariance test at `:229-237` |
| F3 | Retroactive SP display change with no changelog | ✅ **FIXED** | `changelog/data.ts:38` (v5.26) explicitly warns shared Champions reports will now show corrected numbers and shifted speed tiers |
| F4 | New SP tests shaped to pass, not to pin behaviour | ✅ **FIXED** | `stat-calculator.test.ts` now uses `toEqual(spread({...}))` throughout (lines 140-266), plus `evToChampionsSp`/`championsSpToEv` round-trip tests |
| F5 | SP-form fast path `≤66 && ≤32` misreads sparse EV pastes as SP | ⚠️ **STILL-PRESENT** | `src/lib/analysis/stat-calculator.ts:215`; duplicated at `src/lib/validation/champions-legality.ts:273`. `EVs: 4 HP` still reads as 4 SP, not 1. **MEDIUM** — tie to `detectRegulation` instead of a magnitude heuristic; must change both sites |
| F6 | `keepalive` on every draft save breaks >64 KiB autosave | ✅ **FIXED** | `9897389` (VGC-267) — `useAutoDraft.ts:96` `keepalive: opts?.exitFlush === true`; test at `useAutoDraft.test.ts:50` now pins `keepalive: false` |
| F7 | `fe70914` silently reverted sitemap `lastModified` | ⚠️ **STILL-PRESENT** | See the dedicated verification section above. `src/app/sitemap.ts:13-35`. **MEDIUM** (VGC-273) |
| F8 | CI lint non-blocking, 35 errors, stray `ponytail` token, CLAUDE.md stale | ⚠️ **STILL-PRESENT (all three parts)** | `.github/workflows/ci.yml:24-25` still `continue-on-error: true`; live count **33 errors / 62 warnings**; `.github/workflows/ci.yml:22` token; `CLAUDE.md:56` still says CI *"runs `tsc --noEmit`, `eslint`, and `vitest`"*. See S2 |
| F9 | Dead `PATCH /api/share/[id]/collaborators` revoke endpoint | ⚠️ **STILL-PRESENT** | `src/app/api/share/[id]/collaborators/route.ts:161`; the only three client fetches to that path are GET (`CollaboratorPanel.tsx:52`), POST (`:117`), DELETE (`:148`). Zero PATCH callers. **LOW** |
| F10 | `<Link>` → `<a href="/">` full-reload swaps | ⚠️ **STILL-PRESENT** | Now surfaced as **6 `@next/next/no-html-link-for-pages` lint errors** — invisible only because F8 makes lint non-blocking. **LOW** |
| F11 | Speed tiers recompute Speed instead of using `calculatedStats` | ⚠️ **STILL-PRESENT** | `src/components/report/SpeedTierChart.tsx:189` — the `else if (form.data)` branch still re-derives Speed for every non-Champions Pokémon. **LOW** |
| F12 | Fourth local species-key normaliser | ⚠️ **STILL-PRESENT** | `src/lib/utils/speed-tier-form.ts:17` `toSpeciesKey`, alongside `sprite-slug.ts`, `extract-species.ts`, `mega-detect.ts`. **LOW** |
| F13 | Dismissed stat caption: no un-hide, no cross-tab sync | ⚠️ **STILL-PRESENT** | `src/components/report/StatColorNote.tsx:15` `subscribe` still listens only for the custom event; no `storage` listener. **LOW** |
| F14 | Explore newest/updated feed at CDN `no-store` | ⚠️ **STILL-PRESENT** | `src/app/api/explore/route.ts:369-371` (`no-store`) vs `:373-375` (`s-maxage=60`) for other sorts. **LOW** — a 5-10s TTL keeps the freshness win at a fraction of the Neon load |
| F15 | Comment says "fail loudly", code only `console.warn`s | ⚠️ **STILL-PRESENT** | `src/instrumentation.ts:11-19`. Mitigated by the hard test assertion in `champions-dex.test.ts`. **INFO** |

**Score: 6 of 15 prior findings fixed** (including all four of the HIGH/correctness cluster), 9 unchanged.

---

## Systemic observations

### S1 — The Champions-SP fix is a model of how to close a review finding

Worth recording as a positive precedent, because it is unusual. `bdbbfac` did not just delete the padding loop. It (a) extracted `evToChampionsSp`/`championsSpToEv` as a single source of truth with a round-trip test, (b) replaced the order-biased trim with a documented largest-remainder algorithm whose docstring explicitly names the old `2 HP / 32 Atk / 32 Def` output it exists to prevent, (c) rewrote the tests from budget invariants to exact-spread equality including a permutation-invariance property test, and (d) told users in the changelog that their already-shared reports would render differently. All four prior HIGH/MEDIUM findings closed by one coherent change. This is the bar.

### S2 — The lint gate is now actively hiding new defects, not just old debt

This is the finding I would escalate. `53395ca` made lint `continue-on-error` "until that debt is cleared" three months ago. Since then:

- The error count went **35 → 33**. Net two cleared in three months; the debt is not being paid.
- `a1255c1` **added** a new error (N5, `useNotifications.ts:25`) that a blocking gate would have caught at authoring time.
- F10's six `<a href="/">` errors are sitting in the same bucket, so a real prior finding is now camouflaged as "known debt".
- 21 of the 33 are `set-state-in-effect` and 4 are `refs-during-render` — both are React 19 **correctness** rules, not style.
- `CLAUDE.md:56` still tells every future agent that eslint is part of the CI gate, so nobody reading the docs knows this hole exists.

The gate is not merely un-enforced; it has become a place where new correctness errors land invisibly. Either fix the 25 react-hooks errors and flip `continue-on-error` off, or at minimum snapshot the current count and fail CI when it *increases*.

> **Ticket (raise priority):** `VGC-XX: ratchet the eslint gate — pin the error count, fail on any increase, then burn down the 25 react-hooks errors`. Also update `CLAUDE.md:56` to state the truth — **fix now, trivial**.

### S3 — Quality of the week's work, generally

Consistently high. Commit messages explain *why* with specifics (`fd0aa6f` and `1b14f3b` are exemplary — each bullet names the observable user-facing symptom). Comments in the code do the same. Genuinely good catches this week that deserve naming: the `ILIKE` path-parameter pattern injection at `creator/[name]` (`/creator/%25` dumped every public report), the robots.txt named-group replacement semantics, the module-scope `setInterval` keeping the sync Lambda warm, and the `commonModes.combinations` zod omission silently stripping user data on every save. Zero `as any`, zero `@ts-ignore`, zero `console.log`, zero `TODO/FIXME/HACK/XXX` added anywhere in the range.

---

## Consolidated actions

**Fix now — trivial, low-risk:**

1. `CLAUDE.md:56` — remove `eslint` from the stated CI gate, or note it is non-blocking. *(S2)*
2. `src/app/api/webhooks/linear/route.ts:79` — log the swallowed error. *(N4)*
3. `src/app/api/webhooks/linear/route.ts:67` — invert the timestamp guard so a missing/mistyped field 401s. *(N3)*
4. `src/hooks/useNotifications.ts:25` — move the ref write into a `useEffect`. *(N5)*
5. `src/lib/cache.ts:74` — `console.error` in the catch. *(N7)*
6. `src/lib/discord-webhook.ts:22` — wrap the `fetch` in try/catch. *(N12)*
7. Three `ponytail:` markers → `NOTE:`. *(N1)*
8. `src/lib/security/__tests__/no-raw-forwarded-for.test.ts:22` — narrow the regex to the call shape. *(N11)*
9. `package.json:33` — restore the exact `next` pin **if** the exactness was deliberate (confirm with the user first). *(N9)*

**Should be a ticket:**

| Priority | Ticket | Ref |
|---|---|---|
| High | `VGC-XX: ratchet the eslint gate — pin error count, fail on increase, burn down 25 react-hooks errors` | S2 / F8 |
| High | `VGC-273: restore a meaningful lastModified on static + champion sitemap entries` (already filed) | F7 |
| Med | `VGC-XX: add detect-archetype tests — Eviolite, Champions SP thresholds, mixed-scale teams` | N2 |
| Med | `VGC-XX: tighten SP-form detection using detectRegulation, in both stat-calculator and champions-legality` | F5 |
| Med | `VGC-XX: wrap cleanup purgeSatellites in a transaction` | N6 |
| Med | `VGC-XX: opentelemetry moderate advisories — plan the breaking exporter bump` | N9 |
| Low | `VGC-XX: paginate creator profile and saved-reports instead of truncating at 100` | N8 |
| Low | `VGC-XX: sitemap must not cache a DB-stripped version on Neon failure` | N13 |
| Low | `VGC-XX: scale archetype thresholds per-Pokemon rather than all-or-nothing` | N10 |
| Low | `VGC-XX: add src/lib/__tests__/cache.test.ts` | N7 |
| Low | `VGC-XX: remove the unused collaborators PATCH revoke endpoint (or restore its UI)` | F9 |
| Low | `VGC-XX: reinstate a short CDN TTL on the newest/updated explore feed` | F14 |
| Low | `VGC-XX: restore client-side navigation out of shared view` | F10 |
| Low | `VGC-XX: derive speed-tier Speed from a single source of truth` | F11 |
| Low | `VGC-XX: consolidate species-key normalisation into one shared helper` | F12 |
| Low | `VGC-XX: add "restore hidden hints" control and cross-tab dismissal sync` | F13 |

---

*Review performed read-only. No source file was modified; no mutating git command was run. `npm run build` deliberately not executed (shared working tree). `vitest` and `eslint` were run read-only.*

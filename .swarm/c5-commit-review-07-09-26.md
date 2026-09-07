# C5 — Commit Review, last 20 commits on `origin/main`

**Date:** 2026-09-07 · **Agent:** C5 · **Mode:** READ-ONLY (no source file edited; only this report written)
**Range:** `0f73ba3^..70c4633` — 69 files, +1292/−474
**Prior C5 baseline:** `.swarm/c5-commit-review-10-08-26.md` covered up to `a70d924` (2026-08-10). **Every commit in this range post-dates it, so all findings below are NEW unless marked KNOWN.**

```
70c4633 fix: published teams can no longer resurface as a device-only draft
415a281 perf: homepage no longer ships the Pokemon data tables on first paint
6cec919 perf: cut initial JS on every route and the homepage
0024679 fix: mobile touch and layout fixes across report UI
82f9210 fix: core logic sweep — regulation signals, species extraction, explore search
5d456cd chore: changelog v5.27
0242253 chore: surface Discord webhook failures; ignore .agents/.codex tool dirs
a099f97 VGC-274: Linear webhook replay window + drop CORS Allow-Credentials
164fb87 VGC-272: robots.txt named groups un-blocked /api/
1db8419 VGC-266: correct SP definition in llms.txt and FAQ
b865fa2 VGC-264: regression test — no API route may parse x-forwarded-for directly
9897389 VGC-267: keepalive only on the exit flush
d44b93a fix: security hardening — Next 16.3.0 CVEs, spoofable client-IP, JSON-LD escaping
bc7dffd fix: published reports no longer resurface as a local draft for signed-out visitors
c4c6c75 fix: welcome-back banner is signed-in only
a1255c1 fix: client cleanups — explore render loop, optimistic UI honesty, dead code
1b14f3b fix: domain correctness — type chart, parser headers, archetypes, legality
44f780c fix: allowComments and commonModes.combinations silently dropped on every save
fd0aa6f fix: API hardening — creator ILIKE dump, orphan rows, SSE lambda-warming
0f73ba3 fix: analyzing a new team starts a fresh draft instead of overwriting the previous one
```

**Overall:** high-quality range. Dense *why* comments, no `as any`, no `@ts-ignore`, no `console.log`, no commented-out code, one justified-and-documented `eslint-disable`. The security commits (`a099f97`, `b865fa2`, `d44b93a`) are careful and tested. The problems are concentrated in the three most recent perf/UI commits, where async boundaries were introduced without error paths and one UI fix shipped a typo that silently voided it.

---

## HIGH-PRIORITY: the flaky draft-restore test

### Verdict: **(a) badly-written test.** Not a race in the draft-save/publish logic.
A genuine but *separate* logic bug lives nearby (see F1b) — it is not what makes the test flake.

**Test:** `src/hooks/__tests__/useTeamReport.test.ts:22-27` (`persists a parsed user paste with the 'user' source marker`); the same shape recurs at `:38-40`.
**Source under test:** `src/hooks/useTeamReport.ts:91-114`.

### Measured evidence

```
$ node node_modules/vitest/vitest.mjs run src/hooks/__tests__/useTeamReport.test.ts --reporter=verbose
✓ persists a parsed user paste with the 'user' source marker   966ms   ← vi.waitFor default timeout is 1000ms
✓ markPastePublished flips the source marker …                   5ms
✓ markPastePublished is a no-op when nothing is stored           3ms
✓ readRestorableDraft × 7                                      1ms each
Duration 2.50s (transform 1.09s, import 372ms, tests 981ms)
```

Full-suite run (41 files in parallel): the same test measured **811ms**. Solo: **966ms**. The budget is **1000ms**.

**The margin is 34ms on an idle machine.** Under a loaded swarm container the first import crosses 1000ms and `vi.waitFor` times out. That is precisely the observed signature: fails once, passes on two re-runs.

### Why the first test costs ~950ms and the rest cost 1-5ms

`parseTeam` (`src/hooks/useTeamReport.ts:110-114`) is, since `415a281`, a **dynamic import**:

```ts
const parseTeam = useCallback((input: string) => {
  void import("@/lib/analysis/analyze-team").then(({ parseShowdownPaste }) => {
    setParsedTeam(parseShowdownPaste(input));
  });
}, []);
```

`analyze-team.ts` transitively pulls `pokemon.ts` (243KB), `dex-subset.json` (130KB), `moves.ts` (82KB) and `move-names.ts` (129KB). In vitest that whole graph must be Vite-transformed and evaluated **inside test 1's `waitFor` window** (`transform 1.09s` for the file). Every later test hits the module cache — hence 1-5ms.

Two independent aggravators in the test itself:

1. **`parseTeam` returns `void`, so nothing can await it.** `await act(async () => { … parseTeam(PASTE) })` returns as soon as its own microtask queue drains — long before the import settles. The run confirms this: vitest prints *"An update to Probe inside a test was not wrapped in act(...)"* for this exact test. The state update lands outside `act`, and the assertion is left to race a cold module load.
2. **The whole cold-import cost is charged to the assertion budget** rather than to setup.

### Why this is NOT a product race — positive evidence

- `readRestorableDraft` (`useTeamReport.ts:53-72`), `evictStoredDraft` (`:31-40`), `markPastePublished` (`:151-161`) and the persist effect (`:91-103`) are **entirely synchronous** localStorage reads/writes. There is no interleaving point between them.
- The only asynchrony is module loading, and its ordering is deterministic: repeated `import()` of the *same specifier* returns the *same* promise, so `.then` callbacks fire in registration order. Two rapid `parseTeam` calls cannot resolve out of order.
- Effect ordering at publish time is also safe: `useTeamReport` is called at the top of `useHomePage` (`useHomePage.ts:72`), so its persist effect is registered — and therefore flushes — before the publish effect at `useHomePage.ts:328-333` that calls `markPastePublished()`. The snapshot always sees an up-to-date `STORAGE_KEY`.
- The test that flakes asserts only that the *persist effect ran*. It fails by timeout, not by observing a wrong value.

### Proposed fix — precise and minimal

**Primary (root cause, one insertion).** Warm the lazy chunk once so no assertion pays the cold-import cost.

*File:* `src/hooks/__tests__/useTeamReport.test.ts` — insert immediately after the `beforeEach` block that ends at **line 12**:

```ts
// The first import of analyze-team transforms ~580KB of Pokemon data
// (pokemon.ts + dex-subset.json + moves). Warming it here keeps that cost
// out of the vi.waitFor budget below, which it otherwise nearly exhausts
// (~950ms of a 1000ms default) and exceeds on a loaded machine.
beforeAll(async () => {
  await import("@/lib/analysis/analyze-team");
});
```

(and add `beforeAll` to the vitest import on line 3). This takes both `waitFor` calls to a few milliseconds.

**Belt-and-braces (optional, same file).** Raise the two budgets explicitly: `useTeamReport.test.ts:22` and `:38` → `await vi.waitFor(() => { … }, { timeout: 5000 })`.

**Best long-term (product change, removes the whole class).** Make `parseTeam` awaitable — `src/hooks/useTeamReport.ts:110-114`: `return import(…).then(…)` instead of `void import(…)`, typing it `(input: string) => Promise<void>`. Callers ignoring the promise are unaffected; tests can then `await hook.current.parseTeam(PASTE)` inside `act` and delete `vi.waitFor` entirely. This also creates the hook point F6 needs for error handling.

---

## Findings

### F1a — MEDIUM — `70c4633`: the 30-day draft TTL is refreshed by merely *visiting*, not by editing
`src/hooks/useTeamReport.ts:98` writes `STORAGE_SAVED_AT_KEY = Date.now()` on **every** persist-effect run, and the restore path (`src/hooks/useHomePage.ts:403-408`) calls `setPaste(stored); parseTeam(stored)` — which produces a `parsedTeam`, which fires the persist effect, which stamps a fresh timestamp. So opening the homepage renews the TTL.

The TTL is therefore "30 days since the last *visit*", not since the last *save*, and it never expires for a regular user. That directly undercuts the commit's own stated rationale (`useTeamReport.ts:25-27`): *"a publish from another device/browser can't flip this device's marker, so age is the only bound on how long such a team keeps resurfacing as a draft."* For the exact user this was written for, the bound never fires.

**Fix:** only stamp `savedAt` when the stored paste actually changes — in the persist effect, read the current `STORAGE_KEY` first and skip the timestamp write when it already equals `paste`. **NEW.**

### F1b — LOW — `markPastePublished` snapshots the wrong paste when the user edits during publish
`src/hooks/useTeamReport.ts:151-161` snapshots `localStorage.getItem(STORAGE_KEY)` at the moment the publish *response* lands, not the paste that was sent. If the user types while the request is in flight, the *edit* becomes the "published" snapshot, so `readRestorableDraft` evicts that exact draft on the next visit even though the server never received it. Narrow (any further keystroke restores restorability) but avoidable: pass the published paste in as an argument — `useHomePage.ts:331` has it via the share state. **NEW.**

### F2 — HIGH — `0024679`: three malformed Tailwind classes silently void the commit's own 44px fix
`src/components/report/SpeedTierChart.tsx:132`, `:482`, `:500` — still present at HEAD:

```
min-h-11text-[10px]     (line 132)
min-h-11text-xs         (lines 482, 500)
```

A missing space. Tailwind emits **neither** class, so:
- the advertised change ("speed-chart modifier pills and overlay toggles now meet the 44px touch minimum") **did not ship** on the speed chart, and
- the pills also **lost their font-size class**, so they now render at the inherited size — an unintended visual regression on the report's most-viewed chart.

Verified by `grep -rn "min-h-11text" src/` → 3 hits, all in this file, no others repo-wide. **Fix:** insert the space in all three. This is a one-line fix that should not wait for a ticket. `ui-checklist-reviewer` did not catch it. **NEW.**

### F3 — HIGH — `82f9210`: the explore cursor `date_trunc` change does not fix the bug and adds duplicates
`src/app/api/explore/route.ts:193`, `:207`, `:222-225`.

Cursors are serialized from a JS `Date` → `toISOString()` → **millisecond** precision (`route.ts:334-338`, `src/lib/explore/chronological-cursor.ts:20-23`), while `s.created_at` is a `timestamptz` with **microsecond** precision. The commit truncates the *column* to milliseconds in the `WHERE` clause but leaves `ORDER BY` on the untruncated column.

With cursor row at `10:00:00.123456` (cursor value `…123`):
- a row at `.123100` sorts **after** the cursor row (belongs on page 2) but fails `date_trunc('ms', …) < '…123'` → **still skipped**, which is the very bug the commit claims to fix;
- in the composite form `(date_trunc('ms', col), s.id) < (ts, id)`, a row at `.123900` with a smaller `id` was already returned on page 1 yet passes the filter → **returned again as a duplicate**.

Filter expression and sort expression must agree; here they don't. Additionally, wrapping `created_at` in `date_trunc` makes any btree index on it unusable → sequential scan on the hottest read path, on the Neon free tier.

**Correct fix:** carry full precision in the cursor — select `created_at` as text from PG (`s.created_at::text`) and compare untruncated — and drop the `date_trunc` wrappers. Failing that, use the identical truncated expression in `ORDER BY` *and* add an expression index. **No test exists for explore pagination at all** (`find src -path "*__tests__*" -name "*explore*"` → nothing), which is why this shipped. **NEW.**

### F4 — MEDIUM-HIGH — `6cec919`: `ChunkErrorReloader` is now itself behind a lazy chunk
`src/components/ui/DeferredLayoutExtras.tsx:11-14` loads `ChunkErrorReloader` via `dynamic(..., { ssr: false })`. That component exists **solely** to detect `ChunkLoadError` / "Failed to fetch dynamically imported module" and reload once after a deploy invalidates chunk names (`src/components/ui/ChunkErrorReloader.tsx:22-62`). It is now delivered by the exact mechanism it is meant to protect: when chunks 404, its own chunk can 404 too and the listener never mounts.

The component is a handful of lines with no dependencies — the bundle saving is negligible and the reliability cost is real. **Fix:** keep `ChunkErrorReloader` (and arguably `ServiceWorkerRegistration`) statically imported in `layout.tsx`; leave `InstallPrompt`/`ConnectivityStatus` deferred. **NEW.**

### F5 — MEDIUM — `6cec919`: `ClarityProvider` loses a consent withdrawal that races the SDK import
`src/components/providers/ClarityProvider.tsx`:

```ts
const start = async () => {
  if (started) return;
  started = true;                                   // set BEFORE the await
  const { default: Clarity } = await import("@microsoft/clarity");
  clarity = Clarity;
  Clarity.init(id);
  Clarity.consent(true);                            // runs even if consent was revoked meanwhile
};
…
else if (started) clarity?.consent(false);          // clarity is still null → silent no-op
```

If the user revokes analytics consent while the SDK import is in flight, the revocation path optional-chains into a no-op and the resolved import then initialises Clarity **with `consent(true)`**. Given the app ships a cookie banner, that is a consent-compliance bug, not just a nit.

Second issue: `void start()` has no `.catch`. A failed SDK load becomes an unhandled rejection whose message ("Failed to fetch dynamically imported module") **matches `ChunkErrorReloader`'s patterns** (`ChunkErrorReloader.tsx:5-11`) → a spurious full-page reload caused by an analytics script.

**Fix:** a `revoked` flag checked after the `await` before `init`, and `.catch(() => { started = false; })` on both call sites. **NEW.**

### F6 — MEDIUM — `415a281`: every new async boundary swallows its error, with no loading state
Five `void import(...)` sites added with no `.catch` and no user-visible failure or pending state:

| File:line | Consequence if the chunk fails |
|---|---|
| `src/hooks/useTeamReport.ts:110-114` (`parseTeam`) | **Clicking Analyze does nothing at all, silently.** Before this commit parsing was synchronous and could not fail. |
| `src/hooks/useTeamReport.ts:123` (analysis effect) | Report never appears; no error |
| `src/hooks/useHomePage.ts:673-679` (archetype detect) | `archetypeDetected.current = true` is set **before** the import resolves → auto-detect permanently disabled for the session, no retry |
| `src/hooks/useHomePage.ts:698-706` (regulation detect) | Same; regulation tag silently never set |
| `src/app/page.tsx` (`hasMegaCapable` effect) | Mega display pill silently never appears |

Compounding it: `handleAnalyze` (`src/hooks/useHomePage.ts:767-785`) has **no pending indicator**, so on a slow mobile connection the primary CTA is a dead button for the duration of a ~320KB chunk fetch. The guard-ref-before-await pattern is the reusable mistake here: set the ref inside the `.then`, or reset it in a `.catch`. **NEW.**

### F7 — MEDIUM-LOW — `6cec919`: dynamic-import layout shift and missing fallbacks
`src/app/page.tsx` — only `TeamReport` gets a `loading` fallback, and it is a fixed `h-64` skeleton for a component that renders many viewport-heights of content → a guaranteed CLS jump on every analyze. `TeamCardCTA`, `TournamentMode` and `SlideNavControls` have **no** fallback at all → pop-in. `SlideNavControls` is the sticky bottom nav, so its late arrival shifts the report body. Give the skeleton a realistic min-height and add fallbacks (or `min-h` placeholders) for the other three. **NEW.**

### F8 — LOW — `82f9210` fixed six bugs and shipped three tests
CLAUDE.md: *"regressions get a test that names the bug."* Covered: regulation signals, `extractSpecies`, champions legality. **Not covered:**
- Booster Energy case-insensitivity (`src/lib/analysis/item-boosts.ts:36`) — `src/lib/analysis/__tests__/item-boosts.test.ts` **already exists** and was not touched.
- `www.pokepast.es` acceptance (`src/lib/utils/pokepaste.ts:1`, `src/app/api/pokepaste/route.ts:16`) — no test file exists at all.
- explore `tsquery` hyphen split and the cursor change (`src/app/api/explore/route.ts:83`, `:193-225`) — untested; see F3 for what that cost.
- `CalcInput` `vs`-without-period detection (`src/components/report/CalcInput.tsx:56-58`). **NEW.**

### F9 — LOW — new lib module without a sibling test
`src/lib/analysis/analyze-team.ts` (new in `415a281`) has no `__tests__` sibling, against the CLAUDE.md convention. It is thin (a re-export plus `analyzeTeam`), and `homepage-eager-imports.test.ts` is a good tripwire for the *bundling* contract, but `analyzeTeam` itself — which maps every Pokémon through `lookupPokemon` + `calculateAllStats` + `getItemStatBoost`, including the `data === null` zero-stats fallback — is untested at this seam. **NEW.**

### F10 — INFO — `ponytail:` markers are untracked debt that no TODO sweep sees
Two added in this range — `src/hooks/useTeamReport.ts:25` (the TTL caveat that F1a shows is not actually enforced) and `src/app/api/webhooks/linear/route.ts:66` (no delivery-id dedupe inside the replay window) — plus one pre-existing at `src/lib/data/type-chart.ts:189`. These are the project's de facto TODOs, but they are invisible to a `TODO|FIXME|HACK|XXX` grep, which is why the 2026-08-10 C5 report could report "zero in-code TODO debt". Either adopt `TODO(ticket):` or add `ponytail:` to whatever sweep CI runs. **NEW.**

### F11 — INFO — `6cec919`: the sprite preconnect is probably not paying off
`src/app/layout.tsx` adds `<link rel="preconnect" href="https://play.pokemonshowdown.com" crossOrigin="" />`, but sprites are plain `<img>` elements with no `crossorigin` attribute. A crossorigin preconnect warms the CORS connection pool; the anonymous image request then opens a *second* connection. Drop `crossOrigin` from the link (or add `crossOrigin` to the sprite images) so the warmed socket is actually reused. **NEW.**

### F12 — INFO — `9897389`: exit flush still gambles on the 64KiB keepalive cap
`src/hooks/useAutoDraft.ts:91` — the in-session fix is correct and the test was properly re-pointed from the buggy behaviour to the intended one. The `pagehide`/`visibilitychange` flush still sets `keepalive: true` with an unbounded body, so the large-report case that VGC-267 was filed for still throws on exit. A size check with a `navigator.sendBeacon` (or plain fetch) fallback would close it. **KNOWN** — this is prior C5 finding F6 (`c5-commit-review-10-08-26.md:170`), fixed for the main path by this commit; only the exit-flush residue remains.

### Flaky test — status
**KNOWN as a symptom** (`.swarm/run-meta.md`, baseline gate: *"First run showed 1 failure in the draft-restore localStorage test — flaky (`vi.waitFor` race)… Ticket filed"*). **NEW as a diagnosis:** this report supplies the measurement, the root cause, and the exact fix.

---

## Checks that came back clean

| Check (range `0f73ba3^..70c4633`) | Result |
|---|---|
| `TODO` / `FIXME` / `HACK` / `XXX` added | 0 (but see F10 — `ponytail:` ×2) |
| `as any` added | 0 |
| `@ts-ignore` / `@ts-expect-error` added | 0 |
| `console.log` / `debugger` added | 0 |
| Commented-out code left behind | 0 |
| `eslint-disable` added | 1 — `src/hooks/useExploreUrlSync.ts:138`, justified (`useCallback` over a factory-produced function), scoped with a matching `eslint-enable`, and documented with the render-loop it fixed. Acceptable. |
| `useEffect` dependency bugs | None found. `mergeTags` (`src/hooks/useTeamMeta.ts:187-192`) is the *correct* fix for two async detectors resolving from one `tags` snapshot; `hasMegaCapable` and the analysis effect both carry proper `cancelled` guards. |
| Full suite | 417/417 pass; `transform 4.99s`, total 10.84s |

Work in the range worth calling out as good: `a099f97` (replay window + dropping `Allow-Credentials`, with the test rewritten to pin the new contract), `b865fa2` / `no-raw-forwarded-for.test.ts` (architectural tripwire), `homepage-eager-imports.test.ts` (bundling tripwire with an honest comment about being file-level, not graph-level), `useTeamMeta.mergeTags`, and `70c4633`'s regression tests, which do name each case exactly as CLAUDE.md asks.

---

## Suggested tickets

| Priority | Title |
|---|---|
| P1 | Explore cursor pagination still drops and now duplicates rows — `date_trunc` filter disagrees with `ORDER BY` (F3) |
| P1 | Speed chart: `min-h-11text-*` typo voided the 44px touch fix and dropped the font size (F2) — one-line fix |
| P2 | `ChunkErrorReloader` must not be lazy-loaded — it can't recover from the failure it exists for (F4) |
| P2 | Clarity consent revocation lost when it races the SDK import; add `.catch` (F5) |
| P2 | Lazy analyze-team chunk has no error path and no loading state — Analyze silently does nothing on chunk failure (F6) |
| P2 | Draft TTL renews on every visit, so it never expires (F1a) |
| P3 | De-flake `useTeamReport.test.ts` — warm the analyze-team chunk in `beforeAll` (see diagnosis above) |
| P3 | Dynamic-import CLS: realistic skeleton for `TeamReport`, fallbacks for the other three (F7) |
| P3 | Backfill the four missing regression tests from `82f9210` (F8) + test `analyzeTeam` (F9) |
| P4 | `markPastePublished` should take the published paste as an argument (F1b) |
| P4 | Make `ponytail:` markers visible to the TODO sweep (F10); fix the sprite preconnect `crossOrigin` mismatch (F11); exit-flush keepalive size guard (F12) |

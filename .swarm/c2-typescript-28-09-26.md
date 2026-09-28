# C2 — TypeScript Strictness Audit (2026-09-28)

Read-only audit. Repo at `/home/user/VGC-Team-Report`, HEAD `70c4633`, TypeScript 5.9.3.
Conflict risk determined against `.swarm/open-pr-conflict-risk.md` (a `<count> <path>` list of files
touched by the 7 open unmerged PRs; a file absent from that list is zero-conflict).

---

## 0. Headline

The codebase is far cleaner than a typical "strictness audit" target:

| Unsoundness class | Count in `src/` (non-test) |
|---|---|
| `any` in type position (`: any`, `as any`, `any[]`, `Promise<any>`, `<any>`) | **0** |
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | **0** |
| `eslint-disable … no-explicit-any` | **0** |
| `as unknown as` (double casts) | 5 (+1 in a test) |
| Non-null assertions (`!`) | 13 (excluding GraphQL template strings + `process.env.X!`) |
| Exported functions in `src/lib/parser`, `src/lib/analysis`, `src/lib/validation` missing a return type | **0** |

Cold baseline `tsc --noEmit --incremental false` = **0 errors**, so the pre-commit gate is honest today.

Of the 13 non-null assertions and ~25 `as` casts I traced, **all but two are provably guarded**
immediately above the use site. The genuinely load-bearing unsoundness is concentrated in one place:
the undo/redo snapshot pipeline (Finding 1).

---

## 1. Strict flag measurements

Every flag measured individually against the full program with
`node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false --<flag>`
and error lines counted with `grep -cE "error TS[0-9]+"`.

| Flag | Errors | Verdict |
|---|---:|---|
| *(baseline, current tsconfig)* | **0** | config is clean cold |
| `verbatimModuleSyntax` | **0** | free (diagnostics), but changes **emit** — see below |
| `erasableSyntaxOnly` | **0** | **free — enable** |
| `useDefineForClassFields` | **0** | free (diagnostics) but changes **emit** — see below |
| `noImplicitOverride` *(already on)* | 0 | still clean |
| `noFallthroughCasesInSwitch` *(already on)* | 0 | still clean |
| `noUncheckedSideEffectImports` *(already on)* | 0 | still clean |
| `allowUnreachableCode: false` *(already on)* | 0 | still clean |
| `allowUnusedLabels: false` *(already on)* | 0 | still clean |
| `noImplicitReturns` | 2 | near-free (2-line fix) |
| `isolatedDeclarations` | 2 | **N/A** — both are config errors (TS5069/TS5053), not code |
| `noUnusedParameters` | 5 | cheap |
| `noUnusedLocals` | 22 | cheap, and doubles as dead-code detection |
| `exactOptionalPropertyTypes` | 57 | only **3** in `src/lib` |
| `noUncheckedIndexedAccess` | 323 | only **32** in `src/lib` |
| `noPropertyAccessFromIndexSignature` | 649 | mostly `process.env.X` in `src/app` — not worth it |

### Combined-run check (flags can interact)

```
tsc --noEmit --incremental false \
  --verbatimModuleSyntax --erasableSyntaxOnly --useDefineForClassFields \
  --noImplicitOverride --noFallthroughCasesInSwitch --noUncheckedSideEffectImports \
  --allowUnreachableCode false --allowUnusedLabels false
→ 0 errors
```

So the zero-error set is zero-error *together*, not just individually.

### Genuinely free to enable right now

- **`erasableSyntaxOnly` — 0 errors, diagnostics only, no emit change.** The one unambiguous win.
  It permanently forbids `enum`, parameter properties and namespaces, which is exactly the
  invariant this codebase already keeps by hand.

### Zero errors but NOT free (do not batch these)

- **`verbatimModuleSyntax` (0)** — the existing tsconfig comment already calls this out correctly.
  It changes import elision in emit, so it needs its own commit behind a real `next build`.
  My measurement confirms the diagnostic count is still 0; it does not clear the emit risk.
- **`useDefineForClassFields` (0)** — 0 errors is misleading. With `target: ES2017` the default is
  `false`, and flipping it changes class-field **semantics** (`[[Define]]` vs `[[Set]]`), which no
  type-checker error will surface. There are no meaningful classes in `src/`, so the upside is nil
  and the risk is non-zero. **Recommend leaving off.**

### Cheap next tier (if someone wants a follow-up ticket)

- `noImplicitReturns` — **2 errors**, both real code smells:
  - `src/components/ui/NotificationBell.tsx:78` — TS7030 Not all code paths return a value. `CONFLICT-RISK: no`
  - `src/hooks/useShareUrl.ts:137` — TS7030 Not all code paths return a value. `CONFLICT-RISK: no`
  Both are almost certainly `useEffect` callbacks returning a cleanup on one branch only — which is
  a genuine React bug class (the cleanup silently doesn't run on the other branch). Worth a look
  independent of the flag.
- `noUnusedParameters` — 5 errors, all in `.tsx` component props.
- `noUnusedLocals` — 22 errors, and it found real dead code, including
  `src/lib/sharing/url-codec.ts:77 toBase64Url` (a dead export) and
  `src/lib/discord-bot.ts:50 PRIORITY_LABELS`. Hand these to the dead-code agent rather than
  suppressing them.

### Not worth enabling

- `noUncheckedIndexedAccess` (323): I read every one of the 32 `src/lib` hits. They are dominated by
  patterns TypeScript cannot narrow but which are safe by construction —
  regex capture groups after an `if (match)` guard, `String.split(...)[0]` (always defined), and
  `PALETTES[Math.floor(Math.random() * PALETTES.length)]` (6 hits in `random-accent.ts` alone).
  Enabling it means ~323 `!` or `?? fallback` insertions, i.e. trading a compiler warning for
  *more* non-null assertions. Net negative for soundness.
- `noPropertyAccessFromIndexSignature` (649): 510 of these are in `src/app`, overwhelmingly
  `process.env.FOO` dot-access. Pure churn.
- `isolatedDeclarations`: inapplicable. It errors on the config itself
  (`TS5069` needs `declaration`/`composite`; `TS5053` conflicts with `allowJs`). This is an
  app, not a published library — correctly N/A.

### VGC-261 verification

**The claim still holds, and it is actually a 5-flag claim, not 4.**

I could not read the Linear ticket directly — the Linear MCP server is unauthenticated in this
container, so this is verified against the in-repo record instead. The `tsconfig.json` comment
attributes five flags to VGC-261 and dates the measurement 2026-08-10:

```
noImplicitOverride, noFallthroughCasesInSwitch, noUncheckedSideEffectImports,
allowUnreachableCode: false, allowUnusedLabels: false
```

All five are currently **enabled** and the cold baseline is **0 errors**, which proves them clean in
combination — a stronger result than the per-flag measurement the ticket recorded. I also
re-measured `allowUnreachableCode: false` and `allowUnusedLabels: false` individually (0 each).
VGC-261's side note that `verbatimModuleSyntax` also measures 0 but was deliberately held back for
emit reasons is **also still accurate**. Nothing has regressed in the ~7 weeks since.

If the ticket body says "4 flags", the likely discrepancy is that it counts
`allowUnreachableCode`/`allowUnusedLabels` as one item (they are the two `allow*: false` pair) or
omits one — worth a one-line correction on the ticket, but the substance is sound.

---

## 2. Findings — zero-conflict first

### Finding 1 — `useUndoRedo`'s public type lies about its own payload (the real one)

- **Files:** `src/hooks/useUndoRedo.ts:7` (type), `src/hooks/useHomePage.ts:192`, `:208-217`, `:228`, `:232`
- **CONFLICT-RISK:** `useUndoRedo.ts` **no** · `useHomePage.ts` **yes** (3 open PRs)
- **Unsoundness:** two `as` casts plus a bypassed excess-property check, in both directions.

`useUndoRedo` declares a 5-field contract:

```ts
export interface UndoRedoSnapshot {
  notes: Record<string, string>;
  calcs: Record<string, CalcEntry[]>;
  roles: Record<string, string>;
  summary: string;
  plans: MatchupPlan[];
}
```

`useHomePage` actually pushes **seven** fields — it adds `meta` (11 sub-fields: `commonModes`,
`teamName`, `tournamentName`, `placement`, `record`, `mvpIndex`, `rentalCode`, `creatorName`,
`tags`, `templateId`, `privateFields`) and `hiddenSlides`. That extra payload gets through
`pushSnapshot(snapshot: UndoRedoSnapshot)` only because `snapshot` is a **variable, not a fresh
object literal** (line 208 → 217), so TypeScript's excess-property check does not fire. On the way
back out, `undo()` is typed `UndoRedoSnapshot | null` and is cast up:

```ts
restoreSnapshot(undoRedo.undo() as FullUndoSnapshot | null);   // :228
restoreSnapshot(undoRedo.redo() as FullUndoSnapshot | null);   // :232
```

- **Can it produce a runtime bug?** Not today — the round-trip is correct at runtime and
  `restoreSnapshot` is defensively written (`...(snapshot.meta ?? {})`,
  `if (Array.isArray(snapshot.hiddenSlides))`). The design is deliberate and commented
  (lines 185-191, "Finding 4.6").
  **But the cast is precisely what disables the compiler's ability to catch the next regression,
  and the failure mode is silent user data loss.** Concretely: add a 12th editable meta field
  (say `matchupSheetNotes`) to `buildShareState` and to `setMetaFull`'s parameter, and forget to add
  it to the literal at line 211-214. `FullUndoSnapshot` widens automatically (it is
  `Parameters<typeof setMetaFull>[0]`), no error is raised anywhere, and then the first Ctrl+Z after
  editing that field calls `setMetaFull` with it `undefined` — **wiping the user's text instead of
  reverting one step**. This class of bug has already bitten this exact code once, which is what
  "Finding 4.6" in the comment refers to.
- **Suggested fix:** make the hook generic and delete both casts, so the snapshot type is checked
  end to end:
  ```ts
  // useUndoRedo.ts
  export function useUndoRedo<S>() {
    const historyRef = useRef<S[]>([]);
    const pushSnapshot = useCallback((snapshot: S) => { … }, []);
    const undo = useCallback((): S | null => { … }, []);
    const redo = useCallback((): S | null => { … }, []);
  }
  // useHomePage.ts
  const undoRedo = useUndoRedo<FullUndoSnapshot>();
  restoreSnapshot(undoRedo.undo());   // cast gone
  restoreSnapshot(undoRedo.redo());   // cast gone
  ```
  Keep `UndoRedoSnapshot` exported as the default/base shape for the existing test.
- **Diff size:** ~8 lines in `useUndoRedo.ts` (+ 1 in its test if it names the type), 3 in
  `useHomePage.ts`. Small, but `useHomePage.ts` is contended — land it after the 3 open PRs, or
  do the `useUndoRedo.ts` half now (it is zero-conflict and backwards-compatible on its own,
  since `useUndoRedo<UndoRedoSnapshot>()` is the old behaviour).

### Finding 2 — Cypress specs get zero type checking

- **File:** `tsconfig.json:60` — `"exclude": ["node_modules", "cypress"]`
- **CONFLICT-RISK:** **yes** (1 open PR touches `tsconfig.json`)
- **Unsoundness:** 9 TypeScript files under `cypress/` (`cypress/e2e/*.cy.ts`,
  `cypress/support/e2e.ts`) are excluded from the program, so `npm run typecheck` and CI never see
  them. They are also outside `eslint.config.mjs`'s effective surface for TS rules.
- **Can it produce a runtime bug?** Not in production — Cypress specs never ship. The real cost is
  that E2E specs silently rot against `src/` refactors and only fail at `cypress run` time, which
  CI deliberately does not run. Given the project's stated reliance on the type gate, this is the
  largest *coverage* gap in the strictness story even though it produces no findings of its own.
- **Suggested fix:** add a second `tsconfig.cypress.json` (`extends: "./tsconfig.json"`,
  `include: ["cypress/**/*.ts"]`, `types: ["cypress"]`) and a `typecheck:cypress` script; leave the
  root config's `exclude` alone so `next build` is unaffected. Do **not** simply delete `"cypress"`
  from `exclude` — Cypress globals would flood the main program.
- **Diff size:** 1 new 8-line file + 1 script line. But `tsconfig.json` is contended; the new file
  is zero-conflict, so add the file and the script and touch `tsconfig.json` not at all.

### Finding 3 — `cacheGet<T>` is an unchecked cast whenever the schema is omitted

- **File:** `src/lib/cache.ts:29` — `export async function cacheGet<T>(key: string, schema?: ZodType<T>): Promise<T | null>`
- **CONFLICT-RISK:** **no**
- **Unsoundness:** `if (!schema) return raw as T;` — the generic is a naked assertion over whatever
  Redis returns. This is *documented* (the JSDoc says so verbatim and cites VGC-146), and the Zod
  path exists. The problem is adoption: of 6 production call sites, **none passes a schema**:
  - `src/app/api/champions/meta/route.ts:31` — `cacheGet<ChampionsMetaResult>(CACHE_KEY)` ← the one that matters
  - `src/app/api/explore/route.ts:45` — `cacheGet<{ reports: unknown[]; nextCursor: string | null }>(…)`
  - `src/app/api/share/[id]/route.ts:207` — `cacheGet<Record<string, unknown>>(…)`
  - `src/app/api/spotlight/route.ts:19` — `cacheGet<{ spotlight: unknown }>(…)`
  - `src/app/api/creator/[name]/route.ts:35` — `cacheGet<unknown>(…)` (honest)
  - `src/app/api/user/export/route.ts:15` — `cacheGet<string>(rateKey)` (rate-limit stamp)
- **Can it produce a runtime bug?** Yes, on a deploy that changes a cached shape while Redis still
  holds the old one. Concrete failing input: TTL for `champions:meta` is long-lived and the key is
  stable; ship a rename of `ChampionsMetaResult.topSpecies` → `.species`, and for the remaining TTL
  every request to `/api/champions/meta` serves the **old** shape typed as the new one. The consumer
  `src/components/champions/MetaSnapshot.tsx:38` then reads `undefined` and renders an empty meta
  snapshot (or throws on `.map`). Same class for `explore`. The other three are already
  `unknown`-ish and low risk.
- **Suggested fix:** don't change `cacheGet`. Pass the schema at the two typed call sites
  (`champions/meta`, `explore`). Better still, change the signature to make `schema` required and
  add an explicit `cacheGetUnchecked` for the rate-limit-stamp case, so the unsound path has to be
  named. `zod` is already a dependency.
- **Diff size:** ~2 schema literals + 2 call-site args (~15 lines) for the minimal version;
  ~25 lines for the required-schema version.

### Finding 4 — `{} as Record<AllKeys, V>` — three "lying empty object" builders

- **Files:**
  - `src/lib/data/type-chart.ts:225` — `const profile = {} as Record<PokemonType, number>;` · `CONFLICT-RISK: yes` (1 PR)
  - `src/components/report/OffensiveCoverageChart.tsx:71` — `const profile = {} as Record<PokemonType, MoveCoverageResult>;` · `CONFLICT-RISK: yes` (1 PR)
  - `src/app/tools/ev-to-sp/EvToSpConverter.tsx:40` — `const next = {} as Rows;` · `CONFLICT-RISK: no`
- **Unsoundness:** each asserts a fully-populated map before populating it. The type is false for
  the whole body of the function.
- **Can it produce a runtime bug?** Not currently. In all three the very next statement is a
  `for` loop over a local, exhaustive key list (`allTypes` — 18 hardcoded entries in
  `type-chart.ts:216-220`; `ALL_TYPES`; `STATS`), so every key is filled before return. The risk is
  drift: `type-chart.ts` hardcodes its own 18-element `allTypes` array *inside*
  `getDefensiveProfile` rather than deriving it from `PokemonType`. Add a 19th type to
  `PokemonType` (a Stellar-type change is plausible for a future reg) and `getDefensiveProfile`
  returns a map missing that key, still typed as complete — and `getEffectiveness`'s
  `?? 1` means the chart silently shows neutral instead of erroring.
- **Suggested fix:** build via `Object.fromEntries` over a single exported exhaustive constant and
  let TS check completeness, or declare `const profile: Partial<Record<…>> = {}` and return
  `profile as Record<…>` once at the end (narrower lie). Best: export
  `export const ALL_POKEMON_TYPES = [...] as const satisfies readonly PokemonType[]` from
  `src/lib/types/pokemon.ts` and derive `PokemonType` from it, so a new type cannot be added
  without updating the array.
- **Diff size:** ~10 lines for the shared-constant version across `pokemon.ts` + `type-chart.ts`;
  2 lines each for the local `Partial` version.

### Finding 5 — `redis!` in a private helper with a single guarded caller

- **File:** `src/lib/rate-limit.ts:24` — `redis: redis!`
- **CONFLICT-RISK:** **yes** (2 open PRs)
- **Unsoundness:** `getUpstashLimiter` asserts module-level `redis` is non-null. Nothing in its own
  signature or body enforces that.
- **Can it produce a runtime bug?** Not today — its only caller,
  `isRateLimitedAsync` (`:73`), is inside `if (redis) { … }`. It is a latent trap: the guard and the
  assertion are 50 lines apart, and a second caller added without the `if (redis)` would construct
  `new Ratelimit({ redis: undefined })`. Because `isRateLimitedAsync` returns
  "should this be BLOCKED", a throw there fails **open** in any caller that wraps it in
  `try/catch` — i.e. rate limiting silently stops working rather than erroring loudly.
- **Suggested fix:** pass the client in — `function getUpstashLimiter(client: Redis, max: number, windowMs: number)`
  — and let the existing `if (redis)` narrowing supply it. Deletes the `!` with no behaviour change.
- **Diff size:** 3 lines. Contended file — piggyback on whichever open PR touches it.

### Finding 6 — `rawSubset as unknown as PackedDexSubset` (JSON import, unvalidated)

- **File:** `src/lib/data/dex-subset.ts:105`
- **CONFLICT-RISK:** **yes** (2 open PRs)
- **Unsoundness:** a double cast from `resolveJsonModule`'s inferred type to the packed tuple
  interface. Deliberate and commented ("Cast once here so the decoder below is the only place that
  touches raw tuples") — a reasonable containment strategy.
- **Related, and the sharper edge:** `decodeSpecies` trusts positional tuples, and
  `src/lib/data/pkmn-dex-fallback.ts:83` and `:139` then narrow `entry.types` into a
  `[T] | [T, T]` tuple:
  ```ts
  const types = entry.types as PokemonType[];
  const typesTuple: PokemonData["types"] = types.length >= 2 ? [types[0], types[1]] : [types[0]];
  ```
  If `types.length === 0`, this produces `[undefined]` typed as `[PokemonType]`. That is reachable
  in principle: `splitList("")` deliberately returns `[]` (dex-subset.ts:107-111), and the sibling
  `abilities` field already defends with `entry.abilities[0] ?? ""` at `:149` — the types path does not.
- **Can it produce a runtime bug?** **I checked, and no — today.** Direct inspection of
  `src/lib/data/dex-subset.json`: **1515 species rows, 0 with an empty types string** (1 row has
  empty abilities: `MissingNo.`). So the invariant holds. If it were ever violated, the symptom
  would be quiet rather than loud: `getEffectiveness` uses
  `TYPE_CHART[attackType]?.[defType] ?? 1` (`type-chart.ts:180`), so an `undefined` type yields a
  neutral 1× across the whole defensive chart — a wrong report, not a crash.
- **Suggested fix:** two options, cheapest first. (a) Add a vitest assertion beside the data that
  every row has a non-empty types string, pinning the invariant the cast assumes — this matches the
  repo's existing "hash the subset so a prune fails the suite" pattern at `dex-subset.ts:27`.
  (b) Also guard the narrow: `types.length === 0 → return null` from `getPokemonData`, mirroring the
  existing `baseStats` bail-out at `:74-79`.
- **Diff size:** ~8 lines for the test; ~3 lines for the guard.
- **Note:** `SCHEMA_VERSION = 2` is declared at `dex-subset.ts:101` but I found no code comparing it
  to `subset.schemaVersion`. Worth a grep by whoever owns this file — a version constant that is
  never checked is exactly the kind of thing the cast is supposed to be protected by.

### Finding 7 — `event.data as unknown as ClerkUserCreatedData` in the Clerk webhook

- **File:** `src/app/api/webhooks/clerk/route.ts:46`
- **CONFLICT-RISK:** **no**
- **Unsoundness:** discards Clerk's own discriminated union on `event` after the
  `event.type === "user.created"` check, replacing it with a hand-written interface.
- **Can it produce a runtime bug?** Low. The payload is signature-verified first
  (`verifyWebhook`, `:38`), so it is not attacker-controlled, and the access
  `data.email_addresses.find(…)` sits inside the `try` block at `:44`, so a shape change throws into
  a caught path rather than a 500. Realistic failure: Clerk renames or nests `email_addresses` in a
  future API version → welcome emails silently stop being sent and the only signal is a log line.
- **Suggested fix:** narrow off Clerk's union instead of casting — after
  `if (event.type === "user.created")`, `event.data` is already typed by `@clerk/nextjs`. If the
  SDK's type is genuinely too loose, validate with a small Zod object and log a distinct
  `clerk_webhook_shape_drift` warning on failure so the silent-stop mode becomes visible.
- **Diff size:** ~10 lines.

### Finding 8 — unvalidated `JSON.parse(…) as T` from `localStorage`

- **File:** `src/app/dashboard/notifications/NotificationsContent.tsx:48`
  — `const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;`
- **CONFLICT-RISK:** **yes** (1 open PR)
- **Unsoundness:** asserts a shape over arbitrary parsed JSON, then spreads it over defaults:
  `setPrefs({ ...DEFAULT_PREFS, ...parsed })`.
- **Can it produce a runtime bug?** Minor and self-inflicted-only (the value is the viewer's own
  browser storage, not a shared channel). Concrete failing input: a stale key from an earlier schema
  holding `{"emailOnComment": "yes"}` puts a string where a boolean is expected, so a `<Toggle>`
  renders checked-but-unsaveable; `JSON.parse("[1,2,3]")` spreads array indices as prefs keys. The
  whole block is in `try/catch` with a defaults fallback, so nothing crashes.
- **Suggested fix:** the repo already has the tool — `zod`. `NotificationPrefsSchema.partial().safeParse(raw)`
  and fall back to `DEFAULT_PREFS` on failure. Same pattern `url-codec.ts` already adopted for share URLs.
- **Diff size:** ~8 lines.

---

## 3. Verified-safe (checked, no action needed)

I traced each of these to its guard; recording them so the next audit doesn't re-litigate them.

| Site | Why it's sound |
|---|---|
| `src/components/report/TeamStats.tsx:32` `p.data!.baseStats` | preceded by `.filter((p) => p.data?.baseStats)`; TS can't narrow across `filter` without a type predicate |
| `src/components/report/MatchupPlanSlide.tsx:277` `mon.calculatedStats![stat]` | inside the `mon.hasEvs && mon.calculatedStats ? …` ternary |
| `src/components/report/SpeedTierChart.tsx:192` `mon.itemBoost!.multiplier` | guarded by `hasSpeedBoost = mon.itemBoost?.stat === "spe"` |
| `src/components/report/SpeedTierChart.tsx:21` `.get(baseKey)!.push(…)` | preceded by `if (!map.has(baseKey)) map.set(baseKey, [])` |
| `src/app/api/sync/[id]/route.ts:26` `presence.get(shareId)!.set(…)` | same has/set-then-get pattern |
| `src/components/explore/ReportCard.tsx:237` `report.creatorName!` | inside `{report.creatorName && (…)}`; the `!` is redundant, not unsound |
| `src/components/explore/ReportCard.tsx:297` `report.tags!.eventType` | guarded by `hasTagsSection = !!report.tags?.eventType` |
| `src/components/ui/LanguageSelector.tsx:12` `LANGUAGES.find(…)!` | `LanguageCode` is **derived** from `LANGUAGES` (`(typeof LANGUAGES)[number]["code"]`), so the find cannot miss |
| `src/lib/analysis/stat-calculator.ts:180` `groups.get(key)!` | `key` comes from `[...groups.keys()]` |
| `src/lib/utils/diff-state.ts:117` `normalize(newPlans[i])` | `if (oldPlans.length !== newPlans.length) return true;` is the first line of the function |
| `src/lib/parser/showdown-parser.ts:71` `firstLine.split(…)` | `parsePokemonBlock` returns an `"Unknown"` stub when `lines.length === 0` (`:41-58`), and callers pre-`filter(Boolean)` the blocks |
| `src/hooks/useExploreUrlSync.ts:55-56` `params.get("sort") as …` | each cast is immediately validated by an `includes([...])` allow-list on the next lines — a good pattern, cast is just for ergonomics |
| `src/lib/i18n/index.ts:53` `localStorage.getItem(…) as LanguageCode \| null` | validated by `if (saved && translationLoaders[saved])` |
| `src/lib/i18n/index.ts:84-86` Proxy `as unknown as Record` / `as TranslationKeys` | keys are constrained by `TranslationKeys`, and `en` is the exhaustive source of that type |
| `src/lib/data/type-chart.ts:225` populate loop | 18 hardcoded types cover `PokemonType` exactly *today* — see Finding 4 for the drift risk |
| `src/lib/db.ts:4` `process.env.DATABASE_URL!` | conventional for this codebase; failure is a loud connection error at first query, and there is nothing useful to do without a DB |

### Dead cast worth deleting

`src/lib/sharing/url-codec.ts:77` `toBase64Url` is unused (flagged by `noUnusedLocals`) and contains
the only `bytes[i]` indexed-access hit in that file. Deleting the function removes a finding rather
than fixing it. `CONFLICT-RISK: yes` (1 PR touches `url-codec.ts`). Hand to the dead-code agent.

### Two stale casts

`src/components/report/CommonModesSlide.tsx:108` and `src/hooks/useSlideSystem.ts:56` both do
`(t as unknown as Record<string, string | undefined>).commonModesTitle ?? "…"`. But
`commonModesTitle` **is** present in all 7 translation files including `en.ts:196`, so it is a real
member of `TranslationKeys` and the double cast is unnecessary — a leftover from before the key was
added. Removing both casts restores type checking on that lookup (and would catch a future typo in
the key name, which the cast currently swallows into the `?? "Common Modes"` fallback).
`CONFLICT-RISK: CommonModesSlide.tsx` **no** · `useSlideSystem.ts` **no**. Diff: 2 lines. This is the
cheapest genuine soundness win in the report after Finding 1.

---

## 4. Exported-function return types

Measured with the TypeScript compiler API rather than grep (multi-line signatures carry the
annotation on the closing line, which grep gets wrong). Script:
`/tmp/claude-0/-home-user-VGC-Team-Report/09fc8c17-cec1-578d-87a6-7e5f487ab5b3/scratchpad/ts/rt.mjs`

**270** exported functions across `src/` lack an explicit return type — but the distribution is what
matters:

- **`src/lib/parser`, `src/lib/analysis`, `src/lib/validation`, `src/lib/data`, `src/lib/utils`,
  `src/lib/sharing`, `src/lib/security`: 0 missing.** The correctness-critical core is 100%
  annotated. The discipline holds exactly where the audit brief said to look.
- The 270 are almost entirely React components (`function PokemonCard(…)`), Next.js route handlers
  (`export async function GET`), page/layout/`opengraph-image` exports, and hooks — where the
  inferred type (`JSX.Element`, `Promise<NextResponse>`, a large hook object) is both correct and
  more maintainable than a hand-written annotation. Annotating these would be churn.
- Only **10** are in `src/lib` at all, and all are I/O side-effect functions where the return is
  incidental: `src/lib/email.ts:32,79,181,321`, `src/lib/notifications.ts:9,30`,
  `src/lib/posthog-server.ts:31`, `src/lib/discord-bot.ts:60`, `src/lib/i18n/index.ts:47,97`.
  `CONFLICT-RISK: no` for `email.ts`, `notifications.ts`, `discord-bot.ts`(2 PRs → **yes**),
  `posthog-server.ts` **yes** (1 PR), `i18n/index.ts` **yes** (1 PR).

**Recommendation: no action.** Adding `: Promise<void>` to four email helpers is not worth a commit,
and there is no ESLint rule enforcing this today (`eslint.config.mjs` is stock
`next/core-web-vitals` + `next/typescript` with no custom TS rules). If the team wants the invariant
enforced going forward, `@typescript-eslint/explicit-module-boundary-types` scoped to
`src/lib/{parser,analysis,validation}/**` would lock in the part that is already clean, at zero
current cost.

---

## 5. Unsound generics

Only **one** generic is declared in all of `src/lib`:
`src/lib/cache.ts:29 cacheGet<T>` — covered as Finding 3.
Plus the non-generic-but-should-be `useUndoRedo` — Finding 1.

That's the whole surface. There is no generics problem here beyond those two.

---

## 6. Recommended ticket split

Ranked by (real risk × low conflict):

1. **Make `useUndoRedo` generic** (Finding 1) — the only finding whose failure mode is silent user
   data loss. Do the `src/hooks/useUndoRedo.ts` half now (zero-conflict, backwards-compatible);
   land the 3-line `useHomePage.ts` change after the open PRs clear.
2. **Delete the two stale `t as unknown as Record<…>` casts** (§3) — 2 lines, zero conflict,
   restores real type checking on a translation lookup.
3. **Enable `erasableSyntaxOnly`** — 0 errors, diagnostics-only, 1 line. Blocked only by the open PR
   on `tsconfig.json`; sequence after it.
4. **Pass Zod schemas at the two typed `cacheGet` call sites** (Finding 3) — zero conflict on
   `champions/meta` and `explore`; prevents a shape-drift-on-deploy bug class.
5. **Fix the 2 `noImplicitReturns` errors** (`NotificationBell.tsx:78`, `useShareUrl.ts:137`) — both
   zero-conflict, both likely real `useEffect` cleanup bugs. Then enable the flag.
6. **Pin the dex-subset types invariant with a test** (Finding 6a) — 8 lines, and it guards a
   cast that three files depend on.
7. **`tsconfig.cypress.json`** (Finding 2) — closes the largest coverage gap without touching the
   contended root config.
8. Hand `noUnusedLocals`' 22 hits (incl. dead `toBase64Url`, `PRIORITY_LABELS`) to the dead-code
   agent rather than fixing them here.

**Do not** enable `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`,
`useDefineForClassFields`, or `isolatedDeclarations`. Rationale for each in §1.

---

## Appendix — reproduction

```bash
cd /home/user/VGC-Team-Report
TSC="node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false"

$TSC                                      # baseline → 0
$TSC --erasableSyntaxOnly                 # → 0
$TSC --verbatimModuleSyntax               # → 0  (emit-affecting; own commit)
$TSC --noImplicitReturns                  # → 2
$TSC --noUnusedParameters                 # → 5
$TSC --noUnusedLocals                     # → 22
$TSC --exactOptionalPropertyTypes         # → 57
$TSC --noUncheckedIndexedAccess           # → 323
$TSC --noPropertyAccessFromIndexSignature # → 649

# combined zero-error set (interaction check) → 0
$TSC --verbatimModuleSyntax --erasableSyntaxOnly --useDefineForClassFields \
     --noImplicitOverride --noFallthroughCasesInSwitch --noUncheckedSideEffectImports \
     --allowUnreachableCode false --allowUnusedLabels false
```

Per-flag error logs and the return-type script are in
`/tmp/claude-0/-home-user-VGC-Team-Report/09fc8c17-cec1-578d-87a6-7e5f487ab5b3/scratchpad/ts/`.

No repo file was modified, created or deleted other than this report. No git write commands were run.

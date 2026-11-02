# C2 — TypeScript soundness audit

- **Date:** 2026-11-02 · **Repo tip:** `10dfd74` (Merge claude-dev: VGC-230/231/233/235, PR #90)
- **TypeScript:** 5.9.3 · **Program:** 407 `.ts`/`.tsx` under `src/` (148 in `src/lib/`, 96 non-test)
- **Mode:** READ-ONLY. No source edits, no commits. The only write is this file. Repo `tsconfig.json` untouched; every flag count below came from a command-line flag override on the repo config, not a config edit.
- **Baseline gate (cold):** `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0, 0 errors.** Every count below is measured against a genuinely clean baseline.
- **Prior audit:** `.swarm/c2-typescript-26-10-26.md` (38 commits ago). See §5 for the delta.

---

## Headline

Still **zero `any` keywords** in the entire program — AST scan for `SyntaxKind.AnyKeyword` across 416 `.ts`/`.tsx`/`.d.ts` files in `src/` + `cypress/` returns 0. Zero `@ts-ignore`, zero `@ts-expect-error`, zero `@ts-nocheck`. `strict: true` plus the five VGC-261 flags. `champions-legality.ts` remains the cleanest file in the repo: no casts, no non-null assertions, explicit return types throughout.

**But the prior audit's "not one single `any`" headline measured the wrong thing.** `JSON.parse` and `Request.json()` are typed `any` by the TypeScript lib, so `any` enters this program at **25 production sites** with nothing to grep for — no `as`, no `: any`, no diagnostic. The worst one, HIGH-1 below, is a live network boundary feeding the collaborative report editor, and it is the single most dangerous unsound path in the codebase. It was not in the prior report because a cast-and-keyword grep cannot see it.

The structural story has otherwise improved. Last audit's DANGEROUS-1 (the MissingNo. render crash) and DANGEROUS-2 (`[undefined]` type tuple) are **genuinely fixed** — and fixed well, deriving the valid-type set from `TYPE_CHART`'s keys rather than a seventh hand-written copy. DANGEROUS-4 (share-fetch payload) is **half fixed**: the path into the viewer now validates, but the conflict-detection baseline on the line immediately above still takes the raw cast, and the repo's own test proves those two objects differ. DANGEROUS-3 and DANGEROUS-5 are untouched.

---

## 1. High blast radius (fix these)

### HIGH-1 — the SSE collaboration path puts a raw Postgres jsonb blob into `ShareableState` with no cast, no schema, and no migration · **NEW**
`conflict_risk: false` on every file involved.

Server side, the raw column is shipped as-is:

```
src/app/api/sync/[id]/route.ts:112   const data = dataRows[0].data as Record<string, unknown>;
src/app/api/sync/[id]/route.ts:114-116
      send("version", {
        version: knownVersion,
        state: data,
```

Client side, it is parsed into `any` and destructured straight into typed slots:

```
src/hooks/useCollaborativeSync.ts:93    const { version, state } = JSON.parse(e.data);
src/hooks/useCollaborativeSync.ts:99    if (!pendingRemote.current || version > pendingRemote.current.version) pendingRemote.current = { version, state };
src/hooks/useCollaborativeSync.ts:102   applyRemote({ version, state });
src/hooks/useCollaborativeSync.ts:40    const applyRemote = useCallback((event: { version: number; state: ShareableState }) => {
src/hooks/useCollaborativeSync.ts:44      onRemoteUpdateRef.current(event.state, event.version);
src/hooks/useCollaborativeSync.ts:14      onRemoteUpdate: (state: ShareableState, version: number) => void;
```

`JSON.parse` returns `any`, so `{ version, state }` is assignable to `{ version: number; state: ShareableState }` with **no diagnostic and no cast anywhere in the chain**. From there:

```
src/hooks/useHomePage.ts:493-495
  const handleRemoteUpdate = useCallback((state: ShareableState, version: number) => {
    if (share.receiveRemote(state, version, { ...buildShareState(), allowComments: share.allowComments })) applyRemoteState(state);
  }, …);
src/hooks/useHomePage.ts:503-507   useCollaborativeSync({ …, onRemoteUpdate: handleRemoteUpdate, … })
```

so the blob becomes live editor state and, via `useShareUrl.ts:149` (`baselineRef.current = state`), the save baseline.

**Why this is the worst finding in the report — three separate consequences, in order of certainty:**

1. **`normalizeReportData()` is skipped.** Its own docstring says it is *"Used by both the share GET route and the batch migration route to ensure consistent data format across all access paths."* `/api/sync` is a **third** access path to the same `shares.data` column, and it does not call it. `/api/share/[id]/route.ts:172` does (`...normalizeReportData(ownerRows[0].data as Record<string, unknown>)`). So a legacy row is delivered **unmigrated** over SSE: `calcs` still holding plain strings instead of `{text, category}` (`normalize-report.ts:14-23`), `matchupPlans` still in the pre-`gamePlans` `planA`/`planB`/`selectedIndices` shape (`normalize-report.ts:46-69`), and `spreadNotes` not yet merged into `notes` (`:81-97`). Those shapes are then typed `ShareableState` and rendered. The next save writes them back, so the migration is silently reverted — data loss, not just a wrong render.
2. **It bypasses the validation the other two load paths enforce.** `decodeShareState` (`url-codec.ts:137-140`) runs `ShareableStateSchema.safeParse` and fails closed; `parseFetchedShareState` (`useShareUrl.ts:96`) now does the same. The SSE path does neither. A report that is rejected as corrupt on page load can still be injected into a live editor by the SSE stream.
3. **Required fields are not guaranteed.** `ShareableState` declares `paste: string` and `notes: Record<string, string>` as required. Nothing on this path checks either, so a row missing them hands `undefined` to every consumer that reads `state.paste`.

**Fix:** run the same validator the fetch path already uses, in the one place the payload lands:

```ts
// useCollaborativeSync.ts, "version" listener
const raw = JSON.parse(e.data) as { version?: unknown; state?: unknown };
if (typeof raw.version !== "number") return;
const state = await parseFetchedShareState(raw.state);   // already exported from useShareUrl
if (!state) return;                                       // malformed — ignore, same as the catch below
```

and call `normalizeReportData()` in `api/sync/[id]/route.ts:112` so all three access paths agree. Both files are conflict-free.

---

### HIGH-2 — the share-fetch fix validated the viewer but left the conflict baseline on the raw cast · **NEW** (regression of DANGEROUS-4's fix)
`conflict_risk: true` — **CONFLICT-RISK `src/hooks/useShareUrl.ts`**

```
src/hooks/useShareUrl.ts:281   versionRef.current = Number(_v) || 1; baselineRef.current = state as ShareableState;
src/hooks/useShareUrl.ts:285   const validated = await parseFetchedShareState(state);
src/hooks/useShareUrl.ts:294   settle(validated, editable);
```

Commit `282dbed` added `parseFetchedShareState` and routed `settle()` through it — good. But the line four above still assigns the **pre-validation** object to `baselineRef`, so the viewer runs on the parsed state while the baseline runs on the raw one. `ShareableStateSchema` is a `z.object()`, which strips unknown keys, so these are **not the same object** — and the repo's own test says so:

```
src/lib/sharing/__tests__/fetched-share-state.test.ts:143-153
  it("strips the API's internal flags and any unknown keys", async () => {
    const state = await parseFetchedShareState({ ...MINIMAL, _isUnlisted: true, replays: ["https://example.com/replay"] });
    expect(state as unknown as Record<string, unknown>).not.toHaveProperty("replays");
```

Extra keys reach the client because `normalizeReportData` ends with `return { ...rest, … }` (`normalize-report.ts:97-120`), spreading every key the stored jsonb carries.

The baseline is only used for one thing — detecting whether the local editor has diverged:

```
src/hooks/useShareUrl.ts:146
  if (conflictRef.current || (baselineRef.current && editorFingerprint(local) !== editorFingerprint(baselineRef.current))) {
    setConflict({ state, version }); return false;
```

and `reportFingerprint` enumerates **all** keys (`collaboration.ts:5` `Object.fromEntries(Object.entries(input)…)`), filtering only empty values. So for any report whose row carries a key outside the schema — a legacy `replays` array is the documented example (`url-codec.schemas.ts:26-29`) — `editorFingerprint(baselineRef.current)` includes it and `editorFingerprint(local)` does not. `receiveRemote` returns `false` and raises a **conflict the user did not cause**, on their first collaborative update, every time, for that report. Taking the remote side then applies the raw SSE blob from HIGH-1.

Separately: the baseline is set *before* validation, so a body that fails `parseFetchedShareState` still leaves a poisoned `baselineRef` behind the "corrupt link" screen.

**Fix:** one line — move the assignment after the parse and use the parsed value.
```ts
const validated = await parseFetchedShareState(state);
versionRef.current = Number(_v) || 1;
baselineRef.current = validated;
```

Same file, four remaining unvalidated casts off the same `any` body, lower radius:
```
src/hooks/useShareUrl.ts:273   setForkedFrom((data._forkedFrom as ForkedFromMeta | null) ?? null);
src/hooks/useShareUrl.ts:274   … (data._redactedFields as string[]) : []
src/hooks/useShareUrl.ts:276   const ownerEditToken = data._editToken as string | undefined;
src/hooks/useShareUrl.ts:282   if (Array.isArray(_c)) setFetchedCollaborators(_c as string[]);
```

---

### HIGH-3 — the EV-vs-SP **unit** is not in the type, so it is guessed from magnitude · **NEW framing of a documented residual**
**CONFLICT-RISK `src/lib/analysis/stat-calculator.ts`, `src/lib/parser/showdown-parser.ts`, `src/lib/validation/champions-legality.ts`**

This is the highest-blast-radius *modelling* gap in the domain, and it is a pure type problem: `ParsedPokemon.evs` is a `StatSpread` — six numbers with no unit — so the unit has to be inferred downstream.

```
src/lib/analysis/stat-calculator.ts:272-275
export function isSpFormSpread(evs: StatSpread): boolean {
  const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
  if (stats.every((s) => evs[s] <= 0)) return false;
  return stats.every((s) => evs[s] <= CHAMPIONS_MAX_SP_PER_STAT);
}
```

The file documents the failure itself (`:263-270`): *"a spread with a single value just over the cap and a small total (`EVs: 33 HP / 10 Atk`) is read as EVs here, so the 32 SP per-stat cap cannot be enforced from the numbers alone… The real fix is to carry the unit explicitly (a `statForm: "ev" | "sp"` on `ParsedPokemon`, set by the parser), which removes the guess entirely."* That is exactly right, and it is still not done.

The blast radius is the whole point: one function decides the unit for the report card, `PokemonDetailSlide`, `SpeedTierChart`, the spread builder **and** `validateChampionsTeam` (`champions-legality.ts:283`). A misread unit does not produce a crash or a type error — it produces **every displayed stat for that Pokemon being wrong**, with the legality sheet agreeing. The near-miss is on record: the previous version of this predicate consulted the budget as well as the magnitude, and an over-budget SP spread got converted a second time — an Incineroar rendered at 174 HP instead of 202 (`:252-258`). The current shape is a correct patch over the wrong model, not a fix of it.

Worth saying plainly: sharing the one predicate between display and legality (`:260-262`) is good design and means the two can never *disagree*. They can still both be wrong together.

**Fix:** add `statForm: "ev" | "sp"` to `ParsedPokemon`, set it in `showdown-parser.ts` from the format, and make `convertToChampionsSp` / `validateChampionsTeam` switch on it. `isSpFormSpread` then becomes a legacy fallback for rows that predate the field, not the primary decision.

---

### HIGH-4 — `cacheGet<T>`'s `raw as T`: unvalidated Redis payload becomes a domain type · **KNOWN, partially fixed**
`conflict_risk: false`

```
src/lib/cache.ts:35                      if (!schema) return raw as T;
src/app/api/champions/meta/route.ts:31   const cached = await cacheGet<ChampionsMetaResult>(CACHE_KEY);
src/app/api/user/export/route.ts:15      const lastExport = await cacheGet<string>(rateKey);
```

`cacheGet<T>` is still the only unconstrained exported generic in the repo (AST-confirmed: 1 of 1). The schema parameter VGC-146 added is now adopted on **one** call site — `src/lib/sharing/og-image.ts:64 return cacheGet(cardKey(shareId), ogCardSchema);`, which is the right pattern. The remaining six do not pass one:

| Site | Generic | Risk |
|---|---|---|
| `api/champions/meta/route.ts:31` | `ChampionsMetaResult` | **real** — after any shape change to `ChampionsMetaResult`, Redis serves the old shape for a full TTL and the endpoint returns structurally wrong Champions meta with no error |
| `api/user/export/route.ts:15` | `string` | a non-string cached value is typed `string`; used as a rate-limit timestamp |
| `api/share/[id]/route.ts:216` | `Record<string, unknown>` | honest, re-serialized straight back out |
| `api/explore/route.ts:45` | `{reports: unknown[]; nextCursor: string\|null}` | mostly honest |
| `api/spotlight/route.ts:19` | `{spotlight: unknown}` | honest |
| `api/creator/[name]/route.ts:35` | `unknown` | honest |

**Fix:** schema on the Champions-meta and export call sites. Then make the unchecked branch grep-able — a separate `cacheGetUnchecked<T>()` — so the next typed call site cannot reach it by omission.

---

### HIGH-5 — the cast after `safeParse` is the only thing linking `ShareableStateSchema` to `ShareableState` · **KNOWN, unfixed**
`conflict_risk: false`

```
src/lib/sharing/url-codec.ts:140   return result2.data as ShareableState;
src/hooks/useShareUrl.ts:97        if (parsed.success) return parsed.data as ShareableState;
src/hooks/useShareUrl.ts:115       return retry.success ? (retry.data as ShareableState) : null;
```

`result2.data` is already `z.infer<typeof ShareableStateSchema>`. The cast is either a no-op or a lie, and it is the lie that matters: it silences the error you *want* when schema and interface drift. There are now **three** of these, because `parseFetchedShareState` copied the idiom when it was added.

The two definitions happen to agree today — I diffed them field by field (`url-codec.ts:41-75` vs `url-codec.schemas.ts:57-125`): 22 fields each, matching, `genTheme` and `privateFields` present in both. But `CalcEntrySchema` is `z.unknown()` and the schema file states it keeps itself *"decoupled from rapidly-evolving damage-calc shapes"*, so drift is the expected state of the world here.

**Fix:** pin the schema to the type once and delete all three casts.
```ts
export const ShareableStateSchema: z.ZodType<ShareableState> = z.object({ … });
```

---

### HIGH-6 — `normalizePrivateFields` fails **open**, and both call sites feed it an unvalidated cast
**CONFLICT-RISK `src/app/api/share/[id]/route.ts`, `src/lib/sharing/team-graphic-image.tsx`**

```
src/app/api/share/[id]/route.ts:22        const fields = normalizePrivateFields(data.privateFields as string[] | undefined);
src/lib/sharing/team-graphic-image.tsx:91 const privateFields = normalizePrivateFields(data.privateFields as string[] | undefined);

src/lib/sharing/redact-paste.ts:26-33
export function normalizePrivateFields(input: readonly string[] | undefined): PrivateField[] {
  if (!input || input.length === 0) return [];
  const out = new Set<PrivateField>();
  for (const f of input) {
    if (VALID_FIELDS.has(f)) out.add(f as PrivateField);
  }
  return Array.from(out);
}
```

`data` is a jsonb blob typed `Record<string, unknown>`. Both callers assert the field is `string[]`; neither checks. If the stored value is a **string** rather than an array, `input.length` is truthy, `for…of` iterates characters, none are in `VALID_FIELDS`, and the function returns `[]` — i.e. *"nothing is private"*. The caller then skips `redactPasteFields` entirely and the hidden spread/item ships to a public viewer and into the shareable PNG. A redaction helper whose degenerate case is "reveal everything" is the wrong default regardless of how reachable it is.

Reachability is limited but not zero: the share POST validates `privateFields: z.array(z.string()).optional()`, so new writes are well-formed. Rows written before that schema, or by any path that does not go through it, are not covered — and the type system is doing nothing here either way.

**Fix:** widen the parameter and check, which deletes the cast at both call sites at once:
```ts
export function normalizePrivateFields(input: unknown): PrivateField[] {
  if (!Array.isArray(input) || input.length === 0) return [];
  …for (const f of input) if (typeof f === "string" && VALID_FIELDS.has(f)) out.add(f as PrivateField);
}
```
(`redact-paste.ts` itself is conflict-free; the two callers are not, so land the signature change first and let the casts become redundant-but-harmless until the callers are quiet.)

---

## 2. Medium

| # | Site | Problem | Fix |
|---|---|---|---|
| M1 | `src/lib/data/dex-subset.ts:221-223`<br>`export function asPokemonTypes(types: string[]): PokemonType[] { return types as PokemonType[]; }`<br>docstring: *"Narrow a string[] of types to the typed PokemonType union."* | **A landmine with a reassuring docstring.** It claims to narrow and does not; it is the exact cast that caused last audit's MissingNo. render crash. It now has **0 callers** (`grep -rn asPokemonTypes src/ cypress/` → the definition only), because `pkmn-dex-fallback.ts` grew its own validating `toPokemonTypes`. Dead today, wrong the moment anyone believes the comment. | Delete it, or re-implement it as the real filter and have `pkmn-dex-fallback.ts:52` call it instead of keeping a second copy. `conflict_risk: false` |
| M2 | `src/lib/utils/paste-edit.ts:106`<br>`.map(([stat, value]) => \`${value} ${labels[stat as keyof typeof labels]}\`)` | `Object.entries(spread)` yields `[string, number][]`; the cast asserts an unenumerated runtime key is one of 6. An extra key on a deserialized `StatSpread` writes `EVs: 5 undefined` **into the user's paste**. `noUncheckedIndexedAccess` flags it exactly (`paste-edit.ts(107,17): TS2532`). | Iterate a `StatName[]` constant instead of `Object.entries`. `conflict_risk: false` |
| M3 | `src/lib/utils/diff-state.ts:102`<br>`return Array.isArray(value) ? (value as SerializedMatchupPlan[]) : [];` | `Array.isArray` proves it is an array, not an array *of plans*. This feeds version diffing, which decides whether to write a `share_versions` row — the table that ate 447 MB of the 512 MB Neon tier in July 2026. A wrong diff is a storage incident. | Validate per element, or compare on `unknown` with explicit field reads. `conflict_risk: false` |
| M4 | `src/hooks/useMatchupPlans.ts:124`<br>`const parsed: LegacyPlan[] = JSON.parse(raw);` | An annotation on a `JSON.parse` result is a cast with no check and nothing to grep for. Source is `localStorage` — user-editable and version-skewed across deploys. | `const parsed: unknown = JSON.parse(raw)` then a shape guard. **CONFLICT-RISK** |
| M5 | `src/lib/data/type-chart.ts:225`<br>`const profile = {} as Record<PokemonType, number>;` | The empty-object cast claims all 18 keys exist, then relies on the hand-written `allTypes` literal on `:219` to fill them. Add a member to `PokemonType` without touching that literal and every read of the new key is `undefined` typed `number` → `NaN` multipliers in the defensive profile. | `Object.fromEntries(POKEMON_TYPES.map(t => [t, f(t)])) as Record<PokemonType, number>` — still a cast, but provably total because the key source *is* the union source. `conflict_risk: false` |
| M6 | `PokemonType`'s 18 members are still **hand-duplicated in 8 places** | `types/pokemon.ts:1` (the union) · `data/type-chart.ts:6` (`TYPE_CHART` keys) · `data/type-chart.ts:219` (`allTypes`) · `utils/type-colors.ts:3` · `parser/showdown-parser.ts:3` (`POKEMON_TYPES`) · `report/DefensiveCoverageChart.tsx:11` · `report/OffensiveCoverageChart.tsx:14` · `compare/CompareContent.tsx:104`. Nothing derives from anything else. `pkmn-dex-fallback.ts:49` now *does* derive (`new Set(Object.keys(TYPE_CHART))`) and says why — that is the pattern, applied once. | `export const POKEMON_TYPES = [...] as const; export type PokemonType = (typeof POKEMON_TYPES)[number]; export function isPokemonType(v: string): v is PokemonType`. Then adding a type (Stellar, or whatever Champions ships) is a compile error in the two places that must change instead of a silent `undefined` in six. **CONFLICT-RISK on 5 of the 8** |
| M7 | `src/lib/parser/showdown-parser.ts:118-119`<br>`if (TERA_TYPES.includes(tt as TeraType)) { teraType = tt as TeraType; }` | The guard is written in terms of the assertion it exists to justify. Correct today; this is the idiom that produced the MissingNo. crash. | `(TERA_TYPES as readonly string[]).includes(tt)`, or a reusable `isTeraType` predicate. **CONFLICT-RISK** |
| M8 | `src/lib/analysis/stat-calculator.ts:205`<br>`const remainder: Record<string, number> = {};` | A widened key type inside the one function in the repo doing exact integer arithmetic on exactly 6 stats (`trimSpToBudget`). Sound today because `stats: StatName[]` is the key source in both loops, but a typo'd key would read `undefined` typed `number`, `undefined <= 0` is `false`, and `groups.set(undefined, …)` would follow. Zero-cost to tighten. | `Record<StatName, number>`, or reuse `StatSpread`. **CONFLICT-RISK** |
| M9 | `src/app/api/webhooks/clerk/route.ts:61`<br>`const data = event.data as unknown as ClerkUserCreatedData;` | The only genuinely-needed double cast in production — Clerk's `WebhookEvent` union is wider than the handled case. | Narrow on `event.type` first, then one single cast. `conflict_risk: false` |
| M10 | `src/app/api/user/drafts/route.ts:163`<br>`const { draftId } = await request.json();` | `Request.json()` is `Promise<any>`; `draftId` is `any`, truthiness-checked, then bound into a `DELETE … WHERE id = ${draftId}`. Not injectable (Neon parameterizes) and scoped by `owner_id`, but a non-string yields a Postgres type error → 500 where a 400 belongs. The other 19 `request.json()` routes all run a `safeParse`; this one line in an otherwise-validated file skips it. | Route it through the file's existing schema. `conflict_risk: false` |
| M11 | The DB-row boundary — **281 casts, systemic** | `getDb()` returns `NeonQueryFunction<false, false>`, whose rows are `Record<string, unknown>`, so every field read is a hand-written assertion: **179 × `as string`**, 38 × `as Date`, 43 × `as Record<string, unknown>`, 21 × `as number`, concentrated in `src/app/api/**`. Not individually dangerous — each is a developer reading their own `SELECT` — but a column rename, or an `integer`→`bigint` migration (Postgres returns `bigint` as a *string* over the wire), is caught nowhere. | One `rows<T>(sql, schema)` helper that zod-parses at the query site, dropping ~281 assertions to ~40 and removing ~210 future `noUncheckedIndexedAccess` errors as a side effect. Its own ticket. |
| M12 | `noImplicitReturns` → **2 errors** (newly measured) | `src/hooks/useShareUrl.ts(216,13)` and `src/components/ui/NotificationBell.tsx(78,13)`: effects that return a cleanup on some branches and fall through on others. In `useShareUrl` the `shareId` and `inlineData` branches return `() => { clearTimeout(timeout); controller.abort(); }` while the fall-through clears the timeout inline — deliberate, but the asymmetry is exactly what the flag is for. | Return a no-op cleanup on the fall-through and turn the flag on. 2 fixes. |
| M13 | 15 files the tsconfig **never type-checks** | `exclude: ["node_modules", "cypress"]`, and `include` lists `**/*.ts`/`**/*.tsx`/`**/*.mts` but not `**/*.mjs`. So: **9 × `cypress/**/*.ts`** (the whole E2E suite — a spec can reference a renamed export and CI stays green, since `ci.yml` runs tsc/eslint/vitest and Cypress is not in the gate), plus **6 `.mjs`** — `scripts/build-dex-subset.mjs`, `generate-move-names.mjs`, `generate-maskable-icon.mjs`, `generate-og-default.mjs`, and the two root configs. `build-dex-subset.mjs` is the emitter whose positional tuple layout must match `PackedSpecies` exactly, and which M14's double cast trusts. | A `cypress/tsconfig.json` with its own `tsc --noEmit` CI step; add `**/*.mjs` to `include` (`allowJs: true` is already set — measure the churn first). **CONFLICT-RISK on `tsconfig.json`** (not listed, but shared) |
| M14 | `src/lib/data/dex-subset.ts:105`<br>`const subset = rawSubset as unknown as PackedDexSubset;` | A double cast over a 127 KB JSON artifact. Mitigated by the `schemaVersion` check in `ensureSchema()` and a producer hash test — but the producer is never type-checked (M13), so the only thing tying the two tuple layouts together is a hand-bumped integer. | Keep the cast (per-row parsing 1,515 species on the client is not worth it) and type-check `scripts/*.mjs` so emitter and `PackedSpecies` are checked against each other. `conflict_risk: false` |

### Explicitly assessed and found SOUND

Worth recording, because these are the places a wrong number would hurt most:

- **`src/lib/validation/champions-legality.ts` — zero casts, zero non-null assertions, explicit return types, 357 lines.** `megaStoneHolders[0]` (`:342`) is guarded by `length === 1`. Unchanged from last audit and still the model for the rest of the repo.
- **The base-stats decode boundary is sound.** `PackedSpecies.baseStats` is declared as a true 6-tuple (`dex-subset.ts:78`), so `stats[0]…stats[5]` in `decodeSpecies` (`:116-123`) is checked by the compiler and produces **zero** `noUncheckedIndexedAccess` errors. This is the highest-blast-radius indexing in the codebase and it is correct by construction.
- `pkmn-dex-fallback.ts:49-53` — `VALID_POKEMON_TYPES` derived from `Object.keys(TYPE_CHART)`, with a comment explaining that `TYPE_CHART` is a `Record<PokemonType, …>` so the compiler keeps them in lockstep. The right fix, done the right way.
- `stat-calculator.ts:225` `groups.get(key)!` — `key` came from `[...groups.keys()]`.
- `stat-calculator.ts:58, 74` `result as StatSpread` — `Partial<StatSpread>` filled over all 6 `StatName`s on the line above. Lazy, not dangerous.
- `showdown-parser.ts:80` `genderMatch[1] as "M" | "F"` — regex is `/\s+\(([MF])\)\s*$/`.
- `threat-matrix.ts:38, 44` `Object.keys(TYPE_CHART) as PokemonType[]`; `notification-preferences.ts:13` `Object.keys(prefs) as (keyof NotificationPrefs)[]`.
- `redact-paste.ts:30` `f as PrivateField` — guarded by `VALID_FIELDS.has(f)`.
- All 19 `request.json()` route files run a zod `safeParse` (the one exception is M10).
- **Non-null assertions: ~30 in production, 0 dangerous.** Every one traced to its guard, same as last audit. In `src/lib` there are only four: `stat-calculator.ts:225`, `collaboration.ts:33` (`char.codePointAt(0)!` over a `for…of` on a string), `rate-limit.ts:24` (`redis!`, only called under `if (redis)` at `:72`), `db.ts:4` (`process.env.DATABASE_URL!`, env contract). The rest are UI; worst-smelling remains `SpreadBuilder.tsx:52-53` (8 assertions on 2 lines, because `{outcome.stats && …}` narrows one field of a 2-member union but not its siblings — fix with a discriminant), then `TeamStats.tsx:34` `p.data!` after a `.filter()` that cannot narrow, `SpeedTierChart.tsx:203` `mon.itemBoost!` after a boolean that cannot narrow, and `MatchupPlanSlide.tsx:286` `mon.calculatedStats![stat]` (guarded by `mon.hasEvs && mon.calculatedStats` at `:277`). All `conflict_risk: true`.

---

## 3. Cosmetic

Say plainly: **nothing in this section can produce a wrong number.** These are API-hygiene and dead-code items.

- **23 exported functions in `src/lib/` with no explicit return type** (AST-measured; unchanged in count from last audit). 7 are in the domain-math path:
  ```
  src/lib/analysis/damage-calculator.ts:34   calculateReportDamage   ← `survival` widens from 3 literals to `string`, so no consumer can switch on it exhaustively
  src/lib/analysis/spread-builder.ts:8       spreadTotal (arrow)
  src/lib/analysis/spread-builder.ts:9       spreadRules             ← `unit` widens to `string`; only ever "SP" | "EVs"
  src/lib/analysis/spread-builder.ts:40      spreadStats             ← returns @smogon/calc's `StatsTable` via `.rawStats`: a third-party type is the public return type of a src/lib function
  src/lib/analysis/spread-builder.ts:69      evaluateSpread          ← anonymous object embedding calculateReportDamage's inferred return
  src/lib/analysis/threat-matrix.ts:31       findCoverageGaps        ← relies on TS 5.5 inferred type predicates to strip null from `.filter(g => g !== null)` — a compiler-version-dependent public signature
  src/lib/analysis/threat-matrix.ts:43       defensiveWeaknesses
  ```
  Remaining 16 (I/O and glue, not maths): `web-push.ts:5/13`, `posthog-server.ts:31`, `collaboration-access.ts:5`, `discord-bot.ts:60`, `notifications.ts:10/32`, `email.ts:32/81/183/324`, `i18n/index.ts:47/97`, `sharing/quick-share.ts:7/12/13`.
- **`noUnusedLocals` → 21 errors (19 non-test)**, including real dead code: **`src/lib/sharing/url-codec.ts:77 toBase64Url` — the share-URL *encoder*, imported by nothing** (still dead, one audit cycle later); `src/lib/data/tags.ts:33 EventType`; `src/lib/discord-bot.ts:50 PRIORITY_LABELS`; 3 dead `*_I18N` maps in `ExploreFilters.tsx:57/65/73`; 2 dead `UserButton` imports; `HomePageClient.tsx:54 summarizeChangedFields`; `PokemonCard.tsx:180 displayData`.
- **`noUnusedParameters` → 5 errors.** Two are declared component props nothing reads, i.e. dead API surface: `PasteInput.tsx:120 selectedTemplate, onTemplateSelect` (note: another agent's ticket `7-ts-nouncheckedindexedaccess` and `3-bug-template-picker-inert` are both about this area). Plus `MatchupPlanSlide.tsx:456 onResultChange`, `SpeedTierChart.tsx:583 i`, `CalcEntryGroup.tsx:187 category`.
- **42 `eslint-disable` comments** (up sharply — `d8aba62` cleared 36 lint errors and made lint blocking in CI, and suppressions are part of how). By rule: 19 `react-hooks/set-state-in-effect`, 7 `@next/next/no-img-element`, 7 `@next/next/no-html-link-for-pages`, 4 `react-hooks/exhaustive-deps`, 2 `@typescript-eslint/no-unused-vars`, 1 `react-hooks/immutability`, 1 `jsx-a11y/no-static-element-interactions`. **None suppress a type rule**, all but the 4 `exhaustive-deps` carry a justifying comment, and there are still **zero** `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`. Not a soundness concern; recorded because the count tripled and `exhaustive-deps` suppressions (`HomePageClient.tsx:327`, `useHomePage.ts:91/220`, `useExploreUrlSync.ts:138`, `useShareUrl.ts:315`) are the kind that rot.
- **`as unknown as` — 19 total, 5 in production.** 3 are the same i18n workaround written three times to read a key `TranslationKeys` does not declare (`i18n/index.ts:84`, `CommonModesSlide.tsx:108`, `useSlideSystem.ts:56`); adding the key removes all three. The other two are M9 and M14.
- `i18n/index.ts:53/80/86` (`as LanguageCode | null`, `as TranslationKeys`) — lazy, but the `Proxy` fallback returns the English string for a missing key, so a bad `LanguageCode` degrades rather than breaks.
- `utils/normalize-report.ts:13/18/49` — all read through `??` defaults; tolerant by construction.
- `url-codec.ts:108` `bytes.buffer as ArrayBuffer` — `SharedArrayBuffer` narrowing; unavoidable with the current lib.
- **Catch clauses:** 292 total, 5 annotated `: unknown` (`db.ts:12`, `notifications.ts:24/52`, `email.ts:99/195`), 287 bare. Bare is correct — `useUnknownInCatchVariables` is on via `strict`, so a bare `catch (e)` is already `unknown`. No untyped-catch exposure anywhere.

---

## 4. Compiler-flag opportunities (with real error counts)

Every row is a real cold run on the full program: `node node_modules/typescript/bin/tsc --noEmit --incremental false --<flag>`, TypeScript 5.9.3, baseline **0 errors**.

### Already ON
`strict` (⇒ `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, `alwaysStrict`, `noImplicitThis`) · `noImplicitOverride` · `noFallthroughCasesInSwitch` · `noUncheckedSideEffectImports` · `allowUnreachableCode: false` · `allowUnusedLabels: false`.

### Currently OFF — measured 2026-11-02

| Flag | Errors | non-test | `src/lib` non-test | What it catches here | Recommend |
|---|---:|---:|---:|---|---|
| **`noUncheckedIndexedAccess`** | **482** | **308** | **39** | Codes: 231 × TS2532, 158 × TS18048, 63 × TS2345, 22 × TS2322, 6 × TS2538, 2 × TS2769. Catches M2 exactly (`paste-edit.ts(107,17)`). **210 of the 482 (44%) are in `src/app/api/**`** — all the same DB-row-indexing pattern M11 wants refactored anyway. | **Yes — highest value. Stage it.** |
| `exactOptionalPropertyTypes` | 80 | 79 | 9 | 39 × TS2375, 19 × TS2379, 16 × TS2769 (React prop spreads), 4 × TS2322, 2 × TS2345. I read all 9 `src/lib` errors: every one is the benign `x?: T` ← `T \| undefined` shape against `@smogon/calc` or `posthog-node` parameter types (`damage-calculator.ts:22/41`, `spread-builder.ts:70/101`, `threat-matrix.ts:21`, `import/limitless.ts:57`, `showdown-parser.ts:198/217`, `posthog-server.ts:38`). **Real bugs found: 0.** Concentrated in `HomePageClient.tsx` (10), `useHomePage.ts` (7), `TeamReport.tsx` (7), `TournamentMode.tsx` (6), `TeamOverview.tsx` (6) — all `conflict_risk: true`. | **No (low ROI).** Revisit after NUIA. |
| `noUnusedLocals` | 21 | 19 | 3 | Real dead code — see §3. | **Yes — 19 fixes.** |
| `noUnusedParameters` | 5 | 5 | 0 | 5 fixes, 2 of them dead component props. | **Yes — trivial.** Pair with the above. |
| `noImplicitReturns` | **2** | 2 | 0 | M12. Newly measured — the prior audit did not test this flag. | **Yes — 2 fixes, cheapest win on the board.** |
| `noPropertyAccessFromIndexSignature` | 737 | 715 | 100 | Forces `row.foo` → `row["foo"]` across the DB layer. Enormous churn, finds no bug, makes M11 harder to read. | **No.** |
| `verbatimModuleSyntax` | **0** | 0 | 0 | Confirms the tsconfig comment: measures clean. Changes import-elision **emit**, not just diagnostics, so it needs its own commit behind a real `next build`. The existing comment is correct; keep it. | Defer (as documented). |
| `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters` | **509** | — | — | The three recommended, measured together. | — |
| …+ `exactOptionalPropertyTypes` | **583** | — | — | For reference. | — |

### Staged adoption for `noUncheckedIndexedAccess`

308 non-test errors is a real bill, but it is the only flag here that catches a production defect, and the cost is concentrated rather than diffuse.

1. **Stage 1 — `src/lib/` only: 39 errors.** The domain maths. Per file:
   `parser/showdown-parser.ts` 8 · `utils/random-accent.ts` 7 (all `palette` is possibly undefined, `:89-97`, trivial) · `utils/paste-edit.ts` 7 (includes M2) · `sharing/team-graphic-image.tsx` 4 · `analysis/stat-calculator.ts` 3 (`:218/219/221`, all the sound `remainder[stat]` reads from M8 — tightening to `Record<StatName, number>` clears all three at once) · `utils/extract-species.ts` 2 · `linear.ts` 2 · `data/pkmn-dex-fallback.ts` 2 (`:116/179`, the `types[0]`/`types[1]` tuple build — now behind a real `types.length === 0` guard, so these are false positives the compiler cannot see; destructure `const [t0, t1] = types` and branch on `t1`) · `utils/diff-state.ts`, `sharing/url-codec.ts`, `sharing/og-image.ts`, `data/pokemon.ts` 1 each.
   **Caution:** 6 of the 12 Stage-1 files are now CONFLICT-RISK (see §6) — last cycle this stage was entirely conflict-free, and it is not any more.
2. **Stage 2 — the DB row boundary (M11).** Removes most of the 210 API errors.
3. **Stage 3 — components/hooks (~59).**
4. **Stage 4 — tests (174), mostly `result.pokemon[0]!` in assertions; mechanical.**
5. Then flip the flag in `tsconfig.json` and fold `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` (26 fixes) into the same ticket.

An existing unfiled ticket already covers this: `.swarm/unfiled-ticket-bodies/7-ts-nouncheckedindexedaccess.md`. Its error count is from 26-10; use 482/308/39.

---

## 5. Changed since 26-10-26

38 commits landed, including 4 that directly address last cycle's findings.

### Fixed — verified by reading the code

| Prior finding | Status | Evidence |
|---|---|---|
| **DANGEROUS-1** — `entry.types as PokemonType[]` let `"Bird"` reach `TypeBadge` and crash the report render on `MissingNo. @ Leftovers` | **FIXED, and fixed well** (`418be74 fix: reject dex entries whose typing is not a real PokemonType`) | `pkmn-dex-fallback.ts:49-53` adds `VALID_POKEMON_TYPES = new Set(Object.keys(TYPE_CHART))` and `toPokemonTypes()` that filters with a real type predicate; called at both former cast sites (`:103`, `:171`). Deriving the valid set from `TYPE_CHART`'s keys instead of hand-listing a 7th copy is the better of the two fixes I suggested. Regression tests exist and name the bug: `data/__tests__/pkmn-dex-fallback.test.ts:85-86` `expect(data!.types).not.toContain("Bird")`. |
| **DANGEROUS-2** — `[types[0]]` fabricating `[undefined]` typed `[PokemonType]` | **FIXED** | `pkmn-dex-fallback.ts:104-113` now returns `null` when `types.length === 0`, with a comment explaining why fabricating the tuple was wrong. The two NUIA errors at `:116/179` remain but are now false positives the compiler cannot see past. |
| **DANGEROUS-4** — share-fetch payload cast to `ShareableState` with no validation | **HALF FIXED — see HIGH-2** (`282dbed fix: validate the fetched share payload…`) | `parseFetchedShareState` added (`useShareUrl.ts:90-116`) with a 150-line test file and legacy-tolerant retry; `settle(validated, …)` at `:294`. But `:281` still assigns the **unvalidated** `state as ShareableState` to `baselineRef`, four lines before the parse, and the repo's own test proves the two objects differ. |
| `cacheGet` schema parameter adopted nowhere | **Partially adopted** (`e4d9354`) | New `src/lib/sharing/og-image.ts:64` `cacheGet(cardKey(shareId), ogCardSchema)` — the first call site to use it. 6 others still don't; the Champions-meta one still matters (HIGH-4). |

### Still open, unchanged
DANGEROUS-3 (`cache.ts:35`) → **HIGH-4** · DANGEROUS-5 (`url-codec.ts:140`) → **HIGH-5** · #6 `paste-edit.ts` stat label → **M2** · #7 `type-chart.ts:225` → **M5** · #8 `diff-state.ts:102` → **M3** · #9 `dex-subset.ts:105` → **M14** · #10 parser cast-on-guard → **M7** · the 8-way `PokemonType` duplication → **M6** (one of the 8 now derives) · `asPokemonTypes` still a lying, dead cast → **M1** · all 23 missing return types · `toBase64Url` still dead · `noUnusedLocals`/`noUnusedParameters` unchanged at 21/5 · `cacheGet<T>` still the only unconstrained exported generic.

### New this cycle
- **HIGH-1** — `/api/sync` SSE → `JSON.parse` (`any`) → `ShareableState`, with `normalizeReportData` skipped. Not a regression; it predates both audits and was simply invisible to a cast-and-keyword grep. This is the finding that matters most in this report.
- **HIGH-2** — the baseline half of the DANGEROUS-4 fix.
- **HIGH-3** — the EV/SP unit not being in the type, reframed as the top domain-modelling defect.
- **HIGH-6** — `normalizePrivateFields` fails open; both callers feed it an unvalidated cast. New file `team-graphic-image.tsx` added the second call site.
- **M4**, **M10** — two more `JSON.parse`/`request.json()` `any` leaks.
- **M12** — `noImplicitReturns` → 2 errors (flag never previously measured).
- **New since 26-10:** `src/lib/sharing/og-image.ts`, `src/lib/sharing/team-graphic-image.tsx`, `src/lib/db/purge-satellites.ts`, `src/lib/explore/chronological-cursor.ts`, `src/lib/security/api-guard.ts`, `src/lib/import/limitless.ts`. **`src/lib/db/`, `src/lib/security/` and `src/lib/import/` contain zero casts and zero non-null assertions** — the new code is cleaner than the code it sits next to. `team-graphic-image.tsx` is the exception (6 jsonb casts, one of which is HIGH-6).

### Counts, 26-10 → 02-11

| Metric | 26-10 | 02-11 | Note |
|---|---:|---:|---|
| `any` keywords (AST, whole repo) | 0 | **0** | but 25 production `JSON.parse`/`request.json()` sites leak `any` — newly counted |
| `@ts-ignore` / `@ts-expect-error` | 0 | **0** | |
| `eslint-disable` comments | not measured | **42** | 0 of them type rules; lint became a blocking CI gate in `d8aba62` |
| Type assertions, production (excl. `as const`) | 440 | **212** | not a real drop — my regex is tighter than the prior one; use the per-category rows below |
| ↳ DB/third-party boundary | ~290 | **281** | 179 `as string`, 38 `as Date`, 43 `as Record<string, unknown>`, 21 `as number` |
| ↳ `as unknown as`, production | 5 | **5** | |
| Non-null assertions, production | 30 | **~30** | 4 of them in `src/lib`; 0 dangerous |
| Exported `src/lib` fns, no return type | 23 | **23** | AST-measured both times |
| Unconstrained exported generics | 1 | **1** | `cacheGet<T>` |
| Files never type-checked | 13 | **15** | 9 cypress `.ts` + 6 `.mjs` |
| `noUncheckedIndexedAccess` | 394 | **482** | +88; `src/lib` non-test 33 → **39** |
| `exactOptionalPropertyTypes` | 74 | **80** | still 0 real bugs |
| `noPropertyAccessFromIndexSignature` | 681 | **737** | still not worth it |
| `verbatimModuleSyntax` | 0 | **0** | |
| `noUnusedLocals` / `noUnusedParameters` | 21 / 5 | **21 / 5** | |

The NUIA growth (+88) is roughly proportional to program growth (380 → 407 files). The flag is getting more expensive every cycle it is deferred, and Stage 1's conflict exposure went from 0 files to 6.

---

## 6. Conflict-risk index

Files I recommend changing that appear in `.swarm/main-changed-files.md`:

```
CONFLICT-RISK  src/hooks/useShareUrl.ts                        (HIGH-2)
CONFLICT-RISK  src/app/api/share/[id]/route.ts                 (HIGH-6)
CONFLICT-RISK  src/lib/sharing/team-graphic-image.tsx          (HIGH-6)
CONFLICT-RISK  src/lib/analysis/stat-calculator.ts             (HIGH-3, M8)
CONFLICT-RISK  src/lib/parser/showdown-parser.ts               (HIGH-3, M7, M6)
CONFLICT-RISK  src/lib/validation/champions-legality.ts        (HIGH-3)
CONFLICT-RISK  src/lib/types/pokemon.ts                        (HIGH-3, M6)
CONFLICT-RISK  src/lib/utils/type-colors.ts                    (M6)
CONFLICT-RISK  src/lib/data/pkmn-dex-fallback.ts               (NUIA stage 1)
CONFLICT-RISK  src/lib/utils/random-accent.ts                  (NUIA stage 1)
CONFLICT-RISK  src/lib/utils/extract-species.ts                (NUIA stage 1)
CONFLICT-RISK  src/lib/sharing/og-image.ts                     (NUIA stage 1)
CONFLICT-RISK  src/hooks/useMatchupPlans.ts                    (M4)
CONFLICT-RISK  src/components/report/DefensiveCoverageChart.tsx, OffensiveCoverageChart.tsx,
               SpeedTierChart.tsx, TeamStats.tsx, MatchupPlanSlide.tsx, TypeBadge.tsx,
               src/components/compare/CompareContent.tsx        (M6, non-null rewrites)
```

Conflict-free, so safe to take tonight:
```
src/app/api/sync/[id]/route.ts        src/hooks/useCollaborativeSync.ts     ← both of HIGH-1
src/lib/cache.ts                      src/app/api/champions/meta/route.ts   ← HIGH-4
src/lib/sharing/url-codec.ts          src/lib/sharing/url-codec.schemas.ts  ← HIGH-5
src/lib/sharing/redact-paste.ts       ← HIGH-6's signature change
src/lib/data/dex-subset.ts  src/lib/data/type-chart.ts  src/lib/utils/paste-edit.ts
src/lib/utils/diff-state.ts  src/lib/i18n/index.ts  src/components/report/SpreadBuilder.tsx
src/app/api/user/drafts/route.ts  src/app/api/webhooks/clerk/route.ts  tsconfig.json
```

**Important change from last cycle:** the prior audit could say *"every `src/lib/` file carrying a DANGEROUS finding is conflict-free."* That is no longer true — `stat-calculator.ts`, `showdown-parser.ts`, `champions-legality.ts`, `types/pokemon.ts` and `pkmn-dex-fallback.ts` are all in the changed list now. HIGH-1 is the one high-severity finding whose *entire* fix lands in conflict-free files, which is another reason to take it first.

---

## 7. Suggested ticket split

| Priority | Scope | Files | Conflict |
|---|---|---|---|
| **P0** | **HIGH-1** — validate the SSE payload with `parseFetchedShareState`; call `normalizeReportData()` in `/api/sync`. Regression test named for the bug: a legacy `matchupPlans`/`calcs` row arriving over SSE must be migrated, not applied raw. | `api/sync/[id]/route.ts`, `useCollaborativeSync.ts` | **none** |
| **P0** | **HIGH-2** — move `baselineRef.current` after the parse and assign `validated`. Test: a body carrying `replays` must not raise a conflict on the first remote update. | `useShareUrl.ts` | true |
| **P1** | **HIGH-3** — carry `statForm: "ev" \| "sp"` on `ParsedPokemon`; switch `convertToChampionsSp` and `validateChampionsTeam` on it; keep `isSpFormSpread` as the legacy fallback. Deletes the documented `EVs: 33 HP / 10 Atk` residual. | `types/pokemon.ts`, `showdown-parser.ts`, `stat-calculator.ts`, `champions-legality.ts` | true (all 4) |
| **P1** | **HIGH-4 + HIGH-5** — finish the VGC-146 rollout: schema on `cacheGet<ChampionsMetaResult>` and `cacheGet<string>`; pin `ShareableStateSchema: z.ZodType<ShareableState>` and drop all three post-`safeParse` casts; add `cacheGetUnchecked<T>`. | `cache.ts`, `champions/meta/route.ts`, `user/export/route.ts`, `url-codec.ts`, `url-codec.schemas.ts`, `useShareUrl.ts` | partial |
| **P1** | **HIGH-6** — `normalizePrivateFields(input: unknown)` with `Array.isArray`; drop the casts at both callers. Test: a non-array `privateFields` must redact, not reveal. | `redact-paste.ts` (+2 callers) | callers only |
| **P2** | **M1 + M5 + M6** — derive `PokemonType` from `POKEMON_TYPES as const`, add `isPokemonType`, collapse the remaining 7 hand-written lists, build `type-chart.ts:225`'s profile from the canonical list, delete or fix `asPokemonTypes`. | `types/pokemon.ts` + 7 sites | 5 of 8 conflicted |
| **P2** | **M2 + M3 + M4** — the three unvalidated-shape casts that write user data (`paste-edit`, `diff-state`, `useMatchupPlans`). | 3 files | 1 of 3 |
| **P2** | **M12 + `noUnusedLocals` + `noUnusedParameters`** — 26 fixes, three flags on. Deletes dead `toBase64Url`, dead `EventType`, dead props. | ~21 files | some |
| **P2** | `noUncheckedIndexedAccess` Stage 1 — `src/lib/` only, 39 errors, 12 files. | 12 files | **6 conflicted** |
| **P3** | **M11** — typed row reader, retiring 281 DB casts and ~210 future NUIA errors. | `lib/db.ts` + API routes | some |
| **P3** | **M13** — type-check `cypress/**` and `scripts/*.mjs`. | `tsconfig.json`, new `cypress/tsconfig.json` | shared |
| **P3** | Explicit return types on the 7 `src/lib/analysis/` exports; `M8`, `M7`, `M9`, `M10`. | 7 files | mixed |
| **P4** | `SpreadBuilder.tsx` `outcome` discriminant — retires 8 non-null assertions on 2 lines. | 1 file | — |

---

*Read-only audit. `git status` shows no source changes; the repo `tsconfig.json` was never modified — all flag measurements used command-line overrides. Scratch analysis scripts live outside the repo in the session scratchpad.*

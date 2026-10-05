# C2 — TypeScript Soundness Audit

Read-only audit. Repo: `/home/user/VGC-Team-Report`. Date: 2026-10-05.
Scope: all of `src/` (324 files, 69,551 lines), prioritising `src/lib/` (20,524 lines).
No repo file was modified. `npm run typecheck` (= `tsc --noEmit --incremental false`) was not re-run; the task statement says it passes clean and nothing below is a current compiler error — every finding is a hole the compiler is *configured not to see*.

---

## 0. Headline

**The grep-visible `any` surface is zero.** There is not one `: any`, `as any`, `any[]`, `Record<string, any>`
or `<any>` in `src/` outside `node_modules`. All 120 hits for the word `any` are English prose in comments.
There are also **zero** `@ts-ignore` and **zero** `@ts-expect-error` directives, and all **6** non-null
assertions in the codebase are correctly guarded.

That is unusually disciplined, and it means the interesting findings are **not** stylistic `any`s. They are:

1. **Implicit `any` injected by library generics**, which grep cannot see — `JSON.parse`, `Response.json()`
   and the Neon driver's `QueryRows<false> = Record<string, any>[]`.
2. **A validation asymmetry**: the repo built `ShareableStateSchema` (zod) for VGC-146 and wired it into the
   *URL* decode path, but the *API* decode path — which serves every `/s/{id}` page view — still assigns an
   unvalidated `any` straight into `ShareableState`. Half the ticket shipped.

### Counts

| Category | Count | Notes |
|---|---|---|
| Explicit `any` (`: any`, `as any`, `any[]`, `Record<string, any>`) | **0** | genuinely none |
| Implicit `any` from `JSON.parse` | **23 sites** | 1 annotated `: unknown` correctly (url-codec) |
| Implicit `any` from `Response.json()` | **43 client-side** + ~20 server-side | `lib.dom` types it `Promise<any>` |
| Implicit `any` from Neon rows (`Record<string, any>[]`) | ~100+ property reads | the single largest `any` surface |
| Type assertions (`as T`, excl. `as const`) | **194** | `as Record` 49, `as Date` 38, DOM 21, rest long-tail |
| `as unknown as` double casts | **5** | 2 benign, 1 guarded, 2 worth fixing |
| Non-null assertions (`!`) | **6** | **all 6 correctly guarded — no finding** |
| `@ts-ignore` / `@ts-expect-error` | **0** | — |
| `eslint-disable` | **16** | 6 `no-img-element`, 8 `exhaustive-deps`, 1 `no-unused-vars`, 1 a11y |
| Exported `src/lib/` fns missing a return type | **6** | 1 of them widens to `any` (see M5) |

| Risk tier | Count |
|---|---|
| **HIGH** | 5 |
| **MEDIUM** | 7 |
| **LOW** | 9 |

---

## 1. `tsconfig.json` strictness

### ON

Via `"strict": true` (implied): `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`,
`strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `useUnknownInCatchVariables`,
`alwaysStrict`, `strictBuiltinIteratorReturn`.

Written out explicitly (**not** implied by `strict`, each measured at 0 errors on 2026-08-10 per VGC-261):
`noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`,
`allowUnreachableCode: false`, `allowUnusedLabels: false`.

Also on: `skipLibCheck`, `isolatedModules`, `resolveJsonModule`, `incremental` (with the documented
cold-gate caveat), `moduleResolution: bundler`.

### OFF

| Flag | Status | Assessment |
|---|---|---|
| `noUncheckedIndexedAccess` | OFF | **The one worth enabling.** See below. |
| `exactOptionalPropertyTypes` | OFF | Moderate error count, very low real-bug yield here — the codebase assigns `?? undefined` deliberately all over `normalize-report.ts` / `useHomePage.ts`, so this would be ~all noise. |
| `noPropertyAccessFromIndexSignature` | OFF | Would force `row["created_at"]` over `row.created_at` at **every** Neon row read (100+ sites). Pure churn, catches nothing. Do not enable. |
| `noImplicitReturns` | OFF | Low value; `allowUnreachableCode: false` already covers the shape of bug this finds. |
| `noUnusedLocals` / `noUnusedParameters` | OFF | eslint already covers; `noUnusedLocals` would also fight the deliberate `const { _a, _b, ...rest }` destructure in `useShareUrl.ts:200` (already has an eslint-disable for exactly that). |
| `verbatimModuleSyntax` | OFF | Already triaged in the tsconfig comment: 0 errors but changes import-elision *emit*, so it needs its own commit behind a real `next build`. Agreed — leave it. |
| `strict`-adjacent: nothing else missing. | | |

### Which OFF flag would catch the most real bugs: `noUncheckedIndexedAccess`

**Estimated diagnostics: ~300–450.** Derivation (counted by grep over `src/`, tests excluded):
293 literal-index reads (`x[0]`, `rows[0]`, `match[1]`), 55 variable-index reads (`x[i]`),
~81 SCREAMING_CASE record lookups (`GEN_PRESETS[k]`, `TYPE_COLORS[k]`), plus the long tail of
`Record<string, T>` reads in `stat-calculator.ts`, `diff-state.ts`, `bot/route.ts`, `sprite-slug.ts`.

**Honest caveat:** roughly 85–90% of those would be *already-safe* sites, because this codebase guards
properly but in ways TS cannot narrow — `if (rows.length === 0) return 404;` followed by `rows[0].x`
(every API route does this, and I verified the guards at `team-graphic/route.tsx:98`,
`user/profile/route.ts:44`, `views/[shareId]/route.ts:48`, `share/route.ts:164` — all correct), and
`if (!map.has(k)) map.set(k, [])` before `map.get(k)!`.

It is still the right flag, because it is the **only** OFF flag that would have caught a live bug —
see **H3** (`src/lib/data/pkmn-dex-fallback.ts:82-85`), where `types[0]` on a possibly-empty array is
typed `PokemonType` but can be `undefined` at runtime. That is a genuine latent crash in the stat path,
and `noUncheckedIndexedAccess` flags it directly.

**Recommended migration path (cheap, avoids the 400-error cliff):**

1. Add two helpers and let them absorb the boilerplate:
   ```ts
   // src/lib/db.ts
   export function firstRow<T = Record<string, unknown>>(rows: Record<string, unknown>[]): T | null {
     return (rows[0] as T | undefined) ?? null;
   }
   ```
   Converting the ~40 `if (rows.length === 0) … rows[0]` sites to `const row = firstRow(rows); if (!row) …`
   removes the single biggest noise bucket *and* is a readability win independently of the flag.
2. Then turn the flag on in a dedicated commit with a real `next build` behind it, exactly as VGC-261
   handled the other five flags.
3. If step 1 feels too large for one pass: a second `tsconfig.lib.json` that `extends` the root, sets
   `noUncheckedIndexedAccess: true` and `include`s only `src/lib/**` would gate the business logic now
   (the lib surface is only ~60 index reads) and let the API routes follow later. Add it as a separate
   `npm run typecheck:lib` in CI.

---

## 2. HIGH risk

### H1 — Unvalidated `/api/share/{id}` response cast straight into `ShareableState`

**`src/hooks/useShareUrl.ts:187` → `:200` → `:208`**

```ts
fetch(fetchUrl, { signal: controller.signal })
  .then((r) => (r.ok ? r.json() : null))          // :187  -> `data` is `any`
  .then((data) => {
    ...
    // Strip internal flags before treating as ShareableState
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _editable, _isPublic: _ip, _editToken: _et, _isOwner: _io, _version: _v,
            _collaborators: _c, _forkedFrom: _ff, _redactedFields: _rf, ...state } = data;   // :200
    ...
    settle(state as ShareableState, editable);     // :208
  })
```

**Why it is the highest-value finding.** This is the *primary* load path for every shared report —
`/s/{id}` goes through here, not through the URL codec. Twenty lines below it, the inline-data path does
the right thing:

```ts
decodeShareState(inlineData).then((state) => settle(state))   // :219
```

…and `decodeShareState` (`src/lib/sharing/url-codec.ts:128-141`) runs
`ShareableStateSchema.safeParse(parsed)` and **fails closed** (`return null`). VGC-146's changelog entry
says the codec "previously trusted decoded JSON blindly via an unchecked TypeScript cast". The same
sentence is still true of the API path. The schema already exists, is already lazily importable, and is
already proven on the sibling path — this is a 4-line fix, not a design change.

The cast is not cosmetic. `state` reaches `handleRemoteUpdate`-shaped consumers and the report renderer;
`useHomePage.ts:468` defends `matchupPlans` (`Array.isArray(state.matchupPlans) ? … : []`) but
`setNotesFull(state.notes ?? {})` and the rest only defend against `null`/`undefined`, not against
`notes` being a string or `calcs[k]` being a number. A shape that survives `?? {}` but not rendering
produces a white-screen on `/s/{id}`, outside the `.catch(() => settle(null))`, because the throw happens
in React's render pass rather than in the promise chain.

**Fix** (mirror the codec path exactly):
```ts
.then(async (data) => {
  if (!data) return settle(null);
  /* …internal-flag handling unchanged… */
  const { ShareableStateSchema } = await import("@/lib/sharing/url-codec.schemas");
  const parsed = ShareableStateSchema.safeParse(state);
  return settle(parsed.success ? parsed.data : null, editable);
})
```
The dynamic `import()` is required — see the "Rules for this file" block in `url-codec.schemas.ts`; a
static import here would re-add ~63 kB gzip of zod to `/` and undo VGC-256. `useShareUrl` is in the
homepage client graph, so this is load-bearing.

**Conflict risk:** low. `useShareUrl.ts` is not in `.swarm/main-changed-files.md`.

---

### H2 — SSE payload destructured from `any`, then cast into report state

**`src/hooks/useCollaborativeSync.ts:94` and `:111`**

```ts
es.addEventListener("version", (e) => {
  try {
    const { version, state } = JSON.parse(e.data);      // :94  — both are `any`
    if (version <= versionRef.current) return;          // :95
    ...
    versionRef.current = version;                       // :108
    ...
    onRemoteUpdateRef.current(state as ShareableState); // :111
```

Two distinct defects in four lines:

**(a) `version` is `any` and feeds the loop guard.** `version <= versionRef.current` with
`version === undefined` evaluates to `false` (NaN comparison), so execution falls through and
`versionRef.current` is assigned `undefined`. Every subsequent event then also compares `false`, so the
guard is permanently disabled and every tick re-applies remote state. That is precisely the amplifier
described in the file's own comment at `:99-104` — *"That feedback loop is what created 98,905 versions
on a single share."* The guard that was added to stop the incident is itself typed `any`. A string
`version` is equally bad: `"10" <= 9` is `false`, so `"10"` then `"9"` both apply.

**(b) `state as ShareableState`** — same unvalidated cast as H1, on a different transport, and the
`try/catch` does **not** cover it: `onRemoteUpdateRef.current` only calls React setters, so any shape
error surfaces during the *next* render, outside this `try`.

**Fix** (minimal, no new dependency, guard (a) is two lines):
```ts
const payload: unknown = JSON.parse(e.data);
if (typeof payload !== "object" || payload === null) return;
const { version, state } = payload as { version?: unknown; state?: unknown };
if (typeof version !== "number" || !Number.isFinite(version)) return;
if (version <= versionRef.current) return;
...
const { ShareableStateSchema } = await import("@/lib/sharing/url-codec.schemas");
const parsed = ShareableStateSchema.safeParse(state);
if (!parsed.success) return;                       // drop the frame, keep the stream
onRemoteUpdateRef.current(parsed.data);
```
(the listener needs to become `async`, or hoist the schema import to the effect body once per connection).

The presence listener at **`:123`** has the same `any` destructure —
`const { collaborators: count } = JSON.parse(e.data); setCollaborators(count);` — pushing `any` into a
numeric state. Lower impact (a bad value renders as garbage, does not crash), but fix it in the same pass
with `typeof count === "number"`.

**Conflict risk:** low. Not in the churn list.

---

### H3 — `entry.types as PokemonType[]` then `types[0]` with no empty-array guard

**`src/lib/data/pkmn-dex-fallback.ts:82-85`** (and the identical mega path at **`:138-141`**)

```ts
const types = entry.types as PokemonType[];                 // :82
const typesTuple: PokemonData["types"] = types.length >= 2
  ? [types[0], types[1]]
  : [types[0]];                                             // :85  -> [undefined] is possible
```

**Why it is risky.** `entry.types` arrives from `getSpecies()` in `src/lib/data/dex-subset.ts`, where
`decodeSpecies` builds it with `splitList(types)`, and `splitList` *deliberately* returns `[]` for an
empty string (`:112-116`: `"" must decode to [] — "".split("|") yields [""], which would surface a
phantom empty ability/type`). So `types.length === 0` is a reachable state by that function's own
contract. When it happens, `[types[0]]` is `[undefined]` **typed as `[PokemonType]`**, and `undefined`
flows into the defensive type chart, type badges and `getEffectiveness`.

Note the asymmetry: the function right above guards the sibling field —
```ts
const baseStats = entry.baseStats as StatSpread;
if (!baseStats || (baseStats.hp === 0 && baseStats.atk === 0)) { … return null; }   // :73-79
```
…explicitly as "belt-and-braces". `types` gets no equivalent. The `as PokemonType[]` cast is what hides
it: it asserts both the element type (unchecked — a future `"Stellar"` from @pkmn/dex would pass) and,
combined with `noUncheckedIndexedAccess` being off, the non-emptiness.

**Fix** (mirror the `baseStats` guard, 3 lines, at both sites):
```ts
const types = entry.types as PokemonType[];
if (types.length === 0) { pokemonCache.set(key, null); return null; }
const typesTuple: PokemonData["types"] = types.length >= 2 ? [types[0], types[1]] : [types[0]];
```
Stronger variant: validate elements against the 18-member `PokemonType` union instead of casting —
`src/lib/parser/showdown-parser.ts:110-113` already has the right pattern
(`if (POKEMON_TYPES.includes(tt as PokemonType))`). Exporting `POKEMON_TYPES` from the parser (or moving
it to `src/lib/data/`) and filtering on it here would make the cast honest.

**Conflict risk:** low. Not in the churn list.

---

### H4 — `ChampionsMetaResult` crosses two boundaries unvalidated, on both sides

**`src/lib/cache.ts:35`** + **`src/app/api/champions/meta/route.ts:31`** + **`src/components/champions/MetaSnapshot.tsx:38`**

```ts
// src/lib/cache.ts:29-38
export async function cacheGet<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
  const raw = await r.get<unknown>(key);
  if (raw === null || raw === undefined) return null;
  if (!schema) return raw as T;          // :35  — unchecked cast, by design
  ...
}
```
```ts
// src/app/api/champions/meta/route.ts:31
const cached = await cacheGet<ChampionsMetaResult>(CACHE_KEY);     // no schema passed
```
```ts
// src/components/champions/MetaSnapshot.tsx:38
const json = await res.json() as ChampionsMetaResult;              // no validation
```

`cache.ts` is honest about this in its own docstring: *"Without a schema, the value is returned as-is and
the generic is just an unchecked cast (VGC-146)."* The optional-schema parameter was added by VGC-146
precisely for this, and **not one of the 6 call sites passes a schema**.

Most of the other five are harmless because they ask for a weak type (`cacheGet<unknown>`,
`cacheGet<Record<string, unknown>>`, `cacheGet<{ spotlight: unknown }>`, `cacheGet<string>`) — the cast
can't lie about much. `champions/meta` is the exception: it asks for a **fully-structured**
`ChampionsMetaResult` and then serves it straight to the client, which casts it a second time without
validation. With `TOP_POKEMON`-class TTLs (minutes), any deploy that changes the shape of
`ChampionsMetaResult` has a window in which stale Redis entries of the *old* shape are served as the
*new* type, through two casts, to a component that reads nested fields. Classic deploy-window
white-screen.

**Fix.** Define the schema once beside the type and use it on both sides:
```ts
// where ChampionsMetaResult lives
export const ChampionsMetaResultSchema = z.object({ /* … */ });
export type ChampionsMetaResult = z.infer<typeof ChampionsMetaResultSchema>;

// route.ts:31
const cached = await cacheGet(CACHE_KEY, ChampionsMetaResultSchema);  // stale shape -> cache miss -> recompute
// MetaSnapshot.tsx:38
const parsed = ChampionsMetaResultSchema.safeParse(await res.json());
if (!parsed.success) { setError(true); return; }
```
The server side is a one-line change and the mechanism (`safeParse` → `null` → treated as a cache miss →
recompute) is already built into `cacheGet`. Do that one even if the client-side change waits.

**Conflict risk:** low.

---

### H5 — `Record<string, string>` declared over raw JSONB, on the public read path

**`src/lib/utils/normalize-report.ts:83-84`**

```ts
export function normalizeReportData(data: AnyRecord): AnyRecord {   // AnyRecord = Record<string, unknown>
  ...
  const notes: Record<string, string> = { ...(data.notes ?? {}) };   // :83
  const spreadNotes = data.spreadNotes ?? {};                        // :84
  for (const [species, spreadNote] of Object.entries(spreadNotes)) {
    if (typeof spreadNote === "string" && spreadNote.trim()) {
      const existing = notes[species] ?? "";
      if (existing && !existing.includes(spreadNote)) {              // :85-88  .includes() on a non-string
```

**Why it is risky.** `data` is the raw `shares.data` JSONB column, cast in at
`src/app/api/share/[id]/route.ts:227` (`rows[0].data as Record<string, unknown>`) and `:163`. The
annotation on `:83` is doing the work of an assertion: TS accepts it because spreading `unknown` yields
`{}`, which is vacuously assignable to `Record<string, string>` — so from line 84 onward the compiler
believes every value in `notes` is a `string` and checks nothing.

At runtime:
- `data.notes` a **string** → `{ ...​"ab" }` is `{0:"a",1:"b"}`, silently producing index-keyed notes.
- `data.notes` an **array** → same index-keying.
- a note **value** being an object/number → `existing.includes(spreadNote)` on `:87` throws
  `TypeError: existing.includes is not a function`, 500-ing `GET /api/share/{id}`. And the value is
  spread into the response at `:99`, so a non-string note also reaches React as a child
  ("Objects are not valid as a React child") on `/s/{id}`.

Note this file is *otherwise* exemplary — `migrateCalcEntries` (`:10-25`) and `migratePlan` (`:28-69`)
are thoroughly defensive with `typeof`/`Array.isArray` on every field. `notes` is the one field that
skipped the treatment, and the type annotation is why nobody noticed.

Mitigating factor: `POST /api/share` is zod-validated (`ShareBodySchema`, enforced at
`src/app/api/share/route.ts:103-108`) with `notes: z.record(z.string(), z.string())`, so rows written by
the current client are well-formed. The exposure is legacy rows predating the schema, and rows written by
`/api/migrate`.

**Fix** (match the style of the two functions beside it):
```ts
const rawNotes = data.notes;
const notes: Record<string, string> = {};
if (rawNotes && typeof rawNotes === "object" && !Array.isArray(rawNotes)) {
  for (const [k, v] of Object.entries(rawNotes)) {
    if (typeof v === "string") notes[k] = v;
  }
}
```

**Conflict risk:** low (`normalize-report.ts` not in the churn list), but it is read by
`src/app/api/share/route.ts` which **is** (2 touches).

---

## 3. MEDIUM risk

### M1 — `event.data as unknown as ClerkUserCreatedData` then unguarded property chain
**`src/app/api/webhooks/clerk/route.ts:46-50`**
```ts
const data = event.data as unknown as ClerkUserCreatedData;
const primaryEmail = data.email_addresses.find(
  (addr) => addr.id === data.primary_email_address_id,
);
```
A double cast through `unknown` deliberately discards whatever type `verifyWebhook` returns, then calls
`.find` on `email_addresses` with no array check. A `user.created` payload shape change, or an event
whose `data` lacks `email_addresses`, throws. Signature verification happens first (`:38`), so this is a
trusted-but-unversioned boundary, and the outer `try/catch` returns HTTP 200 — so the real consequence is
**silent loss of Day-0 welcome emails** with only a `console.error`, not a user-visible crash. That is
arguably worse for diagnosis.

**Fix:** narrow instead of casting —
`if (!Array.isArray(data.email_addresses)) { console.warn(...); return NextResponse.json({ ok: true }); }`
— or give it a small zod schema; the repo already uses zod in 23 route files.

### M2 — Same column typed `string` in one file and `Date` in another; both via unchecked `as`
**`src/app/api/bot/route.ts:7` and `:9`** vs **`src/app/api/match-log/route.ts:15`**
```ts
// bot/route.ts:7
interface FeedbackRecentRow { type: string; title: string; submitter_name: string | null; created_at: string; }
// bot/route.ts:9
interface FeedbackBugRow { title: string; submitter_name: string | null; created_at: string; }
// match-log/route.ts:15
interface MatchLogRow { …; logged_at: Date; }
```
applied as `(await sql\`…\`) as FeedbackRecentRow[]` (`:86`, `:92`, `:195`, `:219`) and
`as MatchLogRow[]` (`match-log/route.ts:123`).

`feedback.created_at` is `TIMESTAMPTZ` and the Neon serverless driver parses timestamptz to a **`Date`**,
so `created_at: string` is wrong and `logged_at: Date` is right — two files disagree about the same
column family and the compiler cannot referee, because both are unchecked assertions over
`Record<string, any>[]`.

Currently benign: the only consumers are `new Date(r.created_at)` (`:147`, `:222`), and `new Date(Date)`
works. But the declaration is a loaded gun — the next person to write `r.created_at.slice(0, 10)` or
`r.created_at.split("T")` gets a green `tsc` and a runtime `TypeError`.

**Fix:** `created_at: Date` in both interfaces, and drop the now-redundant `new Date(...)` wrapper.

### M3 — The `(row.x as Date).toISOString()` cluster (38 sites)
Representative: **`src/app/api/user/collaborations/route.ts:48-51`**,
**`src/app/api/user/collections/[id]/route.ts:44-47`**, **`src/app/api/explore/route.ts:318-338`**,
**`src/app/s/[id]/page.tsx:207-208`**.
```ts
createdAt: (row.created_at as Date).toISOString(),
invitedAt: (row.invited_at as Date).toISOString(),
```
Every timestamp column in `src/lib/db.ts` is declared `TIMESTAMPTZ DEFAULT NOW()` — **`DEFAULT`, not
`NOT NULL`** — so each is nullable at the schema level, and `as Date` asserts it is not. A single NULL
produces `TypeError: Cannot read properties of null (reading 'toISOString')` → HTTP 500 on a list
endpoint.

**I checked and could not find a reachable NULL today**, which is why this is MEDIUM and not HIGH:
every join in these routes is `INNER JOIN` (`collaborations/route.ts:31`,
`collections/[id]/route.ts:27`), the one `LEFT JOIN` on a nullable aggregate wraps it in `COALESCE`
(`collections/route.ts:48-54`), nothing inserts an explicit NULL into a `_at` column, and the one
genuinely-nullable read is correctly guarded —
`...(row.deleted_at ? { deletedAt: (row.deleted_at as Date).toISOString() } : {})`
(`user/reports/route.ts:58`). The codebase is doing the right thing by convention; it is just not
*enforced* anywhere.

**Fix (cheap, type-level):**
```ts
// src/lib/db.ts
export const isoOrNull = (v: unknown): string | null =>
  v instanceof Date ? v.toISOString() : typeof v === "string" ? v : null;
```
then `createdAt: isoOrNull(row.created_at)`. 38 mechanical replacements, removes the whole class, and
makes the nullability explicit in the response type. **Fix (belt-and-braces):** add
`NOT NULL DEFAULT NOW()` to the timestamp columns in a migration — but check `db.ts`'s
`ALTER TABLE … ADD COLUMN IF NOT EXISTS` idempotence story first.

**Conflict risk:** `src/app/api/explore/route.ts` has **2 touches** on main — mark conflict-risk.

### M4 — `result as StatSpread` on a `Partial<StatSpread>` built from a hand-written key list
**`src/lib/analysis/stat-calculator.ts:58` and `:74`**
```ts
const stats: StatName[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const result: Partial<StatSpread> = {};
for (const stat of stats) { result[stat] = calculateStat(stat, …); }
return result as StatSpread;      // :58  (and :74 for the Champions variant)
```
Correct **today** — the literal list covers all six `StatName` members. The risk is that the array is a
`StatName[]`, not an exhaustive tuple, so if `StatName`/`StatSpread` ever gains a member, this file keeps
compiling and `calculateAllStats` silently returns an object with `undefined` in the new slot, typed as
`number`. That propagates into `calculateChampionsStat` arithmetic as `NaN` and renders as a blank or
`NaN` stat. The same hardcoded six-key array is repeated at `:45`, `:59` (sic, inside
`calculateAllChampionsStats`), `:206` and in at least 6 `.tsx` files.

**Fix** — make the list the single source of truth and exhaustiveness-checked:
```ts
export const STAT_ORDER = ["hp", "atk", "def", "spa", "spd", "spe"] as const
  satisfies readonly StatName[];
// and build without the cast:
return Object.fromEntries(
  STAT_ORDER.map((s) => [s, calculateStat(s, baseStats[s], ivs[s], evs[s], level, nature)]),
) as StatSpread;   // still a cast, but now one that STAT_ORDER's `satisfies` keeps honest
```
A stricter version types `StatSpread = Record<StatName, number>` and builds via a reduce seeded with a
zeroed literal, eliminating the cast entirely.

**Conflict risk: HIGH — `src/lib/analysis/stat-calculator.ts` has 2 touches on main**, and
`src/components/report/{PokemonCard,PokemonDetailSlide,SpeedTierChart}.tsx` (all `convertToChampionsSp`
consumers) have 2–3 each. Coordinate before touching.

### M5 — Inferred return type silently widens to `any`
**`src/lib/linear.ts:14` and `:32-37`**
```ts
async function linearQuery(query: string, variables?: Record<string, unknown>) {   // no return type
  ...
  const data = await res.json();          // :32  -> `any`
  if (data.errors?.length) {
    throw new Error(`Linear GraphQL error: ${data.errors[0].message}`);
  }
  return data.data;                        // :37  -> inferred Promise<any>
}
```
This is exactly the category-4 case the audit asked for: no annotation, so inference widens to `any`, and
**every** call site inside `linear.ts` (including the exported `createLinearIssue` at `:84`) gets `any`
with no cast anywhere for grep to find. `data.errors[0].message` is itself an unguarded index + property
read on `any`.

Lower blast radius than H1–H5 (internal tooling / feedback→Linear plumbing, not a user-facing render
path), but it is the clearest instance of the pattern and the cheapest fix.

**Fix:** annotate the boundary —
```ts
async function linearQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const data: unknown = await res.json();
  const body = data as { data?: T; errors?: { message?: string }[] };
  if (body.errors?.length) throw new Error(`Linear GraphQL error: ${body.errors[0]?.message ?? "unknown"}`);
  return body.data as T;
}
```

### M6 — Proxy `get` trap typed `prop: string` when the runtime value can be a `symbol`
**`src/lib/i18n/index.ts:80-86`**
```ts
return new Proxy(translations as Record<string, string>, {
  get(target, prop: string) {              // :81  — real signature is string | symbol
    const v = target[prop];
    if (typeof v === "string" && v.length > 0) return v;
    return (en as unknown as Record<string, string>)[prop];   // :84
  },
}) as TranslationKeys;
```
Two unsound steps. `ProxyHandler.get` declares `p: string | symbol`; narrowing it to `string` is accepted
only because `get` is declared as a **method**, so TS checks its parameters bivariantly —
`strictFunctionTypes` (which *is* on) explicitly does not apply to method-shorthand parameters. Any
symbol access on the proxy (`Symbol.toPrimitive`, `Symbol.iterator`, `util.inspect.custom`, React's
internal probes, or `JSON.stringify`'s `toJSON` lookup — that last one is a string but still absent)
reaches `target[prop]` as `undefined` and falls through to `en[prop]`, also `undefined`.

Separately, `translations as Record<string, string>` asserts every `TranslationKeys` value is a string.
The `typeof v === "string"` check at `:83` means non-string values degrade gracefully rather than crash —
so this is a correctness/robustness issue, not a crash, hence MEDIUM.

**Fix:**
```ts
get(target, prop) {
  if (typeof prop !== "string") return Reflect.get(target, prop);
  const v = (target as Record<string, unknown>)[prop];
  if (typeof v === "string" && v.length > 0) return v;
  return (en as unknown as Record<string, unknown>)[prop];
}
```

### M7 — `undoRedo.undo() as FullUndoSnapshot | null`
**`src/hooks/useHomePage.ts:228` and `:232`**
```ts
restoreSnapshot(undoRedo.undo() as FullUndoSnapshot | null);
restoreSnapshot(undoRedo.redo() as FullUndoSnapshot | null);
```
`useUndoRedo` is generic over the snapshot type; casting at the consumer rather than instantiating the
hook as `useUndoRedo<FullUndoSnapshot>(…)` means the push and pop sides are never checked against each
other. If a snapshot gains a field, `restoreSnapshot` reads `undefined` with no compiler complaint, and
an undo silently blanks part of the report.

**Fix:** parameterise the hook at the call site and delete both casts.

**Conflict risk: HIGH — `src/hooks/useHomePage.ts` is the single most-churned file (4 touches on main).**

---

## 4. LOW risk

| # | Location | Code | Assessment |
|---|---|---|---|
| L1 | `src/lib/data/dex-subset.ts:105` | `const subset = rawSubset as unknown as PackedDexSubset;` | **Pragmatic, and correctly defended.** A double cast over a `resolveJsonModule` import — but there is a real runtime gate at `:145-148` (`if (subset.schemaVersion !== SCHEMA_VERSION) throw`), bumped in lockstep with `scripts/build-dex-subset.mjs`. This is how a JSON cast should be done. No action. |
| L2 | `src/lib/consent.ts:22-24` | `const value = JSON.parse(…); return Array.isArray(value?.categories) && value.categories.includes(…)` | `JSON.parse` → implicit `any`, but fully guarded by `Array.isArray` inside a `try/catch`. Boundary-pragmatic. Optional tidy: `const value: unknown = JSON.parse(…)` to match the url-codec house style. |
| L3 | `src/hooks/useMatchupPlans.ts:124` | `const parsed: LegacyPlan[] = JSON.parse(raw);` | Annotation-as-assertion over `localStorage`, which is the scariest-*looking* pattern in the repo — but both call sites (`:143`, `:156`) wrap `loadAndMigrate` in `try/catch` with an `[]` fallback, so a non-array parse throws `TypeError` and degrades correctly. Change the annotation to `unknown` + `Array.isArray` for clarity, not for safety. |
| L4 | `src/hooks/useTeamMeta.ts:89`, `:109` | `return stored ? JSON.parse(stored) : EMPTY_META;` | `any` into `useState<TeamMeta>`. In `try/catch`, so a throw is absorbed — but unlike `NotificationsContent.tsx:49` (`{ ...DEFAULT_PREFS, ...parsed }`), it does **not** merge over defaults, so a stale-schema entry yields `undefined` where a `string` is typed. **Fix: `{ ...EMPTY_META, ...JSON.parse(stored) }`** — one-line, and it is the pattern already used elsewhere in the repo. |
| L5 | `src/hooks/usePokemonNotes.ts:21`, `:41`; `useHiddenSlides.ts:19`, `:35`; `useDamageCalcs.ts:52`, `:72` | `JSON.parse(stored)` | All `try/catch`-wrapped with correct fallbacks. `useHiddenSlides` is safe because `new Set(nonIterable)` throws into the catch. `useDamageCalcs` is safe because `migrateCalcs` (`:22-41`) takes `raw: unknown` and validates every level — **this is the model implementation**; H5 and L4 should look like it. |
| L6 | `src/app/page.tsx:639` | `setViewOverrideTheme(sharedState.genTheme as GenTheme)` | Unsafe-looking cast of a `z.string().optional()` schema field to a 9-member union — **defused downstream**: `setViewOverrideTheme` (`useTheme.ts:164`) re-guards with `themeId in GEN_PRESETS ? themeId : null`, so `GEN_PRESETS[effective]` at `:152` cannot be `undefined`. Correct, but defence-in-depth by luck. Proper fix: tighten `genTheme` to `z.enum([...])` in `url-codec.schemas.ts` and delete the cast. **Conflict risk: `src/app/page.tsx` 4 touches, `url-codec.schemas.ts` 1 touch.** |
| L7 | `src/hooks/useExploreUrlSync.ts:55-56` | `params.get("sort") as FilterState["sort"]` | Casts `string \| null` to a non-nullable union — but each is immediately validated by an `includes()` allowlist with a default (`:59-65`). Safe. Cleaner as a `const isSort = (v: string \| null): v is FilterState["sort"] => …` type guard. |
| L8 | All 6 non-null assertions: `SpeedTierChart.tsx:21`, `:192`; `TeamStats.tsx:32`; `ReportCard.tsx:297`; `api/sync/[id]/route.ts:26`; `security/bot-detection.ts:51` | `map.get(k)!`, `mon.itemBoost!`, `p.data!`, `report.tags!` | **No finding — I verified every one.** `:21` and `sync:26` follow `if (!map.has(k)) map.set(k, …)`. `:192` follows `hasSpeedBoost = mon.itemBoost?.stat === "spe"`. `TeamStats:32` follows `.filter((p) => p.data?.baseStats)` (filter isn't a type guard, so the `!` is idiomatic). `ReportCard:297` follows `hasTagsSection = !!report.tags?.eventType` (`:160`). `bot-detection.ts:51` is a regex negative-lookahead `(?!.*lighthouse)`, not an assertion at all. Optional polish only: `:192` reads better as `mon.itemBoost?.multiplier ?? 1`. |
| L9 | Exported `src/lib/` fns with no return type: `i18n/index.ts:47` (`I18nProvider`), `:97` (`useTranslation`), `posthog-server.ts:31` (`captureServerEvent`), `notifications.ts:9` (`createNotification`), `:29` (`notifyFollowers`) | — | Only **6** exported lib functions lack an explicit return type and 5 of them infer something stable and narrow (`ReactElement`, `I18nContextValue`, `void`, `Promise<void>`) — no widening risk. The 6th is `linear.ts:14`, promoted to **M5** because it widens to `any`. Worth adding annotations for consistency; not a bug. |

### Suppressions — all 16 reviewed, none stale-and-dangerous

- **6 × `@next/next/no-img-element`** (`TeamCardExport.tsx:151,293`, `Navbar.tsx:724`,
  `team-graphic/route.tsx:280,471`, `champions/[pokemon]/opengraph-image.tsx:146`, `s/[id]/opengraph-image.tsx:164`,
  `embed/[id]/page.tsx:67`) — all in `ImageResponse`/html2canvas/OG contexts where `next/image` genuinely
  cannot be used. **Still needed.**
- **8 × `react-hooks/exhaustive-deps`** (`useHomePage.ts:91,220`, `useExploreUrlSync.ts:138`,
  `useShareUrl.ts:228`, `page.tsx:357`, + others) — each has an adjacent comment explaining the omitted
  dep (e.g. `useShareUrl.ts:226`: *"editKeyFromUrl is intentionally not a dependency…
  history.replaceState strips it immediately"*). **Justified**, though `useHomePage.ts` carries 2 of them
  and is the highest-churn file in the repo — these are the ones most likely to rot.
- **1 × `@typescript-eslint/no-unused-vars`** (`useShareUrl.ts:199`) — covers the deliberate
  `const { _editable, _ip, … , ...state } = data` internal-flag strip. **Still needed** (and note:
  enabling `noUnusedLocals` would re-break this line at the compiler level, where an eslint-disable
  cannot help it — another reason to leave that flag off).
- **1 × `jsx-a11y/no-static-element-interactions`** (`page.tsx:1673`) — out of scope for this audit;
  flag to the a11y pass.
- **0 `@ts-ignore`, 0 `@ts-expect-error`.** Nothing to clean up.

---

## 5. Unvalidated external input — boundary-by-boundary

| Boundary | Validation | Verdict |
|---|---|---|
| `POST /api/share` body | `ShareBodySchema.safeParse` (`route.ts:103-108`), + `apiGuard` rate-limit + `maxBodySize` | **Correct.** Model for the rest. |
| 23 other API route bodies | zod in all 23 files that take a body (`grep 'from "zod"'` → 23 route files) | **Correct.** Coverage is effectively complete on inbound bodies. |
| Share URL fragment → `ShareableState` | `ShareableStateSchema.safeParse`, fails closed (`url-codec.ts:136-140`) | **Correct.** The reference implementation. |
| **`GET /api/share/{id}` → `ShareableState`** | **none** | **H1 — the gap.** Same destination type, no schema. |
| **SSE `/api/sync/{id}` → `ShareableState`** | **none** | **H2 — the gap.** |
| Redis → `ChampionsMetaResult` | `cacheGet` supports a schema; none passed | **H4.** |
| `shares.data` JSONB → report | `normalizeReportData` is defensive for `calcs`/`matchupPlans`/`hiddenSlides`, **not** for `notes` | **H5.** |
| `searchParams` | **No `as` casts on `searchParams.get()` anywhere** (verified by grep). Numeric reads go through `Number(...)` with NaN-safe comparisons (`share/[id]/route.ts:220`) | **Clean.** |
| `localStorage` / `sessionStorage` (7 hooks) | `try/catch` + fallback everywhere; `migrateCalcs` fully validates | **Acceptable** (L3–L5). `useTeamMeta` should merge over defaults. |
| Discord interaction webhook | Ed25519 `nacl.sign.detached.verify` **before** `JSON.parse` (`discord/route.ts:85-95`) | **Correct.** Post-verification `any` is a trusted boundary. |
| Linear webhook | HMAC + `timingSafeEqual` + replay window **before** parse (`webhooks/linear/route.ts:44-73`) | **Correct.** |
| Clerk webhook | `verifyWebhook` then `as unknown as` + unguarded `.find` | **M1.** |
| Neon rows | none — `Record<string, any>` by driver design | **M2, M3.** |

**The one architectural recommendation:** `ShareableStateSchema` exists, is proven, and is already
lazy-loadable without a bundle cost. Three transports deliver that exact type — URL fragment, REST GET,
SSE — and only the first validates. Routing all three through the schema closes H1 and H2 together and
finishes VGC-146.

---

## 6. Conflict risk vs. `.swarm/main-changed-files.md`

Branch was 0 ahead / 0 behind `origin/main` at run start; last commit 2026-08-24 (`70c4633`).

**Findings in high-churn files — coordinate before editing:**

| Finding | File | Touches on main |
|---|---|---|
| M7 | `src/hooks/useHomePage.ts` | **4** (most-churned file in repo) |
| L6 | `src/app/page.tsx` | **4** |
| M4 | `src/lib/analysis/stat-calculator.ts` | **2** (+ its test, 2) |
| M3 (partial) | `src/app/api/explore/route.ts` | **2** |
| H5 (consumer) | `src/app/api/share/route.ts` | **2** |
| L6 (fix site) | `src/lib/sharing/url-codec.schemas.ts` | **1** |
| M4 (consumers) | `src/components/report/{PokemonDetailSlide,SpeedTierChart}.tsx` | **3 / 2** |

**Findings in low-churn files — safe to take now:** H1 (`useShareUrl.ts`), H2 (`useCollaborativeSync.ts`),
H3 (`pkmn-dex-fallback.ts`), H4 (`cache.ts`, `champions/meta/route.ts`, `MetaSnapshot.tsx`),
H5 (`normalize-report.ts`), M1 (`webhooks/clerk/route.ts`), M2 (`bot/route.ts`, `match-log/route.ts`),
M5 (`linear.ts`), M6 (`i18n/index.ts`). **All five HIGH findings are conflict-free.**

---

## 7. Suggested order of work

1. **H1 + H2 together** — one commit, one mechanism (`ShareableStateSchema` on all three transports).
   Finishes VGC-146. Conflict-free. H2's `typeof version !== "number"` guard also hardens the code path
   that caused the 98,905-version incident, which makes it the highest-value two lines in this report.
2. **H3** — 3 lines × 2 sites in `src/lib/`, conflict-free, closes a real `undefined`-as-`PokemonType`
   path in the stat pipeline. Add a vitest case next to it per the repo convention
   (`src/lib/data/__tests__/`): a species with empty `types` must return `null`, not `[undefined]`.
3. **H4 server side** — one line (`cacheGet(CACHE_KEY, ChampionsMetaResultSchema)`), eliminates the
   deploy-window stale-shape window. Client side can follow.
4. **H5** — replace the `Record<string, string>` annotation with the validating loop; add a regression
   test naming the bug (a `notes` value that is not a string must be dropped, not rendered).
5. **M3** — the `isoOrNull` helper + 38 mechanical call-site edits. Do it as its own commit; it touches
   `explore/route.ts` (churn 2), so rebase first.
6. **M1, M2, M5, M6, L4** — small independent cleanups, batch into one `chore:` commit.
7. **M4** — `STAT_ORDER` + `satisfies`. Coordinate first: `stat-calculator.ts` and three report
   components are all actively churning.
8. **`noUncheckedIndexedAccess`** — only after the `firstRow()` helper lands (step: see §1). Separate
   commit, real `next build` behind it, exactly as VGC-261 handled the other five flags.

Per CLAUDE.md: every one of these needs `verification-gate` (tsc cold + vitest + build) before commit,
new `src/lib/` logic gets a test beside it in `__tests__/`, and nothing is pushed without an explicit
user signal.

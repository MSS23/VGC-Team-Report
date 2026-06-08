# TypeScript Strictness Audit — 2026-06-08

**Subagent:** C2
**Scope:** `src/**/*.ts(x)` (excluding recently-changed conflict files)
**Mode:** Read-only

## TL;DR

- `tsconfig.json` has `strict: true` but is missing `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride`. No `noImplicitAny` override since `strict` includes it — good.
- **Zero literal `any` types** found in `src/` (great — every offender lives in comments).
- **Zero `@ts-ignore` / `@ts-expect-error`** directives anywhere in `src/` — excellent discipline.
- **Three `as unknown as` casts** (escape hatches at boundaries — mostly justified).
- The real strictness gap is the **`as Record<string, unknown>` smell** in DB-row handling, repeated ~30+ times across API routes. Each one is a place TS has dropped to "trust me bro" semantics on data shaped by Postgres/JSONB or untrusted webhook payloads.
- Exported route handlers and hooks are missing explicit return types (idiomatic for Next.js, but many helper hooks should be explicit).

---

## High-priority fixes (would catch real bugs)

### 1. `useTeamMeta.ts:75` — Unvalidated `JSON.parse` written directly into typed state

`/home/user/VGC-Team-Report/src/hooks/useTeamMeta.ts:71-78`

```ts
const [meta, setMeta] = useState<TeamMeta>(() => {
  if (!persist || speciesKeys.length === 0) return EMPTY_META;
  try {
    const stored = localStorage.getItem(teamKey);
    return stored ? JSON.parse(stored) : EMPTY_META;   // ← any → TeamMeta
  } catch {
    return EMPTY_META;
  }
});
```

**Risk:** Any malformed/legacy `vgc-meta-v2-*` localStorage payload (the v1→v2 migration was less than two months ago) will be force-fitted into `TeamMeta`. Downstream `meta.roles[species]` will crash when `roles` is missing or not an object. This whole hook is the path that re-loads after a key change too (`:95`).

**Fix:** Validate shape with a zod schema or hand-roll a guard:
```ts
const parsed = JSON.parse(stored);
return (parsed && typeof parsed === "object" && typeof parsed.roles === "object")
  ? parsed as TeamMeta : EMPTY_META;
```

Same pattern occurs in `useShareUrl.ts:32` (`storeShareInfo`), `usePokemonNotes.ts:21,41`, `useHiddenSlides.ts:19,35`, `useDamageCalcs.ts:52,72`, `useMatchupPlans.ts:125`.

### 2. `useCollaborativeSync.ts:87` — SSE event payload bypass

`/home/user/VGC-Team-Report/src/hooks/useCollaborativeSync.ts:83-101`

```ts
es.addEventListener("version", (e) => {
  if (isSaving.current) return;
  try {
    const { version, state } = JSON.parse(e.data);
    if (version > versionRef.current) {
      versionRef.current = version;
      ...
      onRemoteUpdateRef.current(state as ShareableState);  // ← direct cast
```

**Risk:** An attacker on the network path, or simply a server bug, can push any JSON over the EventSource — and it's directly handed to the React state setter. A typed runtime guard here is the cheapest defense in depth and catches genuine API drift early.

**Fix:** Validate `version` is a finite number and `state` is an object before propagating; ignore otherwise (the `catch` block already swallows parse failures, so adding `if (typeof version !== "number" || !state || typeof state !== "object") return;` is one extra line).

### 3. `useShareUrl.ts:32` — Legacy single-object localStorage path

`/home/user/VGC-Team-Report/src/hooks/useShareUrl.ts:27-44`

```ts
const existing = localStorage.getItem(SHARE_TOKENS_KEY);
let tokens: StoredShareInfo[] = [];
if (existing) {
  const parsed = JSON.parse(existing);
  tokens = Array.isArray(parsed) ? parsed : [parsed];   // ← unsound
}
const idx = tokens.findIndex((t) => t.shareId === info.shareId);
```

**Risk:** If `parsed` is `null`, `42`, or a string (any other primitive), the wrapping `[parsed]` will produce `[null]` and `tokens.findIndex(t => t.shareId === ...)` crashes at runtime (TypeError reading shareId on null). This is the localStorage path that gates *edit access to published reports*, so a corrupt token entry locks the user out.

**Fix:** Guard with `parsed && typeof parsed === "object"` before the array-wrap, and validate each entry has `shareId` + `editToken`.

### 4. `useMatchupPlans.ts:125` — Untyped load + `deduplicateBring` cast

`/home/user/VGC-Team-Report/src/hooks/useMatchupPlans.ts:102-135`

```ts
function deduplicateBring(bring: GamePlan["bring"]): GamePlan["bring"] {
  ...
  return bring.map(...) as GamePlan["bring"];   // ← tuple cast
}
...
function loadAndMigrate(raw: string): MatchupPlan[] {
  const parsed: LegacyPlan[] = JSON.parse(raw);   // ← assertion not validation
```

**Risk:** `bring` is a tuple `[number|null, number|null, number|null, number|null]`. `bring.map(...)` returns `(number|null)[]` not a 4-tuple, then the cast hides the mismatch. If localStorage holds a short legacy `bring` (3 entries from an earlier schema), every downstream consumer that indexes `[3]` gets `undefined` at runtime under `noUncheckedIndexedAccess`-mental-model.

**Fix:** Normalize length explicitly:
```ts
const out: (number|null)[] = bring.map(...);
return [out[0] ?? null, out[1] ?? null, out[2] ?? null, out[3] ?? null];
```

### 5. `app/page.tsx:347` — Response cast inside a route the agent can't recover from

`/home/user/VGC-Team-Report/src/app/page.tsx:345-360`

```ts
const res = await fetch(`/api/share/${shareId}/versions/${version}`);
if (!res.ok) { setCompareLoading(false); return; }
const { data: oldData, editorName: versionEditor } =
  await res.json() as { data: ShareableState; editorName?: string | null };
```

**Risk:** This is the version-compare path. The same server file at `/api/share/[id]/versions/[v]/route.ts` is not shown here — but if it ever returns `{ error: "..." }` with HTTP 200 (Vercel sometimes coerces), `oldData` becomes `undefined` and the rest of the comparison renders broken diffs.

**Fix:** Replace cast with a zod schema (`ShareableStateSchema`) parse + a fall-through that just calls `setCompareLoading(false)`.

### 6. `lib/data/dex-subset.ts:124` — `asPokemonTypes` is an unchecked cast

`/home/user/VGC-Team-Report/src/lib/data/dex-subset.ts:122-125`

```ts
/** Narrow a string[] of types to the typed PokemonType union. */
export function asPokemonTypes(types: string[]): PokemonType[] {
  return types as PokemonType[];
}
```

**Risk:** Function name *implies* narrowing — but it does nothing. If `dex-subset.json` ever contains a regenerated entry with a typo or a brand-new type (Stellar slipped in to gen-9 dex), the entire type chart machinery silently goes off the rails. Cheap fix:
```ts
const ALL = new Set<string>(POKEMON_TYPES);
return types.filter((t): t is PokemonType => ALL.has(t));
```

### 7. `lib/cache.ts:99` — `result[1] as string[]` from Redis SCAN

`/home/user/VGC-Team-Report/src/lib/cache.ts:96-103`

```ts
const result = await r.scan(cursor, { match: `${prefix}*`, count: 100 });
cursor = Number(result[0]);
const keys = result[1] as string[];
if (keys.length > 0) {
  await r.del(...keys);
}
```

**Risk:** Lowish — Upstash's `scan` does return `[string, string[]]`, so the cast is correct *today*. But it has no narrowing, and `keys.length` on a non-array crashes. One-line guard (`Array.isArray(result[1])`) defuses any future SDK signature change.

---

## Medium-priority (cleanups)

### Pervasive `as Record<string, unknown>` on DB rows

Every API route doing JSONB extraction uses the same pattern:
```ts
const data = rows[0].data as Record<string, unknown>;
const creator = (data.creatorName as string) || undefined;   // string|undefined → string
```

Found in (with line numbers):
- `src/app/api/share/[id]/route.ts:22, 76, 148, 197, 245`
- `src/app/api/share/[id]/fork/route.ts:86`
- `src/app/api/share/[id]/collaborators/route.ts:129`
- `src/app/api/share/route.ts:127, 195, 269`
- `src/app/api/sync/[id]/route.ts:134`
- `src/app/api/explore/route.ts:230, 293, 311`
- `src/app/api/migrate/route.ts:53`
- `src/app/api/oembed/route.ts:28`
- `src/app/api/spotlight/route.ts:26`
- `src/app/api/team-graphic/route.tsx:101, 107`
- `src/app/api/creator/[name]/route.ts:95`
- `src/app/api/comments/[shareId]/route.ts:108`
- `src/app/embed/[id]/page.tsx:16`
- `src/app/champions/[pokemon]/page.tsx:138, 152`
- `src/app/s/[id]/page.tsx:31, 32, 166`
- `src/app/s/[id]/opengraph-image.tsx:79, 86`

**Suggested cleanup:** Promote `ShareData` to a real interface in `src/lib/types/share.ts` (it doesn't seem to exist — the existing `ShareableState` is client-side and slightly different), then return `data as ShareData`. The cast still exists, but a single source of truth means a wrong field name fails everywhere instead of being a silent `undefined`.

### `src/lib/utils/normalize-report.ts:7`

`type AnyRecord = Record<string, unknown>` is fine but funcs accept/return `AnyRecord`:
```ts
export function normalizeReportData(data: AnyRecord): AnyRecord
```
Could return `NormalizedReportData` (a hand-rolled interface mirroring the shape the function clearly produces, lines 98-118). Today every caller has to immediately re-cast the result.

### Missing return types on exported hooks

The following exported hooks return inferred objects (40+ call sites depend on the inferred shape):
- `src/hooks/useTeamReport.ts:21` `useTeamReport`
- `src/hooks/useDamageCalcs.ts:44` `useDamageCalcs`
- `src/hooks/useHiddenSlides.ts:11` `useHiddenSlides`
- `src/hooks/usePresentationMode.ts:5`
- `src/hooks/useCreatorMode.ts:5`
- `src/hooks/useShareUrl.ts:78`
- `src/hooks/useWalkthrough.ts:168`
- `src/hooks/usePokemonNotes.ts:13`
- `src/hooks/useShareFlow.ts:18`
- `src/hooks/useAutoDraft.ts:22`
- `src/hooks/useSlideSystem.ts:32`
- `src/hooks/useSlideNavigation.ts:23`
- `src/hooks/useTeamMeta.ts:67`
- `src/hooks/useDarkMode.ts:57`
- `src/hooks/useMatchupPlans.ts:137`
- `src/hooks/useTheme.ts:194`
- `src/hooks/useNotifications.ts:15`
- `src/hooks/useUndoRedo.ts:17`

Not bugs today, but a refactor that subtly drops a field from a returned object won't surface as a compile error until a consumer breaks. Adding `interface UseTeamReportResult` for each takes ~5min/hook and acts as documentation.

### `useShareUrl.ts:187` — `data._forkedFrom as ForkedFromMeta | null`

Cast from a generic fetch response. A misbehaving server could send `{ id: 123 }` (number not string) and the React tree renders broken markup. Suggest a tiny inline guard or zod schema for `_forkedFrom`.

### `lib/i18n/index.ts:83` — `(en as unknown as Record<string, string>)`

Safe enough because `en` is structurally a record-of-strings, but `TranslationKeys` (line 7) may eventually grow nested values. Mark with a comment or constrain `TranslationKeys` to `Record<string, string>`.

### `app/api/discord/route.ts:68` — Implicit `any` swallowed by cast

```ts
const getOption = (name: string) =>
  options.find((o: { name: string }) => o.name === name)?.value as string | undefined;
```
`options` is `body.data?.options ?? []` (any[]), so `o` is annotated only because TS would yell otherwise. The cast on `.value` to `string | undefined` is wishful — Discord interaction options have a typed `value` per option type. Define the interaction shape once.

### `app/api/webhooks/posthog/route.ts:394`

```ts
const elements = properties.$elements as Array<Record<string, unknown>> | undefined;
const selector = properties.$el_text ?? elements?.[0]?.text;
```
`elements?.[0]?.text` is `unknown` after this cast — yet flows into `lines.push(...) \`${selector}\``. String-coerced, so safe, but the cast lies about `text` existing.

---

## Top 5 quick wins

Ranked by (bug-prevention value × ease of fix). Each is implementable in <15 lines changed.

1. **`asPokemonTypes` should actually filter, not cast.** `src/lib/data/dex-subset.ts:122-125`. 3-line change, prevents a class of "Stellar type added to dex, half the app silently breaks" bugs. **Highest signal-to-effort ratio.**

2. **Guard `useTeamMeta` `JSON.parse` with a shape check.** `src/hooks/useTeamMeta.ts:75, 95`. 6-line change (helper `parseTeamMeta`). Removes a real corruption-path crash on legacy localStorage.

3. **Guard SSE payload in `useCollaborativeSync`.** `src/hooks/useCollaborativeSync.ts:87, 105`. Add 2 typeof checks. Defense-in-depth on the live-sync hot path, and the existing `catch` block already covers throws — this is just a refusal to act on garbage.

4. **Guard `storeShareInfo` legacy-format path.** `src/hooks/useShareUrl.ts:27-44`. 4-line change. Fixes a "you've been logged out of your own report" footgun.

5. **Extract `ShareRow` / `ShareData` interface, replace ~20 `as Record<string, unknown>` casts.** `src/lib/types/share.ts` (new) + 5 API routes. Touches >15 lines total but each individual change is one line, and the type centralisation pays dividends for every future API route. Drop this if the 15-line cap is strict — otherwise huge cleanup win.

---

## Notes

- No `@ts-ignore` or `@ts-expect-error` found anywhere. Strong discipline.
- No bare `any` type annotations found. The only `any` matches are in English-prose comments.
- `tsconfig.json` could enable `noUncheckedIndexedAccess` — would surface ~80 latent issues across the codebase but most are array `.find()` / `.[0]` patterns. Worth scheduling for an off-week.

# TypeScript Strictness Audit — 03-06-26

Run date: 2026-06-03
Branch: swarm-nightly-2026-06-03

Prior runs shipped: PR #52 (SEO/metadata), PR #53 (asRecord helper in normalize-report.ts, magic-numbers in InstallPrompt, Linear webhook headers).

---

## Findings

### 1. Unsound type assertion in notifications.ts (line 42)
**File:** `/home/user/VGC-Team-Report/src/lib/notifications.ts:42`
**Snippet:**
```typescript
for (const row of followers) {
  const uid = row.user_id as string;  // ← UNSAFE
```
**Reason:** `followers` from SQL query is untyped. No runtime validation that `user_id` property exists or is a string.
**Proposed fix:** Add explicit Postgres result type or wrap with Zod validation.
**Safety:** Needs ticket — touches data contract boundary.

---

### 2. Unsound type assertions in cache.ts (line 99)
**File:** `/home/user/VGC-Team-Report/src/lib/cache.ts:99`
**Snippet:**
```typescript
const [cursor, keys] = await r.scan(cursor, { match: `${prefix}*`, count: 100 });
const keys = result[1] as string[];  // ← UNSAFE
```
**Reason:** Redis `scan` result tuple is untyped; `result[1]` may not be `string[]`.
**Proposed fix:** Use Redis SDK's typed response: `const { cursor, keys } = await r.scan(...)` or validate.
**Safety:** Needs ticket — cache key extraction could fail silently.

---

### 3. Unsound type assertion in team-graphic/route.tsx (lines 101–107)
**File:** `/home/user/VGC-Team-Report/src/app/api/team-graphic/route.tsx:101–107`
**Snippet:**
```typescript
const data = rows[0].data as Record<string, unknown>;
const paste = (data.paste as string) ?? "";
const tournamentName = (data.tournamentName as string) ?? "";
const placement = (data.placement as string) ?? "";
const creatorName = (data.creatorName as string) ?? "";
const record = (data.record as string) ?? "";
const tags = (data.tags as { archetype?: string[]; regulation?: string; eventType?: string }) ?? {};
```
**Reason:** SQL query returns untyped rows. Chained `as` casts without prior narrowing or validation.
**Proposed fix:** Use `ShareableStateSchema.safeParse()` after PR #53 pattern, or wrap `rows[0].data` in `asRecord()` helper.
**Safety:** Safe to ship — mechanical refactor, no behavior change.

---

### 4. Unsound type assertions in spotlight/route.ts (lines 26, 30, 42, 49, 51–57, 59)
**File:** `/home/user/VGC-Team-Report/src/app/api/spotlight/route.ts:26–59`
**Snippet:**
```typescript
const data = row.data as Record<string, unknown>;
const paste = (data.paste as string) ?? "";
const creatorName = (data.creatorName as string) || undefined;
const likeCount = (likeRows[0]?.count as number) || 0;
const id = row.id as string;
const tournamentName = (data.tournamentName as string) || undefined;
const placement = (data.placement as string) || undefined;
const teamSummary = (data.teamSummary as string) || undefined;
const createdAt = (row.created_at as Date).toISOString();
const updatedAt = (row.updated_at as Date).toISOString();
const viewCount = row.view_count as number;
const commentCount = (commentRows[0]?.count as number) || undefined;
```
**Reason:** Same pattern as team-graphic: untyped SQL rows cast without validation.
**Proposed fix:** Use `asRecord()` helper and add Zod schema for database result shape.
**Safety:** Safe to ship — mechanical refactor.

---

### 5. Unsound type assertion in share/[id]/route.ts (lines 56, 76, 80–82)
**File:** `/home/user/VGC-Team-Report/src/app/api/share/[id]/route.ts:56, 76, 80–82`
**Snippet:**
```typescript
// Line 56: loadForkedFromId
return (rows[0].forked_from_id as string | null) ?? null;

// Lines 76, 80–82: fetchForkedFromMeta
const data = rows[0].data as Record<string, unknown>;
creatorName: ((data.creatorName as string) || null) ?? null,
tournamentName: ((data.tournamentName as string) || null) ?? null,
species: extractSpecies((data.paste as string) ?? ""),
```
**Reason:** SQL query results untyped; cast chain without narrowing.
**Proposed fix:** Apply `asRecord()` helper and validate shape.
**Safety:** Safe to ship — mechanical refactor.

---

### 6. Unsafe Proxy fallback in i18n/index.ts (line 83)
**File:** `/home/user/VGC-Team-Report/src/lib/i18n/index.ts:79–85`
**Snippet:**
```typescript
return new Proxy(translations as Record<string, string>, {
  get(target, prop: string) {
    const v = target[prop];
    if (typeof v === "string" && v.length > 0) return v;
    return (en as unknown as Record<string, string>)[prop];  // ← UNSAFE
  },
}) as TranslationKeys;
```
**Reason:** Line 83 double-cast `en` via `unknown` to bypass type system. No guarantee `en[prop]` returns `string` or exists.
**Proposed fix:** Remove the `as unknown as` chain; TypeScript can infer that `en` has the same shape. Use a safe fallback like `en[prop as keyof typeof en] ?? ""`.
**Safety:** Safe to ship — narrowing fix, no behavior change.

---

### 7. Unsound type assertion in diff-state.ts (line 96)
**File:** `/home/user/VGC-Team-Report/src/lib/utils/diff-state.ts:96`
**Snippet:**
```typescript
function asArray(value: unknown): SerializedMatchupPlan[] {
  return Array.isArray(value) ? (value as SerializedMatchupPlan[]) : [];
}
```
**Reason:** After `Array.isArray()` check, cast to `SerializedMatchupPlan[]` without element validation.
**Proposed fix:** Add `.safeParse(z.array(SerializedMatchupPlanSchema))` or validate elements at the boundary.
**Safety:** Needs ticket — impacts matchup plan parsing correctness.

---

### 8. Unsafe cast in redis scan result in cache.ts (line 98)
**File:** `/home/user/VGC-Team-Report/src/lib/cache.ts:98`
**Snippet:**
```typescript
const result = await r.scan(cursor, { match: `${prefix}*`, count: 100 });
cursor = Number(result[0]);  // ← UNSAFE
const keys = result[1] as string[];
```
**Reason:** Tuple unpacking from untyped Redis result; `result[0]` cast to `Number()` without shape validation.
**Proposed fix:** Destructure with explicit types or use typed SDK method.
**Safety:** Safe to ship — narrowing fix.

---

## Summary

**Safe to ship tonight:** 5 findings
- #3 (team-graphic casting pattern)
- #4 (spotlight casting pattern)
- #5 (share/[id] casting pattern)
- #6 (i18n Proxy fallback)
- #8 (cache scan result unpacking)

**Needs ticket:** 3 findings
- #1 (notifications.ts database row unsafe)
- #2 (redis scan result tuple untyped)
- #7 (matchupPlan array validation missing)

---

### Top 3 for immediate mechanical fix:

1. **`src/lib/i18n/index.ts:83`** — Remove `as unknown as` chain in Proxy fallback; rely on TypeScript's shape inference.

2. **`src/app/api/spotlight/route.ts:26–59`** — Apply `asRecord()` helper to `row.data` and use schema validation for all chained casts.

3. **`src/app/api/team-graphic/route.tsx:101–107`** — Apply `asRecord()` helper and extract field-casting to a typed helper function.


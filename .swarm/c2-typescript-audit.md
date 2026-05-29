# TypeScript Strictness Audit

**Audited:** 2026-05-25  
**Scope:** `src/lib/`, `src/app/api/`, `src/hooks/`  
**tsconfig:** `strict: true` enabled (good baseline)

---

## 1. Uses of `any`

Only **1 explicit `any`** found across the entire scoped codebase:

| File | Line | Code | Justified? |
|------|------|------|------------|
| `src/app/api/migrate/route.ts` | 50 | `row.data as Record<string, any>` | **Partially** — the migrate route normalizes arbitrary legacy JSONB blobs that may have unknown shapes. Using `Record<string, unknown>` with runtime checks would be safer but require more verbose narrowing. Has an eslint-disable comment acknowledging the decision. |

**Verdict:** Excellent discipline. The single `any` is in a migration script with an eslint acknowledgement.

---

## 2. Missing Return Types on Exported Functions

### API Route Handlers: **0 of 72 have explicit return types**

All 72 exported API route handlers (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) across `src/app/api/` lack explicit return type annotations. Examples:

```typescript
// src/app/api/explore/route.ts:11
export async function GET(request: Request) {  // no `: Promise<NextResponse>`

// src/app/api/share/route.ts:63
export async function POST(request: Request) {  // no return type

// src/app/api/feedback/route.ts:78
export async function POST(request: Request) {  // no return type
```

**Impact:** Medium. Next.js infers these correctly at build time, but explicit types would catch accidental non-Response returns at authoring time and improve documentation. This is standard for Next.js App Router conventions where the framework enforces the shape.

### src/lib/ — Good coverage with notable gaps:

| File | Function | Missing Return Type |
|------|----------|-------------------|
| `src/lib/discord-webhook.ts:15` | `postToBuildsChannel` | No return type (returns `Promise<void>` implicitly) |
| `src/lib/notifications.ts:9` | `createNotification` | No return type (returns `Promise<void>` implicitly) |
| `src/lib/notifications.ts:30` | `notifyFollowers` | No return type (returns `Promise<void>` implicitly) |
| `src/lib/db.ts:3` | `getDb` | No return type (inferred from neon()) |
| `src/lib/db.ts:9` | `ensureTable` | No return type (returns `Promise<void>`) |

Most other `src/lib/` exports have proper return type annotations.

---

## 3. Unsound Generics

### `cacheGet<T>` — Unchecked cast when no schema provided

```typescript
// src/lib/cache.ts:29
export async function cacheGet<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
  // ...
  if (!schema) return raw as T;  // ← UNSOUND: T is unconstrained, no runtime validation
```

**Impact:** High. When callers omit the `schema` parameter, the cached value is blindly cast to `T`. A stale Redis entry with the wrong shape silently becomes a type lie. The comment on line 27 acknowledges this (`unchecked cast (VGC-146)`).

**Recommendation:** Require the schema parameter or deprecate the schema-less overload. Alternatively, constrain `T extends Record<string, unknown>` at minimum.

### `paginate<T>` — Acceptable

```typescript
// src/app/api/user/export/route.ts:97
function paginate<T>(rows: T[]): { data: T[]; truncated: boolean }
```

This is a simple utility generic — unconstrained `T` is fine here since it just slices arrays.

---

## 4. Type Assertions (`as`) — 95+ occurrences

### Pattern A: Database row casting (SYSTEMIC — ~60 occurrences)

The most prevalent pattern across all API routes:

```typescript
const data = row.data as Record<string, unknown>;
(row.created_at as Date).toISOString();
(row.view_count as number)
```

**Impact:** Medium-High. The neon serverless driver returns `Record<string, unknown>` rows. Every property access requires a cast. This is a systemic weakness — if column types change or a query is modified, these casts silently produce incorrect types.

**Recommendation:** Define typed row interfaces per query, or use a typed query builder (e.g., Drizzle, Kysely) that maps SQL schema to TypeScript types.

### Pattern B: @pkmn/dex library casting (~10 occurrences)

```typescript
// src/lib/data/pkmn-dex-fallback.ts:57
const baseStats = entry.baseStats as StatSpread;
const types = entry.types as PokemonType[];
const ms = item.megaStone as Record<string, string> | undefined;
```

**Impact:** Medium. The `@pkmn/dex` library has its own type system that doesn't perfectly align with the app's domain types. These casts bridge the two type worlds. Validated by subsequent null/existence checks in most cases.

### Pattern C: Webhook/external data casting (~5 occurrences)

```typescript
// src/app/api/webhooks/clerk/route.ts:46
const data = event.data as unknown as ClerkUserCreatedData;

// src/app/api/webhooks/posthog/route.ts:64
properties: typeof r[2] === "string" ? JSON.parse(r[2]) : (r[2] as Record<string, unknown>) ?? {},
```

**Impact:** Medium. The double-cast in the Clerk webhook (`as unknown as`) fully bypasses type safety. If Clerk's API changes the event shape, this would silently produce wrong types.

### Pattern D: URL params/localStorage casting (~5 occurrences)

```typescript
// src/hooks/useExploreUrlSync.ts:55
const sort = params.get("sort") as FilterState["sort"];

// src/hooks/useShareUrl.ts:202
settle(state as ShareableState, editable);
```

**Impact:** Low-Medium. The `useExploreUrlSync` cast is immediately validated on the next line (`includes()` check). The `useShareUrl` cast is after stripping internal flags, which is reasonable.

### Pattern E: Explore route multi-query destructuring

```typescript
// src/app/api/explore/route.ts:248
const [likeRows, commentRows, collabRows, verifiedRows] = await Promise.all(queries) as [
  Array<Record<string, unknown>>,
  Array<Record<string, unknown>>,
  Array<Record<string, unknown>>,
  Array<Record<string, unknown>>?,
];
```

**Impact:** Medium. Casting `Promise.all` results to a specific tuple. If the queries array ordering changes, the types silently become incorrect. A typed wrapper would be safer.

---

## 5. Non-null Assertions (`!`)

Only **3 non-null assertions** found:

| File | Line | Code | Risk |
|------|------|------|------|
| `src/lib/db.ts` | 4 | `process.env.DATABASE_URL!` | **Low** — app cannot function without this; crashes immediately if missing. Acceptable for required env vars. |
| `src/lib/rate-limit.ts` | 24 | `redis: redis!` | **Medium** — this code path is only reached when `redis` is truthy (checked on line 72: `if (redis)`), but the assertion is inside `getUpstashLimiter` which doesn't itself verify. If called directly, could NPE. |
| `src/hooks/useCollaborativeSync.ts` | 72 | `key: editKey!` | **Low** — guarded by `if (!enabled || !shareId || !editKey)` early return on line 57. The assertion is inside the `connect()` closure that only runs after the guard. |

**Verdict:** Minimal non-null assertion usage. The `redis!` in rate-limit.ts is the only one with any real risk.

---

## Summary of Priorities

| Priority | Issue | Count | Recommended Fix |
|----------|-------|-------|----------------|
| **High** | `cacheGet<T>` unchecked cast | 1 | Require Zod schema or split into typed/untyped variants |
| **High** | DB row `as` casts without validation | ~60 | Introduce typed query helpers or row interfaces |
| **Medium** | API route handlers missing return types | 72 | Add `Promise<NextResponse>` (low urgency for Next.js) |
| **Medium** | Double-cast in Clerk webhook | 1 | Use Zod schema to validate event.data |
| **Medium** | Explore route Promise.all tuple cast | 1 | Type the queries array or use named results |
| **Low** | @pkmn/dex bridge casts | ~10 | Acceptable given library boundary |
| **Low** | lib functions missing void return type | 5 | Minor docs improvement |

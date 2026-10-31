# C2 — TypeScript Strictness Audit

Date: 2026-05-24
Scope: `src/` (excluding `*.test.ts`, `*.spec.ts`)
Time spent: ~12 min

## Counts (headline)

| Metric | Count | Notes |
|---|---:|---|
| `any` uses (literal type, not prose) | **1** | Only `src/app/api/migrate/route.ts:50` — already guarded with `eslint-disable-next-line`. |
| `// @ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | **0** | Clean. Nothing to remove. |
| `JSON.parse` call sites | **24** (22 prod, 2 test) | 4 are typed/Zod-validated; **~18 are unchecked**. |
| Untyped `await fetch(...).json()` patterns | **~30** | None use Zod or a type guard; most rely on `data.foo ?? default` defensive reads. |

The codebase is in genuinely good shape on the `any` front — almost everything that could have been `any` is already `unknown` plus narrowing (see `normalize-report.ts`, `url-codec.ts`). The real surface area is **unvalidated JSON entering the app from network and `localStorage`**.

## Conflict-risk callouts (DO NOT touch — flag only)

These files appear in `.swarm/main-changed-files.md`. Concurrent agents may be editing them. Findings are listed for visibility but **no fix should be applied here in this swarm pass**:

- `src/hooks/useShareUrl.ts:32` — `JSON.parse(existing)` on `localStorage` share-tokens, no shape check.
- `src/hooks/useNotifications.ts:28` — `await res.json()` with no schema (reads `data.notifications`, `data.unreadCount`).
- `src/components/match-tracker/MatchTracker.tsx:85,163` — two unchecked `await res.json()` paths.
- `src/lib/linear.ts:32` — `await res.json()` then reads `data.errors[0].message`, `data.data` untyped (GraphQL responses are always shaped, but a runtime type would catch upstream API drift).
- `src/lib/email.ts:56` — `return res.json()` returns `Promise<unknown>` upward with no annotation.
- `src/lib/utils/normalize-report.ts` — uses `AnyRecord = Record<string, unknown>` plus heavy `as` casts; this is intentional but worth a Zod schema later.
- `src/app/notifications/NotificationsContent.tsx:186`, `src/app/dashboard/notifications/page.tsx` (in conflict list).

If a fix is *forced* later, prefer the lowest-blast-radius change (annotate return type only, do not restructure).

## Top 10 fixes (safe zone, each < 30 min)

Ordered by impact / risk-of-runtime-error.

### 1. `src/app/api/migrate/route.ts:50` — eliminate the lone `any`

Current:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = row.data as Record<string, any>;
```
Fix:
```ts
const data = row.data as Record<string, unknown>;
```
`normalizeReportData` already takes `Record<string, unknown>` (it aliases it as `AnyRecord`), so the cast is the bottleneck, not the data flow. Removes the file's eslint-disable and the only `any` in the repo.

### 2. `src/app/api/discord/route.ts:55` — typed Discord interaction body

Current:
```ts
const body = JSON.parse(rawBody);
if (body.type === PING) { ... }
const command = body.data?.name;
const options = body.data?.options ?? [];
```
Fix: define an interaction shape and parse against it:
```ts
interface DiscordInteraction {
  type: number;
  data?: { name?: string; options?: Array<{ name: string; value: unknown }> };
}
const body = JSON.parse(rawBody) as DiscordInteraction;
```
Cheap, and removes the implicit `any` propagation through `body.data?.options`. Signature-verified upstream so trust boundary is acceptable.

### 3. `src/app/api/webhooks/linear/route.ts:35` — narrow webhook body

Already declared `body: { type?: string; challenge?: string }` on line 32, then reassigned with `JSON.parse(rawBody)` (which returns `any`). The assignment widens the variable to `any` in practice.
Fix:
```ts
body = JSON.parse(rawBody) as { type?: string; challenge?: string };
```
One-token change, removes silent `any` widening.

### 4. `src/lib/consent.ts:22` — type the parsed cookie payload

Current:
```ts
const value = JSON.parse(decodeURIComponent(...));
return Array.isArray(value?.categories) && value.categories.includes(ANALYTICS_CATEGORY);
```
Fix: parse into `unknown`, then narrow:
```ts
const value: unknown = JSON.parse(decodeURIComponent(...));
if (!value || typeof value !== "object") return false;
const categories = (value as { categories?: unknown }).categories;
return Array.isArray(categories) && categories.includes(ANALYTICS_CATEGORY);
```
Cookie content is attacker-influenced (it lives in the user's browser) so a real guard matters here. ~10 min.

### 5. `src/app/api/webhooks/posthog/route.ts:64` — typed parse with fallback

Current:
```ts
properties: typeof r[2] === "string" ? JSON.parse(r[2]) : (r[2] as Record<string, unknown>) ?? {},
```
Fix: extract to a helper that returns `Record<string, unknown>`:
```ts
function safeParseProps(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return {};
  try { const v: unknown = JSON.parse(raw); return (v && typeof v === "object") ? v as Record<string, unknown> : {}; }
  catch { return {}; }
}
```
PostHog responses are external data; the current code will throw on malformed JSON and crash the webhook handler.

### 6. `src/hooks/usePokemonNotes.ts:21,41` — type the localStorage parse

Current:
```ts
return stored ? JSON.parse(stored) : {};
```
Fix:
```ts
const parsed: unknown = stored ? JSON.parse(stored) : {};
return (parsed && typeof parsed === "object" && !Array.isArray(parsed))
  ? (parsed as Record<string, string>) : {};
```
Note: previous incident on 2026-04-10 already prompted the `v2` namespace bump (see file header comment) — adding a runtime shape check is the natural next layer of defence.

### 7. `src/hooks/useHiddenSlides.ts:19,35` — guard the Set parse

Current:
```ts
return stored ? new Set(JSON.parse(stored)) : new Set();
```
`new Set(notAnIterable)` throws. Fix:
```ts
const parsed: unknown = stored ? JSON.parse(stored) : [];
return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
```

### 8. `src/hooks/useCollaborativeSync.ts:87,105` — typed SSE event payloads

EventSource payloads are strings from the network. Current:
```ts
const { version, state } = JSON.parse(e.data);
...
const { collaborators: count } = JSON.parse(e.data);
```
Fix (line 87):
```ts
const parsed = JSON.parse(e.data) as { version: number; state: ShareableState };
const { version, state } = parsed;
if (typeof version !== "number") return;
```
Add a similar narrow for `{ collaborators: number }`. The current try/catch only catches `SyntaxError`, not malformed-but-valid-JSON.

### 9. `src/components/input/PasteInput.tsx:166,188` — sessionStorage parse for spotlight/popular

Current:
```ts
try { setSpotlight(JSON.parse(cached)); } catch { /* ignore */ }
```
Fix: parse to `unknown` and use the same runtime check the network fetch does (`data?.spotlight`). Today, corrupt sessionStorage data is fed straight into the React tree.

### 10. `src/lib/db.ts:3,9` — add explicit return types to `getDb` and `ensureTable`

These are the only two `export function`s in `src/lib/db.ts` without an explicit return annotation. Both are wrapped by every API route.
Fix:
```ts
import type { NeonQueryFunction } from "@neondatabase/serverless";
export function getDb(): NeonQueryFunction<false, false> { ... }
export async function ensureTable(): Promise<void> { ... }
```
Improves IDE hover-doc and prevents accidental Promise-returning regressions.

## Honourable mentions (not in top 10, listed for completeness)

- `src/lib/discord-webhook.ts:15` — `postToBuildsChannel(...)` has no return type; should be `Promise<void>`.
- `src/lib/posthog-server.ts:24` — `captureServerEvent` missing `: void` return type.
- `src/lib/utils/haptics.ts:2,9,16` — all three exports missing `: void`.
- `src/lib/notifications.ts:9,30` — missing `Promise<void>` annotations.
- `src/lib/hooks/useGlobalDisplayPrefs.ts:36` — `useGlobalDisplayPrefs` returns an inferred object; consider an explicit interface.
- `src/lib/templates.ts:60` — fine (`: ReportTemplate | undefined` already there).
- `src/lib/i18n/index.ts:82` — `useTranslation` returns `I18nContextValue` via inference; explicit annotation would harden.
- `src/lib/contexts/VersionDiffContext.tsx:23` — same.

Total `src/lib` exports without explicit return types: ~10. Adding annotations is mechanical and safe.

## Systemic recommendations

### A. Adopt a one-line `safeJsonParse<T>(raw: string, fallback: T): T` helper

There are 18 unguarded `JSON.parse` calls and 30 untyped `fetch().json()` calls — they share the same failure mode (throw on malformed input, propagate `any`). One utility in `src/lib/utils/safe-json.ts`:

```ts
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
```

…lets every hook fix become a one-line change and gives a single grep-able audit point. Pair it with a Zod schema for any payload that comes from the network (start with the SSE event payloads in `useCollaborativeSync`, which are the highest risk).

### B. Enable ESLint `@typescript-eslint/no-unsafe-assignment` + `no-unsafe-member-access` (warn level)

The repo only has 1 `any` because nobody writes `any` — but it has 30 places where `fetch().json()` returns `any` implicitly and then `.foo` flows untyped. These two rules surface that pattern. Run with `--max-warnings 100` for a week, fix opportunistically, then ratchet down.

### C. Standardise on a `lib/api/types.ts` module for response shapes

Today, every `await res.json()` site re-invents the response contract inline (`data.notifications ?? []`, `data.unreadCount ?? 0`, etc.). Define the response type next to the route handler (e.g. `type GetNotificationsResponse = { notifications: Notification[]; unreadCount: number; hasMore: boolean; total: number; }`) and re-export from a shared module. Hooks become:

```ts
const data = await res.json() as GetNotificationsResponse;
```

…which is barely more code than today but turns route-renames into compile errors instead of silent runtime `undefined`.

## Build sanity

Did not run `tsc --noEmit` or `npm run build` in this audit pass (read-only, time-budget bounded). All proposed fixes above are local and should not change compile output beyond removing the one eslint-disable in #1.

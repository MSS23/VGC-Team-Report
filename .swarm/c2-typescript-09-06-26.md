# C2 TypeScript Strictness Audit — 2026-06-09

## Headline

The codebase is in excellent shape. `strict: true`, **zero** explicit `: any`, **zero** `as any`, **zero** `Record<string, any>`, **zero** `@ts-expect-error/ignore/nocheck`, **zero** `eslint-disable-next-line no-explicit-any`. Most prior-audit findings have been fixed (db.ts, discord-webhook.ts, haptics.ts, VersionDiffContext.tsx, useGlobalDisplayPrefs.ts, migrate route, useAutoDraft.ts).

The remaining bites are limited to a small set of exported lib helpers that return `Promise<any>` or are missing an explicit return type. All of the highest-value fixes touch ≤3 lines and are outside the conflict-risk list.

---

## High-confidence quick fixes (≤30 lines each)

### 1. `src/lib/i18n/index.ts:96` — missing return type on `useTranslation()`
```ts
export function useTranslation() {
  return useContext(I18nContext);
}
```
The local `I18nContextValue` interface is already declared at line 35. Add `: I18nContextValue`. This was flagged in the 2026-05-22 audit and remains unfixed.

**Fix (1 line):**
```ts
export function useTranslation(): I18nContextValue {
```

**Note:** `I18nContextValue` is currently a non-exported `interface`. Either export it or use `ReturnType<typeof useContext<I18nContextValue>>` (overkill). Exporting the interface is cleaner — it would also enable downstream callers to type props that receive `t`.

---

### 2. `src/lib/notifications.ts:9, 30` — missing `Promise<void>` return types
Both `createNotification` and `notifyFollowers` are fire-and-forget DB writers with try/catch swallowing all errors. They have no meaningful return value.

**Fix (2 lines, ~+15 chars each):**
```ts
export async function createNotification(
  userId: string,
  …
): Promise<void> {

export async function notifyFollowers(
  creatorName: string,
  …
): Promise<void> {
```

Cost: trivial, prevents any future caller from silently treating these as returning something useful.

---

### 3. `src/lib/posthog-server.ts:24` — missing `: void` on `captureServerEvent`
```ts
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) { … }
```
Fire-and-forget. Returns nothing. Add `: void` after the closing paren.

**Fix (1 line.)**

---

### 4. `src/lib/linear.ts:14` — internal `linearQuery` returns `any` (propagates throughout the file)
```ts
async function linearQuery(query: string, variables?: Record<string, unknown>) {
  …
  const data = await res.json();
  if (data.errors?.length) { … }
  return data.data;   // ← any
}
```
The function is unexported so this is *internal* leakage — every call site (lines 127, 144, 170, 191) reads from an `any`. The cheapest hard improvement: type the return as `Promise<unknown>` and have each call site narrow with a local cast. Each call site already does this informally (e.g. line 135 `as { id: string; name: string }[]`, line 181 `(s: { type: string })`).

**Fix scope:** 1 line in the function signature, no call-site changes required for strict mode (call sites already cast). This converts internal `any` exposure into `unknown` boundaries.

```ts
async function linearQuery(query: string, variables?: Record<string, unknown>): Promise<unknown> {
  …
  const json = (await res.json()) as { data?: unknown; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(`Linear GraphQL error: ${json.errors[0].message}`);
  return json.data;
}
```
≤6 lines. Note: `linear.ts` is on the prior conflict-risk list — confirm it's not in tonight's main-changed-files (`/home/user/VGC-Team-Report/.swarm/main-changed-files.md` does **not** list it, so it's safe tonight).

---

## Medium-confidence improvements

### 5. `src/lib/email.ts:32` — `sendEmail()` returns `Promise<any>` via `res.json()`
```ts
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  …
  return res.json();   // ← Promise<any>
}
```
Resend's `/emails` endpoint returns `{ id: string }` on success. Replace with:
```ts
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ id: string } | null> {
  …
  return res.json() as Promise<{ id: string }>;
}
```
Callers on lines 92 and 188 don't use the return value, so this is non-breaking. ~3 lines.

`sendCommentNotificationEmail` (line 79) and `sendWelcomeEmail` (line 181) are also missing `: Promise<void>` — bundle these into the same edit for a clean 5-line patch.

**email.ts was flagged conflict-risk previously** — check before tonight's batch. Not on tonight's main-changed-files list, so likely safe.

### 6. `src/lib/discord-bot.ts:15, 60` — `discordFetch` and `postFeedbackEmbed` return `Promise<any>`
Same pattern as linear.ts and email.ts. `discordFetch` is unexported. Typing it as `Promise<unknown>` and adding `: Promise<unknown>` to `postFeedbackEmbed` is the minimal change.

Same conflict-risk caveat — not on tonight's changed-files list.

### 7. `src/lib/utils/pokepaste.ts:19, 22, 44, 47` — `await res.json()` returns `any`
```ts
const data = await res.json();
throw new Error(data.error ?? `Failed to fetch (${res.status})`);
return { paste: data.paste, title: data.title ?? null };
```
Defensive cast to a small inline type would tighten this:
```ts
const data = (await res.json()) as { paste?: string; title?: string; error?: string; url?: string };
```
This file is client-side (`fetch("/api/...")`), so the shape is well-known. Two casts, ≤4 lines.

---

## Deferred / skip tonight

- **`src/lib/cache.ts:35` (`return raw as T`)** — documented escape hatch (VGC-146 comment), intentional.
- **`src/lib/parser/showdown-parser.ts:114-115`** — `tt as PokemonType` after `.includes()`. Sound; cosmetic refactor to a type predicate would be nicer but doesn't improve safety.
- **`src/lib/data/pkmn-dex-fallback.ts`** — multiple `as StatSpread` / `as PokemonType[]` casts. These bridge looser `@pkmn/dex` types into ours and are defensively guarded. Risky touch — skip.
- **`src/lib/analysis/stat-calculator.ts:58, 74`** — `result as StatSpread` after a known-complete loop over `["hp",…,"spe"]`. Mathematically safe; tightening it requires an `as const` tuple + `Required<Record<...>>` derive, which is more LOC than warranted.

---

## `@ts-expect-error` / `@ts-ignore` notes

**None present** anywhere in `src/`. The codebase has stayed clean of pragma escape hatches. Nothing to assess.

---

## Non-null assertions worth a look (assessed — all safe to keep)

| File:line | Pattern | Assessment |
|---|---|---|
| `src/app/api/sync/[id]/route.ts:26` | `presence.get(shareId)!.set(...)` | Guarded by `if (!presence.has(shareId)) presence.set(...)` on line 25. Sound. |
| `src/components/report/SpeedTierChart.tsx:19` | `BASE_KEY_TO_MEGA_KEYS.get(baseKey)!.push(...)` | Guarded by `if (!has) set([])` on line 18. Sound. |
| `src/components/report/SpeedTierChart.tsx:181` | `mon.itemBoost!.multiplier` | Guarded by `hasSpeedBoost = mon.itemBoost?.stat === "spe"` on line 180. Sound. |
| `src/components/explore/ReportCard.tsx:294` | `report.tags!.eventType` | Inside a conditional render that's already gated on `report.tags` upstream — verify before fixing. Not worth changing. |
| `src/components/report/TeamStats.tsx:31` | `p.data!.baseStats` | Inside a `.filter()` chain — verify guard before fixing. Skip tonight. |
| `src/lib/analysis/__tests__/item-boosts.test.ts:20-45` | `boost!.stat` in tests | Test-only. Fine. |

No high-confidence fixes here — they're all guarded or test-only.

---

## Loose object indexing

Spot-checked the main candidates (`FEEDBACK_TO_LINEAR[opts.type]` in linear.ts, `MODIFIER_CONFIG[key]` in SpeedTierChart.tsx, `typeLabel[item.type]` in email.ts). All either:
- Use `?? fallback` (`linear.ts:64`, `email.ts:347-358`)
- Are already typed via `Record<SpeedModifier, …>` with the key constrained (SpeedTierChart.tsx:122)

No high-confidence fixes in this category.

---

## Tonight's recommended slate (top 5)

| # | File | Lines | Risk | Conflict file? |
|---|---|---|---|---|
| 1 | `src/lib/i18n/index.ts:96` — add `: I18nContextValue` return + export interface | 2 | None | No |
| 2 | `src/lib/notifications.ts:9, 30` — add `: Promise<void>` to both helpers | 2 | None | No |
| 3 | `src/lib/posthog-server.ts:24` — add `: void` to `captureServerEvent` | 1 | None | No |
| 4 | `src/lib/linear.ts:14` — type `linearQuery` as `Promise<unknown>` (internal) | ~6 | None — call sites already cast | No |
| 5 | `src/lib/email.ts:32, 79, 181` — type `sendEmail` return + add `Promise<void>` to two void senders | ~5 | None | No |

Total: ≤16 lines of changes, no risk to behaviour, all `npx tsc --noEmit && npm run build` should still pass.

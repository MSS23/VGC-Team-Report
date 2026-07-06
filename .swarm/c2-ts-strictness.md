# C2 TypeScript Strictness Audit

Codebase health note: `src/**` contains **zero** occurrences of `: any`, `as any`, `<any>`, or `any[]`, and **zero** `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` pragmas. The strictness problems are instead concentrated in (a) untyped `.json()` / `JSON.parse()` return values at API boundaries, (b) `as unknown as X` double-casts that bypass the type system, (c) missing return type annotations on lib/hook exports, and (d) non-null assertions on optional fields.

## `any` uses (highest priority)
_None found._ The codebase consistently uses `unknown` + narrowing.

## Missing return types on exported functions (silent-widening risk)
Explicit return types are the cheapest guardrail against a hook accidentally dropping or adding a property in a follow-up refactor. All below rely on inference.

- `src/lib/i18n/index.ts:96` — `useTranslation` — inferred `I18nContextValue`. Add `: I18nContextValue` so a rename inside the provider can't silently break every consumer.
- `src/hooks/useSlideSystem.ts:32` — `useSlideSystem(opts)` — returns a large object literal; the return shape is the public contract of the whole slide subsystem, worth pinning to a named interface.
- `src/hooks/useShareFlow.ts:23` — `useShareFlow(...)` — same, controls save + share side-effects; a widening bug here shows up as UI-only.
- `src/hooks/useCollaborativeSync.ts:25` — `useCollaborativeSync(...)` — return contains `syncStatus`, `collaborators`, `markSaving`, `updateVersion`, `lastRemoteUpdate` — safety-critical (the 98k-versions bug).
- `src/hooks/useAutoDraft.ts:22` — `useAutoDraft(...)` — draft-persistence contract.
- `src/hooks/useHomePage.ts:32` — `useHomePage()` — page-level god-hook; return type inference across ~500 lines is very slow to type-check.
- `src/hooks/useTeamReport.ts:21`, `useTeamMeta.ts:81`, `useDamageCalcs.ts:44`, `usePokemonNotes.ts:13`, `useHiddenSlides.ts:11`, `useMatchupPlans.ts:135`, `useShareUrl.ts:78`, `useTheme.ts:194` — all persistence hooks that shape localStorage state; annotate to prevent silent shape drift on rename.

## `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`
_None found._

## Unsafe casts (`as unknown as X`, double-casts that bypass TS)

- `src/lib/i18n/index.ts:83` — `return (en as unknown as Record<string, string>)[prop];` — bypasses the TranslationKeys type. If a translation adds a nested value, this returns `undefined` at runtime and TS never warns. Suggested fix: type `en` as `Record<TranslationKey, string>` or `Object.hasOwn` + return a typed key. Same pattern at:
- `src/hooks/useSlideSystem.ts:56` — `(t as unknown as Record<string, string | undefined>).commonModesTitle ?? "Common Modes"` — the fallback signals the author knew the key might not exist; better to add `commonModesTitle` to `TranslationKeys` so the string-literal lookup is checked.
- `src/components/report/CommonModesSlide.tsx:108` — same pattern; same fix.
- `src/app/api/webhooks/clerk/route.ts:46` — `event.data as unknown as ClerkUserCreatedData` — throws away the discriminated union Clerk's `verifyWebhook` returns. On a schema change, `data.email_addresses.find(...)` crashes with "cannot read properties of undefined". Suggested fix: narrow via `if (event.type === "user.created")` + import Clerk's UserJSON type directly.
- `src/lib/data/dex-subset.ts:62` — `rawSubset as unknown as DexSubset` — trusts bundled JSON; low runtime risk but hides schema drift between the generator and the consumer. Suggested fix: zod-validate at module init and cache the parsed result.
- `src/lib/utils/diff-state.ts:102` — `value as SerializedMatchupPlan[]` inside `asArray()` — the guard only checks `Array.isArray`, not element shape; a legacy stored plan with a missing `gamePlans` field falls through to the JSON.stringify path. Suggested fix: zod-parse element shape or guard `p.gamePlans` explicitly before use.

## Untyped `.json()` / `JSON.parse()` at network boundaries (effective `any`)

Under `noImplicitAny` these still type as `any`, so every downstream property access is unchecked.

- `src/app/api/discord/route.ts:33` — `async function linearQuery(...) { ...; return res.json(); }` — return type is inferred `Promise<any>`. Consumers at lines 214, 224, 271, 293, 317, 336, 340 all traverse `result.data?.issue.state.name` with no type help. Suggested fix: `Promise<{ data?: unknown; errors?: unknown }>` return, then `safeParse` at each call site.
- `src/app/api/discord/route.ts:95` — `const body = JSON.parse(rawBody);` — `body.type`, `body.data?.name`, `body.member`, `body.user` accessed untyped from a signed-but-unstructured Discord payload. Suggested fix: define a `DiscordInteraction` zod schema.
- `src/app/api/webhooks/linear/route.ts:61` — `const body = JSON.parse(rawBody);` — `body.type`, `body.challenge` untyped.
- `src/app/api/webhooks/posthog/route.ts:188` — `const body = await request.json();` — `body.event`, `body.person?.properties?.email`, `body.person?.distinct_id`, `body.timestamp`, `body.properties` all unchecked; this is an EXTERNAL webhook so shape is the least trusted in the codebase. Suggested fix: zod schema at the top of POST.
- `src/app/api/webhooks/posthog/route.ts:61` — `const data = await res.json(); const rows: unknown[][] = data?.results ?? [];` — first line's `data` is `any`; the `unknown[][]` on line 62 only kicks in after the `??`. Fix: `const data = (await res.json()) as unknown; const rows = ...` or zod.
- `src/app/api/webhooks/posthog/route.ts:262` — `const linearRes = await linearRawRes.json();` — `linearRes.data?.issueCreate?.success` + `.issue.identifier` + `.issue.url` untyped, and used to build Discord notification content on line 284.
- `src/app/api/cron/weekly-report/route.ts:26,107,120` — GraphQL response and `package.json` parsed untyped; `pkg.dependencies` accessed as `any`.
- `src/hooks/useCollaborativeSync.ts:98` — `const { version, state } = JSON.parse(e.data);` — SSE payload from `/api/sync`; if the server ever emits a differently shaped `version` event, `state` (typed here as `any`) is passed to `onRemoteUpdateRef.current(state as ShareableState)` and the cast paves over it. Fix: zod parse before applying.

## Non-null assertions in risky spots

- `src/lib/db.ts:4` — `neon(process.env.DATABASE_URL!)` — the `!` turns a missing env var into a cryptic runtime error inside the driver. Fix: `if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required")` (fails fast with a readable message).
- `src/components/report/MatchupPlanSlide.tsx:277` — `mon.calculatedStats![stat]` — `calculatedStats` is optional; if stat calc ever fails (bad EV parse), this crashes rendering the whole slide. Fix: guard the map with `if (!mon.calculatedStats) return null;` above the `.map`.
- `src/components/report/SpeedTierChart.tsx:183` — `mon.itemBoost!.multiplier` — guarded above by `hasSpeedBoost = mon.itemBoost?.stat === "spe"`, but reading `.multiplier` is still an assertion on optional. Fix: destructure once — `const boost = mon.itemBoost; if (boost?.stat === "spe") { ... boost.multiplier ... }`.
- `src/components/explore/ReportCard.tsx:286` — `report.tags!.eventType` — guarded by `hasTagsSection`, which is a boolean computed elsewhere; the guarantee is not visible to TS. Fix: pull `report.tags` into a local before the JSX and narrow with `if (report.tags)`.
- `src/components/report/TeamStats.tsx:32` — `p.data!.baseStats` — guarded by `.filter((p) => p.data?.baseStats)` on the prior line, but the filter callback doesn't narrow through `.map`. Fix: use a type predicate — `.filter((p): p is Pokemon & { data: PokemonData } => !!p.data?.baseStats)`.

## Summary counts
- `any` occurrences in `src/**`: **0**
- `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`: **0**
- `as unknown as X` casts: **5** (3 in i18n proxy pattern, 1 Clerk webhook, 1 dex JSON)
- Untyped `.json()` / `JSON.parse` on network payloads: **~8 hot spots**
- Non-null assertions on optional fields: **5** (excluding tests)
- Exported hooks/lib functions without return type: **~15**

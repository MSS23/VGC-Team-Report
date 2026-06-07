# Wave-1 C2 TypeScript Audit — 2026-06-07

## Baseline

`npx tsc --noEmit` cannot establish a clean baseline in this sandbox because `node_modules` is not installed (every error is `TS2307: Cannot find module 'next'/'zod'/...` or `Cannot find name 'process'`). No source-level TS errors visible. Previous audits (`.swarm/c2-typescript-22-05-26.md` and `.swarm/c2-ts-audit.md`) report a clean strict-mode build, and most of their recommendations have already been applied:

- `Record<string, any>` in `migrate/route.ts` — gone.
- `src/lib/db.ts:getDb` / `:ensureTable` — return types added.
- `src/lib/discord-webhook.ts:postToBuildsChannel` — `Promise<void>` added.
- `src/lib/utils/haptics.ts` — three `: void` returns added.
- `src/lib/contexts/VersionDiffContext.tsx:useVersionDiff` — `: VersionDiffState` added.
- `src/lib/hooks/useGlobalDisplayPrefs.ts` — explicit return type added.
- `src/hooks/useAutoDraft.ts:analysis` — `TeamAnalysis | null` already used.

Repo-wide, **zero** explicit `: any` annotations remain in `src/lib/**`, `src/app/api/**`, and `src/components/**`. Zero `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`. The remaining unsoundness lives in `res.json()` returns (implicit `any` propagation) and a couple of unvalidated `JSON.parse(rawBody)` calls on signed webhook payloads.

## HIGH-VALUE FIXES (safe, low risk)

1. `src/lib/linear.ts:32` — `const data = await res.json()` is implicit `any`; then `data.errors[0].message` and `data.data` propagate `any` to every caller (including back-end ticket-creation flow).
   - Fix: declare a narrow shape — `const data = (await res.json()) as { data?: unknown; errors?: { message: string }[] };` and change the return type of `linearQuery` to `Promise<unknown>`, then have call sites narrow (`labelsData as { team: { labels: { nodes: { id: string; name: string }[] } } }`). Even simpler interim fix: just add `as { data?: unknown; errors?: { message: string }[] }` to silence the leak at the boundary.
   - Risk: low — no runtime behavior change. Call sites already use casts (`as { id: string; name: string }[]`) downstream.

2. `src/lib/email.ts:32-70` — `sendEmail()` has no declared return type; `return res.json()` and `return null` infer as `Promise<any | null>`. Resend's success body is `{ id: string }`.
   - Fix: `export async function sendEmail(opts: {...}): Promise<{ id: string } | null>` and replace `return res.json()` with `return (await res.json()) as { id: string }`.
   - Risk: low — only used internally; callers (`sendCommentNotificationEmail`, `sendWelcomeEmail`) ignore the return value.

3. `src/lib/discord-bot.ts:15-34` — `discordFetch()` has no return type; `return res.json()` is `Promise<any>`. Then `postFeedbackEmbed` reads `message.id` off that `any`.
   - Fix: `async function discordFetch(path: string, options: RequestInit = {}): Promise<unknown>` and narrow at the one usage: `const message = (await discordFetch(...)) as { id: string };`. Three lines total.
   - Risk: low — single internal helper, two call sites.

4. `src/app/api/webhooks/linear/route.ts:61` — `const body = JSON.parse(rawBody)` is `any`; then `body.type === "url_verification"` and `body.challenge` are used without validation. HMAC signature verification already passed, so this is integrity-protected, but the type system doesn't know that.
   - Fix: `const body = JSON.parse(rawBody) as { type?: string; challenge?: string };` (or a 2-field Zod schema). Surfaces typos and stops `any` from spreading.
   - Risk: very low — body is signature-verified before parsing; this is a typing-only change.

5. `src/app/api/discord/route.ts:55,68` — `JSON.parse(rawBody)` and the inline `getOption` cast `as string | undefined` smuggle `any` across the Discord interaction handler.
   - Fix: type as `const body = JSON.parse(rawBody) as { type: number; data?: { name?: string; options?: { name: string; value?: unknown }[] } };` then change `getOption` to return `options.find((o) => o.name === name)?.value` and cast at each call site (`getOption("text") as string | undefined`) — same surface, but typed at the boundary.
   - Risk: very low — Discord signature verification already gates entry.

## MEDIUM-VALUE FIXES

6. `src/app/api/webhooks/clerk/route.ts:46` — `event.data as unknown as ClerkUserCreatedData` is the only `as unknown as` cast in app code (the other two in `dex-subset.ts` and `i18n/index.ts` are justified). Clerk's SDK already discriminates on `event.type === "user.created"`.
   - Fix: import `UserJSON` from `@clerk/nextjs/server` and write `const data = event.data as UserJSON;` (single cast, not double). Or add a small Zod schema for the three fields actually consumed (`id`, `email_addresses`, `first_name`, `primary_email_address_id`).
   - Risk: low — verifies the same fields the current code already reads.

7. `src/lib/utils/pokepaste.ts:22,47` — `const data = await res.json()` is implicit `any`; then `data.paste`, `data.title`, `data.url` are returned without validation. User-facing API.
   - Fix: define a one-shot Zod schema or inline guard — `const data = (await res.json()) as { paste?: unknown; title?: unknown };` plus `if (typeof data.paste !== "string") throw new Error(...)`. Returns the same `PokePasteResult` but the boundary is checked.
   - Risk: low — adds a runtime guard, which is strictly safer than the current pattern.

8. `src/hooks/useTeamMeta.ts:75,95` and `src/hooks/useMatchupPlans.ts:125` — `JSON.parse(stored)` is assigned to `TeamMeta` / `LegacyPlan[]` without validation. localStorage is user-mutable; corrupt payloads silently flow into React state.
   - Fix: in `useTeamMeta`, change `return stored ? JSON.parse(stored) : EMPTY_META` to `const parsed: unknown = JSON.parse(stored); return isTeamMeta(parsed) ? parsed : EMPTY_META;` with a `isTeamMeta` predicate (or a Zod schema). Same pattern for `useMatchupPlans.loadAndMigrate`.
   - Risk: medium — actually a real defensive improvement, but it changes behavior on corrupt data (currently throws / silently breaks downstream).

## SKIP (existing pattern is correct here)

- `src/lib/sharing/url-codec.ts:180` — already does `JSON.parse` → `unknown` → Zod `safeParse`. Reference implementation.
- `src/lib/data/dex-subset.ts:62` — `rawSubset as unknown as DexSubset` is the documented JSON-import cast pattern; the type matches the build-time generated schema. Comment already justifies it.
- `src/lib/i18n/index.ts:83` — `en as unknown as Record<string, string>` is needed for the Proxy fallback; alternative would be `Object.keys(en).reduce<Record<string, string>>(...)` but the cast is fine.
- All `catch {}` blocks (`useTheme.ts`, `useDarkMode.ts`, `PostHogProvider.tsx`, `useAutoDraft.ts`, etc.) — every one is around `localStorage.*` / `navigator.vibrate` / `window.matchMedia` access where the only failure mode is private-browsing / quota / unsupported API, and the calling code already has a safe fallback. These are intentional, not error-swallowing.
- `src/hooks/useDamageCalcs.ts:52,72` — `JSON.parse(stored)` runs through `migrateCalcs()`, which already shape-checks. OK.
- `src/hooks/useCollaborativeSync.ts:87,105` — SSE payload is destructured and passed to `setSyncStatus`/`setCollaborators`; malformed events fall into the existing `catch { /* ignore */ }`. Acceptable for a transient stream.
- `src/app/dashboard/notifications/NotificationsContent.tsx:48` — already does `JSON.parse(raw) as Partial<NotificationPrefs>` and merges with `DEFAULT_PREFS`; the `Partial<>` cast plus default-merge is defensive enough.
- `src/lib/i18n/index.ts:I18nProvider` / `useTranslation` — exported but no return type (React conventions); skip.
- App Router route handlers in `src/app/api/**/route.ts` — return types intentionally omitted per Next.js convention; skip.

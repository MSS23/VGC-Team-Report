# C2 TypeScript Strictness Audit — 11-06-26

## tsc status: clean (0 errors)

`npx tsc --noEmit` exits cleanly. `tsconfig.json` has `"strict": true`, so all
unannotated callback params are inferred (no implicit `any` survives), and
unsound generics would have failed already. This audit therefore focuses on
the small surface of remaining hygiene issues.

## Headline counts
- `any` typed annotations in `src/lib/**`: **0** (all 21 `\bany\b` hits are in
  comments or strings — verified by reading every match).
- `any` typed annotations in `src/**`: **0** (the two `: any` regex hits in
  `src/app/api/share/[id]/route.ts:212` and `src/components/display/DisplayTogglePill.tsx:67`
  are inside comments).
- `as unknown as` double-casts: **3 total**, all justified (see below).
- `// @ts-ignore` / `// @ts-expect-error` directives: **0**.
- `eslint-disable …no-explicit-any` pragmas: **0**.
- Exported `function` decls in `src/lib/**` without explicit return type: **10**
  (out of 112 exported lib functions — 91% already annotated).

## High-leverage fixes (small, safe)

### Add explicit return types to leaked-`any` lib exports
The strict compiler infers these, but the inference leaks structural shapes
across module boundaries. Pinning return types stops future callers from
silently relying on internal shapes.

- `src/lib/email.ts:32` — `sendEmail(opts)` returns `res.json()` (Promise<any>)
  or `null`. Inferred as `Promise<any | null>` — this is the only
  `any`-equivalent leak in `src/lib`. Recommend
  `Promise<{ id?: string } | null>` or just `Promise<unknown | null>`.
  - Risk: low (callers are fire-and-forget; checked all 4 callers, none read
    the response shape).
- `src/lib/email.ts:79` — `sendCommentNotificationEmail`: returns `Promise<void>`. Add `: Promise<void>`.
  - Risk: low.
- `src/lib/email.ts:181` — `sendWelcomeEmail`: returns `Promise<void>`. Add `: Promise<void>`.
  - Risk: low.
- `src/lib/email.ts:321` — `buildWeeklySummaryHtml(data)`: returns a string. Add `: string`.
  - Risk: low.
- `src/lib/notifications.ts:9` — `createNotification`: `Promise<void>`. Add `: Promise<void>`.
  - Risk: low.
- `src/lib/notifications.ts:30` — `notifyFollowers`: `Promise<void>`. Add `: Promise<void>`.
  - Risk: low.
- `src/lib/posthog-server.ts:24` — `captureServerEvent`: returns `void`. Add `: void`.
  - Risk: low.
- `src/lib/discord-bot.ts:60` — `postFeedbackEmbed`: returns the awaited
  `discordFetch` result or `null`. Inferred as `Promise<unknown | null>` (since
  `discordFetch` is presumably typed). Annotate explicitly as
  `Promise<unknown | null>` or the discord message shape if exported.
  - Risk: low.
- `src/lib/i18n/index.ts:47` — `I18nProvider({ children })`: React component, returns
  `React.ReactElement`. Optional — components conventionally rely on
  inference. **Recommend skipping** to match codebase convention.
- `src/lib/i18n/index.ts:96` — `useTranslation()`: returns
  `I18nContextValue`. Add `: I18nContextValue` so consumers don't depend on the
  inferred Proxy fallback shape.
  - Risk: low.

### Verify the three `as unknown as` double-casts
All three are intentional and documented. No fixes needed — listed for
auditor traceability.

- `src/lib/i18n/index.ts:83` — `(en as unknown as Record<string, string>)[prop]`
  inside a Proxy `get` that falls back to English. Justified: `en` is a
  `TranslationKeys` object indexed by an unknown string prop coming from the
  Proxy trap. **Justified.**
- `src/lib/data/dex-subset.ts:62` — `rawSubset as unknown as DexSubset`
  on a raw JSON import. Comment explicitly explains: JSON import is
  structurally compatible, cast once so downstream consumers get a typed
  surface. **Justified.**
- `src/app/api/webhooks/clerk/route.ts:46` — `event.data as unknown as ClerkUserCreatedData`.
  `event.data` is Clerk's `EventPayload` union; narrowing requires the cast
  because the SDK exports the union but not per-type guards. Could be
  upgraded to a runtime zod check, but **currently justified.**

## Medium-leverage fixes

### Generics audit
Only two declared generics in the entire src tree:
- `src/lib/cache.ts:29` — `cacheGet<T>(key, schema?: ZodType<T>)`. `T` is
  bound through the optional `ZodType<T>` schema; when no schema is passed,
  `T` is inferred as `unknown` at the call site. **Sound** (call sites in
  `src/app/api/champions/meta/route.ts:31` explicitly parameterise it).
- `src/app/api/user/export/route.ts:97` — `paginate<T>(rows: T[])`. Identity
  generic, sound by construction.

No unbounded generics in the codebase.

### API route handlers (38 in `src/app/api/**`)
Next.js `GET`/`POST`/`PUT`/`DELETE` route exports lack explicit return
types. This is the Next.js convention — the framework infers `Response |
NextResponse`. Adding annotations would be noise. **No action recommended.**

### Component exports (81 in `src/components/**`)
React function components lack explicit return types. Matches the
codebase convention and is React-idiomatic. **No action recommended** unless
the team adopts a TSX-wide rule.

## Implicit `any` in callbacks
With `"strict": true`, an implicit `any` callback parameter would be a tsc
error. Since tsc is clean, every `.map(x =>`, `.filter(x =>`, etc. is
typed by inference from the receiver. No findings.

## Unused `@ts-ignore` / `@ts-expect-error`
Zero directives across the codebase. Nothing to clean up.

## Skipped (conflict-risk)
None of the high-leverage fixes touch the avoid list:
- `public/sw.js` — not TS, not in scope.
- `src/app/globals.css` — not TS.
- `src/app/page.tsx` — no findings here.
- `src/components/report/SlideNavControls.tsx` — no findings here.
- `src/components/ui/SwipeHint.tsx` — no findings here.
- `src/hooks/useHomePage.ts` — no findings here.

## Recommended dispatch
One small fix subagent can sweep the 8 lib return-type additions
(`email.ts` x4, `notifications.ts` x2, `posthog-server.ts` x1,
`discord-bot.ts` x1, `i18n/index.ts:96` x1) in a single commit. All are
mechanical, all are `Promise<void>` / `string` / `void` / known interface
returns. Risk is uniformly low; tsc will catch any mistake immediately.

Skip `I18nProvider` (component convention) and leave the three documented
`as unknown as` casts alone.

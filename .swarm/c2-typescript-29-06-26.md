# C2 TypeScript Audit — 2026-06-29

`npx tsc --noEmit` → clean (exit 0). `strict: true` is enabled; no `: any`, no `as any`, no `@ts-ignore`, no `@ts-expect-error`, no `@ts-nocheck` anywhere in `src/`. The only `eslint-disable` lines are intentional (`@next/next/no-img-element` for OG/share images and `react-hooks/exhaustive-deps` in known hook patterns).

The May 22 punch list has been mostly executed — `getDb()`, `ensureTable()`, `postToBuildsChannel()`, all three `haptic*()` helpers, `useVersionDiff()`, `useGlobalDisplayPrefs()`, and `useAutoDraft`'s `analysis` parameter all carry the recommended explicit types now. Remaining work is in three buckets: a small set of still-missing return types on widely-used lib helpers, three `res.json()` boundaries that propagate `any` (Linear/Pokepaste/Discord), and one tsconfig flag (`noUncheckedIndexedAccess`) that would catch a real class of latent bug if turned on. The codebase is in very good shape.

---

## A. Strict-flag gaps in `tsconfig.json`

The current config carries only the umbrella `strict: true`. Three opt-in flags would meaningfully improve soundness — but each has different blast radius.

| Flag | Effect | Recommendation |
|------|--------|----------------|
| `noUncheckedIndexedAccess` | Array/object index access returns `T \| undefined` | **Worth a dedicated ticket.** Will surface ~50–100 latent issues across the parser, dex lookups, and slide-system. Implementation will not be a "tonight" change. |
| `noImplicitReturns` | Branches that fall off the end of non-`void` functions become errors | **Safe to flip tonight** — `tsc --noEmit` already passes; this only catches a future-style bug. Worth a 1-line PR. |
| `noFallthroughCasesInSwitch` | `case` without `break`/`return`/`throw` errors | **Safe to flip tonight** — same reasoning. |
| `exactOptionalPropertyTypes` | `{ x?: T }` ≠ `{ x: T \| undefined }` | **Skip.** Would surface dozens of issues in the report editor where the diff treats `undefined` and "missing" as equivalent. Not a tonight change. |

Concrete fix for the two safe flags:
```json
// tsconfig.json:7
"strict": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
```

---

## B. Missing return types on exported lib helpers (`src/lib/**`)

These are the leftovers from May 22 — every one is a single-line annotation against an already-declared interface or simple shape.

### Quick wins (1-line each, no risk)

| # | File:line | Function | Proposed return type |
|---|-----------|----------|----------------------|
| 1 | `src/lib/i18n/index.ts:96` | `useTranslation()` | `: I18nContextValue` (interface already declared at line 35) |
| 2 | `src/lib/posthog-server.ts:24` | `captureServerEvent()` | `: void` |
| 3 | `src/lib/notifications.ts:9` | `createNotification()` | `: Promise<void>` |
| 4 | `src/lib/notifications.ts:30` | `notifyFollowers()` | `: Promise<void>` |
| 5 | `src/lib/email.ts:32` | `sendEmail()` | `: Promise<{ id: string } \| null>` — Resend's success response has `{ id }`; parse it with `await res.json() as { id?: string }` and return `{ id: parsed.id ?? "" }` or null. Also unblocks downstream typing. |
| 6 | `src/lib/email.ts:79` | `sendCommentNotificationEmail()` | `: Promise<void>` (never throws — wrapped in try/catch) |
| 7 | `src/lib/email.ts:181` | `sendWelcomeEmail()` | `: Promise<void>` (same) |
| 8 | `src/lib/email.ts:321` | `buildWeeklySummaryHtml()` | `: string` |
| 9 | `src/lib/discord-bot.ts:60` | `postFeedbackEmbed()` | `: Promise<{ id: string } \| null>` (Discord message has `{ id }`) — or `Promise<void>` if the return is never read. Check the call site; the looser `Promise<void>` is sufficient for the current single caller in the feedback API route. |

### `res.json()` returning `any` (medium, but small)

| # | File:line | Issue | Fix |
|---|-----------|-------|-----|
| 10 | `src/lib/linear.ts:32` | `const data = await res.json()` → `any`. Then `data.errors`, `data.data` propagate as `any`. | `const data = (await res.json()) as { data?: unknown; errors?: { message: string }[] }` — keeps the shape lenient but pins the two fields actually read. Return type of `linearQuery` becomes `Promise<unknown>`; call sites already narrow with their own ad-hoc shape annotations (see lines 135–186) so no downstream churn. |
| 11 | `src/lib/utils/pokepaste.ts:19,22,44,47` | Four `res.json()` calls, fields `data.error`, `data.paste`, `data.title`, `data.url` read as `any`. | Add inline type: `const data = (await res.json()) as { error?: string; paste?: string; title?: string; url?: string }` — same low-friction pattern. Two lines per call. |
| 12 | `src/lib/discord-bot.ts:15` | `discordFetch()` → `Promise<any>`. Caller at line 104 reads `message.id`. | Annotate `discordFetch` as `: Promise<unknown>` and at the call site: `const message = await discordFetch(...) as { id: string }`. Or just type as `Promise<{ id?: string } & Record<string, unknown>>`. |

---

## C. Unsound `as unknown as X` chains

Only 5 in the whole codebase. Most are defensible escapes, but one is fixable now.

| # | File:line | Cast | Verdict |
|---|-----------|------|---------|
| 13 | `src/lib/i18n/index.ts:83` | `(en as unknown as Record<string, string>)[prop]` inside the i18n fallback Proxy | **Acceptable** — `TranslationKeys` is a flat record of string fields, so the cast is sound. Could be tightened to `(en as Record<keyof TranslationKeys, string>)` but the current form is fine. **Skip.** |
| 14 | `src/lib/data/dex-subset.ts:62` | `rawSubset as unknown as DexSubset` for the JSON import | **Acceptable** — documented as a one-shot type assertion at the JSON boundary, used because `resolveJsonModule` produces a structural type. **Skip.** |
| 15 | `src/app/api/webhooks/clerk/route.ts:46` | `event.data as unknown as ClerkUserCreatedData` after a `event.type === "user.created"` discriminant check | **Medium** — Clerk's `WebhookEvent` union should narrow `event.data` to `UserJSON` automatically after the type guard. Test: drop the cast and run `tsc`. If it complains, swap to Clerk's `UserJSON` import. Carried over from May 22. |
| 16 | `src/hooks/useSlideSystem.ts:56` and `src/components/report/CommonModesSlide.tsx:73` | `t as unknown as Record<string, string \| undefined>` to read i18n keys not yet in `TranslationKeys` | **Acceptable but flagged** — the comment in `CommonModesSlide.tsx:69-71` explicitly says "Until then" referring to the Integrate phase. Track this with a TODO/ticket so the cast can be removed when `commonModesTitle` lands in `en.ts`. **Skip tonight.** |

---

## D. Other minor items

- `src/app/api/migrate/route.ts:53` — `row.data as Record<string, unknown>` (no longer `any`). Already fixed since May 22.
- `src/lib/cache.ts:35` — `raw as T` escape hatch when no schema is passed. Documented intentional pattern (VGC-146). **Skip.**
- `src/lib/parser/showdown-parser.ts:114-115` — `tt as PokemonType` after `.includes()`. Sound but could be a typed predicate. **Skip — cosmetic.**
- `src/lib/data/pkmn-dex-fallback.ts:68,77,111,133` — `entry.baseStats as StatSpread`, `entry.types as PokemonType[]`. Third-party `@pkmn/dex` types are looser than ours; the defensive checks around them are correct. **Skip.**
- `src/lib/analysis/stat-calculator.ts:58,74` — `result as StatSpread` after a known-complete `Partial<StatSpread>` loop. Sound. **Skip.**

---

## E. Recommended tonight

Tomorrow's wave can ship these without risk:

| # | File | Change | LOC | On conflict-risk list? |
|---|------|--------|-----|------------------------|
| 1 | `src/lib/i18n/index.ts:96` | Add `: I18nContextValue` to `useTranslation()` | 1 | No |
| 2 | `src/lib/posthog-server.ts:24` | Add `: void` to `captureServerEvent()` | 1 | No |
| 3 | `src/lib/notifications.ts:9,30` | Add `: Promise<void>` to both functions | 2 | No |
| 4 | `src/lib/email.ts:79,181` | Add `: Promise<void>` to two fire-and-forget senders | 2 | No |
| 5 | `src/lib/email.ts:321` | Add `: string` to `buildWeeklySummaryHtml()` | 1 | No |
| 6 | `tsconfig.json:7` | Add `noImplicitReturns: true` + `noFallthroughCasesInSwitch: true` | 2 | No |
| 7 | `src/lib/utils/pokepaste.ts:19,22,44,47` | Type the four `res.json()` calls inline | 4 | No |
| 8 | `src/lib/linear.ts:32` | Narrow `res.json()` to `{ data?: unknown; errors?: { message: string }[] }` | 1 | No |
| 9 | `src/lib/discord-bot.ts:15` | Annotate `discordFetch()` as `: Promise<unknown>` + cast at call site | 2 | No |

Total: ~16 lines, all in lib helpers, none on the changed-files conflict list.

---

## F. Conflict-risk cross-reference

`.swarm/main-changed-files.md` flags 33 files. **None of the recommendations above touch any of them.** The closest call:
- Recommendations #2, #3, #4, #5 are in `src/lib/posthog-server.ts`, `src/lib/notifications.ts`, `src/lib/email.ts`, `src/lib/linear.ts`, `src/lib/utils/pokepaste.ts`, `src/lib/discord-bot.ts` — all OUTSIDE the changed-files list.
- `src/lib/analysis/detect-regulation.ts`, `src/lib/data/champions-dex.ts`, `src/lib/data/mega-pokemon.ts`, `src/lib/data/pokemon.ts`, `src/lib/data/tags.ts`, `src/lib/utils/sprite-slug.ts`, `src/lib/utils/sprite-url.ts`, `src/lib/validation/champions-legality.ts` ARE on the changed-files list — no findings touch them this round.

---

## G. Deferred (good ideas, need their own tickets)

- `tsconfig.json`: add `noUncheckedIndexedAccess`. High-value but high-touch — needs its own day. Will catch real bugs in `allSlideKeys[physicalIndex]`-style access patterns.
- Clerk webhook (`src/app/api/webhooks/clerk/route.ts:46`) — replace `as unknown as ClerkUserCreatedData` with Clerk's `UserJSON` type or a Zod schema. Webhook code deserves its own validation pass.
- `src/lib/parser/showdown-parser.ts:114` — convert `.includes()` + cast to a typed predicate `(t): t is PokemonType => POKEMON_TYPES.includes(t)`. Pure cosmetic.
- Once the Integrate phase adds `commonModesTitle` etc. to `en.ts`, drop the `as unknown as Record<string, string \| undefined>` casts at `useSlideSystem.ts:56` and `CommonModesSlide.tsx:73`.

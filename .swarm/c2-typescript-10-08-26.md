# C2 — TypeScript Strictness Audit — 2026-08-10

**Read-only audit.** No repo file was modified. All scratch configs written to `/tmp/c2-ts/`.
Verified at the end: `git diff --stat -- tsconfig.json` → empty, and `md5sum` of `tsconfig.json`
matches the pre-audit backup (`2a9a521d5d1114adf50ee42e5b2fe521`).

TypeScript 5.9.3. Baseline `node node_modules/typescript/bin/tsc --noEmit` → **0 errors**.
312 files under `src/` in the program.

---

## 1. Current tsconfig.json state

`compilerOptions` contains **no** individual strict-family flags — only the umbrella `"strict": true`.
Everything else is module/target/JSX plumbing (`target: ES2017`, `moduleResolution: bundler`,
`isolatedModules`, `incremental`, `skipLibCheck: true`, Next plugin, `@/*` path alias).

### ON (implied by `strict: true`, not written out)
| Flag | Status |
|---|---|
| `noImplicitAny` | ON (via strict) |
| `strictNullChecks` | ON (via strict) |
| `strictFunctionTypes` | ON (via strict) |
| `strictBindCallApply` | ON (via strict) |
| `strictPropertyInitialization` | ON (via strict) |
| `strictBuiltinIteratorReturn` | ON (via strict, TS 5.6+) |
| `noImplicitThis` | ON (via strict) |
| `alwaysStrict` | ON (via strict) |
| `useUnknownInCatchVariables` | ON (via strict) |

### OFF (not enabled by `strict`)
`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
`exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`,
`noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax`;
plus `allowUnreachableCode` / `allowUnusedLabels` which default to permissive and would need
explicit `false`.

`skipLibCheck: true` is also on — worth knowing, but leave it (turning it off type-checks
`@pkmn/dex` + Clerk + OTel `.d.ts` and is pure noise).

---

## 2. MEASURED cost of every currently-off flag

Method: `/tmp/c2-ts/tsconfig.<flag>.json` extends the **real** `/home/user/VGC-Team-Report/tsconfig.json`
with exactly one flag added and `incremental: false`, then
`node node_modules/typescript/bin/tsc --noEmit -p <scratch>`. File-list parity between the real
config and a scratch config was verified with `--listFiles` (identical, 312 `src/` files), and flag
application was verified with `--showConfig`.

| Flag | Errors | Top 3 files by error count |
|---|---:|---|
| `noImplicitOverride` | **0** | — free win |
| `noFallthroughCasesInSwitch` | **0** | — free win |
| `noUncheckedSideEffectImports` | **0** | — free win |
| `allowUnreachableCode: false` | **0** | — free win |
| `allowUnusedLabels: false` | **0** | — free win |
| `verbatimModuleSyntax` | **0** | — 0 tsc errors, but see caveat below |
| `noImplicitReturns` | **2** | `src/components/ui/NotificationBell.tsx` (1), `src/hooks/useShareUrl.ts` (1) |
| `noUnusedParameters` | **5** | `src/components/input/PasteInput.tsx` (2), `SpeedTierChart.tsx` (1), `PokemonDetailSlide.tsx` (1) |
| `noUnusedLocals` | **23** | `src/app/page.tsx` (4), `src/components/layout/Navbar.tsx` (3), `src/components/explore/ExploreFilters.tsx` (3) |
| `exactOptionalPropertyTypes` | **57** | `src/app/page.tsx` (9), `src/hooks/useHomePage.ts` (6), `src/components/report/TournamentMode.tsx` (6) *(tie: `TeamOverview.tsx` 6)* |
| `noUncheckedIndexedAccess` | **327** | `src/lib/parser/__tests__/showdown-parser.test.ts` (39), `src/app/api/share/route.ts` (20), `src/app/api/user/analytics/route.ts` (16) |
| `noPropertyAccessFromIndexSignature` | **644** | `src/app/api/webhooks/posthog/route.ts` (46), `src/lib/utils/normalize-report.ts` (42), `src/app/api/explore/route.ts` (32) |

Also re-measured for completeness (all already ON via `strict`, so all **0** and all no-ops if
written out explicitly): `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`,
`strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`,
`useUnknownInCatchVariables`, `strictBuiltinIteratorReturn`.

### VGC-261 ("Enable 4 already-clean TS strict flags") — verdict

The ticket body is not in the repo (only the `l0-triage-10-08-26.md` one-liner at line 35), so I
could not read which four it names — Linear MCP is unauthenticated in this container.

**The claim "4 flags are clean at 0 errors" is TRUE and in fact conservative.** Measured, there are
**six** genuinely-off flags at 0 errors:

1. `noImplicitOverride` — 0
2. `noFallthroughCasesInSwitch` — 0
3. `noUncheckedSideEffectImports` — 0
4. `allowUnreachableCode: false` — 0
5. `allowUnusedLabels: false` — 0
6. `verbatimModuleSyntax` — 0

**Recommendation for tonight's implementer:** enable **1–5**. That is the safe set — all five are
pure diagnostics with zero emit effect, and all five verify clean today.

**Hold `verbatimModuleSyntax`.** It reports 0 tsc errors but it is not a diagnostics-only flag: it
changes import elision semantics, and Next 16 / SWC reads it during transform. Enabling it without a
full `next build` is not verified, and a type-only import that is currently elided would start being
emitted. If the implementer wants it, it needs its own commit + a real build, not a piggyback.

Two flags a naive reading might count as "already clean" are `useUnknownInCatchVariables` and
`strictFunctionTypes`. They are 0-error, but only because `strict: true` already turned them on —
writing them into `tsconfig.json` is a no-op that adds noise. Don't count them toward the four.

### Guidance on the expensive flags

- **`noPropertyAccessFromIndexSignature` (644) — recommend NOT enabling.** Only 76 of the 644 are
  `process.env.FOO`. The other ~568 are dot-access on DB rows and `Record<string, unknown>` blobs:
  the most-hit properties are `id` (36), `paste` (33), `data` (31), `tournamentName` (24),
  `creatorName` (24), `created_at` (23). Turning the flag on converts all of those to
  `row['created_at']`, which is churn that makes the code *less* readable and fixes no bug. The
  actual defect this flag is pointing at is that Neon query results are untyped. Fix that instead
  (typed row interfaces / zod-parsed rows in `src/lib/db.ts` call sites) and the flag becomes
  cheap later. Worth its own ticket, phrased as "type the SQL rows", not "enable the flag".
- **`noUncheckedIndexedAccess` (327)** — this is the flag with real bug-finding value in a
  dex/parser codebase, and `IMPROVEMENTS.md` §7.7 already tracks it (it recorded 329; my 327 today
  confirms the estimate is stable). Breakdown by area: `src/app` 162, `src/components` 57, tests 49,
  `src/lib` 44, `src/hooks` 15. The `src/lib` slice is only 44 errors and is concentrated in
  `sprite-url.ts` (12), `showdown-parser.ts` (8), `random-accent.ts` (6), `paste-edit.ts` (6) —
  a plausible single-session chunk. It cannot be enabled globally tonight.
- **`exactOptionalPropertyTypes` (57)** — 34 of 57 are `TS2375`, i.e. building an object literal with
  `foo: string | undefined` and assigning it to a type declaring `foo?: string`. Almost all are in
  UI/hook props (`src/components` 31, `src/app` 12, `src/hooks` 10); `src/lib` has only **3**
  (`showdown-parser.ts:190`, `showdown-parser.ts:209`, `posthog-server.ts:38`). Mostly mechanical
  (`foo?: string | undefined` in the interface, or conditional spread), but 57 sites across mostly
  `.tsx` means a `ui-checklist-reviewer` pass. Not a tonight job.
- **`noUnusedLocals` (23) / `noUnusedParameters` (5)** — cheap and worth doing, but note ESLint
  currently does **not** catch these: `eslint.config.mjs` is bare `eslint-config-next/core-web-vitals`
  + `/typescript` with no `no-unused-vars` override. These 28 items overlap the C1 dead-code agent's
  territory — coordinate so the same lines aren't deleted twice. Full list in §2a below.
- **`noImplicitReturns` (2)** — two sites, both `TS7030`:
  `src/components/ui/NotificationBell.tsx:78` and `src/hooks/useShareUrl.ts:137`. Both look like
  `useEffect` callbacks with a conditional cleanup return. Trivially fixable; a good candidate to
  bundle with the free-win batch **only if** the implementer is willing to touch two `.tsx`/hook
  files (which pulls in the `ui-checklist-reviewer` requirement). Otherwise defer.

### 2a. Full unused-symbol list (for C1 coordination)

`noUnusedLocals` (23): `src/app/api/user/profile/route.ts:4` `auth` ·
`src/app/dashboard/DashboardContent.tsx:8` `UserButton` ·
`src/app/dashboard/profile/page.tsx:9` `UserButton` ·
`src/app/page.tsx:6` `Link`, `:48` `summarizeChangedFields`, `:187` `megaStates`, `:226` `walkthroughIsFirstTime` ·
`src/components/explore/ExploreContent.tsx:13` `SearchCategory` ·
`src/components/explore/ExploreFilters.tsx:57,65,73` `CATEGORY_I18N`/`SORT_I18N`/`PLACEMENT_I18N` ·
`src/components/explore/SpotlightCard.tsx:29` `t` ·
`src/components/layout/Navbar.tsx:186` `syncStatus`, `:202` `exportMenuOpen`/`setExportMenuOpen` ·
`src/components/report/PokemonCard.tsx:180` `displayData` ·
`src/hooks/useSlideSystem.ts:34` `hiddenSlides` ·
`src/lib/data/tags.ts:33` `EventType` (TS6196, unused type) ·
`src/lib/discord-bot.ts:50` `PRIORITY_LABELS` ·
`src/lib/sharing/url-codec.ts:161` `toBase64Url` ·
plus test-only: `src/lib/__tests__/cron-auth.test.ts:1` `vi`, `src/lib/sharing/__tests__/url-codec.test.ts:1` `vi`, `beforeAll`.

`noUnusedParameters` (5): `src/components/input/PasteInput.tsx:121` `selectedTemplate`, `onTemplateSelect` ·
`src/components/report/MatchupPlanSlide.tsx:447` `onResultChange` ·
`src/components/report/PokemonDetailSlide.tsx:243` `category` ·
`src/components/report/SpeedTierChart.tsx:540` `i`.

Note `PasteInput.tsx:121` and `MatchupPlanSlide.tsx:447` are *props* that are destructured and never
used — those are dead props on the component's public interface, i.e. the caller is still passing
them. Deleting the parameter without deleting the call-site prop is only half the fix.

---

## 3. `any` inventory — `src/lib/**` and `src/app/api/**`

### Explicit `any`: zero.

A regex sweep for type-position `any` (`: any`, `as any`, `<any`, `any[]`, `any>`) across **all of
`src/`** returns exactly **one** hit, and it is the English word "any" inside a comment
(`src/components/display/DisplayTogglePill.tsx:67`). There are:

- **0** `eslint-disable`/`no-explicit-any` suppressions anywhere in `src/`
- **0** `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` anywhere in `src/`

The `Record<string, any>` + eslint-disable in `src/app/api/migrate/route.ts` flagged by the
2026-05-22 audit has been fixed. **On explicit `any`, this codebase is clean — there are no "lazy
`any`" offenders to list, because there are no explicit `any`s.**

### The real exposure is *implicit* `any` at JSON boundaries

`Response.json()` / `Request.json()` are typed `Promise<any>` in lib.dom, so every unannotated
`await …json()` injects an `any` that `noImplicitAny` cannot see. There are **40** such call sites in
`src/lib` + `src/app/api` (tests excluded), against **34** `safeParse` guards.

**Genuinely-unavoidable / correctly-handled (inbound request bodies — 25+ sites).** The dominant
pattern is `const raw = await request.json(); const parsed = Schema.safeParse(raw);` — the `any` dies
one line later at a zod boundary. This is the right pattern and needs no change:
`api/share/route.ts:88`, `api/match-log/route.ts:37`, `api/feedback/route.ts:90`,
`api/comments/**`, `api/reactions/[shareId]/route.ts:65`, `api/views/[shareId]/route.ts:26`,
`api/user/saved/route.ts:74,127`, `api/user/follow/route.ts:47,74`, `api/user/profile/route.ts:75`,
`api/user/reports/[shareId]/route.ts:30`, `api/user/drafts/route.ts:104`,
`api/share/[id]/collaborators/route.ts:93,210`, `api/user/collaborations/route.ts:77`,
`api/user/notifications/route.ts:86`. Only cosmetic nit: annotate `raw: unknown` so the `any` never
exists at all — zero behavioural change, and it makes the guard structurally enforced.

**Lazy — inbound body used without validation (4 sites, real risk, worth tickets):**

| Site | Problem |
|---|---|
| `src/app/api/user/collections/route.ts:86` | `const action = raw.action as string;` — reads an `any` property and *casts* it to `string` **before** any `safeParse`. The per-action schemas run after. A non-string `action` sails through the cast. |
| `src/app/api/user/drafts/route.ts:160` | `const { draftId } = await request.json();` — `draftId` is `any`, only checked for truthiness, then interpolated into a `DELETE … WHERE id = ${draftId}`. Neon's tagged template parameterizes it so it is not injectable, but a non-string type is not rejected. |
| `src/app/api/share/[id]/versions/route.ts:106` | `body.version` off an `any`, salvaged by `Number()` + `Number.isInteger`. Sound in practice, but the guard is manual. |
| `src/app/api/webhooks/posthog/route.ts:188-209` | The largest one. `body` is `any`, then ~6 chained optional reads (`body.person?.properties?.email`, `body.data?.event_name`, …) plus `properties.$session_id as string \| undefined`. This is an unauthenticated-shape third-party payload handled entirely by `??` defaults with no schema. Highest-value zod target in the codebase. |

**Lazy — outbound third-party responses returned as `any` (11 sites).** `return res.json()` with no
annotation makes the `any` escape the function and infect every caller:
`src/lib/email.ts:69`, `src/lib/discord-bot.ts:33`, `src/lib/linear.ts:32` (`data.errors[0].message`
read straight off `any`), `src/app/api/discord/route.ts:33`,
`src/app/api/cron/daily-ops/route.ts:89,165`, `src/app/api/cron/weekly-report/route.ts:26,120`
(`(await res.json()).data` — `any` in one expression), `src/app/api/cron/posthog-errors/route.ts:103`,
`src/lib/utils/pokepaste.ts:19,22,44,47` (`data.paste`, `data.title`, `data.error` all off `any`).

Good counter-example already in the repo: `src/app/api/cron/posthog-errors/route.ts:88` does
`const data: PostHogErrorResponse = await res.json();`. That one-line annotation is the fix pattern
for the other ten.

**Documented, acceptable escape hatch:** `src/lib/cache.ts:34` `return raw as T` when no schema is
passed — the VGC-146 comment explains it, and the schema path is the default. Leave it.

**`as unknown as` double-casts (5, all of them small):** `src/lib/i18n/index.ts:84`,
`src/lib/data/dex-subset.ts:62`, `src/app/api/webhooks/clerk/route.ts:46`,
`src/hooks/useSlideSystem.ts:56`, `src/components/report/CommonModesSlide.tsx:108`. The two i18n ones
(`t as unknown as Record<string, string | undefined>` to read a key the dictionary type doesn't
declare) are the same smell twice: the translation dictionary type is missing keys the UI actually
uses. Fixing the dictionary type kills both casts.

---

## 4. Exported functions in `src/lib/**` missing an explicit return type

Measured with the TypeScript compiler API (`/tmp/c2-ts/scan.mjs`), covering exported
`function` declarations and exported `const` arrow/function expressions. **10 total, 0 in tests** —
down sharply from the 2026-05-22 audit, so most of that list has been fixed.

| File:line | Function | Inferred return | Priority |
|---|---|---|---|
| `src/lib/email.ts:32` | `sendEmail` | `Promise<any>` | **High** — leaks `any` to callers |
| `src/lib/discord-bot.ts:60` | `postFeedbackEmbed` | `Promise<any>` | **High** — leaks `any` to callers |
| `src/lib/email.ts:79` | `sendCommentNotificationEmail` | `Promise<void>` | Low |
| `src/lib/email.ts:181` | `sendWelcomeEmail` | `Promise<void>` | Low |
| `src/lib/email.ts:321` | `buildWeeklySummaryHtml` | `string` | Low |
| `src/lib/notifications.ts:9` | `createNotification` | `Promise<void>` | Low |
| `src/lib/notifications.ts:30` | `notifyFollowers` | `Promise<void>` | Low |
| `src/lib/posthog-server.ts:31` | `captureServerEvent` | `void` | Low |
| `src/lib/i18n/index.ts:47` | `I18nProvider` | `FunctionComponentElement<…>` | Skip — JSX component, inference is idiomatic |
| `src/lib/i18n/index.ts:97` | `useTranslation` | `I18nContextValue` | Low — interface already declared in-file |

Only **2 of the 10** are actually harmful: `sendEmail` and `postFeedbackEmbed` both infer
`Promise<any>` because they end in an unannotated `res.json()`, which is the §3 outbound-response
problem surfacing through the public API of `src/lib`. Those two are the ones worth a ticket; the
other seven infer a correct concrete type and adding the annotation is documentation, not a fix.

---

## Recommended action, in priority order

1. **VGC-261 tonight — enable 5 flags, not 4** (`noImplicitOverride`, `noFallthroughCasesInSwitch`,
   `noUncheckedSideEffectImports`, `allowUnreachableCode: false`, `allowUnusedLabels: false`).
   All verified at 0 errors against the current tree. **Exclude `verbatimModuleSyntax`** — 0 tsc
   errors but it changes emit and needs its own `next build`. Do not write out
   `useUnknownInCatchVariables` / `strictFunctionTypes`; `strict: true` already covers them.
   Note the tsconfig-only commit will trip the Ignored Build Step gotcha if it lands as the tip
   commit of a push — order it before a code commit.
2. **New ticket: zod-validate the PostHog webhook body** (`api/webhooks/posthog/route.ts:188-209`)
   and fix the pre-validation cast at `api/user/collections/route.ts:86`.
3. **New ticket: annotate the 11 outbound `res.json()` sites**, which also fixes the two
   `Promise<any>` exports in `src/lib` (`email.ts:32`, `discord-bot.ts:33/60`). Follow the existing
   `posthog-errors/route.ts:88` pattern. Note `email.ts`, `discord-bot.ts` and `linear.ts` were on
   the conflict-risk list in May — re-check `main-changed-files.md` before touching them.
4. **New ticket: `noUncheckedIndexedAccess`, `src/lib` slice only** (44 errors, 4 files) as phase 1
   of IMPROVEMENTS.md §7.7. Leave `src/app` (162) and `src/components` (57) for later phases.
5. **Re-scope, don't enable, `noPropertyAccessFromIndexSignature`.** The 644 errors are a symptom of
   untyped Neon rows. File it as "add row types to SQL query results", and revisit the flag after.
6. `noUnusedLocals`/`noUnusedParameters` (28 items) — hand to C1's dead-code pass rather than
   enabling the flags standalone; ESLint is not catching these today.

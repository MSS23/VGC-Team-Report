# C2 — TypeScript Strictness Audit (31-08-26)

Read-only audit. No repo source file was modified; every measurement used a throwaway
tsconfig in the session scratchpad (`/tmp/.../scratchpad/tsflags/*.json`) that `extends`
the repo `tsconfig.json` and flips exactly one flag.

- TypeScript: **5.9.3**
- Command per flag: `node node_modules/typescript/bin/tsc --noEmit --incremental false -p <temp-config>`
- Baseline (`npm run typecheck`, cold): **0 errors**, ~13s wall.
- Error counts below count only top-level diagnostic lines (`^<file>(line,col): error TSxxxx`),
  not the indented "Type 'X' is not assignable…" continuation lines.

---

## 1. Flag inventory

`strict: true` is on, so the strict-family sub-flags are implicitly enabled. The repo also
turns on five extra non-strict-implied flags (added by VGC-261, commit `bdbbfac`, 2026-08-11).

| Flag | State | How |
|---|---|---|
| `strict` | **ON** | explicit |
| `noImplicitAny` | **ON** | implied by `strict` |
| `strictNullChecks` | **ON** | implied by `strict` |
| `strictFunctionTypes` | **ON** | implied by `strict` |
| `useUnknownInCatchVariables` | **ON** | implied by `strict` |
| `strictBindCallApply` / `strictPropertyInitialization` / `alwaysStrict` / `noImplicitThis` | **ON** | implied by `strict` |
| `noImplicitOverride` | **ON** | explicit (VGC-261) |
| `noFallthroughCasesInSwitch` | **ON** | explicit (VGC-261) |
| `noUncheckedSideEffectImports` | **ON** | explicit (VGC-261) |
| `allowUnreachableCode: false` | **ON** | explicit (VGC-261) |
| `allowUnusedLabels: false` | **ON** | explicit (VGC-261) |
| `noUncheckedIndexedAccess` | **OFF** | — |
| `exactOptionalPropertyTypes` | **OFF** | — |
| `noUnusedLocals` | **OFF** | — |
| `noUnusedParameters` | **OFF** | — |
| `noImplicitReturns` | **OFF** | — |
| `verbatimModuleSyntax` | **OFF** | deliberately, per tsconfig comment |
| `noPropertyAccessFromIndexSignature` | **OFF** | — (not on the brief; measured anyway) |

Other relevant settings: `skipLibCheck: true` (so `node_modules` .d.ts errors are never
surfaced), `allowJs: true`, `incremental: true` (buildinfo at repo root; the gate must run
cold — confirmed still true), `exclude: ["node_modules", "cypress"]` — **Cypress specs are
not type-checked at all** by the gate.

---

## 2. Measured error counts (hard evidence)

| Flag | Currently | Errors if enabled | Files touched | Verdict |
|---|---|---|---|---|
| `strict` | ON | 0 (baseline) | — | already clean |
| `noImplicitAny` | ON (implied) | 0 | 0 | already clean — re-measured explicitly |
| `strictNullChecks` | ON (implied) | 0 | 0 | already clean — re-measured explicitly |
| `strictFunctionTypes` | ON (implied) | 0 | 0 | already clean — re-measured explicitly |
| `useUnknownInCatchVariables` | ON (implied) | 0 | 0 | already clean — re-measured explicitly |
| `noImplicitOverride` | ON | 0 | 0 | already clean |
| `noFallthroughCasesInSwitch` | ON | 0 | 0 | already clean |
| `verbatimModuleSyntax` | **OFF** | **0** | 0 | **free to enable (diagnostics)** — but changes emit, see §3 |
| `noImplicitReturns` | **OFF** | **2** | 2 | 2 errors to fix — trivial |
| `noUnusedParameters` | **OFF** | **5** | 4 | 5 errors to fix — trivial |
| `noUnusedLocals` | **OFF** | **22** | 15 | 22 errors to fix — mechanical (dead imports/vars) |
| `exactOptionalPropertyTypes` | **OFF** | **57** | 21 | 57 errors — real design work |
| `noUncheckedIndexedAccess` | **OFF** | **323** | 72 | 323 errors — large project |
| `noPropertyAccessFromIndexSignature` | OFF | **649** | 74 | 649 errors (all TS4111) — not worth it |

Combined runs (to size a single cleanup commit):

| Combination | Errors |
|---|---|
| `noUnusedLocals` + `noUnusedParameters` + `noImplicitReturns` | **29** |
| all six OFF flags from the brief at once (incl. `verbatimModuleSyntax`) | **405** (vs 409 summed — 4 cascade overlaps) |

### VGC-261 claim: **verified, with one correction**

The ticket says "enable 4 strict flags that are already clean (0 errors each)".

- The work already landed: commit `bdbbfac` (2026-08-11) added the flags to `tsconfig.json`.
- The claim is **substantively true** — the flags are on and the cold program type-checks at
  0 errors today.
- **Correction: it was 5 flags, not 4** (`noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `noUncheckedSideEffectImports`, `allowUnreachableCode: false`, `allowUnusedLabels: false`).
  The tsconfig comment itself says "the five flags below".
- The two flags the ticket might have meant as the other pair, `useUnknownInCatchVariables`
  and `strictFunctionTypes`, are already implied by `strict: true`; I measured them
  explicitly anyway and both are 0 — writing them out would be a no-op, as the comment states.
- If VGC-261 is still open in Linear it is **stale** and should be closed, not re-implemented.

---

## 3. Per-flag detail

### `verbatimModuleSyntax` — 0 errors, but do not treat as free
No diagnostics. However it changes import elision at **emit** time (type-only imports must be
written `import type`), and `isolatedModules` is already on so the risk is low but non-zero.
The existing tsconfig comment flags this correctly: it needs its own commit with a real
`next build` behind it. **I did not run `next build`** (it writes into `.next/` inside the
repo, and this audit is read-only), so the build side remains unverified.

### `noImplicitReturns` — 2 errors
```
src/components/ui/NotificationBell.tsx(78,13): error TS7030: Not all code paths return a value.
src/hooks/useShareUrl.ts(137,13): error TS7030: Not all code paths return a value.
```
Both are almost certainly `useEffect` callbacks with a conditional cleanup return — the
classic false-positive shape. Fix = `return undefined;` on the other branch. Cheapest win here.

### `noUnusedParameters` — 5 errors
```
src/components/input/PasteInput.tsx(121,63): 'selectedTemplate'
src/components/input/PasteInput.tsx(121,81): 'onTemplateSelect'
src/components/report/MatchupPlanSlide.tsx(447,3): 'onResultChange'
src/components/report/PokemonDetailSlide.tsx(244,3): 'category'
src/components/report/SpeedTierChart.tsx(548,35): 'i'
```
All in `src/components`, none in `src/lib`. Three are destructured props that a component
accepts but no longer uses — worth checking whether the prop should be *removed* from the
interface rather than prefixed with `_`. (Note: `_`-prefixing satisfies the flag by default.)

### `noUnusedLocals` — 22 errors, 15 files
```
src/app/api/user/profile/route.ts(4,10): 'auth'
src/app/dashboard/DashboardContent.tsx(8,10): 'UserButton'
src/app/dashboard/profile/page.tsx(9,10): 'UserButton'
src/app/page.tsx(6,1): 'Link'
src/app/page.tsx(52,30): 'summarizeChangedFields'
src/app/page.tsx(190,5): 'megaStates'
src/app/page.tsx(229,5): 'walkthroughIsFirstTime'
src/components/explore/ExploreContent.tsx(13,31): 'SearchCategory'
src/components/explore/ExploreFilters.tsx(57,7): 'CATEGORY_I18N'
src/components/explore/ExploreFilters.tsx(65,7): 'SORT_I18N'
src/components/explore/ExploreFilters.tsx(73,7): 'PLACEMENT_I18N'
src/components/explore/SpotlightCard.tsx(29,9): 't'
src/components/layout/Navbar.tsx(186,20): 'syncStatus'
src/components/layout/Navbar.tsx(202,10): 'exportMenuOpen'
src/components/layout/Navbar.tsx(202,26): 'setExportMenuOpen'
src/components/report/PokemonCard.tsx(180,9): 'displayData'
src/hooks/useSlideSystem.ts(34,35): 'hiddenSlides'
src/lib/__tests__/cron-auth.test.ts(1,32): 'vi'
src/lib/data/tags.ts(33,6): 'EventType'            (TS6196 — unused type alias)
src/lib/discord-bot.ts(50,7): 'PRIORITY_LABELS'
src/lib/sharing/__tests__/url-codec.test.ts(1,32): 'vi'
src/lib/sharing/url-codec.ts(77,10): 'toBase64Url'
```
Only 3 are in `src/lib` non-test code. Several overlap with C1's dead-code findings
(`toBase64Url`, `PRIORITY_LABELS`, `EventType`) — coordinate so the same deletions are not
made twice.

**Why these survive CI:** eslint *does* catch them, but `@typescript-eslint/no-unused-vars`
fires as a **warning**, and `.github/workflows/ci.yml` runs `npm run lint` with
`continue-on-error: true`. Current lint state: **95 problems (33 errors, 62 warnings)** —
the CI comment says "35 pre-existing", so the debt has drifted by 2. Turning on
`noUnusedLocals` would move this class of debt into the blocking `typecheck` step, which is
the more useful gate.

### `exactOptionalPropertyTypes` — 57 errors, 21 files
Error mix: TS2375 ×31, TS2379 ×12, TS2769 ×8, TS2322 ×4, TS2345 ×2.
By area: components 31, app 12, hooks 11, lib 3.
Hot files:
```
9  src/app/page.tsx
6  src/hooks/useHomePage.ts
6  src/components/report/TournamentMode.tsx
6  src/components/report/TeamOverview.tsx
4  src/components/ui/PdfExport.tsx
3  src/components/report/TeamReport.tsx
3  src/components/report/CommonModesSlide.tsx
2  src/lib/parser/showdown-parser.ts
2  src/hooks/useTeamMeta.ts
2  src/components/report/SpeedTierChart.tsx
2  src/components/report/PokemonDetailSlide.tsx
2  src/app/api/feedback/route.ts
1  each: src/lib/posthog-server.ts, src/components/ui/ShareModal.tsx,
        src/components/layout/Navbar.tsx, src/components/input/PasteInput.tsx,
        src/components/explore/ExploreContent.tsx, src/hooks/useSlideSystem.ts,
        src/hooks/useMatchupPlans.ts, src/app/champions/[pokemon]/page.tsx,
        src/hooks/__tests__/useSwipeNavigation.test.tsx
```
Dominant pattern: optional props declared `foo?: string` / `shiny?: boolean` are being
assigned an explicit `undefined` (spread of a partial object, or `foo: maybeUndefined`).
The fix is either widening the declaration to `foo?: string | undefined` or conditionally
omitting the key. **Widening every declaration to `| undefined` defeats the point of the
flag** — this needs a real pass, not a codemod. Not recommended as a swarm-sized task.

### `noUncheckedIndexedAccess` — 323 errors, 72 files
Error mix: TS2532 ×146 ("possibly undefined"), TS18048 ×122, TS2345 ×33, TS2322 ×15,
TS2538 ×5, TS2769 ×2.
By area: app 167 (of which `src/app/api` = 148), components 58, lib non-test 32, hooks 24,
tests 51.
Hot files:
```
40  src/lib/parser/__tests__/showdown-parser.test.ts
20  src/app/api/share/route.ts
16  src/app/api/user/analytics/route.ts
14  src/app/api/share/[id]/route.ts
10  src/components/report/TeamReport.tsx
 9  src/app/api/explore/route.ts
 8  src/lib/parser/showdown-parser.ts
 7  src/components/seo/JsonLd.tsx
 7  src/app/api/user/profile/route.ts
```
Concentrated in API route handlers indexing SQL result rows (`rows[0].x`) and in the
Showdown parser indexing split lines. A third of the count is in test files, where
`!` / non-null assumptions are acceptable. This is the highest-value flag for real
null-safety (the parser and the share API are exactly where an out-of-range index would
bite) but it is a multi-session project, not a single commit.

### `noPropertyAccessFromIndexSignature` — 649 errors (measured out of curiosity)
All TS4111, 510 of them in `src/app` (webhook/analytics handlers reading
`payload.some_key` off `Record<string, unknown>`). Purely stylistic (`x.foo` → `x["foo"]`).
Recommend **never** enabling this one; the churn buys nothing.

---

## 4. `any` catalogue

Measured by AST (`ts.SyntaxKind.AnyKeyword` over all 324 `.ts`/`.tsx` files in `src`), not by
grep, so comments and the English word "any" do not count.

| Area | Explicit `any` type nodes |
|---|---|
| `src/lib` | **0** |
| `src/app` | 0 |
| `src/components` | 0 |
| `src/hooks` | 0 |
| `src/types` | 0 |
| **whole `src`** | **0** |

Grep for the bare token `any` returns 33 hits in `src/lib`, but **every one is prose in a
comment or a string** (e.g. "…(if any)…"). There is no `: any`, no `as any`, no `any[]`,
no `Promise<any>` written anywhere in `src`.

Related escape hatches:
- `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`: **0 occurrences** repo-wide.
- `as unknown as` double assertions: **6**
  - `src/lib/data/dex-subset.ts:105` — `rawSubset as unknown as PackedDexSubset` (JSON import cast)
  - `src/lib/i18n/index.ts:84` — `en as unknown as Record<string, string>`
  - `src/lib/sharing/__tests__/url-codec.test.ts:210` (test polyfill, fine)
  - `src/components/report/CommonModesSlide.tsx:108`, `src/hooks/useSlideSystem.ts:56` —
    both cast the i18n dictionary to `Record<string, string | undefined>`; same smell as
    `i18n/index.ts:84`, worth one shared typed accessor.
  - `src/app/api/webhooks/clerk/route.ts:46` — `event.data as unknown as ClerkUserCreatedData`
    (unvalidated webhook payload — flag to C4/security as well).
- `as <Type>` single assertions in `src/lib` non-test: 28.
- Non-null assertions (`x!.y`) in `src/lib` non-test: **0**.

### The real `any` surface is implicit, not written
`Response.json()` and `Request.json()` return `Promise<any>` in the DOM lib, so every
unvalidated read injects `any` into the program without the keyword ever appearing.

- **86** `.json()` reads across `src` (excluding `NextResponse.json(...)`/`Response.json(...)`
  constructors, of which there are 375):
  - 24 are request-body reads (`req.json()` / `request.json()`)
  - 62 are fetch-response reads
- 33 zod `parse`/`safeParse` call sites exist, so a good share of the request bodies *are*
  validated — but the fetch responses largely are not.
- Two exported `src/lib` functions leak this straight into their public signature:
  - `src/lib/email.ts:32` `sendEmail(...)` → inferred **`Promise<any>`** (`return res.json();`)
  - `src/lib/discord-bot.ts:60` `postFeedbackEmbed(...)` → inferred **`Promise<any>`**
    (`return res.json();` via the helper at `discord-bot.ts:33`)
- Other unvalidated `src/lib` reads: `src/lib/linear.ts:32`, `src/lib/utils/pokepaste.ts:19,22,44,47`.

**Recommendation:** give the two exported functions an explicit narrow return type (or
`unknown` + a zod parse). That removes the only two `any`s that escape into consumer code
and costs ~10 lines.

---

## 5. Missing return types on exported functions

Counted by AST over exported `function` declarations and exported `const f = () => …`.

| Area | Exported fns missing an explicit return type |
|---|---|
| `src/lib` (non-test) | **10 of 129** (92% annotated) |
| `src/hooks` | 24 |
| `src/components` | 112 (mostly React components — low value) |
| `src/app` | 121 (mostly page/route/metadata exports — low value) |
| tests | 0 |

`src/lib` is in good shape. The 10 gaps, with the type TS currently infers:

| Location | Function | Inferred return |
|---|---|---|
| `src/lib/email.ts:32` | `sendEmail` | **`Promise<any>`** ← fix this |
| `src/lib/discord-bot.ts:60` | `postFeedbackEmbed` | **`Promise<any>`** ← fix this |
| `src/lib/email.ts:79` | `sendCommentNotificationEmail` | `Promise<void>` |
| `src/lib/email.ts:181` | `sendWelcomeEmail` | `Promise<void>` |
| `src/lib/email.ts:321` | `buildWeeklySummaryHtml` | `string` |
| `src/lib/notifications.ts:9` | `createNotification` | `Promise<void>` |
| `src/lib/notifications.ts:30` | `notifyFollowers` | `Promise<void>` |
| `src/lib/posthog-server.ts:31` | `captureServerEvent` | `void` |
| `src/lib/i18n/index.ts:47` | `I18nProvider` | `FunctionComponentElement<…>` (React component) |
| `src/lib/i18n/index.ts:97` | `useTranslation` | `I18nContextValue` |

Only the top two are actual defects; the other eight infer correctly and annotating them is
cosmetic. Note that `sendEmail`'s JSDoc says "Returns null if RESEND_API_KEY is not set or
the request fails" — the signature should say `Promise<unknown | null>` or a parsed shape, and
the doc/type disagreement is exactly the sort of thing an explicit annotation would have caught.

---

## 6. Recommendations, in order

1. **Close VGC-261** — already shipped in `bdbbfac`; note it was 5 flags, not 4.
2. **One small commit: `noImplicitReturns` + `noUnusedParameters`** — 7 errors total, all
   mechanical, and it makes two more flags permanent. (~30 min.)
3. **Type the two `Promise<any>` leaks** in `src/lib/email.ts` and `src/lib/discord-bot.ts`.
   This is the entire explicit-`any` remediation the codebase needs.
4. **`noUnusedLocals` (22 errors)** — coordinate with C1's dead-code list first so deletions
   are not duplicated; several entries are genuine dead exports, not just unused imports.
   Consider also flipping `continue-on-error` off for lint once the 33 lint errors are cleared.
5. **`verbatimModuleSyntax`** — 0 diagnostics, but it must ride its own commit with a real
   `next build` verifying emit. Not free despite the 0.
6. **`exactOptionalPropertyTypes` (57)** — worth doing eventually; needs judgement per site.
   Do not codemod it by widening every optional to `| undefined`.
7. **`noUncheckedIndexedAccess` (323)** — highest real safety value (share API + parser), but
   plan it as a staged project, ideally per-directory via an override config rather than one
   323-error commit.
8. **Do not enable `noPropertyAccessFromIndexSignature`** (649 errors, zero safety gain).
9. Unrelated but noted: `exclude: ["node_modules", "cypress"]` means Cypress specs get no
   type checking at all. A separate `cypress/tsconfig.json` would close that hole.

---

### Reproduction

```bash
cd /home/user/VGC-Team-Report
cat > /tmp/t.json <<'JSON'
{ "extends": "/home/user/VGC-Team-Report/tsconfig.json",
  "compilerOptions": { "noUncheckedIndexedAccess": true, "incremental": false, "noEmit": true } }
JSON
node node_modules/typescript/bin/tsc --noEmit --incremental false -p /tmp/t.json | grep -cE "^[^ ].*error TS"
```

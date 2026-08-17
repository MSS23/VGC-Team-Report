# C2 — TypeScript strictness audit (17-08-26)

Branch audited: `claude/loving-sagan-853anq` @ `5d456cd`. Read-only; no file in `src/` touched.
TypeScript 5.9.3. All flag measurements below are **real `tsc` runs**, not estimates.

---

## 0. Correction to the brief: VGC-261 is already on `origin/main`

The task brief said VGC-261 ("enable 4 strict flags that are already clean") lives on the
unmerged `origin/swarm-nightly-2026-08-10`. That is stale:

```
git diff origin/main -- tsconfig.json   # → empty
```

`origin/main:tsconfig.json` already carries the VGC-261 block (`noImplicitOverride`,
`noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `allowUnreachableCode:false`,
`allowUnusedLabels:false`) plus the `npm run typecheck` cold-gate and the CI switch. **VGC-261
is done and merged** — it should be closed, not re-scheduled. Nothing below re-reports it.

Note the commit message's own correction, which holds up: the ticket listed
`useUnknownInCatchVariables` and `strictFunctionTypes`, but `strict: true` already implies both,
so the real count was five flags, not four/seven.

---

## 1. Measured flag results

**Method.** A temp config in `/tmp/c2ts/` extends the real `tsconfig.json` and enables exactly one
flag, then `node node_modules/typescript/bin/tsc --noEmit --incremental false -p <temp>`.
Verified the temp config resolves the **identical 324-file program** as the repo config
(`--listFilesOnly`, both = 324 non-`node_modules` files). Cold baseline = **0 errors**, ~12s.

| Candidate flag | Real error count | Verdict |
|---|---:|---|
| `strictBuiltinIteratorReturn` | **0** | No-op — already implied by `strict` in TS 5.6+. Don't add. |
| `useDefineForClassFields` | **0** | Clean, but changes *emit* semantics, not just diagnostics. No value here: the codebase has no class fields to protect. Skip. |
| `verbatimModuleSyntax` | **0** | Confirms VGC-261's measurement independently. Still correctly deferred — import-elision emit change, needs its own commit behind a real `next build`. |
| `erasableSyntaxOnly` | **0** | **Free win, and not covered by VGC-261.** Pure diagnostic; forbids `enum`/namespaces/param-properties. Recommend enabling. |
| `noImplicitReturns` | **2** | **Cheap win.** Both are real control-flow smells (below). |
| `noUnusedParameters` | **5** | Cheap; 5 dead params, 0 in `src/lib/`. |
| `noUnusedLocals` | **22** | Moderate; 5 are in `src/lib/`, incl. a genuinely dead export. |
| `exactOptionalPropertyTypes` | **57** | Real value, real cost. Only **3** in `src/lib/`. |
| `noUncheckedIndexedAccess` | **322** | **Do not enable.** Analysis in §1.4. |
| `noPropertyAccessFromIndexSignature` | **649** | Do not enable — pure style, enormous churn. |
| `isolatedDeclarations` | n/a | `TS5053: cannot be specified with allowJs`. Not applicable. |
| `skipLibCheck: false` | **301** | Keep `true`. All 301 are third-party `.d.ts`; zero signal. |

### 1.1 `noImplicitReturns` (2) — enable

```
src/components/ui/NotificationBell.tsx(78,13): TS7030: Not all code paths return a value.
src/hooks/useShareUrl.ts(137,13): TS7030: Not all code paths return a value.
```

Both sit at a `useEffect` cleanup position — an effect that returns a cleanup on some paths and
`undefined` on others. Not currently a bug, but it is exactly the shape that turns into a leaked
listener later. 2-line fix.

### 1.2 `noUnusedParameters` (5) — enable

`PasteInput.tsx:121` (`selectedTemplate`, `onTemplateSelect` — a prop pair threaded in and never
read, i.e. the template feature is wired but dead), `MatchupPlanSlide.tsx:447` (`onResultChange`),
`PokemonDetailSlide.tsx:244` (`category`), `SpeedTierChart.tsx:544` (`i`).
None in `src/lib/`. The two `PasteInput` props are worth a look — a caller may believe template
selection works.

### 1.3 `noUnusedLocals` (22) — enable after a small cleanup

`src/lib/` hits:

```
src/lib/data/tags.ts(33,6)        TS6196: 'EventType' is declared but never used
src/lib/discord-bot.ts(50,7)      TS6133: 'PRIORITY_LABELS' is declared but its value is never read
src/lib/sharing/url-codec.ts(77,10) TS6133: 'toBase64Url' is declared but its value is never read
src/lib/__tests__/cron-auth.test.ts(1,32)          'vi'
src/lib/sharing/__tests__/url-codec.test.ts(1,32)  'vi'
```

`url-codec.ts:toBase64Url` is the interesting one — a base64url *encoder* that nothing calls, in
the module that owns share-link encoding. Either the encode path was replaced and this is a
leftover, or an encode/decode asymmetry was introduced. Worth C1's dead-code cross-check.

Remaining 17 are app/component-level (`page.tsx` ×4 incl. `megaStates` and
`walkthroughIsFirstTime`, `Navbar.tsx` ×3 incl. `exportMenuOpen`/`setExportMenuOpen` — a state
pair that is set up and never used, `ExploreFilters.tsx` ×3 i18n dictionaries, etc.).
`Navbar`'s unused `exportMenuOpen` and `page.tsx`'s `megaStates` both look like half-removed
features rather than harmless imports.

### 1.4 `noUncheckedIndexedAccess` (322) — recommend AGAINST

322 errors, 73 of them in `src/lib/` (40 of those in one test file). I sampled the actual
diagnostics rather than trusting the count, and **the large majority are provably safe**:

```ts
// src/lib/utils/random-accent.ts — 6 errors, all this one line's consumers
const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
//    ^ 'palette' is possibly 'undefined' ×6 — PALETTES is a non-empty `as const` literal
```

```ts
// src/lib/parser/showdown-parser.ts:29-30 — 2 of its 8
const match = part.match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/i);
if (match) {
  const value = parseInt(match[1], 10);          // match[1] guaranteed by the pattern
  const key = statMap[match[2].toLowerCase()];   // match[2] likewise
```

Enabling this would force ~322 non-null assertions or guards, most of which add noise and a few
of which would be `!` — which is strictly worse than the status quo, because `!` lies where the
current inference merely omits. There are a handful of legitimate catches
(`src/lib/data/pkmn-dex-fallback.ts:83/139` genuinely widens a `[PokemonType]`/`[PokemonType,
PokemonType]` tuple; `src/lib/utils/diff-state.ts:117`), but they are not worth 322 edits.
**Better targeted alternative:** fix those 3–4 sites by hand and leave the flag off.

### 1.5 `exactOptionalPropertyTypes` (57) — the only large flag worth a ticket

`src/lib/` cost is just **3 lines**:

```
src/lib/parser/showdown-parser.ts(194,5) + (213,3)  TS2375
  { pokemon, warnings, teamName: string | undefined } not assignable to ParsedTeam
src/lib/posthog-server.ts(38,14)  TS2379
  { distinctId, event, properties: Record<string, unknown> | undefined } → EventMessage
```

Both `showdown-parser` hits are the same root cause: `ParsedTeam.teamName?: string` (optional, not
`| undefined`) built via an object literal that always sets the key. The fix is one of
`teamName?: string | undefined` on the interface, or conditional spread at the two construction
sites. Everything else is UI/hooks: `src/app/page.tsx` ×9, `useHomePage.ts` ×6,
`TournamentMode.tsx` ×6, `TeamOverview.tsx` ×6, `PdfExport.tsx` ×4, then a long tail of 1–3.

Recommendation: this is a real ticket (57 sites), not a free win. It catches the
`{ key: undefined }` vs `{}` distinction, which matters for the share/draft serialisation paths
where a present-but-undefined key round-trips through JSON differently from an absent one.

### 1.6 Suggested ticket split

- **Free/near-free, one commit:** `erasableSyntaxOnly` (0) + `noImplicitReturns` (2) +
  `noUnusedParameters` (5) + `noUnusedLocals` (22 — after confirming the dead `toBase64Url` /
  `PRIORITY_LABELS` are truly dead with C1). Total 29 mechanical edits.
- **Own commit, needs a real build:** `verbatimModuleSyntax` (0 diagnostics, emit change) —
  already scoped this way by VGC-261's author; just needs doing.
- **Own ticket:** `exactOptionalPropertyTypes` (57).
- **Explicitly reject and record why:** `noUncheckedIndexedAccess`,
  `noPropertyAccessFromIndexSignature`, `skipLibCheck:false`, `useDefineForClassFields`,
  `strictBuiltinIteratorReturn`.

---

## 2. Escape hatches: `any`, `@ts-ignore`, unsafe casts

### 2.1 `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`: **zero**

Clean across all of `src/`. Nothing to report.

### 2.2 Explicit `any`: **zero** — and that is misleading

A precise type-position grep over `src/**/*.{ts,tsx}` finds **no** explicit `any` annotation, cast,
or generic argument. The reason is enforcement, not discipline alone:

```
$ eslint --print-config src/lib/linear.ts
@typescript-eslint/no-explicit-any [2]     # error-level, active
```

**The catch: that rule is syntactic.** It cannot see `any` that arrives by inference — and this
codebase has a lot of it. `lib.dom.d.ts` declares `json(): Promise<any>`, so every `.json()` is an
un-lintable `any` injection point. A compiler-API scan (TS checker, all of `src/`, tests excluded)
found **137 `any`-typed variable bindings**:

| Area | `any` bindings |
|---|---:|
| `src/app` | 88 |
| `src/hooks` | 20 |
| `src/lib` | 15 |
| `src/components` | 14 |

So the honest headline is: *the codebase reports zero `any` and contains 137 of them.* The lint
rule creates a false sense of coverage. Any future "no `any`" claim should be measured with the
checker, not grep.

### 2.3 `as unknown as` — 6 sites, 5 defensible

| Site | Assessment |
|---|---|
| `src/lib/data/dex-subset.ts:105` | **Fine.** Deliberate, documented single choke point casting the raw positional-array JSON to `PackedDexSubset`; decoder is the only consumer. |
| `src/app/api/webhooks/clerk/route.ts:46` | **Fine.** `event.data` → `ClerkUserCreatedData` after `verifyWebhook` proved authenticity, inside a `event.type === "user.created"` narrow. |
| `src/lib/i18n/index.ts:84` | Acceptable. Proxy fallback reading `en` as `Record<string, string>`; guarded by a `typeof v === "string"` check. |
| `src/components/report/CommonModesSlide.tsx:108`, `src/hooks/useSlideSystem.ts:56` | Same pattern twice: `t as unknown as Record<string, string \| undefined>` to read a key the `TranslationKeys` type doesn't declare. This is the type system correctly reporting a missing key and being overridden. Small fix: add the key to `TranslationKeys`. Low risk, but it is the one pattern here that suppresses a true signal. |
| `src/lib/sharing/__tests__/url-codec.test.ts:210` | Test-only Node compat shim. Fine. |

### 2.4 A distinct, non-obvious `any` source in `src/lib/` — `Object.values(StatSpread)`

Not a `.json()` issue and easy to miss:

```ts
// src/lib/types/pokemon.ts
export interface StatSpread { hp: number; atk: number; def: number; spa: number; spd: number; spe: number; }
```

`StatSpread` has **no index signature**, so `Object.values(x)` falls through to the
`values(o: {}): any[]` overload and yields `any[]`, not `number[]`. Consequences, confirmed by the
checker:

```
src/lib/parser/showdown-parser.ts:137        evTotal   : any
src/lib/validation/champions-legality.ts:271 total     : any
src/lib/validation/champions-legality.ts:301 value     : any   (Object.entries)
src/components/report/PokemonCard.tsx:418        totalEvs : any
src/components/report/PokemonDetailSlide.tsx:678 totalEvs : any
src/app/champions/[pokemon]/MegaLandingContent.tsx:90 bst : any
```

These are the EV/SP budget totals — the numbers that drive `evTotal > 510`,
`total > CHAMPIONS_TOTAL_SP`, `maxPerStat <= CHAMPIONS_MAX_SP_PER_STAT` and the per-stat
`value > 252` check. Every one of those comparisons is currently unchecked by the type system.
Corroborating evidence that someone already tripped over this:

```ts
// src/lib/analysis/detect-archetype.ts:90
return Object.values(evs).reduce((a, b) => a + (b ?? 0), 0) <= CHAMPIONS_TOTAL_SP;
//                                                ^^^^^^ a nullish guard that is only
//                                                meaningful because `b` is `any`
```

**Recommended fix (single small change, high leverage):** add a typed helper in
`src/lib/analysis/` — `export function sumSpread(s: StatSpread): number` (and a `maxStat`) — and
route all six sites through it. This restores `number` across the entire Champions SP/EV budget
path, which is the app's core correctness surface, without touching a compiler flag. Given
CLAUDE.md's rule that new `src/lib/` logic gets a vitest test, this ships with one.

---

## 3. `.json()` boundaries — inbound vs outbound

87 `.json()` call sites outside tests. Split as requested.

### 3.1 INBOUND (`request.json()` / `JSON.parse(rawBody)`) — 25 sites

**Good news: 20 of 25 are properly validated.** Every one goes
`const raw = await request.json()` → `Schema.safeParse(raw)` → 400 on failure, and reads only
`parsed.data` afterwards. That covers `share`, `share/[id]/collaborators` ×2, `user/profile`,
`user/follow` ×2, `user/notifications`, `user/drafts` (POST), `user/reports/[shareId]`,
`user/saved` ×2, `user/collaborations`, `views/[shareId]`, `feedback`, `pokepaste`,
`reactions/[shareId]`, `comments/[shareId]`, `comments/[shareId]/[commentId]`, `comments/flag`,
`match-log`. The zod discipline on write endpoints is genuinely solid — this is better than the
137-`any` figure alone suggests.

**The 5 real holes**, in severity order:

1. **`src/app/api/webhooks/posthog/route.ts:188`** — the worst. Fully unvalidated:
   ```ts
   const body = await request.json();           // any
   const event = body.event ?? body.data?.event_name ?? "unknown_event";
   const personEmail = body.person?.properties?.email ?? "anonymous";
   const personId = body.person?.distinct_id ?? "unknown";
   const timestamp = body.timestamp ?? new Date().toISOString();
   ```
   Five `any` values derived from an external POST body, then used to compose a Linear ticket.
   `??` only defends against `null`/`undefined`, not against an object or array where a string is
   expected — a `person.properties.email` of `{}` sails straight through and gets stringified
   downstream. Needs a zod schema like every other route has.

2. **`src/app/api/discord/route.ts:95`** — `const body = JSON.parse(rawBody)` → `any`, and
   `body.type`, `body.data?.name`, `body.data?.options` all inherit it. The authorization call
   `isAuthorizedInvoker(body)` has a typed parameter, but `any` is assignable to anything, so the
   compiler checks nothing at that call site. Mitigated in practice by the preceding
   `nacl.sign.detached.verify` signature check — so this is a type hole, not an open door. Still,
   it is the auth-relevant path and deserves a schema.

3. **`src/app/api/webhooks/linear/route.ts:61`** — `const body = ...` typed `any`, same webhook
   shape as above.

4. **`src/app/api/user/drafts/route.ts:163`** — `const { draftId } = await request.json();`
   followed only by `if (!draftId)`. `draftId` is `any` and could be an object or array; it then
   goes into a `sql` tagged template. Neon parameterises, so this is not injection — but it is an
   unvalidated type reaching the DB layer, and it is the odd one out in a file whose POST handler
   *does* use `DraftBodySchema`. Cheapest fix in the list.

5. **`src/app/api/user/collections/route.ts:86`** — `const action = raw.action as string;` on an
   unvalidated body, *before* the per-branch `safeParse`. The cast is on `any`, so it asserts
   nothing. Reordering so the discriminator is parsed first would fix it.

Also worth noting: `src/app/api/share/[id]/versions/route.ts:105` reads `body.version` off an
`any`, but immediately does `Number(...)` + `Number.isInteger` + `>= 1`, so it is runtime-safe
despite the type hole. Not counted as a hole.

### 3.2 OUTBOUND (`res.json()` on responses we fetched) — 62 sites

Lower severity as flagged in the brief, but it is where the bulk of the 137 `any`s live. Three
tiers:

- **Already typed (good pattern to copy):** `CommentSection.tsx:57`
  (`res.json() as Promise<{ comments: Comment[]; nextCursor: string | null }>`),
  `MetaSnapshot.tsx:38`, `ExploreContent.tsx:110`, `page.tsx:357`, `useAutoDraft.ts:98`,
  `CollaboratorPanel.tsx:134`, `cron/posthog-errors/route.ts:88`.
- **`src/lib/` untyped** — 15 bindings:
  - `src/lib/linear.ts` — `linearQuery`'s `const data = await res.json()` (:32) is the source;
    `data.errors`, `data.data` and then `labelsData` (:127), `createLabel` (:144),
    `teamData` (:170), `result` (:191) are all `any`.
  - `src/lib/discord-bot.ts:33/104`, `src/lib/email.ts:69`, `src/lib/utils/pokepaste.ts:19/22/44/47`.
  - `pokepaste.ts` is the one with a user-visible consequence: `fetchPokePaste` returns
    `{ paste: data.paste, title: data.title ?? null }` where both are `any`, and the declared
    `Promise<PokePasteResult>` return type launders them into `string`. If the proxy ever returns
    a non-string `paste`, the parser receives a non-string with no complaint. (`createPokePaste`
    does better — it checks `typeof data.url !== "string"`.)
- **Everything else** — `src/app/api/cron/daily-ops` (16 bindings), `cron/weekly-report` (12),
  `api/discord` (13), plus ~30 component/hook `const data = await res.json()`. These are internal
  same-origin calls; cost of leaving them is inference quality, not safety.

### 3.3 VGC-273 cross-check

The ticket's premise is confirmed and slightly understated:

- `linearQuery` exists twice — `src/lib/linear.ts:14` and `src/app/api/discord/route.ts:23`. Same
  signature `(query: string, variables?: Record<string, unknown>)`, and the two have **diverged**:
  - `lib/linear.ts` uses bare `fetch`, checks `res.ok`, checks `data.errors?.length` and throws on
    GraphQL errors, and returns `data.data`.
  - `api/discord/route.ts` uses `fetchWithTimeout(..., 10000)`, checks **neither** `res.ok` nor
    `data.errors`, and returns the whole envelope (`res.json()`), so its 13 call sites index into
    `result.data.…` themselves and a GraphQL error surfaces as an undefined-property read rather
    than a thrown error.
  - So the Discord copy is both the less safe one *and* the one with the timeout. A merge should
    take the timeout from Discord's and the error handling from lib's.
- Deduping is also the cheapest way to close 18 of the 137 `any` bindings at once: a single
  `linearQuery<T>(query, variables): Promise<T>` in `src/lib/linear.ts` — or even
  `Promise<unknown>` with per-call narrowing — removes the `any` from both files' call sites
  simultaneously.

---

## 4. Exported functions whose return type degrades to `any`

Measured with the TS checker over every module export in `src/` (tests excluded), flagging
signatures whose return type contains `any` at depth ≤ 3 (including inside `Promise<>`/arrays).

**Result: exactly 3, all inferred, all in `src/lib/`, all from an untyped outbound `.json()`:**

```
src/lib/email.ts:32        sendEmail          -> Promise<any>   [INFERRED]
src/lib/email.ts:73        sendWeeklySummary  -> Promise<any>   [INFERRED]
src/lib/discord-bot.ts:60  postFeedbackEmbed  -> Promise<any>   [INFERRED]
```

Each ends in `return res.json();` with no annotation, so `any` escapes the module boundary into
every caller. Fix is three annotations — `Promise<unknown>` at minimum, or a small
`ResendResponse` / `DiscordMessage` interface. Low effort, and it stops the leak at the boundary
rather than at each call site.

Everything else that returns a value is either explicitly annotated or infers to a concrete type.
Notably `src/lib/utils/pokepaste.ts` does **not** appear here — it has explicit
`Promise<PokePasteResult>` / `Promise<string>` annotations. That is worse than it looks: the
annotation makes the boundary *look* typed while the `any` values are silently laundered into it
(§3.2). An explicit return type is not evidence the body is type-safe.

---

## 5. Priority list

| # | Item | Where | Effort | Why |
|---|---|---|---|---|
| 1 | zod-validate the PostHog webhook body | `api/webhooks/posthog/route.ts:188` | S | Only genuinely unvalidated external POST body; 5 `any`s feeding ticket creation |
| 2 | `sumSpread`/`maxStat` helper for `StatSpread` | `src/lib/` + 6 call sites | S | Restores `number` to the EV/SP budget checks — core correctness path |
| 3 | Dedupe `linearQuery`, keeping timeout + error handling | VGC-273 | S–M | Fixes a real divergence (Discord copy swallows GraphQL errors) and kills 18 `any`s |
| 4 | Annotate 3 exported `Promise<any>` returns | `email.ts` ×2, `discord-bot.ts` | XS | Stops `any` at the module boundary |
| 5 | Free-flag commit: `erasableSyntaxOnly`, `noImplicitReturns`, `noUnusedParameters`, `noUnusedLocals` | `tsconfig.json` + 29 edits | S | Measured; 0/2/5/22 |
| 6 | Validate remaining 4 inbound holes | discord, linear webhook, drafts DELETE, collections | S | Consistency with the 20 routes that already do this |
| 7 | `verbatimModuleSyntax` in its own commit behind a build | `tsconfig.json` | S | 0 errors measured twice; emit change is the only blocker |
| 8 | `exactOptionalPropertyTypes` | 57 sites, 3 in `src/lib/` | M–L | Own ticket |
| 9 | Add the 2 missing `TranslationKeys` keys, drop the 2 casts | `CommonModesSlide`, `useSlideSystem` | XS | Removes the only signal-suppressing casts |
| — | **Close VGC-261** | — | — | Already merged to `main` (§0) |
| — | **Reject** `noUncheckedIndexedAccess` (322), `noPropertyAccessFromIndexSignature` (649), `skipLibCheck:false` (301), `useDefineForClassFields`, `strictBuiltinIteratorReturn` | — | — | Measured; cost ≫ benefit, or no-op |

---

### Method notes / caveats

- Every count above came from an actual `tsc` invocation on the full 324-file program with
  `--incremental false`. Temp configs live in `/tmp/c2ts/`, never in the repo.
- Flags were measured **individually** against a 0-error baseline. Counts are not additive —
  enabling two flags together can produce fewer errors than the sum (overlapping sites) or reveal
  new ones. Re-measure the combined config before committing the §1.6 batch.
- `any`-binding and return-type figures come from the TypeScript compiler API (checker), not grep,
  and exclude `__tests__`. Scripts are in `/tmp/c2ts/anyscan.mjs` and `/tmp/c2ts/anyvars.mjs`.
- `next build` was not run, per the shared-worktree constraint. The two emit-affecting flags
  (`verbatimModuleSyntax`, `useDefineForClassFields`) are therefore reported as **diagnostically**
  clean only — neither should be enabled without a real build.

# C2 — TypeScript Strictness Audit (`src/lib/`)

## Baseline
`tsconfig.json`: `strict: true`, `target: ES2017`, `allowJs: true`, `isolatedModules: true`. No `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` / `noImplicitOverride`.

Searches across `src/lib/**/*.ts`: **zero `: any`**, **zero `as any`**, **zero `@ts-ignore` / `@ts-expect-error`**. Only **2 `as unknown as`** double-casts. State already healthy — leverage is in narrowing `unknown`/missing return types on hot helpers.

## Top 5 safe-to-tighten

1. **`src/lib/utils/normalize-report.ts:28,77`** — `migratePlan(plan: AnyRecord)` and `normalizeReportData(data): AnyRecord` lose all shape info. Introduce a `RawReportData` interface (matches `ShareableState`-ish) and return `NormalizedReportData`. Single file, only 2 callers (share GET + migrate route).
2. **`src/lib/linear.ts:14,32`** — `linearQuery` returns implicit `any` from `res.json()`. Type as `unknown` and require callers to assert via a small `LinearResponse<T>` generic. Confined to one file. Note: file unchanged on main.
3. **`src/lib/discord-bot.ts:33` & `src/lib/email.ts:69`** — `discordFetch`/`sendEmail` return `Promise<any>`. Change to `Promise<unknown>`; `email.ts` is touched on main but callers already ignore result. **conflict-risk: true** (email.ts in main-changed-files).
4. **`src/lib/utils/pokepaste.ts:19,22,44,47`** — `await res.json()` → implicit `any`, then `data.error`, `data.paste`, `data.title`, `data.url` accessed unsafely. Wrap in a typed `parsePokePasteResponse(json: unknown)` helper using a tiny zod schema (zod already in deps via `cache.ts`).
5. **`src/lib/utils/diff-state.ts:95`** — `asArray` returns `as SerializedMatchupPlan[]` from `unknown[]` without per-item validation. Add an `isMatchupPlanLike` guard inline; same file, no exports touched.

## Top 3 risky-but-worth-it

1. **`src/lib/i18n/index.ts:83`** — `as unknown as Record<string, string>` Proxy cast. Removing requires typing `TranslationKeys` as `Record<string,string>` or constraining the Proxy generic — propagates to every `t.foo` callsite. **conflict-risk: true**.
2. **`src/lib/data/dex-subset.ts:62`** — `rawSubset as unknown as DexSubset` skips runtime validation of a bundled JSON. Add `zod` schema parse at module init; tiny perf cost, but every dex consumer depends on the shape. **conflict-risk: true**.
3. **Enable `noUncheckedIndexedAccess`** project-wide — surfaces many `arr[i]` is-defined assumptions across `version-diff.ts`, `stat-calculator.ts`, `type-chart.ts`. High value, hundreds of touchpoints.

## RECOMMENDED TICKET

**VGC-TYPE: Type normalize-report + diff-state + pokepaste return surfaces**

Files (exactly 3):
- `src/lib/utils/normalize-report.ts`
- `src/lib/utils/diff-state.ts`
- `src/lib/utils/pokepaste.ts`

Scope: replace `AnyRecord` with shared `RawReportData`/`NormalizedReportData` interfaces re-exported from `src/lib/sharing/url-codec.ts`; add per-item guard in `diff-state.asArray`; add minimal zod schema for PokéPaste API responses. ~2.5h incl. tsc + build + tests. Zero `as any`/`as unknown as` introduced. No files appear in `main-changed-files.md` — **conflict-risk: false**.

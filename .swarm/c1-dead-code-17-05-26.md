# Dead Code Audit — VGC-192 — 17-05-26

Auditor: c1-dead-code swarm agent
Branch: claude-dev
Date: 2026-05-17

---

## Confirmed Dead Exports (all safe to remove)

### `src/lib/analysis/stat-calculator.ts` — 4 dead exports
- `evSpreadToSp` — defined at line 88; zero external imports (Champions SP path unused in render)
- `spToEvSpread` — defined at line 203; zero external imports
- `formatSpSpread` — defined at line 192; zero external imports
- `isChampionsOptimized` — defined at line 183; zero external imports

All four can be deleted together. The file has other live exports; surgical deletion only.

### `src/lib/utils/mega-detect.ts` — 2 dead exports
- `getBaseFormName` — defined at line 61; zero external imports
- `getMegaDataKey` — defined at line 70; zero external imports

Both are dead. The rest of `mega-detect.ts` (`isMegaForm`, `normalizeMegaKey`, etc.) is live.

### `src/lib/linear.ts` — 1 dead export
- `isLinearConfigured` — defined at line 225; zero external imports anywhere in app code

### `src/lib/utils/multi-import.ts` — 1 dead export
- `importTeam` — defined at line 71; zero external imports (callers use `detectImportSource` + `fetchPokePaste` directly)

### `src/lib/utils/game-plan-helpers.tsx` — 2 dead exports (from prior audit, confirmed)
- `ResultBadge` — only definition, no external import
- `ResultToggle` — only definition, no external import

### `src/lib/data/tags.ts` — 1 dead export
- `EventType` (type alias, line 20) — `export type EventType = (typeof EVENT_TYPES)[number]`
- No file imports this type by name. All callers use `string` or `eventType` as a plain string field. Confirmed via exhaustive grep — every hit of "EventType" in the codebase is inside `tags.ts` itself.

### `src/hooks/useExploreUrlSync.ts` — 1 dead export
- `ExploreUrlSyncResult` (interface, line 21) — exported but never imported by any consumer; callers rely on inference from the hook return value.

### `src/lib/utils/pokepaste.ts` — 2 dead interface exports
- `PokePasteResult` — interface used only inside `pokepaste.ts` as the return type of `fetchPokePaste`; no external file imports it
- `CreatePokePasteInput` — interface used only inside `pokepaste.ts` as the parameter type of `createPokePaste`; no external file imports it

Both interfaces can be unexported (remove `export`, keep the interface for internal type safety) — deletion would cause an implicit-any on the internal functions.

---

## Confirmed Dead Unused Imports (2)

| File | Unused Import | Verdict |
|------|--------------|---------|
| `src/components/layout/Navbar.tsx:13` | `hapticMedium` from `@/lib/utils/haptics` | Only in import line; never called in file body. Delete from import. |
| `src/hooks/useShareUrl.ts:6` | `encodeShareState` from `@/lib/sharing/url-codec` | Only in import line; never called in file body. Delete from import. |

---

## False Positives — Items on Prior List That ARE Used

None. Every item on the prior research list is confirmed dead.

One near-miss: `hapticMedium` from `haptics.ts` itself is **live** (used in `TeamOverview.tsx` and `EditFab.tsx`). Only the **import** of it inside `Navbar.tsx` is dead. Do not delete the function — only remove it from the Navbar import statement.

---

## Additional Dead Exports Found (not on prior list)

- `PokePasteResult` and `CreatePokePasteInput` in `src/lib/utils/pokepaste.ts` — not on the research-synthesis list but confirmed dead externally. Recommend unexport rather than delete (preserve internal typing).
- `ExploreUrlSyncResult` in `src/hooks/useExploreUrlSync.ts` — not on original list but confirmed dead externally.
- `EventType` in `src/lib/data/tags.ts` — not on original list but confirmed dead externally.

---

## `any` Type Usage in `src/lib/`

Only **one real `any`** in lib code:

| File | Line | Usage | Suppressed? |
|------|------|-------|-------------|
| `src/lib/utils/normalize-report.ts` | 8 | `type AnyRecord = Record<string, any>` | No explicit eslint-disable |

The second instance (`src/app/api/migrate/route.ts:50`) is in `src/app/`, not `src/lib/`, and has an `eslint-disable` comment.

**Recommended fix:** Change `Record<string, any>` to `Record<string, unknown>` in `normalize-report.ts`. Internal usage of `AnyRecord` throughout the file already performs coercion before accessing values, so this is safe.

---

## No Dead Hooks Found

All 24 hooks in `src/hooks/` have at least one external consumer. The lowest-traffic hooks (`useScrollHide`, `useSwipeNavigation`, `useWalkthrough`, `useTheme`) are all referenced by components or other hooks. None are dead.

---

## Files to Edit for VGC-192 Cleanup

| File | Action |
|------|--------|
| `src/lib/analysis/stat-calculator.ts` | Delete `evSpreadToSp`, `spToEvSpread`, `formatSpSpread`, `isChampionsOptimized` |
| `src/lib/utils/mega-detect.ts` | Delete `getBaseFormName`, `getMegaDataKey` |
| `src/lib/linear.ts` | Delete `isLinearConfigured` |
| `src/lib/utils/multi-import.ts` | Delete `importTeam` |
| `src/lib/utils/game-plan-helpers.tsx` | Delete `ResultBadge`, `ResultToggle` |
| `src/lib/data/tags.ts` | Remove `export` from `EventType` type alias (or delete if unused internally) |
| `src/hooks/useExploreUrlSync.ts` | Remove `export` from `ExploreUrlSyncResult` interface |
| `src/lib/utils/pokepaste.ts` | Remove `export` from `PokePasteResult` and `CreatePokePasteInput` |
| `src/components/layout/Navbar.tsx` | Remove `hapticMedium` from import line 13 |
| `src/hooks/useShareUrl.ts` | Remove `encodeShareState` from import lines 5-9 |
| `src/lib/utils/normalize-report.ts` | Narrow `AnyRecord` to `Record<string, unknown>` |

Total: 10 files, ~20 line-level changes. All are safe, mechanical removals with no logic risk.

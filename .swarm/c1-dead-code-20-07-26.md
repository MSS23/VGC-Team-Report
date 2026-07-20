# Dead Code Audit — 20-07-26 (C1)

Method: grepped every `export const|function|interface|type` in `src/**` and looked for import sites elsewhere; verified dynamic-import indirection; scanned each `package.json` dependency across `src/` and `scripts/`.

## HIGH CONFIDENCE — Safe to delete

1. **`src/components/display/DisplayTogglePill.tsx`** — entire file, **267 LoC**. Export: `DisplayTogglePill` (line 48). No importers anywhere. Empty `src/components/display/` dir can also be removed.
2. **`src/lib/hooks/useGlobalDisplayPrefs.ts`** — entire file, **51 LoC**. Export: `useGlobalDisplayPrefs` (line 36). Zero references.
3. **`src/components/providers/ConsentGate.tsx`** — entire file, **37 LoC**. Export: `ConsentGate` (line 19). Never imported. Consent gating already lives inline in `PostHogProvider`.
4. **`getRegMBMegas` in `src/lib/data/mega-pokemon.ts:846`** — ~5 LoC function. Zero importers; sibling helpers still used.
5. **`isRateLimited` in `src/lib/rate-limit.ts:84`** — 7 LoC + delete `src/lib/__tests__/rate-limit.test.ts` (44 LoC). Comment marks it "legacy sync wrapper — prefer isRateLimitedAsync". Only callers are its own test.

## MEDIUM

- **`asPokemonTypes` in `src/lib/data/dex-subset.ts:123`** — 3-line type-cast helper, never imported.
- **Move `@pkmn/dex` from `dependencies` → `devDependencies`.** Only real importer is `scripts/build-dex-subset.mjs`. Runtime uses pre-extracted `dex-subset.ts`.
- Unexport trivial type-only exports never imported outside their file (list omitted — cheap cleanup, no bundle impact).

## UNCERTAIN — none

All apparent orphans under `src/components/**` were traced to `dynamic()` sites.

## Conflict-risk overlaps

None. All HIGH/MEDIUM findings NOT in `.swarm/main-changed-files.md`. Safe to touch.

## Total impact — top 5

~412 LoC deletable with high confidence, no CONFLICT-RISK overlaps.

## Actionable this run

All 5 HIGH-CONFIDENCE deletions are single-commit changes.

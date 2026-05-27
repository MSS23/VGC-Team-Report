# Bundle Size Analysis — 2026-05-27

## Summary

Total client JS: **10.5 MB** across 80 chunks. The top 3 chunks alone account for **6.7 MB (62%)** — all `@pkmn/dex` data (learnsets, abilities, species across every generation).

## Top 5 Largest Client Components (source size)

| # | File | Size | Key deps pulled in |
|---|------|------|--------------------|
| 1 | `app/changelog/ChangelogContent.tsx` | 96 KB / 1133 lines | motion/react |
| 2 | `app/page.tsx` | 85 KB / 1881 lines | @clerk, mega-detect -> @pkmn/dex, motion |
| 3 | `app/dashboard/DashboardContent.tsx` | 58 KB | @clerk |
| 4 | `components/layout/Navbar.tsx` | 44 KB | @clerk |
| 5 | `components/ui/ShareModal.tsx` | 44 KB | — |

## Oversized npm Dependencies in Client Bundle

| Package | node_modules size | Client bundle impact | Import style |
|---------|------------------|---------------------|--------------|
| **@pkmn/dex** | 52 MB | **~6.7 MB** (3 chunks) | **Static** via `pokemon.ts` -> `pkmn-dex-fallback.ts` |
| **@clerk/nextjs** | 15 MB | ~400 KB (estimated) | Static, 13 client files |
| **motion/react** | 676 KB | ~476 KB (spread across 9 chunks) | Static in 12 components |
| **html2canvas-pro** | 6 MB | **0 KB** (dynamic import) | Correctly lazy-loaded |
| **jspdf** | 30 MB | **0 KB** (dynamic import) | Correctly lazy-loaded |

## Critical Finding: @pkmn/dex in Client Bundle

The import chain `pokemon.ts` -> `pkmn-dex-fallback.ts` -> `@pkmn/dex` pulls the **entire Showdown dataset** into every page that calls `lookupPokemon()`. This includes `app/page.tsx` (the homepage), `PokemonCard`, `SpeedTierChart`, `PokemonDetailSlide`, `CompareContent`, and more.

A second chain exists: `mega-detect.ts` -> `pkmn-dex-fallback.ts` -> `@pkmn/dex`, imported by 5 client components.

`InlinePokemonEditor.tsx` statically imports `Dex` directly, but is already lazy-loaded via `next/dynamic` in `PokemonCard.tsx` — so that path is handled.

**Fix**: Move `lookupPokemonFromDex()` behind a dynamic `import()` so `@pkmn/dex` only loads when the static `POKEMON_DATA` map misses. This would cut ~6.7 MB from initial load.

## motion/react Spread

12 files import `motion/react` statically. While tree-shaking helps, `AnimatePresence` + `motion` together pull in ~50-80 KB per entry point. Components like `ExploreEmpty`, `SpotlightCard`, and `FeedbackContent` use trivial fade animations that could use CSS transitions instead.

## "use client" Observations

112 files have `"use client"`. Notable candidates for removal:
- `lib/i18n/index.ts` — uses React context (needs client, justified)
- `lib/utils/translate-move.ts` — pure utility, could be shared
- `app/page.tsx` — the entire homepage is client-rendered, preventing any SSR benefit

## Recommendations (by impact)

1. **Lazy-load @pkmn/dex** — make `lookupPokemonFromDex` use `await import("@pkmn/dex")` (-6.7 MB)
2. **Replace trivial motion animations with CSS** in low-priority components (-~100 KB)
3. **Extract server-renderable parts of `app/page.tsx`** into a server component wrapper
4. **Audit `translate-move.ts`** — remove `"use client"` if it has no hooks/browser APIs

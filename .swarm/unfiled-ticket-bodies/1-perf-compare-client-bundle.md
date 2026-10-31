## Source
`.swarm/c3-perf-26-10-26.md` #1, measured from the real build.

## Finding
`/compare` is the heaviest route in the app: **1178.4 KB raw / 338.1 KB gzip** (299.4 KB on modern browsers, excluding the `noModule` polyfill chunk). The cause is three static imports in `src/components/compare/CompareContent.tsx` pulling server-sized data into the **client** bundle:

| Module | Raw | Gzip |
|---|---|---|
| `dex-subset.json` | 128.0 KB | 33.1 KB |
| `pokemon.ts` | 189.8 KB | 38.1 KB |
| `mega-pokemon.ts` | 42.5 KB | 12.0 KB |

**= 83.2 KB gzip recoverable from a single file.**

Confirmed by reading the emitted chunk strings, which carry `generatedAt:2026-08-10` from the generated dex — this is genuinely in the client bundle, not inferred.

## Fix
Apply the pattern the homepage already uses (the v5.26 bundle work, which C3 verified is still holding), and **add `/compare` to the existing bundle tripwire test** so it cannot regress.

## Note for whoever picks this up
`CompareContent.tsx` was edited on the 26-10-26 nightly branch for the VGC-293 Mega-ability fix. The swarm deliberately did not also do this refactor in the same run — mixing a bundle refactor into a bug fix raises the chance of both failing the build gate. Rebase on that change first.

Also in the same report: `jspdf`, `html2canvas-pro`, `qrcode`, `@smogon/calc` and `cheerio` were all verified **correctly** lazy or server-only — no action needed there. Separately, `motion` costs 37.5 KB gzip on 7 routes to serve 48 opacity/translate fades.

---
*Filed automatically by the overnight swarm, run 26-10-26.*

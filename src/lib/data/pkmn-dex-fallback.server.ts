/**
 * Server registration for the dex fallback (VGC-271).
 *
 * Importing this module for its side effect installs the real implementation
 * synchronously, so every `lookupPokemon` / `detectMegaFromItem` call made on
 * the server behaves exactly as it did before the lazy split — no awaits, no
 * null window. It is imported by:
 *
 *   - `src/instrumentation.ts`                      (validateMegaCoverage at
 *                                                    server startup / build)
 *   - `src/app/champions/[pokemon]/page.tsx`        (SSG for the SEO-critical
 *                                                    Mega guide pages)
 *   - `vitest.config.ts` setupFiles                 (mirrors the server runtime
 *                                                    for the unit suite)
 *
 * A static side-effect import is evaluated before the importing module's body
 * runs, which is what makes the SSG path safe.
 *
 * ⚠️  NEVER import this from a `"use client"` component or from a module that
 * one can reach — it statically pulls `dex-subset.json` (129,858 bytes) and
 * would put the blob straight back into the eager client chunk this ticket
 * removed it from. There is deliberately no `server-only` guard here because
 * `instrumentation.ts` and vitest both run outside the react-server condition,
 * where that package throws.
 */

import { registerDexFallback } from "@/lib/data/pkmn-dex-fallback";
import { dexFallbackImpl } from "@/lib/data/pkmn-dex-fallback.impl";

registerDexFallback(dexFallbackImpl);

export {};

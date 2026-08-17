/**
 * Dynamic dex fallback — the *split* entry point (VGC-271).
 *
 * ── Why this file is a façade ───────────────────────────────────────────────
 * The fallback resolves any Pokemon/Mega our hand-maintained maps in
 * `pokemon.ts` / `mega-pokemon.ts` miss, by reading `dex-subset.json`. That
 * JSON is 129,858 bytes even after the VGC-257 re-encode, and because this
 * module used to `import` it statically it landed in the EAGER script set of
 * `/` and `/compare` — downloaded, parsed and evaluated on every first paint
 * to service a table that a typical (all-meta) team never touches.
 *
 * So the module is split in two:
 *
 *   pkmn-dex-fallback.impl.ts    the real table + lookups. Statically imports
 *                                `dex-subset.ts` → the JSON. Reached from the
 *                                client ONLY through `import()`, so Turbopack
 *                                emits it as its own on-demand chunk.
 *   pkmn-dex-fallback.ts (here)  a synchronous façade with the exact same
 *                                exported signatures. Delegates to the impl
 *                                once it is registered; returns `null` (and
 *                                kicks off the load) before that.
 *   pkmn-dex-fallback.server.ts  a side-effect module that statically imports
 *                                the impl and registers it. Server-only.
 *
 * ── The two synchronous SERVER consumers ────────────────────────────────────
 * `src/instrumentation.ts` (validateMegaCoverage at startup) and
 * `src/app/champions/[pokemon]/page.tsx` (SSG for the SEO Mega guides) call
 * into this fallback synchronously and cannot await anything. Both import
 * `pkmn-dex-fallback.server` first, which registers the impl at module-eval
 * time — so on the server the lookups below are *always* fully populated and
 * behave exactly as they did before the split. Nothing on the server ever
 * observes the un-registered state.
 *
 * ── The client's null-then-populate window ──────────────────────────────────
 * On the client the impl arrives asynchronously, so there IS a window where a
 * lookup for an uncommon species would return `null`. Nothing is allowed to
 * render during that window: `dex-fallback-gate.ts` probes a freshly parsed
 * team, and the report/compare views only commit the team to React state once
 * the chunk has landed. Common teams resolve from the static maps and never
 * pay for the chunk at all.
 */

import type { PokemonData } from "@/lib/types/pokemon";
import type { MegaPokemonEntry } from "@/lib/data/mega-pokemon";

/** The surface `pkmn-dex-fallback.impl.ts` must provide. */
export interface DexFallbackImpl {
  lookupPokemonFromDex(species: string): PokemonData | null;
  getMegaEntryFromDex(species: string): MegaPokemonEntry | null;
  detectMegaFromItemDex(item: string | null, species: string): MegaPokemonEntry | null;
  getDexBaseSpecies(species: string): string | null;
}

let impl: DexFallbackImpl | null = null;
let loading: Promise<void> | null = null;

/** Install the implementation synchronously (server path). Idempotent. */
export function registerDexFallback(next: DexFallbackImpl): void {
  impl ??= next;
}

/** True once lookups below are backed by the real dex subset. */
export function isDexFallbackReady(): boolean {
  return impl !== null;
}

/**
 * Load the dex subset on demand. Idempotent and safe to call concurrently —
 * every caller awaits the same in-flight import. Resolves (rather than
 * rejects) on a failed chunk fetch: callers use this to decide when it is safe
 * to render, and a network blip must degrade to "static maps only", not to a
 * stuck UI.
 */
export function loadDexFallback(): Promise<void> {
  if (impl) return Promise.resolve();
  loading ??= import("./pkmn-dex-fallback.impl")
    .then((m) => {
      registerDexFallback(m.dexFallbackImpl);
    })
    .catch(() => {
      // Allow a later call to retry the fetch.
      loading = null;
    });
  return loading;
}

/**
 * Answer `null` now, but start fetching the chunk so a later render/parse has
 * it. Fire-and-forget — the synchronous contract of these functions can't
 * change. Only called from paths where the caller plausibly *did* want dex
 * data; the "obviously not in the dex" short-circuits below skip it so an
 * all-meta team never pulls the chunk at all.
 */
function warmAndMiss(): null {
  void loadDexFallback();
  return null;
}

/**
 * Every Mega forme in the subset is named `<Base>-Mega[-X|-Y]`, so a species
 * string with no "mega" in it can never resolve to a Mega entry — answering
 * null for it is not a "miss" and must not trigger a chunk fetch.
 */
const LOOKS_LIKE_MEGA = /mega/i;

/**
 * All 93 mega stones in the subset end in "ite", optionally followed by a
 * single X/Y/Z ("Charizardite X", "Absolite Z"). Verified against
 * `dex-subset.json`; anything else cannot be a mega stone.
 */
const LOOKS_LIKE_MEGA_STONE = /ite( ?[xyz])?$/i;

// ── Public API (identical signatures to the pre-split module) ───────────────

/**
 * Resolve a species name against the dex subset. Returns our PokemonData shape,
 * or null if the subset doesn't recognise it either — or, on the client, if the
 * subset chunk has not loaded yet (see the gate).
 */
export function lookupPokemonFromDex(species: string): PokemonData | null {
  return impl ? impl.lookupPokemonFromDex(species) : warmAndMiss();
}

/**
 * Given a species string that IS a mega form (e.g. "Golurk-Mega"), build a
 * MegaPokemonEntry from the dex subset.
 */
export function getMegaEntryFromDex(species: string): MegaPokemonEntry | null {
  if (impl) return impl.getMegaEntryFromDex(species);
  // `isMegaForm()` runs this for every team member; without the guard a team of
  // six ordinary Pokemon would fetch the chunk it demonstrably doesn't need.
  if (!LOOKS_LIKE_MEGA.test(species)) return null;
  return warmAndMiss();
}

/**
 * Given a base species + held item, build a MegaPokemonEntry by asking the dex
 * subset whether the item is a mega stone for that species.
 */
export function detectMegaFromItemDex(
  item: string | null,
  species: string,
): MegaPokemonEntry | null {
  if (!item) return null;
  if (impl) return impl.detectMegaFromItemDex(item, species);
  // Same reasoning as getMegaEntryFromDex: Leftovers is not a mega stone, and
  // saying so must not cost a 129 kB fetch.
  if (!LOOKS_LIKE_MEGA_STONE.test(item.trim())) return null;
  return warmAndMiss();
}

/**
 * The canonical base-species name for any forme ("Rotom-Wash" → "Rotom").
 * Used by Species Clause in `champions-legality.ts`, which keeps its own regex
 * fallback for the null case.
 */
export function getDexBaseSpecies(species: string): string | null {
  // No warm-up here: the gate decides up front whether a team's Species Clause
  // check can need form collapsing, so reaching this un-loaded is the benign
  // "no two members could possibly be the same species" case.
  return impl ? impl.getDexBaseSpecies(species) : null;
}

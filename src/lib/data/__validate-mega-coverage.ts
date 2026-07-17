/**
 * Build-time data integrity check: every "*-mega" key in CHAMPIONS_DEX must
 * have a corresponding entry in MEGA_POKEMON_LIST, and every entry in
 * MEGA_POKEMON_LIST must resolve through the same lookup path used by the UI.
 *
 * Without this guard, a Champions-legal Mega missing from mega-pokemon.ts
 * silently breaks the EV/SP spread display on PokemonCard (the dex lookup
 * returns null, displayData becomes null, the entire stats column vanishes —
 * exactly the Golurk-Mega class of bug the user reported).
 *
 * Imported from instrumentation.ts so it runs once at server startup and
 * fails the Vercel build if data drifts.
 */
import { CHAMPIONS_DEX } from "./champions-dex";
import { MEGA_BY_KEY } from "./mega-pokemon";
import { lookupPokemon } from "./pokemon";

export function validateMegaCoverage(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Every "*-mega" species in Champions dex should have a static MEGA_POKEMON_LIST
  // entry for SEO landing pages and rich descriptions. The runtime fallback to
  // @pkmn/dex (pkmn-dex-fallback.ts) means missing entries no longer break the
  // EV spread display, so this is a soft warning rather than a build-breaker.
  for (const species of CHAMPIONS_DEX) {
    if (!species.includes("-mega")) continue;
    if (!MEGA_BY_KEY.has(species)) {
      errors.push(
        `CHAMPIONS_DEX lists "${species}" but mega-pokemon.ts has no MEGA_POKEMON_LIST entry. ` +
        `Spread display still works via @pkmn/dex fallback, but SEO landing page is missing.`,
      );
    }
  }

  // 2. Every mega entry must resolve to base stats through the production
  // lookup path. That includes the generated @pkmn/dex fallback used by cards
  // and landing pages when the hand-authored static catalogue lags behind.
  for (const [dataKey, entry] of MEGA_BY_KEY) {
    if (!lookupPokemon(dataKey)) {
      errors.push(
        `MEGA_POKEMON_LIST entry "${entry.displayName}" (dataKey: ${dataKey}) ` +
        `cannot be resolved by lookupPokemon(). The card will show 0% bars.`,
      );
    }
    if (!lookupPokemon(entry.baseName)) {
      errors.push(
        `MEGA_POKEMON_LIST entry "${entry.displayName}" baseName "${entry.baseName}" ` +
        `cannot be resolved by lookupPokemon(). The flip-to-base toggle will be hidden.`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

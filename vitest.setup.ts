/**
 * Global unit-test setup.
 *
 * Registers the dex-subset fallback implementation synchronously (VGC-271),
 * mirroring what `src/instrumentation.ts` does at server startup. Without it
 * every `lookupPokemon` / `detectMegaFromItem` call in the suite would run
 * against the un-loaded façade and answer `null` for anything outside the
 * hand-maintained static maps — the tests would be asserting against the
 * client's pre-load window rather than real behaviour.
 *
 * Tests that specifically exercise the lazy client path use the reset helpers
 * in `src/lib/data/__tests__/pkmn-dex-fallback-lazy.test.ts` instead.
 */
import "@/lib/data/pkmn-dex-fallback.server";

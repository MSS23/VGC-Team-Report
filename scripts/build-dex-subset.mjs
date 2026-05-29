/**
 * build-dex-subset.mjs — pre-extract the minimal @pkmn/dex slice that the
 * client actually reads, so we can drop the full 1.8MB raw / ~350KB gzipped
 * @pkmn/dex bundle from every page load.
 *
 * Run once per @pkmn/dex bump:
 *
 *     node scripts/build-dex-subset.mjs
 *
 * Output: src/lib/data/dex-subset.json (committed to git).
 *
 * What's in the subset:
 *  - Species: every entry with non-zero base stats (the same filter the
 *    runtime fallback applies). For each: name, types, baseStats, abilities
 *    (full list — fallback uses Object.values, mega-detect grabs [0] as the
 *    primary), forme, baseSpecies, isNonstandard.
 *  - Items: only mega stones (~50 entries). For each: name + the megaStone
 *    record `{ [baseSpecies]: megaSpeciesName }`.
 *
 * What's deliberately omitted: moves, abilities table, types table, learnsets,
 * tier metadata, every other Gen, simulator internals — none of which the
 * client touches.
 */

import { Dex } from "@pkmn/dex";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "src", "lib", "data", "dex-subset.json");

// ── Species ────────────────────────────────────────────────────────────────
const species = [];
for (const entry of Dex.species.all()) {
  if (!entry.exists) continue;
  if (!entry.baseStats) continue;
  // Skip placeholders / zero-stat entries (matches the runtime guard so the
  // subset matches the fallback's accepted set exactly).
  if (entry.baseStats.hp === 0 && entry.baseStats.atk === 0) continue;

  species.push({
    name: entry.name,
    types: entry.types,
    baseStats: {
      hp: entry.baseStats.hp,
      atk: entry.baseStats.atk,
      def: entry.baseStats.def,
      spa: entry.baseStats.spa,
      spd: entry.baseStats.spd,
      spe: entry.baseStats.spe,
    },
    // Full ability list — pkmn-dex-fallback uses Object.values(entry.abilities).
    // We flatten to an array so the subset stays JSON-flat (no Records).
    abilities: Object.values(entry.abilities).filter(Boolean),
    forme: entry.forme || null,
    baseSpecies: entry.baseSpecies || null,
    isNonstandard: entry.isNonstandard || null,
  });
}

// ── Items (only the mega-stone subset is needed) ───────────────────────────
const megaStones = [];
for (const item of Dex.items.all()) {
  if (!item.exists) continue;
  if (!item.megaStone) continue;
  megaStones.push({
    name: item.name,
    megaStone: item.megaStone, // { [baseName]: megaName }
  });
}

const payload = {
  // Schema version — bump when shape changes so old caches can be detected.
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  species,
  megaStones,
};

writeFileSync(OUTPUT, JSON.stringify(payload));
const bytes = Buffer.byteLength(JSON.stringify(payload));
console.log(`Wrote ${OUTPUT}`);
console.log(`  species: ${species.length}, megaStones: ${megaStones.length}`);
console.log(`  raw size: ${(bytes / 1024).toFixed(1)} KB`);

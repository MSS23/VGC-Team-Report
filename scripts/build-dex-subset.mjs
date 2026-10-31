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
 *
 * ── Wire format (schemaVersion 2) ──────────────────────────────────────────
 * The subset is emitted as positional ARRAYS, not objects. At 1,515 species an
 * array-of-objects repeats all seven field names 1,515 times, which cost ~324KB
 * raw of client JS for data whose only job is a cold fallback path (VGC-257).
 * The positional form carries the identical species set in ~127KB raw. Decoding
 * back to the object shape happens in `src/lib/data/dex-subset.ts`.
 *
 *   species[i] = [name, types, baseStats, abilities, forme, baseSpecies, nsIdx]
 *     types      "Grass|Poison"            — pipe-joined, never empty
 *     baseStats  [hp, atk, def, spa, spd, spe]
 *     abilities  "Overgrow|Chlorophyll"    — pipe-joined, "" when none
 *     forme      "Mega-X" | 0              — 0 means null (base forme)
 *     baseSpecies "Raichu" | 0 | null      — 0 means "same as name"
 *     nsIdx      index into `nonstandardValues` (0 ⇒ null, i.e. standard)
 *
 *   megaStones[i] = [name, [[baseSpeciesName, megaSpeciesName], …]]
 *
 * ⚠️  Size must come from the ENCODING, never from dropping rows. In particular
 * do NOT filter on `isNonstandard` — 43 of the 92 Mega formes are flagged
 * `Future` (they are the Champions-original Megas) and pruning them would
 * silently delete half the Mega roster from detection. `dex-subset.test.ts`
 * asserts the exact species set, so a prune attempt fails the suite.
 */

import { Dex } from "@pkmn/dex";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "src", "lib", "data", "dex-subset.json");

/** Bump when the wire format changes; `dex-subset.ts` refuses anything else. */
const SCHEMA_VERSION = 2;

// Interned `isNonstandard` values. Index 0 is always null ("standard"). Values
// are discovered from the data, so a new @pkmn/dex flag round-trips untouched.
const nonstandardValues = [null];
function nonstandardIndex(value) {
  if (!value) return 0;
  const existing = nonstandardValues.indexOf(value);
  if (existing !== -1) return existing;
  return nonstandardValues.push(value) - 1;
}

// ── Species ────────────────────────────────────────────────────────────────
const species = [];
for (const entry of Dex.species.all()) {
  if (!entry.exists) continue;
  if (!entry.baseStats) continue;
  // Skip placeholders / zero-stat entries (matches the runtime guard so the
  // subset matches the fallback's accepted set exactly).
  if (entry.baseStats.hp === 0 && entry.baseStats.atk === 0) continue;

  const forme = entry.forme || null;
  const baseSpecies = entry.baseSpecies || null;

  species.push([
    entry.name,
    entry.types.join("|"),
    [
      entry.baseStats.hp,
      entry.baseStats.atk,
      entry.baseStats.def,
      entry.baseStats.spa,
      entry.baseStats.spd,
      entry.baseStats.spe,
    ],
    // Full ability list — pkmn-dex-fallback uses Object.values(entry.abilities).
    // Pipe-joined so the subset stays JSON-flat (no Records, no nested arrays).
    Object.values(entry.abilities).filter(Boolean).join("|"),
    forme ?? 0,
    // 0 ⇒ "same as name" (true for every base forme). An explicit null stays
    // null so a future @pkmn/dex row without a baseSpecies round-trips exactly.
    baseSpecies === entry.name ? 0 : baseSpecies,
    nonstandardIndex(entry.isNonstandard),
  ]);
}

// ── Items (only the mega-stone subset is needed) ───────────────────────────
const megaStones = [];
for (const item of Dex.items.all()) {
  if (!item.exists) continue;
  if (!item.megaStone) continue;
  // megaStone is { [baseName]: megaName }; entries keep it positional.
  megaStones.push([item.name, Object.entries(item.megaStone)]);
}

const payload = {
  // Schema version — bump when shape changes so old caches can be detected.
  schemaVersion: SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  nonstandardValues,
  species,
  megaStones,
};

writeFileSync(OUTPUT, JSON.stringify(payload));
const bytes = Buffer.byteLength(JSON.stringify(payload));
console.log(`Wrote ${OUTPUT}`);
console.log(`  species: ${species.length}, megaStones: ${megaStones.length}`);
console.log(`  raw size: ${(bytes / 1024).toFixed(1)} KB`);

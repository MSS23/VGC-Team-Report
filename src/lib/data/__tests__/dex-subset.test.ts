/**
 * dex-subset regression suite — VGC-257.
 *
 * `dex-subset.json` was re-encoded from an array-of-objects (323.7 kB raw) to
 * positional arrays (126.8 kB raw) because the blob sat on the homepage's
 * critical path purely to service a cold fallback. The re-encode must be a
 * pure serialisation change: the set of species/formes/mega stones that can be
 * resolved after it has to be IDENTICAL to before.
 *
 * The hashes below are pinned from the pre-change (schemaVersion 1) artifact.
 * If a regeneration legitimately changes the dataset (an @pkmn/dex bump), the
 * hashes change with it — but that has to be a deliberate, reviewed edit, not
 * a silent side effect of "shrinking" the file.
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";

import {
  allMegaStones,
  allSpecies,
  getMegaStone,
  getSpecies,
} from "@/lib/data/dex-subset";
import {
  detectMegaFromItemDex,
  getMegaEntryFromDex,
  lookupPokemonFromDex,
} from "@/lib/data/pkmn-dex-fallback";
import { POKEMON_DATA, lookupPokemon } from "@/lib/data/pokemon";

const toId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// ── Pinned from the schemaVersion-1 artifact (commit before the re-encode) ──
const SPECIES_COUNT = 1515;
const MEGA_STONE_COUNT = 93;
const SPECIES_ID_HASH =
  "6432fb323d2daf3726360981b36b0927d95f98d0846f265d4d8e6c613fe8e6e2";
const MEGA_STONE_ID_HASH =
  "9e1c6612d229b65502e046e3eb7d4cf1986a8ddabc203d635f2e4f50c0115813";
const FULL_CONTENT_HASH =
  "915a43ba92328317873612e494210b0b710876163a466b93c5db60a4f812311d";

describe("dex-subset — representable set is unchanged by the re-encode", () => {
  it("keeps the exact species row count", () => {
    expect(allSpecies()).toHaveLength(SPECIES_COUNT);
  });

  it("keeps the exact species key set (guards against silent row loss)", () => {
    const ids = allSpecies().map((s) => toId(s.name)).sort();
    expect(new Set(ids).size).toBe(SPECIES_COUNT);
    expect(sha256(ids.join(","))).toBe(SPECIES_ID_HASH);
  });

  it("keeps the exact mega-stone key set", () => {
    expect(allMegaStones()).toHaveLength(MEGA_STONE_COUNT);
    const ids = allMegaStones().map((m) => toId(m.name)).sort();
    expect(sha256(ids.join(","))).toBe(MEGA_STONE_ID_HASH);
  });

  it("decodes to byte-identical content (every field of every row)", () => {
    // Field-level guard, not just key-level: catches a decoder that drops
    // abilities, mangles baseStats ordering, or loses `baseSpecies`.
    const canonical = JSON.stringify({
      species: allSpecies(),
      megaStones: allMegaStones(),
    });
    expect(sha256(canonical)).toBe(FULL_CONTENT_HASH);
  });

  it("decodes a base-forme row to the pre-re-encode object shape", () => {
    expect(getSpecies("Bulbasaur")).toEqual({
      name: "Bulbasaur",
      types: ["Grass", "Poison"],
      baseStats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
      abilities: ["Overgrow", "Chlorophyll"],
      forme: null,
      baseSpecies: "Bulbasaur",
      isNonstandard: null,
    });
  });

  it("decodes an alt-forme row, including forme/baseSpecies/isNonstandard", () => {
    expect(getSpecies("Raichu-Mega-X")).toEqual({
      name: "Raichu-Mega-X",
      types: ["Electric"],
      baseStats: { hp: 60, atk: 135, def: 95, spa: 90, spd: 95, spe: 110 },
      abilities: ["Surge Surfer"],
      forme: "Mega-X",
      baseSpecies: "Raichu",
      isNonstandard: "Future",
    });
  });

  it("decodes an empty ability list to [] and not ['']", () => {
    // "" is the packed encoding for "no abilities"; a naive split would yield
    // a phantom empty-string ability.
    const noAbilities = allSpecies().filter((s) => s.abilities.length === 0);
    expect(noAbilities.length).toBeGreaterThan(0);
    for (const s of allSpecies()) {
      expect(s.abilities).not.toContain("");
      expect(s.types).not.toContain("");
      expect(s.types.length).toBeGreaterThan(0);
    }
  });

  it("accepts the same name spellings as before (toID normalisation)", () => {
    const canonical = getSpecies("Clefable-Mega");
    expect(canonical).not.toBeNull();
    expect(getSpecies("clefable-mega")).toBe(canonical);
    expect(getSpecies("Clefable Mega")).toBe(canonical);
    expect(getSpecies("clefablemega")).toBe(canonical);
    expect(getSpecies("Definitelynotapokemon")).toBeNull();
  });
});

describe("dex-subset — the isNonstandard trap (do NOT prune by this flag)", () => {
  /**
   * 43 of the 92 Mega formes are flagged `Future` — those ARE the
   * Champions-original Megas this app exists to report on. Pruning the subset
   * by `isNonstandard` to save bytes would silently delete half the Mega
   * roster from detection. Size must come from the encoding, never from
   * dropping rows.
   */
  const megaFormes = () =>
    allSpecies().filter((s) => s.forme?.startsWith("Mega") ?? false);

  it("keeps every Mega forme, including the 43 flagged isNonstandard='Future'", () => {
    const megas = megaFormes();
    expect(megas).toHaveLength(92);
    const byFlag = megas.reduce<Record<string, number>>((acc, s) => {
      const key = String(s.isNonstandard);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    expect(byFlag).toEqual({ Past: 48, Future: 43, CAP: 1 });
  });

  it("resolves a Future-flagged Mega that pruning on isNonstandard would delete", () => {
    const entry = getMegaEntryFromDex("Clefable-Mega");
    expect(entry).not.toBeNull();
    expect(entry?.dataKey).toBe("clefable-mega");
    expect(entry?.baseName).toBe("Clefable");
    expect(entry?.types).toEqual(["Fairy", "Flying"]);
    expect(entry?.ability).toBe("Cute Charm");
    expect(entry?.megaStone).toBe("Clefablite");
  });

  it("keeps the LGPE/Custom/CAP rows too — nothing was filtered out", () => {
    const flags = new Set(allSpecies().map((s) => s.isNonstandard));
    expect(flags).toEqual(
      new Set([null, "Past", "LGPE", "Future", "Custom", "CAP"]),
    );
  });
});

describe("dex-subset — the fallback miss path still works", () => {
  it("resolves a species that is NOT in the hand-maintained static map", () => {
    // Premise: the static map really does miss this one, so the only way to a
    // result is through the dex-subset fallback.
    expect(POKEMON_DATA["clefable-mega"]).toBeUndefined();

    const data = lookupPokemon("Clefable-Mega");
    expect(data).not.toBeNull();
    expect(data?.name).toBe("Clefable-Mega");
    expect(data?.baseStats).toEqual({
      hp: 95,
      atk: 80,
      def: 93,
      spa: 135,
      spd: 110,
      spe: 70,
    });
    expect(data?.types).toEqual(["Fairy", "Flying"]);
  });

  it("resolves the same species through the raw fallback entry point", () => {
    expect(lookupPokemonFromDex("Clefable-Mega")?.name).toBe("Clefable-Mega");
    expect(lookupPokemonFromDex("Not A Real Pokemon")).toBeNull();
  });

  it("detects a Mega from its held stone via the fallback", () => {
    expect(getMegaStone("Clefablite")?.megaStone).toEqual({
      Clefable: "Clefable-Mega",
    });
    const detected = detectMegaFromItemDex("Clefablite", "Clefable");
    expect(detected?.dataKey).toBe("clefable-mega");
    expect(detectMegaFromItemDex("Leftovers", "Clefable")).toBeNull();
    expect(detectMegaFromItemDex(null, "Clefable")).toBeNull();
  });
});

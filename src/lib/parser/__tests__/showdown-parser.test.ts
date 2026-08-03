import { describe, it, expect } from "vitest";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";

const GARCHOMP_BLOCK = `Garchomp @ Life Orb
Ability: Rough Skin
Level: 50
Tera Type: Fire
Shiny: Yes
EVs: 4 HP / 252 Atk / 252 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Protect
- Swords Dance`;

const FULL_TEAM_PASTE = [
  `Garchomp @ Life Orb\nAbility: Rough Skin\nEVs: 252 Atk / 252 Spe / 4 HP\nJolly Nature\n- Earthquake\n- Dragon Claw\n- Protect\n- Swords Dance`,
  `Flutter Mane @ Choice Specs\nAbility: Protosynthesis\nEVs: 252 SpA / 252 Spe / 4 HP\nTimid Nature\n- Moonblast\n- Shadow Ball\n- Dazzling Gleam\n- Mystical Fire`,
  `Incineroar @ Safety Goggles\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 SpD\nCareful Nature\n- Fake Out\n- Flare Blitz\n- Knock Off\n- Parting Shot`,
  `Rillaboom @ Assault Vest\nAbility: Grassy Surge\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Grassy Glide\n- Wood Hammer\n- Fake Out\n- U-turn`,
  `Urshifu-Rapid-Strike @ Focus Sash\nAbility: Unseen Fist\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Surging Strikes\n- Close Combat\n- Aqua Jet\n- Detect`,
  `Tornadus @ Covert Cloak\nAbility: Prankster\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\n- Bleakwind Storm\n- Tailwind\n- Rain Dance\n- Protect`,
].join("\n\n");

describe("parseShowdownPaste", () => {
  describe("basic single Pokemon parse", () => {
    it("parses species, item, ability, nature, moves, EVs", () => {
      const result = parseShowdownPaste(GARCHOMP_BLOCK);
      expect(result.pokemon).toHaveLength(1);
      const mon = result.pokemon[0];
      expect(mon.species).toBe("Garchomp");
      expect(mon.item).toBe("Life Orb");
      expect(mon.ability).toBe("Rough Skin");
      expect(mon.nature).toBe("Jolly");
      expect(mon.moves).toEqual(["Earthquake", "Dragon Claw", "Protect", "Swords Dance"]);
      expect(mon.evs.atk).toBe(252);
      expect(mon.evs.spe).toBe(252);
      expect(mon.evs.hp).toBe(4);
      expect(mon.evs.def).toBe(0);
    });

    it("parses level, shiny, and tera type", () => {
      const result = parseShowdownPaste(GARCHOMP_BLOCK);
      const mon = result.pokemon[0];
      expect(mon.level).toBe(50);
      expect(mon.shiny).toBe(true);
      expect(mon.teraType).toBe("Fire");
    });

    it("defaults IVs to 31 when not specified", () => {
      const result = parseShowdownPaste(GARCHOMP_BLOCK);
      const mon = result.pokemon[0];
      expect(mon.ivs).toEqual({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });
    });
  });

  describe("full 6-Pokemon team", () => {
    it("parses all 6 Pokemon", () => {
      const result = parseShowdownPaste(FULL_TEAM_PASTE);
      expect(result.pokemon).toHaveLength(6);
      expect(result.pokemon[0].species).toBe("Garchomp");
      expect(result.pokemon[1].species).toBe("Flutter Mane");
      expect(result.pokemon[5].species).toBe("Tornadus");
    });
  });

  describe("nickname + species", () => {
    it("parses nickname and species from 'Nickname (Species) @ Item'", () => {
      const paste = `Big Boy (Garchomp) @ Life Orb\nAbility: Rough Skin\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].species).toBe("Garchomp");
      expect(result.pokemon[0].nickname).toBe("Big Boy");
      expect(result.pokemon[0].item).toBe("Life Orb");
    });
  });

  describe("gender detection", () => {
    it("detects gender from 'Species (F) @ Item'", () => {
      const paste = `Garchomp (F) @ Life Orb\nAbility: Rough Skin\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].species).toBe("Garchomp");
      expect(result.pokemon[0].gender).toBe("F");
      expect(result.pokemon[0].nickname).toBeNull();
    });

    it("detects male gender", () => {
      const paste = `Garchomp (M) @ Life Orb\nAbility: Rough Skin\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].gender).toBe("M");
    });
  });

  describe("team name from header", () => {
    it("extracts team name from === header with format tag", () => {
      const paste = `=== [gen9vgc2024regg] My Team ===\n\n${GARCHOMP_BLOCK}`;
      const result = parseShowdownPaste(paste);
      expect(result.teamName).toBe("My Team");
    });

    it("extracts team name from === header without format tag", () => {
      const paste = `=== Cool Team ===\n\n${GARCHOMP_BLOCK}`;
      const result = parseShowdownPaste(paste);
      expect(result.teamName).toBe("Cool Team");
    });
  });

  describe("empty paste", () => {
    it("returns empty pokemon array with warning for empty string", () => {
      const result = parseShowdownPaste("");
      expect(result.pokemon).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("returns empty pokemon array with warning for whitespace-only paste", () => {
      const result = parseShowdownPaste("   \n\n   ");
      expect(result.pokemon).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("EV validation", () => {
    it("generates warning when EVs exceed 510", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nEVs: 252 HP / 252 Atk / 252 Spe\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.warnings.some(w => w.includes("510"))).toBe(true);
    });

    it("no warning when EVs are exactly 510", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nEVs: 6 HP / 252 Atk / 252 Spe\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.warnings.some(w => w.includes("510"))).toBe(false);
    });
  });

  describe("no moves warning", () => {
    it("generates warning when Pokemon has no moves", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nJolly Nature`;
      const result = parseShowdownPaste(paste);
      expect(result.warnings.some(w => w.includes("No moves"))).toBe(true);
    });
  });

  describe("unicode non-breaking spaces", () => {
    it("parses EVs with non-breaking spaces (\\u00a0)", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nEVs: 252\u00a0Atk / 252\u00a0Spe / 4\u00a0HP\nJolly Nature\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      const mon = result.pokemon[0];
      expect(mon.evs.atk).toBe(252);
      expect(mon.evs.spe).toBe(252);
      expect(mon.evs.hp).toBe(4);
    });
  });

  describe("\\r\\n line endings", () => {
    it("parses paste with Windows-style line endings", () => {
      const paste = `Garchomp @ Life Orb\r\nAbility: Rough Skin\r\nEVs: 252 Atk / 252 Spe\r\nJolly Nature\r\n- Earthquake\r\n- Dragon Claw`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon).toHaveLength(1);
      expect(result.pokemon[0].species).toBe("Garchomp");
      expect(result.pokemon[0].moves).toEqual(["Earthquake", "Dragon Claw"]);
    });
  });

  describe("more than 6 Pokemon", () => {
    it("truncates to 6 with warning", () => {
      const blocks = Array.from({ length: 7 }, (_, i) =>
        `Mon${i + 1} @ Leftovers\nAbility: Test\n- Tackle`
      );
      const paste = blocks.join("\n\n");
      const result = parseShowdownPaste(paste);
      expect(result.pokemon).toHaveLength(6);
      expect(result.warnings.some(w => w.includes("7") && w.includes("6"))).toBe(true);
    });
  });

  describe("Shiny: Yes detection", () => {
    it("sets shiny to true when Shiny: Yes", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nShiny: Yes\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].shiny).toBe(true);
    });

    it("sets shiny to false when not specified", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].shiny).toBe(false);
    });
  });

  describe("Tera Type parsing", () => {
    it("parses valid Tera Type", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nTera Type: Fairy\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].teraType).toBe("Fairy");
    });

    it("sets teraType to null when not specified", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].teraType).toBeNull();
    });
  });

  describe("Level parsing", () => {
    it("forces level 50 even when paste specifies level 100", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nLevel: 100\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].level).toBe(50);
    });

    it("defaults to level 50 when not specified", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].level).toBe(50);
    });
  });

  describe("regression: stray blank line inside a move block creates a phantom Pokemon", () => {
    it("keeps the moves after a stray blank line on the same Pokemon", () => {
      // Paste mangled by a chat client: a blank line sneaks in before the last moves
      const mangled = [
        `Garchomp @ Life Orb\nAbility: Rough Skin\nEVs: 252 Atk / 252 Spe / 4 HP\nJolly Nature\n- Dragon Claw\n- Protect\n\n- Earthquake\n- Swords Dance`,
        `Flutter Mane @ Choice Specs\nAbility: Protosynthesis\nEVs: 252 SpA / 252 Spe / 4 HP\nTimid Nature\n- Moonblast\n- Shadow Ball\n- Dazzling Gleam\n- Mystical Fire`,
        `Incineroar @ Safety Goggles\nAbility: Intimidate\nEVs: 252 HP / 4 Atk / 252 SpD\nCareful Nature\n- Fake Out\n- Flare Blitz\n- Knock Off\n- Parting Shot`,
        `Rillaboom @ Assault Vest\nAbility: Grassy Surge\nEVs: 252 HP / 252 Atk / 4 SpD\nAdamant Nature\n- Grassy Glide\n- Wood Hammer\n- Fake Out\n- U-turn`,
        `Urshifu-Rapid-Strike @ Focus Sash\nAbility: Unseen Fist\nEVs: 252 Atk / 4 SpD / 252 Spe\nJolly Nature\n- Surging Strikes\n- Close Combat\n- Aqua Jet\n- Detect`,
        `Tornadus @ Covert Cloak\nAbility: Prankster\nEVs: 4 HP / 252 SpA / 252 Spe\nTimid Nature\n- Bleakwind Storm\n- Tailwind\n- Rain Dance\n- Protect`,
      ].join("\n\n");

      const result = parseShowdownPaste(mangled);

      expect(result.pokemon).toHaveLength(6);
      // No phantom "Earthquake" Pokemon eating a team slot
      expect(result.pokemon.map(p => p.species)).toEqual([
        "Garchomp", "Flutter Mane", "Incineroar", "Rillaboom", "Urshifu-Rapid-Strike", "Tornadus",
      ]);
      expect(result.pokemon[0].moves).toEqual([
        "Dragon Claw", "Protect", "Earthquake", "Swords Dance",
      ]);
      // The continuation block must not be treated as a mon with no ability/moves
      expect(result.warnings.some(w => w.startsWith("Earthquake"))).toBe(false);
    });
  });

  describe("regression: === Team Name === header parsed as a Pokemon", () => {
    it("ignores a header that is not followed by a blank line", () => {
      const paste = `=== [gen9vgc2024regg] My Team ===\nGarchomp @ Life Orb\nAbility: Rough Skin\nEVs: 252 Atk / 252 Spe / 4 HP\nJolly Nature\n- Earthquake\n- Dragon Claw\n- Protect\n- Swords Dance\n\nFlutter Mane @ Choice Specs\nAbility: Protosynthesis\nEVs: 252 SpA / 252 Spe / 4 HP\nTimid Nature\n- Moonblast\n- Shadow Ball\n- Dazzling Gleam\n- Protect`;

      const result = parseShowdownPaste(paste);

      expect(result.teamName).toBe("My Team");
      expect(result.pokemon).toHaveLength(2);
      expect(result.pokemon.map(p => p.species)).toEqual(["Garchomp", "Flutter Mane"]);
      expect(result.pokemon.some(p => p.species.includes("==="))).toBe(false);
      expect(result.pokemon[0].item).toBe("Life Orb");
      expect(result.pokemon[0].moves).toHaveLength(4);
    });
  });

  describe("IVs parsing", () => {
    it("parses explicit IVs", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\nIVs: 0 Atk / 0 Spe\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].ivs.atk).toBe(0);
      expect(result.pokemon[0].ivs.spe).toBe(0);
      // Unspecified IVs default to 31
      expect(result.pokemon[0].ivs.hp).toBe(31);
      expect(result.pokemon[0].ivs.spa).toBe(31);
    });

    it("defaults all IVs to 31 when not specified", () => {
      const paste = `Garchomp @ Life Orb\nAbility: Rough Skin\n- Earthquake`;
      const result = parseShowdownPaste(paste);
      expect(result.pokemon[0].ivs).toEqual({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });
    });
  });
});

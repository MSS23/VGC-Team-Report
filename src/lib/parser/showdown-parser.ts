import type { ParsedPokemon, ParsedTeam, PokemonType, StatSpread } from "@/lib/types/pokemon";

const POKEMON_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

function defaultEvs(): StatSpread {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
}

function defaultIvs(): StatSpread {
  return { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
}

function parseStatLine(line: string): Partial<StatSpread> {
  const stats: Partial<StatSpread> = {};
  const statMap: Record<string, keyof StatSpread> = {
    hp: "hp", atk: "atk", def: "def", spa: "spa", spd: "spd", spe: "spe",
  };
  // Normalize non-breaking spaces and other Unicode whitespace to regular spaces
  const cleaned = line.replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, " ");
  const parts = cleaned.split("/").map(s => s.trim());
  for (const part of parts) {
    // Case-insensitive matching with flexible whitespace
    const match = part.match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/i);
    if (match) {
      const value = parseInt(match[1], 10);
      const key = statMap[match[2].toLowerCase()];
      if (key) stats[key] = value;
    }
  }
  return stats;
}

function parsePokemonBlock(block: string): { pokemon: ParsedPokemon; warnings: string[] } {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
  const warnings: string[] = [];

  if (lines.length === 0) {
    return {
      pokemon: {
        species: "Unknown",
        nickname: null,
        gender: null,
        item: null,
        ability: null,
        level: 50,
        teraType: null,
        shiny: false,
        evs: defaultEvs(),
        ivs: defaultIvs(),
        nature: "Serious",
        moves: [],
      },
      warnings: ["Empty Pokemon block"],
    };
  }

  // Parse first line: Nickname (Species) (G) @ Item
  // or: Species (G) @ Item
  // or: Species @ Item
  const firstLine = lines[0];
  let species = "";
  let nickname: string | null = null;
  let gender: "M" | "F" | null = null;
  let item: string | null = null;

  // Split by @ for item
  const atSplit = firstLine.split(" @ ");
  let namePart = atSplit[0].trim();
  if (atSplit.length > 1) {
    item = atSplit.slice(1).join(" @ ").trim();
  }

  // Check for gender at end: (M) or (F)
  const genderMatch = namePart.match(/\s+\(([MF])\)\s*$/);
  if (genderMatch) {
    gender = genderMatch[1] as "M" | "F";
    namePart = namePart.slice(0, genderMatch.index).trim();
  }

  // Check for species in parentheses: Nickname (Species)
  const speciesMatch = namePart.match(/^(.+?)\s+\(([^)]+)\)\s*$/);
  if (speciesMatch) {
    nickname = speciesMatch[1].trim();
    species = speciesMatch[2].trim();
  } else {
    species = namePart.trim();
  }

  // Parse remaining lines
  let ability: string | null = null;
  let level = 50;
  let teraType: PokemonType | null = null;
  let shiny = false;
  const evs = defaultEvs();
  const ivs = defaultIvs();
  let nature = "Serious";
  const moves: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Normalize non-breaking spaces for matching
    const cleanLine = line.replace(/[\u00a0]/g, " ");

    if (/^Ability:\s*/i.test(cleanLine)) {
      ability = cleanLine.replace(/^Ability:\s*/i, "").trim();
    } else if (/^Level:\s*/i.test(cleanLine)) {
      level = parseInt(cleanLine.replace(/^Level:\s*/i, "").trim(), 10) || 50;
    } else if (/^Tera Type:\s*/i.test(cleanLine)) {
      const tt = cleanLine.replace(/^Tera Type:\s*/i, "").trim();
      if (POKEMON_TYPES.includes(tt as PokemonType)) {
        teraType = tt as PokemonType;
      }
    } else if (/^Shiny:\s*/i.test(cleanLine)) {
      shiny = cleanLine.replace(/^Shiny:\s*/i, "").trim().toLowerCase() === "yes";
    } else if (/^EVs:\s*/i.test(cleanLine)) {
      const parsed = parseStatLine(cleanLine.replace(/^EVs:\s*/i, "").trim());
      Object.assign(evs, parsed);
    } else if (/^IVs:\s*/i.test(cleanLine)) {
      const parsed = parseStatLine(cleanLine.replace(/^IVs:\s*/i, "").trim());
      Object.assign(ivs, parsed);
    } else if (/Nature\s*$/i.test(cleanLine)) {
      nature = cleanLine.replace(/\s*Nature\s*$/i, "").trim();
    } else if (cleanLine.startsWith("- ")) {
      moves.push(cleanLine.slice(2).trim());
    }
  }

  // Validation
  const evTotal = Object.values(evs).reduce((a, b) => a + b, 0);
  if (evTotal > 510) {
    warnings.push(`${species}: EV total ${evTotal} exceeds maximum of 510`);
  }
  if (moves.length === 0) {
    warnings.push(`${species}: No moves found`);
  }
  if (!ability) {
    warnings.push(`${species}: No ability specified`);
  }

  return {
    pokemon: {
      species,
      nickname,
      gender,
      item,
      ability,
      level,
      teraType,
      shiny,
      evs,
      ivs,
      nature,
      moves,
    },
    warnings,
  };
}

export function parseShowdownPaste(paste: string): ParsedTeam {
  const allWarnings: string[] = [];
  let teamName: string | undefined;

  // Normalize all line endings: \r\n → \n, bare \r → \n
  const normalized = paste.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Check for team name header: === [format] Team Name === or === Team Name ===
  const headerMatch = normalized.match(/^===\s*(?:\[[^\]]*\]\s*)?(.+?)\s*===\s*$/m);
  if (headerMatch) {
    const name = headerMatch[1].trim();
    if (name) teamName = name;
  }

  // Split into Pokemon blocks (double newline separated)
  const blocks = normalized
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean)
    // Filter out header lines
    .filter(b => !b.match(/^===.*===$/));

  if (blocks.length === 0) {
    return { pokemon: [], warnings: ["No Pokemon found in paste"], teamName };
  }

  const pokemon: ParsedPokemon[] = [];

  for (const block of blocks) {
    const { pokemon: parsed, warnings } = parsePokemonBlock(block);
    if (parsed.species !== "Unknown") {
      pokemon.push(parsed);
      allWarnings.push(...warnings);
    }
  }

  if (pokemon.length === 0) {
    allWarnings.push("No valid Pokemon could be parsed");
  } else if (pokemon.length > 6) {
    allWarnings.push(`Found ${pokemon.length} Pokemon, but a VGC team has 6. Showing first 6.`);
  }

  return {
    pokemon: pokemon.slice(0, 6),
    warnings: allWarnings,
    teamName,
  };
}

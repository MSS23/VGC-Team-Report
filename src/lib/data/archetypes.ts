export interface ArchetypeDefinition {
  name: string;
  description: string;
  indicators: {
    pokemon: string[];
    moves: string[];
    abilities: string[];
    items: string[];
  };
  weakTo: string[];
  strongVs: string[];
}

export const ARCHETYPES: ArchetypeDefinition[] = [
  {
    name: "Tailwind HO",
    description: "Fast, aggressive teams using Tailwind for speed control",
    indicators: {
      pokemon: ["tornadus", "whimsicott", "talonflame", "murkrow"],
      moves: ["tailwind"],
      abilities: ["prankster", "gale-wings"],
      items: ["focus-sash", "life-orb"],
    },
    weakTo: ["trick-room", "priority", "fake-out"],
    strongVs: ["slow-balance", "hard-tr"],
  },
  {
    name: "Hard Trick Room",
    description: "Dedicated Trick Room teams with slow, powerful Pokemon",
    indicators: {
      pokemon: ["dusclops", "porygon2", "cresselia", "gothitelle", "hatterene", "farigiraf"],
      moves: ["trick room"],
      abilities: ["armor-tail"],
      items: ["eviolite", "mental-herb"],
    },
    weakTo: ["taunt", "imprison", "fast-pressure"],
    strongVs: ["tailwind-ho", "rain"],
  },
  {
    name: "Psyspam",
    description: "Psychic Terrain + Expanding Force or Stored Power strats",
    indicators: {
      pokemon: ["indeedee-f", "armarouge", "hatterene", "iron-valiant"],
      moves: ["expanding force", "psychic terrain", "trick room"],
      abilities: ["psychic-surge"],
      items: ["life-orb", "choice-specs"],
    },
    weakTo: ["dark-types", "priority-block"],
    strongVs: ["priority-reliant", "balance"],
  },
  {
    name: "Rain",
    description: "Rain-boosted Water attacks with Swift Swim sweepers",
    indicators: {
      pokemon: ["kyogre", "pelipper", "politoed", "iron-bundle", "basculegion", "palafin"],
      moves: ["rain dance", "water spout", "hydro pump"],
      abilities: ["drizzle", "swift-swim"],
      items: ["choice-specs", "choice-scarf", "mystic-water", "damp-rock"],
    },
    weakTo: ["opposing-weather", "grass-types", "water-absorb"],
    strongVs: ["sun", "bulky-ground"],
  },
  {
    name: "Sun",
    description: "Sun-boosted Fire attacks with Chlorophyll sweepers",
    indicators: {
      pokemon: ["koraidon", "groudon", "torkoal", "ninetales-alola", "lilligant-hisui", "venusaur"],
      moves: ["sunny day", "eruption", "heat wave", "solar beam"],
      abilities: ["drought", "orichalcum-pulse", "chlorophyll"],
      items: ["heat-rock", "choice-specs", "life-orb"],
    },
    weakTo: ["opposing-weather", "flash-fire", "water-types"],
    strongVs: ["rain", "grass-types"],
  },
  {
    name: "Balance",
    description: "Flexible, well-rounded teams with multiple modes",
    indicators: {
      pokemon: ["incineroar", "rillaboom", "landorus-therian", "cresselia", "amoonguss"],
      moves: ["fake out", "u-turn", "parting shot"],
      abilities: ["intimidate", "regenerator"],
      items: ["sitrus-berry", "safety-goggles", "leftovers"],
    },
    weakTo: ["hyper-offense", "setup-sweepers"],
    strongVs: ["one-dimensional"],
  },
  {
    name: "Hyper Offense",
    description: "All-out aggressive teams with minimal defensive investment",
    indicators: {
      pokemon: ["flutter-mane", "chi-yu", "chien-pao", "calyrex-shadow", "iron-bundle"],
      moves: [],
      abilities: ["beads-of-ruin", "sword-of-ruin"],
      items: ["choice-specs", "choice-band", "life-orb", "focus-sash"],
    },
    weakTo: ["priority", "fake-out", "redirection"],
    strongVs: ["balance", "stall"],
  },
  {
    name: "Dondozo Core",
    description: "Dondozo + Tatsugiri Commander combo",
    indicators: {
      pokemon: ["dondozo", "tatsugiri"],
      moves: ["order up", "wave crash", "earthquake"],
      abilities: [],
      items: ["leftovers", "sitrus-berry"],
    },
    weakTo: ["haze", "clear-smog", "perish-song", "whirlwind"],
    strongVs: ["physical-offense", "single-target"],
  },
];

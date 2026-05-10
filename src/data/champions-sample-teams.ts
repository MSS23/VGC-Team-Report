/**
 * Pre-built Champions format sample team archetypes (VGC-77).
 * These represent iconic archetypes from the Champions Series format
 * featuring Mega Evolutions and Primal Pokemon.
 *
 * The `pokemon` arrays use base-form species names from the Champions dex.
 * Regulation "Champions" covers the legacy series with restricted picks.
 */

export interface ChampionsSampleTeam {
  id: string;
  name: string;
  description: string;
  /** Six species names (base or form, no "Mega" prefix — display layer adds that) */
  pokemon: [string, string, string, string, string, string];
  regulation: "Champions";
}

export const CHAMPIONS_SAMPLE_TEAMS: ChampionsSampleTeam[] = [
  {
    id: "sample-groudon-sun",
    name: "Primal Groudon Sun",
    description:
      "Hyper-offense built around Primal Groudon's Desolate Land, abusing sun-boosted Fire moves and a fast Mode-2 offense package.",
    pokemon: ["groudon", "xerneas", "bronzong", "incineroar", "landorus-therian", "amoonguss"],
    regulation: "Champions",
  },
  {
    id: "sample-kyogre-rain",
    name: "Primal Kyogre Rain",
    description:
      "Rain archetype anchored by Primal Kyogre's Primordial Sea, pairing Water Spout with speed control and defensive backbone.",
    pokemon: ["kyogre", "lunala", "incineroar", "amoonguss", "bronzong", "tapu-fini"],
    regulation: "Champions",
  },
  {
    id: "sample-kangaskhan-goodstuffs",
    name: "Mega Kangaskhan Goodstuffs",
    description:
      "Balanced goodstuffs team featuring Mega Kangaskhan's Parental Bond for consistent double-hit damage with flexible team support.",
    pokemon: ["kangaskhan", "incineroar", "amoonguss", "landorus-therian", "tapu-koko", "arcanine"],
    regulation: "Champions",
  },
];

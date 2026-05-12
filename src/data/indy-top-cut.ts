/**
 * Sample top-8 data for the inaugural Indianapolis Regionals Champions format event (May 29-31, 2026).
 * These are representative archetypes from the Regulation M-A meta — actual results will be
 * published on Limitless TCG once the tournament concludes.
 */

export interface IndyTopCutEntry {
  placement: string;
  player: string;
  country: string;
  species: [string, string, string, string, string, string];
  limitlessUrl?: string;
}

export const INDY_TOP_CUT: IndyTopCutEntry[] = [
  {
    placement: "1st",
    player: "TBD",
    country: "🇺🇸",
    species: ["Charizard", "Garchomp", "Incineroar", "Amoonguss", "Tapu Fini", "Rillaboom"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
  {
    placement: "2nd",
    player: "TBD",
    country: "🇺🇸",
    species: ["Kangaskhan", "Landorus-Therian", "Incineroar", "Amoonguss", "Tapu Koko", "Arcanine"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
  {
    placement: "3rd",
    player: "TBD",
    country: "🇺🇸",
    species: ["Salamence", "Garchomp", "Incineroar", "Amoonguss", "Tapu Lele", "Rillaboom"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
  {
    placement: "4th",
    player: "TBD",
    country: "🇺🇸",
    species: ["Metagross", "Landorus-Therian", "Incineroar", "Amoonguss", "Tapu Fini", "Rillaboom"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
  {
    placement: "5th",
    player: "TBD",
    country: "🇺🇸",
    species: ["Charizard", "Landorus-Therian", "Incineroar", "Amoonguss", "Tapu Koko", "Arcanine"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
  {
    placement: "5th",
    player: "TBD",
    country: "🇺🇸",
    species: ["Kangaskhan", "Garchomp", "Incineroar", "Amoonguss", "Tapu Fini", "Rillaboom"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
  {
    placement: "7th",
    player: "TBD",
    country: "🇺🇸",
    species: ["Salamence", "Landorus-Therian", "Incineroar", "Amoonguss", "Tapu Koko", "Rillaboom"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
  {
    placement: "7th",
    player: "TBD",
    country: "🇺🇸",
    species: ["Metagross", "Garchomp", "Incineroar", "Amoonguss", "Tapu Lele", "Arcanine"],
    limitlessUrl: "https://play.limitlesstcg.com/tournaments",
  },
];

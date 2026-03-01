import type { StatName } from "@/lib/types/pokemon";

export interface NatureData {
  name: string;
  plus: StatName | null;
  minus: StatName | null;
}

export const NATURES: Record<string, NatureData> = {
  // Neutral natures (no stat changes)
  Hardy: { name: "Hardy", plus: null, minus: null },
  Docile: { name: "Docile", plus: null, minus: null },
  Serious: { name: "Serious", plus: null, minus: null },
  Bashful: { name: "Bashful", plus: null, minus: null },
  Quirky: { name: "Quirky", plus: null, minus: null },

  // +Attack natures
  Lonely: { name: "Lonely", plus: "atk", minus: "def" },
  Brave: { name: "Brave", plus: "atk", minus: "spe" },
  Adamant: { name: "Adamant", plus: "atk", minus: "spa" },
  Naughty: { name: "Naughty", plus: "atk", minus: "spd" },

  // +Defense natures
  Bold: { name: "Bold", plus: "def", minus: "atk" },
  Relaxed: { name: "Relaxed", plus: "def", minus: "spe" },
  Impish: { name: "Impish", plus: "def", minus: "spa" },
  Lax: { name: "Lax", plus: "def", minus: "spd" },

  // +Speed natures
  Timid: { name: "Timid", plus: "spe", minus: "atk" },
  Hasty: { name: "Hasty", plus: "spe", minus: "def" },
  Jolly: { name: "Jolly", plus: "spe", minus: "spa" },
  Naive: { name: "Naive", plus: "spe", minus: "spd" },

  // +Sp. Attack natures
  Modest: { name: "Modest", plus: "spa", minus: "atk" },
  Mild: { name: "Mild", plus: "spa", minus: "def" },
  Quiet: { name: "Quiet", plus: "spa", minus: "spe" },
  Rash: { name: "Rash", plus: "spa", minus: "spd" },

  // +Sp. Defense natures
  Calm: { name: "Calm", plus: "spd", minus: "atk" },
  Gentle: { name: "Gentle", plus: "spd", minus: "def" },
  Sassy: { name: "Sassy", plus: "spd", minus: "spe" },
  Careful: { name: "Careful", plus: "spd", minus: "spa" },
};

export function getNatureModifier(nature: string, stat: StatName): number {
  const data = NATURES[nature];
  if (!data) return 1;
  if (data.plus === stat) return 1.1;
  if (data.minus === stat) return 0.9;
  return 1;
}

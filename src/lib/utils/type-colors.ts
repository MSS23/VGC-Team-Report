import type { PokemonType } from "@/lib/types/pokemon";

export const TYPE_COLORS: Record<PokemonType, { bg: string; text: string; border: string }> = {
  Normal:   { bg: "#A8A77A", text: "#FFFFFF", border: "#9C9B6E" },
  Fire:     { bg: "#EE8130", text: "#FFFFFF", border: "#E27524" },
  Water:    { bg: "#6390F0", text: "#FFFFFF", border: "#5784E4" },
  Electric: { bg: "#F7D02C", text: "#1A1A2E", border: "#EBC420" },
  Grass:    { bg: "#7AC74C", text: "#FFFFFF", border: "#6EBB40" },
  Ice:      { bg: "#96D9D6", text: "#1A1A2E", border: "#8ACDCA" },
  Fighting: { bg: "#C22E28", text: "#FFFFFF", border: "#B6221C" },
  Poison:   { bg: "#A33EA1", text: "#FFFFFF", border: "#973295" },
  Ground:   { bg: "#E2BF65", text: "#1A1A2E", border: "#D6B359" },
  Flying:   { bg: "#A98FF0", text: "#FFFFFF", border: "#9D83E4" },
  Psychic:  { bg: "#F95587", text: "#FFFFFF", border: "#ED497B" },
  Bug:      { bg: "#A6B91A", text: "#FFFFFF", border: "#9AAD0E" },
  Rock:     { bg: "#B6A136", text: "#FFFFFF", border: "#AA952A" },
  Ghost:    { bg: "#735797", text: "#FFFFFF", border: "#674B8B" },
  Dragon:   { bg: "#6F35FC", text: "#FFFFFF", border: "#6329F0" },
  Dark:     { bg: "#705746", text: "#FFFFFF", border: "#644B3A" },
  Steel:    { bg: "#B7B7CE", text: "#1A1A2E", border: "#ABABC2" },
  Fairy:    { bg: "#D685AD", text: "#FFFFFF", border: "#CA79A1" },
};

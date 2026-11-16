import type { TeraType } from "@/lib/types/pokemon";

// Badge text is 10–11px uppercase (TypeBadge), so every text/bg pair here must
// clear WCAG AA 4.5:1 for small text. The pastel backgrounds (Normal, Fire,
// Water, Grass, Flying, Psychic, Bug, Rock, Fairy, Stellar) only reached
// 2.08–3.15:1 against white, so they take the dark ink instead (5.4–8.2:1).
// Guarded by __tests__/type-colors.a11y.test.ts — do not reintroduce white here.
export const TYPE_COLORS: Record<TeraType, { bg: string; text: string; border: string }> = {
  Normal:   { bg: "#A8A77A", text: "#1A1A2E", border: "#9C9B6E" },
  Fire:     { bg: "#EE8130", text: "#1A1A2E", border: "#E27524" },
  Water:    { bg: "#6390F0", text: "#1A1A2E", border: "#5784E4" },
  Electric: { bg: "#F7D02C", text: "#1A1A2E", border: "#EBC420" },
  Grass:    { bg: "#7AC74C", text: "#1A1A2E", border: "#6EBB40" },
  Ice:      { bg: "#96D9D6", text: "#1A1A2E", border: "#8ACDCA" },
  Fighting: { bg: "#C22E28", text: "#FFFFFF", border: "#B6221C" },
  Poison:   { bg: "#A33EA1", text: "#FFFFFF", border: "#973295" },
  Ground:   { bg: "#E2BF65", text: "#1A1A2E", border: "#D6B359" },
  Flying:   { bg: "#A98FF0", text: "#1A1A2E", border: "#9D83E4" },
  Psychic:  { bg: "#F95587", text: "#1A1A2E", border: "#ED497B" },
  Bug:      { bg: "#A6B91A", text: "#1A1A2E", border: "#9AAD0E" },
  Rock:     { bg: "#B6A136", text: "#1A1A2E", border: "#AA952A" },
  Ghost:    { bg: "#735797", text: "#FFFFFF", border: "#674B8B" },
  Dragon:   { bg: "#6F35FC", text: "#FFFFFF", border: "#6329F0" },
  Dark:     { bg: "#705746", text: "#FFFFFF", border: "#644B3A" },
  Steel:    { bg: "#B7B7CE", text: "#1A1A2E", border: "#ABABC2" },
  Fairy:    { bg: "#D685AD", text: "#1A1A2E", border: "#CA79A1" },
  // Stellar is Tera-only (no chart row) but needs badge styling — the games
  // render it as the iridescent teal/gold Stellar crown (VGC-294).
  Stellar:  { bg: "#4FA89B", text: "#1A1A2E", border: "#439C8F" },
};

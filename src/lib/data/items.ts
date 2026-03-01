export type ItemCategory =
  | "speed-boost" | "power" | "bulk" | "protection"
  | "berry" | "choice" | "utility" | "terrain" | "weather";

export interface ItemData {
  name: string;
  categories: ItemCategory[];
}

export const ITEMS: Record<string, ItemData> = {
  "choice-scarf": { name: "Choice Scarf", categories: ["speed-boost", "choice"] },
  "choice-band": { name: "Choice Band", categories: ["power", "choice"] },
  "choice-specs": { name: "Choice Specs", categories: ["power", "choice"] },
  "life-orb": { name: "Life Orb", categories: ["power"] },
  "assault-vest": { name: "Assault Vest", categories: ["bulk"] },
  "eviolite": { name: "Eviolite", categories: ["bulk"] },
  "focus-sash": { name: "Focus Sash", categories: ["protection"] },
  "safety-goggles": { name: "Safety Goggles", categories: ["protection", "utility"] },
  "leftovers": { name: "Leftovers", categories: ["bulk", "utility"] },
  "sitrus-berry": { name: "Sitrus Berry", categories: ["berry", "bulk"] },
  "lum-berry": { name: "Lum Berry", categories: ["berry", "utility"] },
  "wiki-berry": { name: "Wiki Berry", categories: ["berry", "bulk"] },
  "aguav-berry": { name: "Aguav Berry", categories: ["berry", "bulk"] },
  "figy-berry": { name: "Figy Berry", categories: ["berry", "bulk"] },
  "iapapa-berry": { name: "Iapapa Berry", categories: ["berry", "bulk"] },
  "mago-berry": { name: "Mago Berry", categories: ["berry", "bulk"] },
  "yache-berry": { name: "Yache Berry", categories: ["berry", "protection"] },
  "shuca-berry": { name: "Shuca Berry", categories: ["berry", "protection"] },
  "charti-berry": { name: "Charti Berry", categories: ["berry", "protection"] },
  "coba-berry": { name: "Coba Berry", categories: ["berry", "protection"] },
  "chople-berry": { name: "Chople Berry", categories: ["berry", "protection"] },
  "kasib-berry": { name: "Kasib Berry", categories: ["berry", "protection"] },
  "roseli-berry": { name: "Roseli Berry", categories: ["berry", "protection"] },
  "occa-berry": { name: "Occa Berry", categories: ["berry", "protection"] },
  "booster-energy": { name: "Booster Energy", categories: ["power", "speed-boost"] },
  "clear-amulet": { name: "Clear Amulet", categories: ["utility"] },
  "covert-cloak": { name: "Covert Cloak", categories: ["utility"] },
  "rocky-helmet": { name: "Rocky Helmet", categories: ["utility"] },
  "mental-herb": { name: "Mental Herb", categories: ["utility"] },
  "wide-lens": { name: "Wide Lens", categories: ["utility"] },
  "scope-lens": { name: "Scope Lens", categories: ["power"] },
  "muscle-band": { name: "Muscle Band", categories: ["power"] },
  "wise-glasses": { name: "Wise Glasses", categories: ["power"] },
  "expert-belt": { name: "Expert Belt", categories: ["power"] },
  "mystic-water": { name: "Mystic Water", categories: ["power"] },
  "charcoal": { name: "Charcoal", categories: ["power"] },
  "loaded-dice": { name: "Loaded Dice", categories: ["power"] },
  "throat-spray": { name: "Throat Spray", categories: ["power"] },
  "weakness-policy": { name: "Weakness Policy", categories: ["power"] },
  "mirror-herb": { name: "Mirror Herb", categories: ["utility"] },
  "terrain-extender": { name: "Terrain Extender", categories: ["terrain"] },
  "heat-rock": { name: "Heat Rock", categories: ["weather"] },
  "damp-rock": { name: "Damp Rock", categories: ["weather"] },
  "icy-rock": { name: "Icy Rock", categories: ["weather"] },
  "smooth-rock": { name: "Smooth Rock", categories: ["weather"] },
};

export function lookupItem(name: string): ItemData | null {
  const key = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return ITEMS[key] ?? null;
}

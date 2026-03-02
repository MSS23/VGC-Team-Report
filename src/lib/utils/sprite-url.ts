const BASE_URL = "https://play.pokemonshowdown.com/sprites";

function toSlug(species: string): string {
  return species
    .toLowerCase()
    .replace(/[''.]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SLUG_OVERRIDES: Record<string, string> = {
  "urshifu-rapid-strike": "urshifu-rapidstrike",
  "calyrex-ice": "calyrex-ice",
  "calyrex-shadow": "calyrex-shadow",
  "indeedee-f": "indeedee-f",
  "meowstic-f": "meowstic-f",
  "ogerpon-wellspring": "ogerpon-wellspring",
  "ogerpon-hearthflame": "ogerpon-hearthflame",
  "ogerpon-cornerstone": "ogerpon-cornerstone",
  "zacian-crowned": "zacian-crowned",
  "palkia-origin": "palkia-origin",
  "dialga-origin": "dialga-origin",
  "giratina-origin": "giratina-origin",
  "landorus-therian": "landorus-therian",
  "thundurus-therian": "thundurus-therian",
  "tornadus-therian": "tornadus-therian",
  "enamorus-therian": "enamorus-therian",
  "ninetales-alola": "ninetales-alola",
  "arcanine-hisui": "arcanine-hisui",
  "lilligant-hisui": "lilligant-hisui",
  "goodra-hisui": "goodra-hisui",
  "kyurem-white": "kyurem-white",
  "kyurem-black": "kyurem-black",
  "bloodmoon-ursaluna": "ursaluna-bloodmoon",
  "rotom-wash": "rotom-wash",
  "rotom-heat": "rotom-heat",
  "rotom-mow": "rotom-mow",
  "rotom-fan": "rotom-fan",
  "rotom-frost": "rotom-frost",
  "flutter-mane": "fluttermane",
  "iron-hands": "ironhands",
  "iron-bundle": "ironbundle",
  "iron-valiant": "ironvaliant",
  "iron-moth": "ironmoth",
  "iron-thorns": "ironthorns",
  "iron-jugulis": "ironjugulis",
  "iron-leaves": "ironleaves",
  "iron-boulder": "ironboulder",
  "iron-crown": "ironcrown",
  "great-tusk": "greattusk",
  "brute-bonnet": "brutebonnet",
  "scream-tail": "screamtail",
  "sandy-shocks": "sandyshocks",
  "slither-wing": "slitherwing",
  "roaring-moon": "roaringmoon",
  "walking-wake": "walkingwake",
  "gouging-fire": "gougingfire",
  "raging-bolt": "ragingbolt",
  "chien-pao": "chienpao",
  "chi-yu": "chiyu",
  "ting-lu": "tinglu",
  "wo-chien": "wochien",
  "kommo-o": "kommoo",
};

export type SpriteVariant = "gen5ani" | "ani" | "gen5";

function variantPath(variant: SpriteVariant, shiny: boolean): string {
  return shiny ? `${variant}-shiny` : variant;
}

export function getSpriteUrl(species: string, variant: SpriteVariant = "gen5ani", shiny = false): string {
  const slug = toSlug(species);
  const resolved = SLUG_OVERRIDES[slug] ?? slug;
  const ext = variant === "gen5" ? "png" : "gif";
  return `${BASE_URL}/${variantPath(variant, shiny)}/${resolved}.${ext}`;
}

export function getSpriteFallbackUrl(variant: SpriteVariant = "gen5"): string {
  const ext = variant === "gen5" ? "png" : "gif";
  return `${BASE_URL}/${variant}/substitute.${ext}`;
}

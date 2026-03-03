const BASE_URL = "https://play.pokemonshowdown.com/sprites";

function toSlug(species: string): string {
  return species
    .toLowerCase()
    .replace(/♂/g, "m")
    .replace(/♀/g, "f")
    .replace(/[éè]/g, "e")
    .replace(/[''.:\u2019]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SLUG_OVERRIDES: Record<string, string> = {
  // Base name corrections (Showdown strips all non-alnum from base names)
  "ho-oh": "hooh",
  "type-null": "typenull",
  "mr-mime": "mrmime",
  "mr-rime": "mrrime",
  "mime-jr": "mimejr",
  "jangmo-o": "jangmoo",
  "hakamo-o": "hakamoo",
  "kommo-o": "kommoo",
  "tapu-koko": "tapukoko",
  "tapu-lele": "tapulele",
  "tapu-bulu": "tapubulu",
  "tapu-fini": "tapufini",
  // Nidoran gender (♂/♀ handled in toSlug → nidoranm / nidoranf)

  // Form names (multi-word forms merged)
  "urshifu-rapid-strike": "urshifu-rapidstrike",
  "necrozma-dusk-mane": "necrozma-duskmane",
  "necrozma-dawn-wings": "necrozma-dawnwings",
  "oricorio-pom-pom": "oricorio-pompom",
  "mr-mime-galar": "mrmime-galar",
  "tauros-paldea-combat": "tauros-paldeacombat",
  "tauros-paldea-blaze": "tauros-paldeablaze",
  "tauros-paldea-aqua": "tauros-paldeaaqua",

  // Paradox Pokemon (two-word names, no hyphen on Showdown)
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

  // Treasures of Ruin
  "chien-pao": "chienpao",
  "chi-yu": "chiyu",
  "ting-lu": "tinglu",
  "wo-chien": "wochien",

  // Bloodmoon Ursaluna (name order differs from Showdown slug)
  "bloodmoon-ursaluna": "ursaluna-bloodmoon",

  // Forms that match slug as-is (kept for documentation)
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
  "rotom-wash": "rotom-wash",
  "rotom-heat": "rotom-heat",
  "rotom-mow": "rotom-mow",
  "rotom-fan": "rotom-fan",
  "rotom-frost": "rotom-frost",
};

function resolveSlug(species: string): string {
  const slug = toSlug(species);
  return SLUG_OVERRIDES[slug] ?? slug;
}

// ─── Legacy exports (kept for any remaining callers) ────────────────

export type SpriteVariant = "gen5ani" | "ani" | "gen5";

export function getSpriteUrl(species: string, variant: SpriteVariant = "gen5ani", shiny = false): string {
  const resolved = resolveSlug(species);
  const ext = variant === "gen5" ? "png" : "gif";
  const folder = shiny ? `${variant}-shiny` : variant;
  return `${BASE_URL}/${folder}/${resolved}.${ext}`;
}

export function getSpriteFallbackUrl(variant: SpriteVariant = "gen5"): string {
  const ext = variant === "gen5" ? "png" : "gif";
  return `${BASE_URL}/${variant}/substitute.${ext}`;
}

// ─── Gen-themed sprite support ──────────────────────────────────────

interface GenSpriteStyle {
  /** Static sprite folder on Showdown (e.g., "gen1rb", "gen3", "home") */
  folder: string;
  /** Shiny static folder, or null if the gen didn't have shinies */
  shinyFolder: string | null;
  /** Animated sprite folder (e.g., "gen5ani", "ani") */
  animated: string;
  /** Shiny animated folder */
  animatedShiny: string;
  /** Whether sprites should use pixelated rendering */
  pixelated: boolean;
}

const GEN_SPRITE_STYLES: Record<string, GenSpriteStyle> = {
  gen1: { folder: "gen1rb",  shinyFolder: null,         animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen2: { folder: "gen2",    shinyFolder: null,         animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen3: { folder: "gen3",    shinyFolder: "gen3-shiny", animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen4: { folder: "gen4",    shinyFolder: "gen4-shiny", animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen5: { folder: "gen5",    shinyFolder: "gen5-shiny", animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen6: { folder: "dex",     shinyFolder: "dex-shiny",  animated: "ani",     animatedShiny: "ani-shiny",     pixelated: false },
  gen7: { folder: "dex",     shinyFolder: "dex-shiny",  animated: "ani",     animatedShiny: "ani-shiny",     pixelated: false },
  gen8: { folder: "home",    shinyFolder: "home-shiny", animated: "ani",     animatedShiny: "ani-shiny",     pixelated: false },
  gen9: { folder: "home",    shinyFolder: "home-shiny", animated: "ani",     animatedShiny: "ani-shiny",     pixelated: false },
};

/**
 * Returns an ordered list of sprite URLs to try for a given species.
 * The component should try each URL in order, falling back on 404.
 *
 * Gen-specific folders only contain Pokemon from that era (e.g., gen1rb
 * only has Kanto Pokemon). When a sprite isn't found the fallback chain
 * ensures we always land on a valid image.
 */
export function getGenThemedSpriteUrls(
  species: string,
  genTheme: string,
  animated: boolean,
  shiny: boolean,
): string[] {
  const slug = resolveSlug(species);
  const style = GEN_SPRITE_STYLES[genTheme] ?? GEN_SPRITE_STYLES.gen9;
  const urls: string[] = [];

  if (animated) {
    // 1. Gen-themed animated (e.g., gen5ani for retro themes, ani for modern)
    urls.push(`${BASE_URL}/${shiny ? style.animatedShiny : style.animated}/${slug}.gif`);
    // 2. Fallback to both animated styles (ani has modern, gen5ani has wider coverage)
    if (style.animated !== "ani") {
      urls.push(`${BASE_URL}/${shiny ? "ani-shiny" : "ani"}/${slug}.gif`);
    }
    if (style.animated !== "gen5ani") {
      urls.push(`${BASE_URL}/${shiny ? "gen5ani-shiny" : "gen5ani"}/${slug}.gif`);
    }
    // 3. Gen-themed static (e.g., home for gen8/9 — covers newer Pokemon)
    const staticFolder = shiny && style.shinyFolder ? style.shinyFolder : style.folder;
    if (staticFolder !== "gen5") {
      urls.push(`${BASE_URL}/${staticFolder}/${slug}.png`);
    }
    // 4. Gen5 static fallback (broadest retro coverage)
    urls.push(`${BASE_URL}/${shiny ? "gen5-shiny" : "gen5"}/${slug}.png`);
  } else {
    // 1. Gen-themed static (e.g., gen1rb, gen3, home)
    const staticFolder = shiny && style.shinyFolder ? style.shinyFolder : style.folder;
    urls.push(`${BASE_URL}/${staticFolder}/${slug}.png`);
    // 2. If shiny requested but gen has no shiny folder, try gen5-shiny
    if (shiny && !style.shinyFolder) {
      urls.push(`${BASE_URL}/gen5-shiny/${slug}.png`);
    }
    // 3. Fallback to gen5 static (broadest pixel coverage)
    if (style.folder !== "gen5") {
      urls.push(`${BASE_URL}/${shiny ? "gen5-shiny" : "gen5"}/${slug}.png`);
    }
    // 4. Animated fallback
    urls.push(`${BASE_URL}/${shiny ? "ani-shiny" : "ani"}/${slug}.gif`);
  }

  // Ultimate fallback — substitute sprite
  urls.push(`${BASE_URL}/gen5/substitute.png`);

  return urls;
}

/**
 * Whether a gen theme uses pixelated (retro) rendering for static sprites.
 */
export function isGenThemePixelated(genTheme: string): boolean {
  return GEN_SPRITE_STYLES[genTheme]?.pixelated ?? false;
}

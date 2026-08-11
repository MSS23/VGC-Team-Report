import { resolveSlug, STATIC_ONLY_SLUGS } from "./sprite-slug";

const BASE_URL = "https://play.pokemonshowdown.com/sprites";

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

/**
 * Style used for any unknown/invalid gen theme. Declared as a standalone
 * constant (rather than reached for as `GEN_SPRITE_STYLES.gen9`) so the fallback
 * is not itself an index lookup that can come back `undefined` — every read of
 * `style.*` below is then statically guaranteed to hit a real object.
 */
const DEFAULT_GEN_SPRITE_STYLE: GenSpriteStyle = {
  folder: "home", shinyFolder: "home-shiny", animated: "ani", animatedShiny: "ani-shiny", pixelated: false,
};

const GEN_SPRITE_STYLES: Record<string, GenSpriteStyle> = {
  gen1: { folder: "gen1rb",  shinyFolder: null,         animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen2: { folder: "gen2",    shinyFolder: null,         animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen3: { folder: "gen3",    shinyFolder: "gen3-shiny", animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen4: { folder: "gen4",    shinyFolder: "gen4-shiny", animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen5: { folder: "gen5",    shinyFolder: "gen5-shiny", animated: "gen5ani", animatedShiny: "gen5ani-shiny", pixelated: true },
  gen6: { folder: "dex",     shinyFolder: "dex-shiny",  animated: "ani",     animatedShiny: "ani-shiny",     pixelated: false },
  gen7: { folder: "dex",     shinyFolder: "dex-shiny",  animated: "ani",     animatedShiny: "ani-shiny",     pixelated: false },
  gen8: { folder: "home",    shinyFolder: "home-shiny", animated: "ani",     animatedShiny: "ani-shiny",     pixelated: false },
  gen9: DEFAULT_GEN_SPRITE_STYLE,
};

/**
 * Resolves a gen theme to its sprite style, always returning a real object.
 *
 * The own-property check matters: `GEN_SPRITE_STYLES` is an object literal, so a
 * bare `GEN_SPRITE_STYLES[genTheme]` for a key like `"toString"`, `"constructor"`
 * or `"__proto__"` returns an inherited `Object.prototype` member instead of
 * `undefined`, which means `?? DEFAULT` never fires and the caller ends up
 * reading `.folder` off a function — emitting `.../undefined/garchomp.png`.
 * `genTheme` comes from persisted user preferences, so it is untrusted input.
 */
function resolveGenStyle(genTheme: string): GenSpriteStyle {
  return Object.prototype.hasOwnProperty.call(GEN_SPRITE_STYLES, genTheme)
    ? (GEN_SPRITE_STYLES[genTheme] ?? DEFAULT_GEN_SPRITE_STYLE)
    : DEFAULT_GEN_SPRITE_STYLE;
}

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
  // An unrecognised genTheme (stale localStorage, hand-edited URL, a gen we
  // haven't added yet) falls back to the modern style, so the 12 `style.*` reads
  // below are safe today and stay safe once `noUncheckedIndexedAccess` lands.
  const style: GenSpriteStyle = resolveGenStyle(genTheme);
  const urls: string[] = [];

  // Some species (e.g. the Treasures of Ruin) have no animated GIF on
  // Showdown — trying one just 404s and flashes a broken image. Force the
  // static path for those even when animation was requested.
  const wantAnimated = animated && !STATIC_ONLY_SLUGS.has(slug);

  if (wantAnimated) {
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
    if (STATIC_ONLY_SLUGS.has(slug)) {
      // No animated GIF exists for these, and retro static folders don't
      // carry gen-9 mons — guarantee the modern HOME PNG so a retro theme
      // still resolves to the real sprite instead of the substitute doll.
      urls.push(`${BASE_URL}/${shiny ? "home-shiny" : "home"}/${slug}.png`);
    } else {
      // 4. Animated fallback
      urls.push(`${BASE_URL}/${shiny ? "ani-shiny" : "ani"}/${slug}.gif`);
    }
  }

  // No base-form fallback for Megas — see sprite-slug.ts comment.
  // Callers must gate Mega visibility on MEGAS_WITH_SPRITES.

  // Ultimate fallback — substitute sprite
  urls.push(`${BASE_URL}/gen5/substitute.png`);

  return urls;
}

/**
 * Whether a gen theme uses pixelated (retro) rendering for static sprites.
 */
export function isGenThemePixelated(genTheme: string): boolean {
  // Same unknown-theme fallback as getGenThemedSpriteUrls — one source of truth.
  return resolveGenStyle(genTheme).pixelated;
}

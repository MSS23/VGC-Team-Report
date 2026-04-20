const BASE = "https://play.pokemonshowdown.com/sprites";

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

const SLUG_MAP: Record<string, string> = {
  "ho-oh": "hooh", "type-null": "typenull", "mr-mime": "mrmime", "mr-rime": "mrrime",
  "mime-jr": "mimejr", "jangmo-o": "jangmoo", "hakamo-o": "hakamoo", "kommo-o": "kommoo",
  "tapu-koko": "tapukoko", "tapu-lele": "tapulele",
  "tapu-bulu": "tapubulu", "tapu-fini": "tapufini",
  "flutter-mane": "fluttermane", "iron-hands": "ironhands", "iron-bundle": "ironbundle",
  "iron-valiant": "ironvaliant", "iron-moth": "ironmoth", "iron-thorns": "ironthorns",
  "iron-jugulis": "ironjugulis", "iron-leaves": "ironleaves", "iron-boulder": "ironboulder",
  "iron-crown": "ironcrown", "great-tusk": "greattusk", "brute-bonnet": "brutebonnet",
  "scream-tail": "screamtail", "sandy-shocks": "sandyshocks", "slither-wing": "slitherwing",
  "roaring-moon": "roaringmoon", "walking-wake": "walkingwake", "gouging-fire": "gougingfire",
  "raging-bolt": "ragingbolt", "chien-pao": "chienpao", "chi-yu": "chiyu",
  "ting-lu": "tinglu", "wo-chien": "wochien",
  "urshifu-rapid-strike": "urshifu-rapidstrike",
  "necrozma-dusk-mane": "necrozma-duskmane", "necrozma-dawn-wings": "necrozma-dawnwings",
  "oricorio-pom-pom": "oricorio-pompom", "mr-mime-galar": "mrmime-galar",
  "tauros-paldea-combat": "tauros-paldeacombat", "tauros-paldea-blaze": "tauros-paldeablaze",
  "tauros-paldea-aqua": "tauros-paldeaaqua",
  "bloodmoon-ursaluna": "ursaluna-bloodmoon",
  "charizard-mega-x": "charizard-megax",
  "charizard-mega-y": "charizard-megay",
  "mewtwo-mega-x": "mewtwo-megax",
  "mewtwo-mega-y": "mewtwo-megay",
};

export function resolveSlug(species: string): string {
  const slug = toSlug(species);
  return SLUG_MAP[slug] ?? slug;
}

/** Ordered sprite URLs: animated GIF first, then static PNG fallbacks.
 *
 * For Mega forms not yet on Showdown's CDN (most Pokemon Champions
 * originals — Mega Excadrill, Mega Golurk, Mega Glimmora, etc. all
 * 404 on every variant), we append the base form's sprite URLs as
 * additional fallbacks. The onError-cycling consumer lands on the
 * base sprite instead of a broken image. The Mega context is still
 * conveyed by the surrounding label/badge UI; the sprite is just a
 * graceful degradation. */
export function getSpriteUrls(species: string): string[] {
  const slug = resolveSlug(species);
  const urls: string[] = [
    `${BASE}/ani/${slug}.gif`,
    `${BASE}/gen5ani/${slug}.gif`,
    `${BASE}/home/${slug}.png`,
    `${BASE}/gen5/${slug}.png`,
  ];
  // Mega-form fallback: strip "-mega" / "-megax" / "-megay" to recover
  // the base species slug, then append its sprite URLs.
  const megaMatch = slug.match(/^(.+?)-mega[xy]?$/);
  if (megaMatch) {
    const base = megaMatch[1];
    urls.push(
      `${BASE}/ani/${base}.gif`,
      `${BASE}/gen5ani/${base}.gif`,
      `${BASE}/home/${base}.png`,
      `${BASE}/gen5/${base}.png`,
    );
  }
  return urls;
}

import { resolveSlug, STATIC_ONLY_SLUGS } from "./sprite-slug";

/**
 * VGC-232 — sprite fallback chain + per-CDN forme normalisation.
 *
 * PokePaste (the dominant share format) never patched its sprite URLs for
 * post-SwSh DLC formes, so `Zygarde-10%`, `Zygarde-Complete`, `Sirfetch'd`
 * and `Ash-Greninja` render as broken images. The `pokepastefix` Chrome
 * extension papers over it for desktop Chrome only — its Safari port is
 * blocked by CSP, so iOS viewers still see holes.
 *
 * We can't fix pokepast.es, but we can guarantee our own reports never show
 * a broken image: `/api/sprite` walks an ORDERED, FINITE chain of upstreams
 * and serves the first one that returns real image bytes.
 *
 * The hard part is that every sprite CDN spells formes differently:
 *
 *   species            Showdown            PokemonDB
 *   ─────────────────  ──────────────────  ────────────────────
 *   Zygarde-10%        zygarde-10          zygarde-10
 *   Zygarde-Complete   zygarde-complete    zygarde-complete
 *   Sirfetch'd         sirfetchd           sirfetchd
 *   Ash-Greninja       greninja-ash        greninja-ash
 *   Ho-Oh              hooh                ho-oh
 *   Tapu Koko          tapukoko            tapu-koko
 *   Urshifu-Rapid…     urshifu-rapidstrike urshifu-rapid-strike
 *   Slowbro-Galar      slowbro-galar       slowbro-galarian
 *
 * Showdown collapses hyphens inside a species name and truncates regional
 * suffixes; PokemonDB keeps the hyphens and uses the long adjective form.
 * Getting that wrong is silent — you just get another 404 — which is exactly
 * why this lives in one tested pure module rather than inline in the route.
 */

// ─── Host allowlist (SSRF boundary) ──────────────────────────────────
//
// SECURITY: these are the ONLY origins the sprite proxy may ever contact.
// Species/forme text is normalised to `[a-z0-9-]` and used ONLY as a path
// filename — it is never interpolated into a hostname, scheme, port or
// query string, so a crafted species string cannot redirect the fetch.

export type SpriteUpstream = "showdown" | "pokemondb";

export const SPRITE_UPSTREAM_HOSTS: Readonly<Record<SpriteUpstream, string>> = {
  showdown: "play.pokemonshowdown.com",
  pokemondb: "img.pokemondb.net",
};

/** Path prefix each allowlisted host is permitted to serve from. */
const SPRITE_HOST_PATH_PREFIX: Readonly<Record<string, string>> = {
  "play.pokemonshowdown.com": "/sprites/",
  "img.pokemondb.net": "/sprites/",
};

const SHOWDOWN_BASE = `https://${SPRITE_UPSTREAM_HOSTS.showdown}/sprites`;
const POKEMONDB_BASE = `https://${SPRITE_UPSTREAM_HOSTS.pokemondb}/sprites`;

/**
 * Terminal upstream of every chain. Showdown has served this file since 2013
 * and it is the same "missing mon" doll the Showdown client itself uses, so a
 * chain that reaches it still renders a deliberate image rather than a broken
 * one. `/api/sprite` appends an inline SVG after this as a final, network-free
 * guarantee — see the route.
 */
export const SHOWDOWN_SUBSTITUTE_URL = `${SHOWDOWN_BASE}/gen5/substitute.png`;

/** Filenames may only ever be lowercase slug + a known image extension. */
const SAFE_SPRITE_FILENAME = /^[a-z0-9-]+\.(png|gif)$/;

/**
 * Whether a URL may be fetched by the sprite proxy.
 *
 * Requires: https, an allowlisted host (exact match — no suffix matching, so
 * `play.pokemonshowdown.com.evil.tld` is rejected), no embedded credentials,
 * no explicit port, the host's own path prefix, no traversal segments, and a
 * filename matching the safe pattern.
 */
export function isAllowedSpriteUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port) return false;

  const prefix = Object.prototype.hasOwnProperty.call(SPRITE_HOST_PATH_PREFIX, url.hostname)
    ? SPRITE_HOST_PATH_PREFIX[url.hostname]
    : undefined;
  if (!prefix) return false;

  const path = url.pathname;
  if (!path.startsWith(prefix)) return false;
  if (path.includes("..") || path.includes("//") || path.includes("%")) return false;

  const filename = path.slice(path.lastIndexOf("/") + 1);
  return SAFE_SPRITE_FILENAME.test(filename);
}

// ─── Forme normalisation ─────────────────────────────────────────────

/**
 * Lowercase hyphen slug shared by both CDNs before their per-host quirks.
 *
 * Handles the punctuation that breaks PokePaste in the first place:
 * apostrophes (`Sirfetch'd`, including the typographic U+2019 that Showdown
 * exports), `%` (`Zygarde-10%`), gender symbols, accents (`Flabébé`), spaces
 * and periods (`Mr. Mime`).
 */
function baseSlug(species: string): string {
  return species
    .trim()
    .toLowerCase()
    // Matches `sprite-slug.ts`: the gender symbol fuses onto the name
    // (Nidoran♂ -> nidoranm), it does not become its own segment.
    .replace(/♂/g, "m")
    .replace(/♀/g, "f")
    .replace(/[éè]/g, "e")
    // Apostrophes and periods vanish entirely (sirfetchd, mr-mime), they do
    // not become separators.
    .replace(/['’.:]/g, "")
    // `%` vanishes too: "zygarde-10%" -> "zygarde-10", not "zygarde-10-".
    .replace(/%/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Species whose canonical name differs from a mechanical slug on BOTH CDNs.
 * Applied to the shared base slug before per-host rules.
 *
 * Ash-Greninja is the headline case: Showdown and PokemonDB both file it as
 * `greninja-ash`, but every paste in the wild writes "Ash-Greninja", so the
 * mechanical slug 404s on both.
 */
const CANONICAL_ALIASES: Readonly<Record<string, string>> = {
  "ash-greninja": "greninja-ash",
  "greninja-ash-battle-bond": "greninja-ash",
  "zygarde-10-power-construct": "zygarde-10",
  "zygarde-50": "zygarde",
  "bloodmoon-ursaluna": "ursaluna-bloodmoon",
  "ursaluna-blood-moon": "ursaluna-bloodmoon",
  "darmanitan-galar-zen": "darmanitan-galarzen",
};

/** Regional suffix spelling: Showdown truncates, PokemonDB uses the adjective. */
const REGIONAL_LONG_FORM: Readonly<Record<string, string>> = {
  alola: "alolan",
  galar: "galarian",
  hisui: "hisuian",
  paldea: "paldean",
};

/**
 * PokemonDB keeps the internal hyphens that Showdown collapses. These are the
 * species where `resolveSlug` (Showdown convention) squashes a hyphen we need
 * to put back, keyed by the SHOWDOWN slug.
 */
const POKEMONDB_UNSQUASHED: Readonly<Record<string, string>> = {
  hooh: "ho-oh",
  typenull: "type-null",
  mrmime: "mr-mime",
  mrrime: "mr-rime",
  mimejr: "mime-jr",
  jangmoo: "jangmo-o",
  hakamoo: "hakamo-o",
  kommoo: "kommo-o",
  tapukoko: "tapu-koko",
  tapulele: "tapu-lele",
  tapubulu: "tapu-bulu",
  tapufini: "tapu-fini",
  fluttermane: "flutter-mane",
  ironhands: "iron-hands",
  ironbundle: "iron-bundle",
  ironvaliant: "iron-valiant",
  ironmoth: "iron-moth",
  ironthorns: "iron-thorns",
  ironjugulis: "iron-jugulis",
  ironleaves: "iron-leaves",
  ironboulder: "iron-boulder",
  ironcrown: "iron-crown",
  greattusk: "great-tusk",
  brutebonnet: "brute-bonnet",
  screamtail: "scream-tail",
  sandyshocks: "sandy-shocks",
  slitherwing: "slither-wing",
  roaringmoon: "roaring-moon",
  walkingwake: "walking-wake",
  gougingfire: "gouging-fire",
  ragingbolt: "raging-bolt",
  chienpao: "chien-pao",
  chiyu: "chi-yu",
  tinglu: "ting-lu",
  wochien: "wo-chien",
  nidoranf: "nidoran-f",
  nidoranm: "nidoran-m",
  porygonz: "porygon-z",
  "urshifu-rapidstrike": "urshifu-rapid-strike",
  "necrozma-duskmane": "necrozma-dusk-mane",
  "necrozma-dawnwings": "necrozma-dawn-wings",
  "oricorio-pompom": "oricorio-pom-pom",
  "tauros-paldeacombat": "tauros-paldean-combat",
  "tauros-paldeablaze": "tauros-paldean-blaze",
  "tauros-paldeaaqua": "tauros-paldean-aqua",
  "darmanitan-galarzen": "darmanitan-galarian-zen",
};

/**
 * Normalises a species/forme name to one upstream's own file-naming
 * convention. Pure, total, and guaranteed to return `[a-z0-9-]+` (or `""`
 * for input with no usable characters) — the caller may safely place the
 * result in a URL path segment.
 */
export function normaliseForUpstream(species: string, upstream: SpriteUpstream): string {
  const base = baseSlug(species);
  if (!base) return "";

  const canonical = Object.prototype.hasOwnProperty.call(CANONICAL_ALIASES, base)
    ? (CANONICAL_ALIASES[base] ?? base)
    : base;

  // `resolveSlug` already encodes Showdown's convention (hyphen squashing,
  // mega X/Y, regional truncation) and is exercised by its own test file —
  // reuse it rather than forking a second copy that can drift.
  const showdown = resolveSlug(canonical);

  if (upstream === "showdown") return showdown;

  // ── PokemonDB ──
  let db = Object.prototype.hasOwnProperty.call(POKEMONDB_UNSQUASHED, showdown)
    ? (POKEMONDB_UNSQUASHED[showdown] ?? showdown)
    : showdown;

  // Regional suffixes: Showdown's `-alola` is PokemonDB's `-alolan`.
  db = db.replace(/-(alola|galar|hisui|paldea)(?=$|-)/, (_m, region: string) =>
    `-${REGIONAL_LONG_FORM[region] ?? region}`,
  );

  return db;
}

// ─── Chain construction ──────────────────────────────────────────────

export interface SpriteChainOptions {
  /** Prefer an animated GIF as the first link. */
  animated?: boolean;
  shiny?: boolean;
}

function pushUnique(urls: string[], url: string): void {
  if (!urls.includes(url)) urls.push(url);
}

/**
 * Ordered, finite fallback chain for a species.
 *
 * Order (each link a DIFFERENT sprite set, never the same URL twice):
 *   1. Showdown animated GIF   — only when animated was asked for and the
 *                                species actually has one
 *   2. Showdown HOME PNG       — the Pokemon HOME renders, best forme coverage
 *   3. PokemonDB HOME PNG      — independent HOME mirror, different naming;
 *                                covers formes Showdown is late to add
 *   4. Showdown gen5 PNG       — broadest retro pixel coverage
 *   5. Showdown substitute PNG — terminal; always renders
 *
 * The list is bounded at five entries and always ends on
 * `SHOWDOWN_SUBSTITUTE_URL`, so a caller walking it can never loop.
 */
export function buildSpriteFallbackChain(
  species: string,
  opts: SpriteChainOptions = {},
): string[] {
  const psSlug = normaliseForUpstream(species, "showdown");
  const dbSlug = normaliseForUpstream(species, "pokemondb");
  const shiny = opts.shiny === true;
  const urls: string[] = [];

  // An unusable species name (empty, punctuation-only) short-circuits to the
  // terminal rather than emitting `.../.png`.
  if (!psSlug) return [SHOWDOWN_SUBSTITUTE_URL];

  // Some species never got an animated GIF (Treasures of Ruin) — asking for
  // one just burns an upstream round-trip on a guaranteed 404.
  if (opts.animated === true && !STATIC_ONLY_SLUGS.has(psSlug)) {
    pushUnique(urls, `${SHOWDOWN_BASE}/${shiny ? "ani-shiny" : "ani"}/${psSlug}.gif`);
  }

  pushUnique(urls, `${SHOWDOWN_BASE}/${shiny ? "home-shiny" : "home"}/${psSlug}.png`);

  if (dbSlug) {
    pushUnique(urls, `${POKEMONDB_BASE}/home/${shiny ? "shiny" : "normal"}/${dbSlug}.png`);
  }

  pushUnique(urls, `${SHOWDOWN_BASE}/${shiny ? "gen5-shiny" : "gen5"}/${psSlug}.png`);
  pushUnique(urls, SHOWDOWN_SUBSTITUTE_URL);

  return urls;
}

/**
 * Chain for a caller that already has a concrete primary URL (the `u=` form
 * of `/api/sprite`, used by the html2canvas export paths).
 *
 * The primary is preserved verbatim so the common case — a species whose
 * primary sprite exists — is served from the primary with no extra upstream
 * request. Only if it fails do we continue with the species-derived chain.
 *
 * `species` is optional because older callers only pass `u`; without it we
 * recover a slug from the primary's filename, which keeps the Showdown links
 * usable (a Showdown slug is not a PokemonDB slug, so the PokemonDB link is
 * only added when a real species name is supplied).
 */
export function buildChainForPrimaryUrl(
  primaryUrl: string,
  species: string | null,
  opts: SpriteChainOptions = {},
): string[] {
  const chain: string[] = [primaryUrl];

  if (species) {
    for (const url of buildSpriteFallbackChain(species, opts)) pushUnique(chain, url);
    return chain;
  }

  // Derive a Showdown slug from `<...>/sprites/<folder>/<slug>.<ext>`.
  const filename = primaryUrl.slice(primaryUrl.lastIndexOf("/") + 1);
  const slug = filename.replace(/\.(png|gif)$/, "");
  if (/^[a-z0-9-]+$/.test(slug) && slug !== "substitute") {
    pushUnique(chain, `${SHOWDOWN_BASE}/home/${slug}.png`);
    pushUnique(chain, `${SHOWDOWN_BASE}/gen5/${slug}.png`);
  }
  pushUnique(chain, SHOWDOWN_SUBSTITUTE_URL);

  return chain;
}

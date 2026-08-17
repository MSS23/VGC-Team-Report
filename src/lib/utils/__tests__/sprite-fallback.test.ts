import { describe, it, expect } from "vitest";
import {
  normaliseForUpstream,
  buildSpriteFallbackChain,
  buildChainForPrimaryUrl,
  isAllowedSpriteUrl,
  SPRITE_UPSTREAM_HOSTS,
  SHOWDOWN_SUBSTITUTE_URL,
} from "@/lib/utils/sprite-fallback";

/**
 * VGC-232 regression cover.
 *
 * The bug: PokePaste (and anything reusing its URL scheme) 404s on DLC
 * formes — Zygarde-10%, Zygarde-Complete, Sirfetch'd, Ash-Greninja — because
 * their file names differ per CDN. These tests pin the per-upstream spelling
 * of exactly those four plus ordinary species, because a wrong slug fails
 * SILENTLY (another 404, another fallback hop) and would otherwise rot
 * unnoticed.
 */

const ALLOWED_HOSTS = Object.values(SPRITE_UPSTREAM_HOSTS);

describe("normaliseForUpstream — the four broken formes", () => {
  const CASES: Array<[string, string, string]> = [
    // species,            showdown,          pokemondb
    ["Zygarde-10%", "zygarde-10", "zygarde-10"],
    ["Zygarde-Complete", "zygarde-complete", "zygarde-complete"],
    ["Sirfetch'd", "sirfetchd", "sirfetchd"],
    ["Ash-Greninja", "greninja-ash", "greninja-ash"],
  ];

  it.each(CASES)("%s -> showdown %s / pokemondb %s", (species, showdown, pokemondb) => {
    expect(normaliseForUpstream(species, "showdown")).toBe(showdown);
    expect(normaliseForUpstream(species, "pokemondb")).toBe(pokemondb);
  });

  it("handles the typographic apostrophe Showdown actually exports", () => {
    expect(normaliseForUpstream("Sirfetch’d", "showdown")).toBe("sirfetchd");
    expect(normaliseForUpstream("Farfetch’d", "showdown")).toBe("farfetchd");
  });

  it("drops the percent sign rather than turning it into a separator", () => {
    // "zygarde-10-" (a trailing hyphen) was the original PokePaste failure.
    expect(normaliseForUpstream("Zygarde-10%", "showdown")).not.toContain("%");
    expect(normaliseForUpstream("Zygarde-10%", "showdown")).not.toMatch(/-$/);
  });

  it("accepts Showdown's own spelling of Ash-Greninja unchanged", () => {
    expect(normaliseForUpstream("Greninja-Ash", "showdown")).toBe("greninja-ash");
    expect(normaliseForUpstream("Greninja-Ash", "pokemondb")).toBe("greninja-ash");
  });
});

describe("normaliseForUpstream — ordinary species", () => {
  it.each([
    ["Incineroar", "incineroar", "incineroar"],
    ["Flutter Mane", "fluttermane", "flutter-mane"],
    ["Ho-Oh", "hooh", "ho-oh"],
    ["Mr. Mime", "mrmime", "mr-mime"],
    ["Tapu Koko", "tapukoko", "tapu-koko"],
    ["Urshifu-Rapid-Strike", "urshifu-rapidstrike", "urshifu-rapid-strike"],
  ])("%s -> showdown %s / pokemondb %s", (species, showdown, pokemondb) => {
    expect(normaliseForUpstream(species, "showdown")).toBe(showdown);
    expect(normaliseForUpstream(species, "pokemondb")).toBe(pokemondb);
  });

  it("expands regional suffixes for PokemonDB but not for Showdown", () => {
    expect(normaliseForUpstream("Slowbro-Galar", "showdown")).toBe("slowbro-galar");
    expect(normaliseForUpstream("Slowbro-Galar", "pokemondb")).toBe("slowbro-galarian");
    expect(normaliseForUpstream("Raichu-Alola", "pokemondb")).toBe("raichu-alolan");
    expect(normaliseForUpstream("Wooper-Paldea", "pokemondb")).toBe("wooper-paldean");
  });

  it("does not double-expand an already-expanded regional suffix", () => {
    expect(normaliseForUpstream("Tauros-Paldea-Combat", "pokemondb")).toBe(
      "tauros-paldean-combat",
    );
  });
});

describe("normaliseForUpstream — output is always path-safe", () => {
  const HOSTILE = [
    "../../etc/passwd",
    "..%2f..%2fadmin",
    "evil.com/x",
    "a?b=c#d",
    "http://169.254.169.254/latest/meta-data",
    "Pikachu/../../secret",
    "  ",
    "",
    "@@@",
  ];

  it.each(HOSTILE)("sanitises %o to a bare slug", (input) => {
    for (const upstream of ["showdown", "pokemondb"] as const) {
      const slug = normaliseForUpstream(input, upstream);
      expect(slug).toMatch(/^[a-z0-9-]*$/);
      expect(slug).not.toContain("/");
      expect(slug).not.toContain("..");
      expect(slug).not.toContain(":");
    }
  });
});

describe("buildSpriteFallbackChain", () => {
  it("is ordered, finite and always terminates on the substitute", () => {
    for (const species of ["Incineroar", "Zygarde-10%", "Ash-Greninja", "Sirfetch'd"]) {
      const chain = buildSpriteFallbackChain(species, { animated: true });
      expect(chain.length).toBeGreaterThan(1);
      expect(chain.length).toBeLessThanOrEqual(5);
      expect(chain[chain.length - 1]).toBe(SHOWDOWN_SUBSTITUTE_URL);
      // No repeats — a repeated link is a wasted upstream round-trip and, if
      // a caller ever loops on failure, an infinite one.
      expect(new Set(chain).size).toBe(chain.length);
    }
  });

  it("orders primary -> Pokemon HOME -> PokemonDB HOME -> gen5 -> substitute", () => {
    expect(buildSpriteFallbackChain("Ash-Greninja", { animated: true })).toEqual([
      "https://play.pokemonshowdown.com/sprites/ani/greninja-ash.gif",
      "https://play.pokemonshowdown.com/sprites/home/greninja-ash.png",
      "https://img.pokemondb.net/sprites/home/normal/greninja-ash.png",
      "https://play.pokemonshowdown.com/sprites/gen5/greninja-ash.png",
      SHOWDOWN_SUBSTITUTE_URL,
    ]);
  });

  it("leads with the HOME PNG when animation was not requested", () => {
    const chain = buildSpriteFallbackChain("Zygarde-Complete");
    expect(chain[0]).toBe(
      "https://play.pokemonshowdown.com/sprites/home/zygarde-complete.png",
    );
    expect(chain.some((u) => u.endsWith(".gif"))).toBe(false);
  });

  it("skips the animated attempt for species with no GIF (Treasures of Ruin)", () => {
    const chain = buildSpriteFallbackChain("Chien-Pao", { animated: true });
    expect(chain.some((u) => u.includes("/ani/"))).toBe(false);
    expect(chain[0]).toBe("https://play.pokemonshowdown.com/sprites/home/chienpao.png");
  });

  it("uses the shiny folders on every upstream when shiny is requested", () => {
    const chain = buildSpriteFallbackChain("Incineroar", { animated: true, shiny: true });
    expect(chain).toContain("https://play.pokemonshowdown.com/sprites/ani-shiny/incineroar.gif");
    expect(chain).toContain("https://play.pokemonshowdown.com/sprites/home-shiny/incineroar.png");
    expect(chain).toContain("https://img.pokemondb.net/sprites/home/shiny/incineroar.png");
  });

  it("returns only the substitute for an unusable species name", () => {
    expect(buildSpriteFallbackChain("")).toEqual([SHOWDOWN_SUBSTITUTE_URL]);
    expect(buildSpriteFallbackChain("   ")).toEqual([SHOWDOWN_SUBSTITUTE_URL]);
  });

  it("only ever emits allowlisted, fetchable URLs", () => {
    for (const species of [
      "Zygarde-10%",
      "Zygarde-Complete",
      "Sirfetch'd",
      "Ash-Greninja",
      "Incineroar",
      "Flutter Mane",
      "../../etc/passwd",
      "http://169.254.169.254/",
    ]) {
      for (const url of buildSpriteFallbackChain(species, { animated: true, shiny: true })) {
        expect(ALLOWED_HOSTS).toContain(new URL(url).hostname);
        expect(isAllowedSpriteUrl(url)).toBe(true);
      }
    }
  });
});

describe("buildChainForPrimaryUrl", () => {
  const PRIMARY = "https://play.pokemonshowdown.com/sprites/ani/greninja-ash.gif";

  it("keeps the caller's primary first so a working sprite costs one request", () => {
    expect(buildChainForPrimaryUrl(PRIMARY, "Ash-Greninja", { animated: true })[0]).toBe(
      PRIMARY,
    );
  });

  it("continues with the species chain and never repeats the primary", () => {
    const chain = buildChainForPrimaryUrl(PRIMARY, "Ash-Greninja", { animated: true });
    expect(new Set(chain).size).toBe(chain.length);
    expect(chain).toContain("https://img.pokemondb.net/sprites/home/normal/greninja-ash.png");
    expect(chain[chain.length - 1]).toBe(SHOWDOWN_SUBSTITUTE_URL);
  });

  it("recovers Showdown fallbacks from the filename when no species is given", () => {
    expect(
      buildChainForPrimaryUrl(
        "https://play.pokemonshowdown.com/sprites/ani/zygarde-10.gif",
        null,
      ),
    ).toEqual([
      "https://play.pokemonshowdown.com/sprites/ani/zygarde-10.gif",
      "https://play.pokemonshowdown.com/sprites/home/zygarde-10.png",
      "https://play.pokemonshowdown.com/sprites/gen5/zygarde-10.png",
      SHOWDOWN_SUBSTITUTE_URL,
    ]);
  });

  it("terminates on the substitute even when the primary IS the substitute", () => {
    const chain = buildChainForPrimaryUrl(SHOWDOWN_SUBSTITUTE_URL, null);
    expect(chain).toEqual([SHOWDOWN_SUBSTITUTE_URL]);
  });
});

describe("isAllowedSpriteUrl — SSRF boundary", () => {
  it("accepts the allowlisted sprite hosts", () => {
    expect(
      isAllowedSpriteUrl("https://play.pokemonshowdown.com/sprites/home/incineroar.png"),
    ).toBe(true);
    expect(
      isAllowedSpriteUrl("https://img.pokemondb.net/sprites/home/normal/ho-oh.png"),
    ).toBe(true);
  });

  it.each([
    // Not on the allowlist at all
    "https://evil.tld/sprites/home/x.png",
    // Suffix-matching attack on the allowlist
    "https://play.pokemonshowdown.com.evil.tld/sprites/home/x.png",
    // Subdomain is not the allowlisted host
    "https://evil.play.pokemonshowdown.com/sprites/home/x.png",
    // Cloud metadata / link-local
    "http://169.254.169.254/latest/meta-data",
    "https://169.254.169.254/sprites/home/x.png",
    // Internal targets
    "https://localhost/sprites/home/x.png",
    "http://127.0.0.1:8080/sprites/home/x.png",
    // Non-https schemes
    "http://play.pokemonshowdown.com/sprites/home/x.png",
    "file:///etc/passwd",
    "data:image/png;base64,AAAA",
    // Credentials smuggled into the authority
    "https://play.pokemonshowdown.com@evil.tld/sprites/home/x.png",
    "https://user:pass@play.pokemonshowdown.com/sprites/home/x.png",
    // Explicit port
    "https://play.pokemonshowdown.com:8080/sprites/home/x.png",
    // Outside the permitted path prefix
    "https://play.pokemonshowdown.com/admin/secret.png",
    // Traversal / encoding tricks
    "https://play.pokemonshowdown.com/sprites/../admin/secret.png",
    "https://play.pokemonshowdown.com/sprites/home/%2e%2e%2fadmin.png",
    // Non-image extension
    "https://play.pokemonshowdown.com/sprites/home/x.svg",
    "https://play.pokemonshowdown.com/sprites/home/x.php",
    // Garbage
    "not a url",
    "",
  ])("rejects %o", (url) => {
    expect(isAllowedSpriteUrl(url)).toBe(false);
  });
});

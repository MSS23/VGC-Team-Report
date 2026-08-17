/**
 * pkmn-dex-fallback lazy-split suite — VGC-271.
 *
 * VGC-257 shrank `dex-subset.json` from 331,481 to 129,858 bytes but left it
 * STATICALLY imported from the client graph, so it stayed in the eager
 * script+preload set of `/` and `/compare`. VGC-271 split the module:
 *
 *   pkmn-dex-fallback.impl.ts    holds the static `dex-subset` import
 *   pkmn-dex-fallback.ts         a sync façade that reaches the impl by import()
 *   pkmn-dex-fallback.server.ts  registers the impl synchronously (server/tests)
 *
 * Two things can silently undo that:
 *   1. someone re-adds a static `dex-subset` import to a client-reachable
 *      module (the byte-level guard below), or
 *   2. the client gate stops covering a case, so an uncommon species renders
 *      as an empty card during the load window (the gate tests below).
 *
 * `vitest.setup.ts` registers the impl globally, mirroring the server runtime;
 * these tests use `vi.resetModules()` to get a fresh, *un*-registered façade
 * and observe the client's pre-load window on purpose.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(__dirname, "..", "..", "..");

describe("pkmn-dex-fallback — the eager import must not come back", () => {
  /**
   * The whole point of the ticket. These modules are reachable from
   * `"use client"` components, so a static `dex-subset` import in any of them
   * pins 129,858 bytes into the first-paint chunk again.
   */
  const CLIENT_REACHABLE = [
    "lib/data/pkmn-dex-fallback.ts",
    "lib/data/pokemon.ts",
    "lib/utils/mega-detect.ts",
    "lib/validation/champions-legality.ts",
    "lib/data/dex-fallback-gate.ts",
  ];

  for (const rel of CLIENT_REACHABLE) {
    it(`${rel} does not statically import the dex subset`, () => {
      const source = readFileSync(join(SRC, rel), "utf8");
      const staticImports = source
        .split("\n")
        .filter((line) => /^\s*import\b/.test(line) && !/^\s*import\s+type\b/.test(line));
      const offending = staticImports.filter((line) =>
        /["']([^"']*\/)?dex-subset(\.json)?["']/.test(line),
      );
      expect(offending).toEqual([]);
    });
  }

  it("only the impl and the InlinePokemonEditor reach dex-subset statically", () => {
    // The editor is already behind next/dynamic (PokemonCard), so its copy
    // lives in its own on-demand chunk.
    const impl = readFileSync(join(SRC, "lib/data/pkmn-dex-fallback.impl.ts"), "utf8");
    expect(impl).toMatch(/from\s+["']@\/lib\/data\/dex-subset["']/);
  });

  it("the server registration module is imported by both sync server consumers", () => {
    const instrumentation = readFileSync(join(SRC, "instrumentation.ts"), "utf8");
    const megaPage = readFileSync(join(SRC, "app/champions/[pokemon]/page.tsx"), "utf8");
    expect(instrumentation).toContain("pkmn-dex-fallback.server");
    expect(megaPage).toContain("pkmn-dex-fallback.server");
  });
});

describe("pkmn-dex-fallback — the façade's pre-load window", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("answers null before the chunk loads and real data after", async () => {
    const fallback = await import("@/lib/data/pkmn-dex-fallback");

    expect(fallback.isDexFallbackReady()).toBe(false);
    // Clefable-Mega is deliberately absent from the hand-maintained static map.
    expect(fallback.lookupPokemonFromDex("Clefable-Mega")).toBeNull();

    await fallback.loadDexFallback();

    expect(fallback.isDexFallbackReady()).toBe(true);
    expect(fallback.lookupPokemonFromDex("Clefable-Mega")?.name).toBe("Clefable-Mega");
    expect(fallback.getMegaEntryFromDex("Clefable-Mega")?.dataKey).toBe("clefable-mega");
    expect(fallback.detectMegaFromItemDex("Clefablite", "Clefable")?.dataKey).toBe(
      "clefable-mega",
    );
    expect(fallback.getDexBaseSpecies("Rotom-Wash")).toBe("Rotom");
  });

  it("registerDexFallback installs the impl synchronously (the server path)", async () => {
    const fallback = await import("@/lib/data/pkmn-dex-fallback");
    expect(fallback.isDexFallbackReady()).toBe(false);

    await import("@/lib/data/pkmn-dex-fallback.server");

    expect(fallback.isDexFallbackReady()).toBe(true);
    expect(fallback.lookupPokemonFromDex("Clefable-Mega")?.name).toBe("Clefable-Mega");
  });

  it("says 'not a Mega' / 'not a stone' without fetching the chunk", async () => {
    const fallback = await import("@/lib/data/pkmn-dex-fallback");

    expect(fallback.getMegaEntryFromDex("Incineroar")).toBeNull();
    expect(fallback.detectMegaFromItemDex("Leftovers", "Incineroar")).toBeNull();
    expect(fallback.detectMegaFromItemDex(null, "Incineroar")).toBeNull();
    // Still un-loaded: none of the above may have triggered the import().
    expect(fallback.isDexFallbackReady()).toBe(false);
  });
});

describe("dex-fallback-gate — decides when a team may render", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const mon = (species: string, item: string | null = null) => ({ species, item });

  it("lets an all-meta team through without loading the chunk", async () => {
    const { teamNeedsDexFallback } = await import("@/lib/data/dex-fallback-gate");
    const fallback = await import("@/lib/data/pkmn-dex-fallback");

    expect(
      teamNeedsDexFallback([
        mon("Incineroar", "Assault Vest"),
        mon("Rillaboom", "Miracle Seed"),
        mon("Urshifu-Rapid-Strike", "Mystic Water"),
        mon("Chi-Yu", "Choice Scarf"),
        mon("Amoonguss", "Rocky Helmet"),
        mon("Chien-Pao", "Focus Sash"),
      ]),
    ).toBe(false);
    expect(fallback.isDexFallbackReady()).toBe(false);
  });

  it("holds a team back when a species only the dex knows is present", async () => {
    const { teamNeedsDexFallback } = await import("@/lib/data/dex-fallback-gate");
    expect(teamNeedsDexFallback([mon("Incineroar"), mon("Clefable-Mega")])).toBe(true);
  });

  it("holds a team back when two members could be the same species (Species Clause)", async () => {
    const { teamNeedsDexFallback } = await import("@/lib/data/dex-fallback-gate");
    // Rotom-Wash + Rotom-Heat share dex #479; collapsing them needs the subset.
    expect(teamNeedsDexFallback([mon("Rotom-Wash"), mon("Rotom-Heat")])).toBe(true);
  });

  it("is always false once the fallback is registered (server + post-load)", async () => {
    const { teamNeedsDexFallback } = await import("@/lib/data/dex-fallback-gate");
    await import("@/lib/data/pkmn-dex-fallback.server");
    expect(teamNeedsDexFallback([mon("Clefable-Mega"), mon("Rotom-Wash"), mon("Rotom-Heat")])).toBe(
      false,
    );
  });
});

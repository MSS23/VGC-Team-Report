import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Tripwire for the /compare bundle-size fix (VGC-257 follow-up, 2026-08-24).
 *
 * VGC-257 got the Pokémon data tables (pokemon.ts ~243KB + dex-subset.json
 * ~130KB raw, ~73 kB gzip) off the homepage's first load, but the same weight
 * regressed onto /compare, which statically imported `@/lib/data/pokemon` and
 * `@/lib/utils/mega-detect`. That work now lives in the lazily-imported
 * `./analyze-compare-paste` chunk, pulled in only when somebody actually
 * compares two teams.
 *
 * This scans the two files on /compare's eager import graph for static
 * imports of the heavy modules. It is a file-level tripwire, not a full graph
 * analysis — if it fires, someone re-added a static import; if you add a NEW
 * eager import to these files, make sure it doesn't transitively reach
 * @/lib/data/pokemon or @/lib/data/dex-subset.
 */

const SRC = join(__dirname, "..", "..", "..");

const EAGER_COMPARE_FILES = [
  "app/compare/page.tsx",
  "components/compare/CompareContent.tsx",
];

const FORBIDDEN_STATIC_IMPORTS = [
  "@/lib/data/pokemon",
  "@/lib/data/dex-subset",
  "@/lib/data/pkmn-dex-fallback",
  "@/lib/parser/showdown-parser",
  "@/lib/analysis/analyze-team",
  "@/lib/utils/mega-detect",
  "./analyze-compare-paste",
  "@/components/compare/analyze-compare-paste",
];

/**
 * Static `import ... from "x"` / `export ... from "x"`. Dynamic `import("x")`
 * is the sanctioned lazy path and is allowed, as is `import type`, which is
 * erased at compile time and ships no runtime code.
 */
function staticValueImports(source: string): string[] {
  return [...source.matchAll(/^\s*(?:import|export)\s+(?!type\s)[^;]*?from\s+["']([^"']+)["']/gm)]
    .map((m) => m[1]);
}

describe("/compare eager import graph stays free of heavy data modules", () => {
  for (const file of EAGER_COMPARE_FILES) {
    it(`${file} has no static import of the heavy modules`, () => {
      const source = readFileSync(join(SRC, file), "utf8");
      const offending = staticValueImports(source).filter((spec) =>
        FORBIDDEN_STATIC_IMPORTS.includes(spec),
      );
      expect(offending, `${file} statically imports: ${offending.join(", ")}`).toEqual([]);
    });
  }

  it("CompareContent loads the analyzer through a dynamic import()", () => {
    const source = readFileSync(join(SRC, "components/compare/CompareContent.tsx"), "utf8");
    expect(source).toMatch(/import\(\s*["']\.\/analyze-compare-paste["']\s*\)/);
  });
});

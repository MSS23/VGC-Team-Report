import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Tripwire for the homepage bundle-size refactor (2026-08-23).
 *
 * The paste screen must not eagerly ship the Pokémon data tables
 * (pokemon.ts ~246KB + dex-subset.json ~130KB) or the parser/analysis
 * layer. That work lives in the lazily-imported analyze-team / mega-detect /
 * detect-* chunks, loaded only when a team is actually analyzed.
 *
 * This scans the three files on the homepage's eager import graph for
 * static imports of the heavy modules. It is a file-level tripwire, not a
 * full graph analysis — if it fires, someone re-added a static import; if
 * you add a NEW eager import to these files, make sure it doesn't
 * transitively reach @/lib/data/pokemon or @/lib/data/dex-subset.
 */

const ROOT = join(__dirname, "..", "..");

const EAGER_HOMEPAGE_FILES = [
  "app/page.tsx",
  "hooks/useHomePage.ts",
  "hooks/useTeamReport.ts",
];

const FORBIDDEN_STATIC_IMPORTS = [
  "@/lib/data/pokemon",
  "@/lib/data/dex-subset",
  "@/lib/data/pkmn-dex-fallback",
  "@/lib/parser/showdown-parser",
  "@/lib/analysis/analyze-team",
  "@/lib/analysis/detect-archetype",
  "@/lib/analysis/detect-regulation",
  "@/lib/utils/mega-detect",
];

describe("homepage eager import graph stays free of heavy data modules", () => {
  for (const file of EAGER_HOMEPAGE_FILES) {
    it(`${file} has no static import of the heavy modules`, () => {
      const source = readFileSync(join(ROOT, file), "utf8");
      // Static: `import ... from "x"` / `export ... from "x"`.
      // Dynamic `import("x")` is the sanctioned lazy path and is allowed.
      const staticImports = [...source.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/gm)]
        .map((m) => m[1]);
      const offending = staticImports.filter((spec) => FORBIDDEN_STATIC_IMPORTS.includes(spec));
      expect(offending, `${file} statically imports: ${offending.join(", ")}`).toEqual([]);
    });
  }
});

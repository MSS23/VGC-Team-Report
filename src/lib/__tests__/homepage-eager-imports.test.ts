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
  "components/home/HomePageServer.tsx",
  "components/home/HomePageClient.tsx",
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

/**
 * Tripwire for the move-name catalogue (VGC-303, 2026-10-19).
 *
 * `@/lib/data/move-names` is a ~127KB generated table of localised move
 * names. It used to be a static import in translate-move.ts, so every chunk
 * that rendered a move label shipped it — the whole report view, for every
 * user, even though only the six non-English languages can read it. It now
 * loads through a dynamic `import()` inside `loadMoveNames()`.
 *
 * Listed below are translate-move.ts plus its direct consumers; none of them
 * may reach the table statically. Types come in via type-position
 * `import()` (`typeof import("...").MOVE_NAMES`), which is erased at build
 * time and deliberately not matched here.
 */
const MOVE_NAME_CONSUMERS = [
  "lib/utils/translate-move.ts",
  "components/report/PokemonCard.tsx",
  "components/report/TournamentMode.tsx",
  "components/report/OffensiveCoverageChart.tsx",
  "components/report/pokemon-detail/MovesPanel.tsx",
  "components/ui/OTSSheetModal.tsx",
];

const FORBIDDEN_MOVE_NAME_IMPORT = "@/lib/data/move-names";

// Static: `import ... from "x"` / `export ... from "x"`.
// Dynamic `import("x")` is the sanctioned lazy path and is allowed.
function staticImportSpecifiers(source: string): string[] {
  return [...source.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
}

describe("homepage eager import graph stays free of heavy data modules", () => {
  for (const file of EAGER_HOMEPAGE_FILES) {
    it(`${file} has no static import of the heavy modules`, () => {
      const source = readFileSync(join(ROOT, file), "utf8");
      const offending = staticImportSpecifiers(source)
        .filter((spec) => FORBIDDEN_STATIC_IMPORTS.includes(spec));
      expect(offending, `${file} statically imports: ${offending.join(", ")}`).toEqual([]);
    });
  }
});

describe("move-name catalogue stays behind a dynamic import", () => {
  for (const file of MOVE_NAME_CONSUMERS) {
    it(`${file} has no static import of ${FORBIDDEN_MOVE_NAME_IMPORT}`, () => {
      const source = readFileSync(join(ROOT, file), "utf8");
      const offending = staticImportSpecifiers(source)
        .filter((spec) => spec === FORBIDDEN_MOVE_NAME_IMPORT || spec.endsWith("/data/move-names"));
      expect(offending, `${file} statically imports: ${offending.join(", ")}`).toEqual([]);
    });
  }

  it("translate-move.ts still loads the catalogue lazily", () => {
    const source = readFileSync(join(ROOT, "lib/utils/translate-move.ts"), "utf8");
    // A real (non type-position) dynamic import must still be present —
    // otherwise the lazy path was deleted rather than kept.
    expect(source).toMatch(/(?<!typeof\s)import\("@\/lib\/data\/move-names"\)/);
  });
});

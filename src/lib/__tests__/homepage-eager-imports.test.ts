import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

/**
 * Transitive tripwire for the bundle-size refactors on the two heaviest
 * entry points: the homepage paste screen (2026-08-23) and `/compare`
 * (VGC-293-REDO, 2026-11-02).
 *
 * Neither screen may *eagerly* ship the Pokémon data tables
 * (`pokemon.ts` ~246 KB + `dex-subset.json` ~130 KB + `mega-pokemon.ts`
 * ~37 KB — 81 KB gzipped between them). That work belongs in the lazily
 * imported analyze-team / mega-detect / effective-form chunks, loaded only
 * when a team is actually analyzed or compared.
 *
 * ## Why this walks the graph
 *
 * The previous version of this test was **file-level**: it looked at the
 * direct imports of each entry file and nothing else. VGC-293 defeated it
 * with a single hop — `CompareContent.tsx` stopped importing
 * `@/lib/data/pokemon` and `@/lib/utils/mega-detect` directly and imported
 * the new `@/lib/utils/effective-form` instead, whose own first two lines
 * import exactly those two modules. Same chunks, same 81 KB gz, green test.
 *
 * So this version resolves and follows every *static* import, through any
 * number of hops, and fails with the offending chain spelled out. A
 * dynamic `import()` is a boundary and is never followed: lazy-loading is
 * the sanctioned fix, not the regression.
 */

/** `src/` — this file lives at `src/lib/__tests__/`. */
const SRC = join(__dirname, "..", "..");

/**
 * Entry points whose eager import graph is guarded.
 *
 * Everything reachable from these without crossing a dynamic `import()`
 * boundary is First Load JS for its route.
 */
const EAGER_ENTRY_FILES = [
  // Homepage paste screen
  "app/page.tsx",
  "components/home/HomePageServer.tsx",
  "components/home/HomePageClient.tsx",
  "hooks/useHomePage.ts",
  "hooks/useTeamReport.ts",
  // /compare (VGC-293-REDO)
  "app/compare/page.tsx",
  "components/compare/CompareContent.tsx",
];

/**
 * Modules that must never be reachable eagerly from any entry above, at any
 * depth. Paths are relative to `src/`, without extension.
 */
const FORBIDDEN_MODULES = [
  "lib/data/pokemon",
  "lib/data/dex-subset",
  "lib/data/pkmn-dex-fallback",
  "lib/data/mega-pokemon",
  "lib/utils/mega-detect",
];

/**
 * Additionally forbidden on the homepage only. `/compare` legitimately
 * parses pastes on the client, but the homepage defers the whole
 * parser/analysis layer.
 */
const FORBIDDEN_HOMEPAGE_ONLY = [
  "lib/parser/showdown-parser",
  "lib/analysis/analyze-team",
  "lib/analysis/detect-archetype",
  "lib/analysis/detect-regulation",
];

const HOMEPAGE_ENTRIES = new Set([
  "app/page.tsx",
  "components/home/HomePageServer.tsx",
  "components/home/HomePageClient.tsx",
  "hooks/useHomePage.ts",
  "hooks/useTeamReport.ts",
]);

const RESOLVE_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mts", ".json"];
const PARSEABLE = /\.(ts|tsx|js|jsx|mts)$/;

/** `src/`-relative, extensionless id for a resolved file — used for matching. */
function moduleId(absPath: string): string {
  return relative(SRC, absPath).replace(/\\/g, "/").replace(PARSEABLE, "").replace(/\.json$/, "");
}

/**
 * Resolve an import specifier the way the bundler does.
 *
 * Handles the `@/*` → `./src/*` alias from `tsconfig.json` `paths`, relative
 * specifiers, implicit `.ts`/`.tsx`/`.js`/`.json` extensions and `index.*`
 * directory entries. Bare package specifiers resolve to `node_modules` and
 * are out of scope, so they return `null` and end the walk on that edge.
 */
function resolveSpecifier(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = resolve(dirname(fromFile), spec);
  else return null;

  for (const ext of RESOLVE_EXTENSIONS) {
    const candidate = base + ext;
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      /* not a file — try the next candidate */
    }
  }
  for (const ext of RESOLVE_EXTENSIONS.filter(Boolean)) {
    const candidate = join(base, `index${ext}`);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      /* not a file — try the next candidate */
    }
  }
  return null;
}

/**
 * Strip comments so commented-out imports (and doc comments that quote
 * import lines — `src/lib/data/dex-subset.ts` has one) are not mistaken for
 * real edges. Line comments are only stripped when they start the line, so
 * `"https://…"` inside a string survives.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*\/\//.test(line))
    .join("\n");
}

/**
 * Every *eager* import specifier in a source file.
 *
 * Included: `import x from "m"`, `export … from "m"`, bare side-effect
 * `import "m"`.
 * Excluded (erased at compile time or lazy at runtime, so not First Load JS):
 * `import type … from "m"`, `export type … from "m"`, an import clause whose
 * every binding is `type`-prefixed, and any dynamic `import("m")` —
 * including the `typeof import("m")` type query.
 */
function eagerImports(source: string): string[] {
  const code = stripComments(source);
  const specs: string[] = [];

  // `import <clause> from "m"` / `export <clause> from "m"`.
  // `[^;]*?` cannot span a `;`, so it never runs past one statement, and the
  // required `from` keyword excludes every `import(...)` call expression.
  for (const m of code.matchAll(/^\s*(import|export)\s([^;]*?)\sfrom\s+["']([^"']+)["']/gm)) {
    const clause = m[2].trim();
    if (/^type\b/.test(clause)) continue; // `import type … ` / `export type … `
    const braced = clause.match(/^\{([\s\S]*)\}$/);
    if (braced) {
      const bindings = braced[1].split(",").map((b) => b.trim()).filter(Boolean);
      // `import { type A, type B } from "m"` is fully erased too.
      if (bindings.length > 0 && bindings.every((b) => /^type\s/.test(b))) continue;
    }
    specs.push(m[3]);
  }

  // Bare side-effect import: `import "m";` (no clause, no `from`).
  for (const m of code.matchAll(/^\s*import\s+["']([^"']+)["']/gm)) specs.push(m[1]);

  return specs;
}

/**
 * Breadth-first walk of the eager import graph from `entryRel`.
 *
 * Returns, for each forbidden module actually reached, the shortest chain to
 * it. BFS gives the shortest chain first; `seen` both terminates import
 * cycles and keeps the walk linear.
 */
function findForbiddenChains(entryRel: string, forbidden: string[]): string[] {
  const entryAbs = join(SRC, entryRel);
  const forbiddenSet = new Set(forbidden);
  const hits = new Map<string, string[]>();
  const seen = new Set<string>([entryAbs]);
  let frontier: { file: string; chain: string[] }[] = [{ file: entryAbs, chain: [entryRel] }];

  while (frontier.length > 0) {
    const next: { file: string; chain: string[] }[] = [];
    for (const { file, chain } of frontier) {
      if (!PARSEABLE.test(file)) continue; // `.json` is a leaf
      const source = readFileSync(file, "utf8");
      for (const spec of eagerImports(source)) {
        const resolved = resolveSpecifier(spec, file);
        if (!resolved) continue; // bare package, or unresolvable — stop here
        const id = moduleId(resolved);
        const nextChain = [...chain, relative(SRC, resolved).replace(/\\/g, "/")];
        if (forbiddenSet.has(id) && !hits.has(id)) hits.set(id, nextChain);
        if (seen.has(resolved)) continue;
        seen.add(resolved);
        next.push({ file: resolved, chain: nextChain });
      }
    }
    frontier = next;
  }

  return [...hits.values()].map((chain) => chain.join(" → "));
}

describe("eager import graphs stay free of the heavy dex modules", () => {
  for (const entry of EAGER_ENTRY_FILES) {
    const forbidden = HOMEPAGE_ENTRIES.has(entry)
      ? [...FORBIDDEN_MODULES, ...FORBIDDEN_HOMEPAGE_ONLY]
      : FORBIDDEN_MODULES;

    it(`${entry} cannot reach a heavy data module through any number of static imports`, () => {
      const chains = findForbiddenChains(entry, forbidden);
      expect(
        chains,
        `${entry} eagerly reaches forbidden module(s) — this is First Load JS:\n  ${chains.join("\n  ")}\n` +
          `Load the offending module with a dynamic import() instead (see loadResolveEffectiveForm in CompareContent.tsx).`,
      ).toEqual([]);
    });
  }

  it("classifies eager vs. lazy/erased imports correctly", () => {
    const source = [
      `import { a } from "./eager-default";`,
      `export { b } from "./eager-reexport";`,
      `import "./eager-side-effect";`,
      `import type { C } from "./type-only";`,
      `export type { D } from "./type-only-reexport";`,
      `import { type E, type F } from "./all-type-bindings";`,
      `const g = await import("./dynamic");`,
      `type H = typeof import("./type-query").thing;`,
      `// import { i } from "./commented-out";`,
    ].join("\n");

    expect(eagerImports(source)).toEqual([
      "./eager-default",
      "./eager-reexport",
      "./eager-side-effect",
    ]);
  });

  it("the walker actually resolves edges (self-check against a known eager chain)", () => {
    // `effective-form.ts` reaches the dex subset via `pokemon.ts` →
    // `pkmn-dex-fallback.ts`. If the resolver or the import regex breaks, this
    // returns [] and every guard above would pass vacuously.
    const chains = findForbiddenChains("lib/utils/effective-form.ts", ["lib/data/dex-subset"]);
    expect(chains).toEqual([
      "lib/utils/effective-form.ts → lib/data/pokemon.ts → lib/data/pkmn-dex-fallback.ts → lib/data/dex-subset.ts",
    ]);
  });
});

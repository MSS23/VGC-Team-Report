import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Makes the `analyze-team.ts` header comment an enforced rule rather than a
 * request.
 *
 * `analyze-team.ts` exists so the parser and the big Pokémon data tables
 * (pokemon.ts + dex-subset.json, ~73 kB gzip) load as ONE lazy chunk. That
 * only holds while every caller reaches it through `await import(...)`: a
 * single static `import { analyzeTeam } from "@/lib/analysis/analyze-team"`
 * anywhere in a client component's eager graph silently folds the whole dex
 * back into that route's first load — which is exactly how the weight
 * regressed onto /compare after VGC-257.
 *
 * `homepage-eager-imports.test.ts` pins three specific homepage files; this
 * one is the repo-wide backstop, so a new route can't reintroduce the problem
 * by importing the module from a file nobody thought to add to a list.
 * Test files may import it statically — they run in node, not the browser.
 */

const SRC = join(__dirname, "..", "..", "..");

const BARRIER_MODULE = "@/lib/analysis/analyze-team";

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("analyze-team stays behind the lazy-import barrier", () => {
  it("no non-test source file statically imports it", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const source = readFileSync(file, "utf8");
      // Static `import ... from "x"` / `export ... from "x"`. Dynamic
      // `import("x")` is the sanctioned lazy path; `import type` is erased.
      const specs = [
        ...source.matchAll(/^\s*(?:import|export)\s+(?!type\s)[^;]*?from\s+["']([^"']+)["']/gm),
      ].map((m) => m[1]);
      if (specs.includes(BARRIER_MODULE)) offenders.push(relative(SRC, file));
    }
    expect(
      offenders,
      `${offenders.join(", ")} statically import ${BARRIER_MODULE}. ` +
        `Use \`await import("${BARRIER_MODULE}")\` from an event handler or effect instead.`,
    ).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Tripwire for the motion-runtime bundle win (VGC-296, 2026-10-12).
 *
 * `ReportCard` renders on /explore, /dashboard, /creator and every one of the
 * 72 SSG champions pages; `MegaLandingContent` is the champions page shell.
 * Both used `motion` for a plain entrance/stat-bar animation, which pulled the
 * motion runtime (~37.5KB gz) into those routes' shared chunk. They now use the
 * CSS utilities in globals.css (`fade-in`, `animate-bar-fill`,
 * `stagger-children`), which also pick up the global prefers-reduced-motion
 * rule for free.
 *
 * This is a file-level tripwire, not a full graph analysis — if it fires,
 * someone re-added a motion import. Reach for the CSS utilities instead, or
 * move the animation into a component that isn't on these routes.
 */

const ROOT = join(__dirname, "..", "..");

const MOTION_FREE_FILES = [
  "components/explore/ReportCard.tsx",
  "app/champions/[pokemon]/MegaLandingContent.tsx",
];

const FORBIDDEN_STATIC_IMPORTS = ["motion", "motion/react", "framer-motion"];

describe("de-motioned components stay free of the motion runtime", () => {
  for (const file of MOTION_FREE_FILES) {
    it(`${file} has no static import of motion`, () => {
      const source = readFileSync(join(ROOT, file), "utf8");
      const staticImports = [...source.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/gm)]
        .map((m) => m[1]);
      const offending = staticImports.filter((spec) => FORBIDDEN_STATIC_IMPORTS.includes(spec));
      expect(offending, `${file} statically imports: ${offending.join(", ")}`).toEqual([]);
    });
  }
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// VGC-246: GET /api/team-graphic is unauthenticated and renders a share row
// as a PNG. It used to select the row by id alone:
//
//   SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL
//
// so any 8-character share ID produced a picture of a *private* team —
// sprites, held items, abilities and Tera types — while GET /api/share/[id]
// correctly 404s the same report for a non-owner. Tiered publishing
// (VGC-142) promises "bytes never leave the API for non-owners"; the PNG
// path broke that promise for every private report, and for the "item"
// field on public reports whose creator had hidden items.
//
// This fix has been written at least five times on branches that were never
// merged (see .swarm/board-reconciliation-21-09-26.md). This test is the
// tripwire that stops it regressing a sixth time.

const ROUTE = join(
  process.cwd(),
  "src",
  "app",
  "api",
  "team-graphic",
  "route.tsx",
);

describe("VGC-246: /api/team-graphic must not render private reports", () => {
  const source = readFileSync(ROUTE, "utf8");

  it("loads the visibility flags alongside the row data", () => {
    const select = source.match(/SELECT[\s\S]*?FROM shares/i)?.[0] ?? "";
    expect(select).toMatch(/is_public/);
    expect(select).toMatch(/is_unlisted/);
  });

  it("refuses a report that is neither public nor unlisted", () => {
    // The same predicate GET /api/share/[id] uses for a non-owner read.
    expect(source).toMatch(/!\s*isPublic\s*&&\s*!\s*isUnlisted/);
  });

  it("redacts the creator's hidden fields before rendering", () => {
    // "item" is a redactable field (PrivateField) and the graphic draws
    // held items, so the paste must pass through redactPasteFields.
    expect(source).toMatch(/redactPasteFields\s*\(/);
    expect(source).toMatch(/normalizePrivateFields\s*\(/);
  });

  it("never parses the paste straight off the row", () => {
    // Guards against a future edit reintroducing the raw read while
    // leaving the redaction helper imported but unused.
    expect(source).not.toMatch(/parseTeamForGraphic\(\s*\(?data\.paste/);
  });
});

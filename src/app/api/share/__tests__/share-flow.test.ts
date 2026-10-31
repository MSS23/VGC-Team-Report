/**
 * Integration tests for the shares INSERT/UPDATE/dedup flow.
 *
 * These tests connect to the real database and verify column-level correctness.
 * Two past regressions motivate this suite:
 *   - 17-05: INSERT column/value mismatch silently corrupted owner_id
 *   - 24-05: dedup SELECT omitted is_unlisted, silently demoting unlisted → private
 *
 * Skipped automatically when DATABASE_URL is not set (e.g. local unit-only runs).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "@/lib/db";
import { extractSpecies } from "@/lib/utils/extract-species";

const SKIP = !process.env.DATABASE_URL;

const SAMPLE_PASTE = `Garchomp @ Life Orb
Ability: Rough Skin
Tera Type: Ground
EVs: 252 Atk / 4 Def / 252 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Protect
- Rock Slide

Flutter Mane @ Choice Specs
Ability: Protosynthesis
Tera Type: Fairy
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Moonblast
- Shadow Ball
- Dazzling Gleam
- Protect`;

const TEST_OWNER = "vitest-share-flow-owner";

const BASE_STATE = {
  paste: SAMPLE_PASTE,
  matchupPlans: [],
  creatorName: "Test Creator",
  teamSummary: "Test summary",
  tournamentName: "Test Regional",
};

function makeId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function makeToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

describe.skipIf(SKIP)("shares INSERT/UPDATE/dedup — SQL column correctness", () => {
  // getDb() must be lazy: calling it during module evaluation throws when
  // DATABASE_URL is not set, even though the describe block is marked skipIf.
  let sql: ReturnType<typeof getDb>;
  const cleanupIds: string[] = [];

  beforeAll(() => {
    sql = getDb();
  });

  afterAll(async () => {
    if (cleanupIds.length > 0) {
      // Targeted cleanup — only rows this test suite created
      await sql`DELETE FROM shares WHERE id = ANY(${cleanupIds}::text[]) AND owner_id = ${TEST_OWNER}`;
    }
  });

  // ── 1. INSERT ──────────────────────────────────────────────────────────────
  it("INSERT writes all columns correctly — owner_id must not be clobbered", async () => {
    const id = makeId();
    const editToken = makeToken();
    const species = extractSpecies(SAMPLE_PASTE);

    await sql`
      INSERT INTO shares (id, edit_token, data, version, is_public, is_unlisted, owner_id, species)
      VALUES (
        ${id},
        ${editToken},
        ${JSON.stringify(BASE_STATE)}::jsonb,
        1,
        false,
        false,
        ${TEST_OWNER},
        ${species}
      )
    `;
    cleanupIds.push(id);

    const rows = await sql`
      SELECT id, edit_token, version, is_public, is_unlisted, owner_id, species,
             data->>'creatorName' AS creator_name
      FROM shares WHERE id = ${id}
    `;

    expect(rows).toHaveLength(1);
    const row = rows[0];

    // Core identity columns
    expect(row.id).toBe(id);
    expect(row.edit_token).toBe(editToken);
    expect(row.owner_id).toBe(TEST_OWNER);

    // Payload integrity
    expect(row.version).toBe(1);
    expect(row.is_public).toBe(false);
    expect(row.is_unlisted).toBe(false);
    expect(row.creator_name).toBe(BASE_STATE.creatorName);

    // Species extraction
    expect(Array.isArray(row.species)).toBe(true);
    expect(row.species).toContain("Garchomp");
    expect(row.species).toContain("Flutter Mane");
  });

  // ── 2. UPDATE via edit_token ───────────────────────────────────────────────
  it("UPDATE via edit_token: owner_id not clobbered, version increments, data updates", async () => {
    const id = makeId();
    const editToken = makeToken();

    await sql`
      INSERT INTO shares (id, edit_token, data, version, is_public, is_unlisted, owner_id, species)
      VALUES (
        ${id}, ${editToken}, ${JSON.stringify(BASE_STATE)}::jsonb,
        1, false, false, ${TEST_OWNER}, ${extractSpecies(SAMPLE_PASTE)}
      )
    `;
    cleanupIds.push(id);

    const updatedState = { ...BASE_STATE, teamSummary: "Updated summary" };
    await sql`
      UPDATE shares
      SET data       = ${JSON.stringify(updatedState)}::jsonb,
          updated_at = NOW(),
          version    = COALESCE(version, 1) + 1,
          is_public  = false,
          is_unlisted = false,
          species    = ${extractSpecies(SAMPLE_PASTE)}
      WHERE id = ${id} AND edit_token = ${editToken}
    `;

    const rows = await sql`
      SELECT owner_id, version, is_public, is_unlisted,
             data->>'teamSummary' AS team_summary
      FROM shares WHERE id = ${id}
    `;

    expect(rows).toHaveLength(1);
    const row = rows[0];

    // owner_id must survive the UPDATE (this was the 17-05 regression)
    expect(row.owner_id).toBe(TEST_OWNER);

    // version incremented
    expect(row.version).toBe(2);

    // data updated
    expect(row.team_summary).toBe("Updated summary");

    // visibility unchanged
    expect(row.is_public).toBe(false);
    expect(row.is_unlisted).toBe(false);
  });

  // ── 3. Dedup SELECT must include is_unlisted (the 24-05 regression) ────────
  it("dedup SELECT includes is_unlisted so unlisted shares are not demoted to private", async () => {
    const id = makeId();
    const editToken = makeToken();

    // Create an unlisted share
    await sql`
      INSERT INTO shares (id, edit_token, data, version, is_public, is_unlisted, owner_id, species)
      VALUES (
        ${id}, ${editToken}, ${JSON.stringify(BASE_STATE)}::jsonb,
        1, false, true, ${TEST_OWNER}, ${extractSpecies(SAMPLE_PASTE)}
      )
    `;
    cleanupIds.push(id);

    // Replicate the dedup query from route.ts exactly, including is_unlisted
    const dupRows = await sql`
      SELECT id, edit_token, COALESCE(version, 1) AS version, is_public, is_unlisted
      FROM shares
      WHERE owner_id = ${TEST_OWNER}
        AND deleted_at IS NULL
        AND data->>'paste' = ${SAMPLE_PASTE}
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    expect(dupRows).toHaveLength(1);
    const dup = dupRows[0];

    // is_unlisted must be in the SELECT result (24-05 bug: it was omitted)
    expect(dup.is_unlisted).toBeDefined();
    expect(dup.is_unlisted).toBe(true);

    // Confirm the dedup UPDATE preserves unlisted status
    await sql`
      UPDATE shares
      SET data        = ${JSON.stringify({ ...BASE_STATE, teamSummary: "Re-shared" })}::jsonb,
          updated_at  = NOW(),
          version     = COALESCE(version, 1) + 1,
          is_public   = ${!!dup.is_public},
          is_unlisted = ${dup.is_unlisted as boolean},
          species     = ${extractSpecies(SAMPLE_PASTE)}
      WHERE id = ${dup.id}
    `;

    const afterRows = await sql`
      SELECT is_unlisted, is_public, version FROM shares WHERE id = ${id}
    `;

    // Unlisted must survive the dedup UPDATE — was silently demoted before the fix
    expect(afterRows[0].is_unlisted).toBe(true);
    expect(afterRows[0].is_public).toBe(false);
    expect(afterRows[0].version).toBe(2);
  });
});

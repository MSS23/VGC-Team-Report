import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { hasEditorAccess, isAcceptedCollaborator } from "@/lib/collaboration-access";
import type { getDb } from "@/lib/db";

// Real Postgres semantics (PGlite) so the owner / accepted / pending / NULL
// status / soft-deleted cases are checked against the actual SQL.
const db = new PGlite();
const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const query = strings.reduce((acc, fragment, i) => acc + (i ? `$${i}` : "") + fragment, "");
  return (await db.query(query, values)).rows;
}) as unknown as ReturnType<typeof getDb>;

beforeAll(async () => {
  await db.exec(`CREATE TABLE shares (id TEXT PRIMARY KEY, owner_id TEXT, deleted_at TIMESTAMPTZ);
    CREATE TABLE collaborators (share_id TEXT, user_id TEXT, status TEXT);`);
}, 30000);

beforeEach(async () => {
  await db.exec(`TRUNCATE shares, collaborators;
    INSERT INTO shares VALUES ('live0001', 'owner', NULL), ('gone0001', 'owner', NOW());
    INSERT INTO collaborators VALUES
      ('live0001', 'accepted', 'accepted'), ('live0001', 'legacy', NULL), ('live0001', 'invited', 'pending'),
      ('gone0001', 'accepted', 'accepted');`);
});

afterAll(async () => { await db.close(); });

describe("hasEditorAccess", () => {
  it.each([
    ["owner", true],
    ["accepted", true],
    ["legacy", true],
    ["invited", false],
    ["stranger", false],
  ])("live share, %s -> %s", async (userId, expected) => {
    expect(await hasEditorAccess(sql, "live0001", userId)).toBe(expected);
  });

  it("denies owner and collaborators of a soft-deleted share", async () => {
    expect(await hasEditorAccess(sql, "gone0001", "owner")).toBe(false);
    expect(await hasEditorAccess(sql, "gone0001", "accepted")).toBe(false);
  });

  it("denies a missing share", async () => {
    expect(await hasEditorAccess(sql, "nope0001", "owner")).toBe(false);
  });
});

describe("isAcceptedCollaborator", () => {
  it("accepts accepted and NULL status, rejects pending, owner and strangers", async () => {
    expect(await isAcceptedCollaborator(sql, "live0001", "accepted")).toBe(true);
    expect(await isAcceptedCollaborator(sql, "live0001", "legacy")).toBe(true);
    expect(await isAcceptedCollaborator(sql, "live0001", "invited")).toBe(false);
    expect(await isAcceptedCollaborator(sql, "live0001", "owner")).toBe(false);
    expect(await isAcceptedCollaborator(sql, "live0001", "stranger")).toBe(false);
  });

  it("ignores the share's deleted state (callers check it on their own share query)", async () => {
    expect(await isAcceptedCollaborator(sql, "gone0001", "accepted")).toBe(true);
  });
});

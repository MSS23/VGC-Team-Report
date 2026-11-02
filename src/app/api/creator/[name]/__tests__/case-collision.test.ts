/**
 * VGC-253 regression: the public creator page looked its profile up with
 * `WHERE LOWER(name) = ...` and took `rows[0]` with no ORDER BY. Because `name`
 * is stored at the user's own casing, two rows differing only in case both
 * match, and which bio/socials the public page served was nondeterministic.
 *
 * Real Postgres (PGlite) so the ordering is Postgres' own, not a mock's.
 */
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/cache", () => ({ cacheGet: vi.fn(async () => null), cacheSet: vi.fn(async () => undefined) }));

import { getDb } from "@/lib/db";
import { GET } from "../route";

const db = new PGlite();

beforeAll(async () => {
  await db.exec(`
    CREATE TABLE shares (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), view_count INTEGER, is_public BOOLEAN, deleted_at TIMESTAMPTZ);
    CREATE TABLE collaborators (share_id TEXT NOT NULL, user_name TEXT NOT NULL, status TEXT);
    CREATE TABLE verified_creators (name TEXT PRIMARY KEY);
    CREATE TABLE follows (user_id TEXT, creator_name TEXT);
    CREATE TABLE creator_profiles (name TEXT PRIMARY KEY, bio TEXT, twitter TEXT, discord TEXT, youtube TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), is_public BOOLEAN DEFAULT TRUE, accent_theme TEXT, avatar_url TEXT, user_id TEXT);
  `);
}, 30_000);

beforeEach(async () => {
  await db.exec("TRUNCATE shares, collaborators, verified_creators, follows, creator_profiles");
  vi.mocked(getDb).mockReturnValue((async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((sql, fragment, i) => sql + (i ? `$${i}` : "") + fragment, "");
    return (await db.query(query, values)).rows;
  }) as never);
});

afterAll(async () => { await db.close(); });

function creatorRequest(name: string) {
  return GET(new Request(`https://example.test/api/creator/${encodeURIComponent(name)}`), {
    params: Promise.resolve({ name: encodeURIComponent(name) }),
  });
}

it("serves the owned profile, not an unclaimed row that only differs in case", async () => {
  await db.exec(`
    INSERT INTO creator_profiles (name, bio, user_id) VALUES ('WolfeyVGC', 'Owned bio', 'user_victim');
    INSERT INTO creator_profiles (name, bio, user_id) VALUES ('wolfeyvgc', 'Unclaimed bio', NULL);
  `);

  for (const lookup of ["WolfeyVGC", "wolfeyvgc", "WOLFEYVGC"]) {
    const payload = await (await creatorRequest(lookup)).json();
    expect(payload.profile.bio).toBe("Owned bio");
  }
});

it("picks the same row on every request when neither row is claimed", async () => {
  await db.exec(`
    INSERT INTO creator_profiles (name, bio, user_id) VALUES ('WolfeyVGC', 'Upper bio', NULL);
    INSERT INTO creator_profiles (name, bio, user_id) VALUES ('wolfeyvgc', 'Lower bio', NULL);
  `);

  const bios = await Promise.all([1, 2, 3].map(async () => (await (await creatorRequest("wolfeyvgc")).json()).profile.bio));
  expect(new Set(bios).size).toBe(1);
});

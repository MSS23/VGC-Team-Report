/**
 * VGC-253 regression: creator_profiles used to be keyed on the Clerk display
 * name alone, with no user_id anywhere in the upsert. Setting your display name
 * to a target's and calling PUT /api/user/profile overwrote their public
 * creator page — bio, socials and avatar — under their verified badge.
 *
 * Runs against real Postgres (PGlite) because the fix lives in the ON CONFLICT
 * ... DO UPDATE ... WHERE shape: a DO UPDATE whose WHERE fails yields zero
 * rows, and only real Postgres proves that is what happens.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), currentUser: vi.fn() }));

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { GET, PUT } from "../route";

const db = new PGlite();

type ProfileRow = {
  name: string;
  user_id: string | null;
  bio: string | null;
  twitter: string | null;
  is_public: boolean | null;
};

beforeAll(async () => {
  // Mirrors the creator_profiles shape built by ensureTable() in src/lib/db.ts.
  await db.exec(`
    CREATE TABLE creator_profiles (
      name TEXT PRIMARY KEY,
      bio TEXT,
      twitter TEXT,
      discord TEXT,
      youtube TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      is_public BOOLEAN DEFAULT TRUE,
      accent_theme TEXT,
      avatar_url TEXT,
      user_id TEXT
    );
  `);
}, 30_000);

beforeEach(async () => {
  await db.exec("TRUNCATE creator_profiles");
  vi.mocked(getDb).mockReturnValue((async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((sql, fragment, i) => sql + (i ? `$${i}` : "") + fragment, "");
    return (await db.query(query, values)).rows;
  }) as never);
});

afterAll(async () => { await db.close(); });

/** Signs in as a Clerk account whose display name resolves to `name`. */
function signIn(id: string, name: string) {
  vi.mocked(currentUser).mockResolvedValue({ id, firstName: null, lastName: null, username: name, imageUrl: null } as never);
}

function saveRequest(body: Record<string, unknown>) {
  return new Request("https://example.test/api/user/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function rows() {
  return (await db.query<ProfileRow>("SELECT name, user_id, bio, twitter, is_public FROM creator_profiles ORDER BY name")).rows;
}

describe("PUT /api/user/profile — creator identity is bound to the account (VGC-253)", () => {
  it("a second account cannot overwrite an owned profile by copying the display name", async () => {
    signIn("user_victim", "WolfeyVGC");
    expect((await PUT(saveRequest({ bio: "Real bio", twitter: "wolfeyvgc" }))).status).toBe(200);

    // The attacker renames themselves to the victim's display name in Clerk.
    signIn("user_attacker", "WolfeyVGC");
    const response = await PUT(saveRequest({ bio: "Follow my scam link", twitter: "attacker" }));

    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatch(/another account/i);

    const saved = await rows();
    expect(saved).toHaveLength(1);
    expect(saved[0].user_id).toBe("user_victim");
    expect(saved[0].bio).toBe("Real bio");
    expect(saved[0].twitter).toBe("wolfeyvgc");
  });

  it("a hijack attempt cannot flip the victim's page to private either", async () => {
    signIn("user_victim", "WolfeyVGC");
    expect((await PUT(saveRequest({ bio: "Real bio", isPublic: true }))).status).toBe(200);

    signIn("user_attacker", "WolfeyVGC");
    expect((await PUT(saveRequest({ isPublic: false }))).status).toBe(409);

    expect((await rows())[0].is_public).toBe(true);
  });

  it("the owner can still re-save their own profile", async () => {
    signIn("user_victim", "WolfeyVGC");
    expect((await PUT(saveRequest({ bio: "First draft" }))).status).toBe(200);
    expect((await PUT(saveRequest({ bio: "Second draft", twitter: "wolfeyvgc" }))).status).toBe(200);

    const saved = await rows();
    expect(saved).toHaveLength(1);
    expect(saved[0].user_id).toBe("user_victim");
    expect(saved[0].bio).toBe("Second draft");
  });

  it("claims a legacy row with a NULL user_id for the first authenticated saver", async () => {
    await db.exec("INSERT INTO creator_profiles (name, bio, user_id) VALUES ('WolfeyVGC', 'Legacy bio', NULL)");

    signIn("user_victim", "WolfeyVGC");
    expect((await PUT(saveRequest({ bio: "Claimed bio" }))).status).toBe(200);

    const saved = await rows();
    expect(saved).toHaveLength(1);
    expect(saved[0].user_id).toBe("user_victim");
    expect(saved[0].bio).toBe("Claimed bio");

    // Once claimed, the row is no longer up for grabs.
    signIn("user_attacker", "WolfeyVGC");
    expect((await PUT(saveRequest({ bio: "Too late" }))).status).toBe(409);
    expect((await rows())[0].bio).toBe("Claimed bio");
  });

  it("stores the Clerk user id rather than trusting the display name alone", async () => {
    signIn("user_victim", "WolfeyVGC");
    await PUT(saveRequest({ bio: "Real bio" }));
    expect((await rows())[0]).toMatchObject({ name: "WolfeyVGC", user_id: "user_victim" });
  });
});

describe("GET /api/user/profile — never serves another account's row (VGC-253)", () => {
  it("prefers the caller's own row over a case-colliding row owned by someone else", async () => {
    await db.exec(`
      INSERT INTO creator_profiles (name, bio, user_id) VALUES ('WolfeyVGC', 'Victim bio', 'user_victim');
      INSERT INTO creator_profiles (name, bio, user_id) VALUES ('wolfeyvgc', 'Attacker bio', 'user_attacker');
    `);

    signIn("user_victim", "WolfeyVGC");
    expect((await (await GET(new Request("https://example.test/api/user/profile"))).json()).profile.bio).toBe("Victim bio");

    signIn("user_attacker", "wolfeyvgc");
    expect((await (await GET(new Request("https://example.test/api/user/profile"))).json()).profile.bio).toBe("Attacker bio");
  });
});

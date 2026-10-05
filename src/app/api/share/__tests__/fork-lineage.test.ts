import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock every external boundary the GET handler touches so we exercise the real
// fork-lineage disclosure logic against an in-memory "database".
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/cache", () => ({
  cacheGet: vi.fn(async () => null),
  cacheSet: vi.fn(async () => undefined),
  CacheKeys: { share: (id: string) => `share:${id}` },
  CacheTTL: { SHARE_PUBLIC: 300 },
}));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { GET } from "@/app/api/share/[id]/route";

type Row = Record<string, unknown>;

const FORK_ID = "abcd1234";
const SOURCE_ID = "src12345";

/** The fork itself: public, so any outsider can read it. */
const FORK_ROW: Row = {
  data: { paste: "Garchomp @ Life Orb\n", creatorName: "Forker" },
  version: 1,
  is_public: true,
  is_unlisted: false,
  owner_id: "owner-fork",
  forked_from_id: SOURCE_ID,
};

/** The source report's identifying metadata — none of it may leak. */
const SOURCE_DATA = {
  paste: "Miraidon @ Choice Specs\n\nFlutter Mane @ Booster Energy\n",
  creatorName: "SourceCreator",
  tournamentName: "Secret Regional",
};

/**
 * A minimal tagged-template `sql` stand-in. Routes by query text:
 *   - the fork-lineage lookup (`SELECT data, deleted_at, is_public ...`)
 *   - the main share read (`... AND deleted_at IS NULL`)
 *   - collaborator reads (empty)
 * `sourceRows` of `null` models a hard-deleted source; `"throw"` models the
 * column not existing yet mid-migration.
 */
function makeSql(sourceRows: Row[] | null | "throw") {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/deleted_at, is_public FROM shares/.test(q)) {
      if (sourceRows === "throw") return Promise.reject(new Error("no such column"));
      return Promise.resolve(sourceRows ?? []);
    }
    if (/FROM shares WHERE id/.test(q)) return Promise.resolve([FORK_ROW]);
    if (/FROM collaborators/.test(q)) return Promise.resolve([]);
    return Promise.resolve([]);
  };
}

function sourceRow(visibility: { is_public: boolean; is_unlisted: boolean }): Row {
  return { data: SOURCE_DATA, deleted_at: null, ...visibility };
}

function req() {
  return new Request(`https://x.test/api/share/${FORK_ID}`);
}
function params() {
  return { params: Promise.resolve({ id: FORK_ID }) };
}

/** Nothing about the source may appear anywhere in the serialized response. */
async function expectNoSourceLeak(res: Response) {
  const raw = await res.text();
  expect(raw).not.toContain("SourceCreator");
  expect(raw).not.toContain("Secret Regional");
  expect(raw).not.toContain("Miraidon");
  expect(raw).not.toContain(SOURCE_ID);
  return JSON.parse(raw);
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
  vi.mocked(auth).mockResolvedValue({ userId: null } as never);
});

/**
 * Forking is restricted to public sources, but only at fork time — the source
 * owner can unpublish afterwards. The lineage lookup must re-check the
 * source's CURRENT visibility, or the attribution banner discloses a private
 * report's existence, creator, event and species list to anyone holding the
 * fork's link.
 */
describe("GET /api/share/[id] — fork lineage disclosure", () => {
  it("attributes a still-public source (banner keeps working)", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql([sourceRow({ is_public: true, is_unlisted: false })]) as never,
    );
    const res = await GET(req(), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._forkedFrom).toMatchObject({
      id: SOURCE_ID,
      creatorName: "SourceCreator",
      tournamentName: "Secret Regional",
      deleted: false,
    });
    expect(body._forkedFrom.species).toContain("Miraidon");
  });

  it("omits lineage once the source has been made private", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql([sourceRow({ is_public: false, is_unlisted: false })]) as never,
    );
    const res = await GET(req(), params());
    expect(res.status).toBe(200);
    const body = await expectNoSourceLeak(res);
    expect(body._forkedFrom).toBeNull();
    // The fork's own content is untouched.
    expect(String(body.paste)).toContain("Garchomp");
  });

  it("omits lineage when the source is unlisted", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql([sourceRow({ is_public: false, is_unlisted: true })]) as never,
    );
    const res = await GET(req(), params());
    expect(res.status).toBe(200);
    const body = await expectNoSourceLeak(res);
    expect(body._forkedFrom).toBeNull();
  });

  it("still degrades gracefully for a hard-deleted source", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const res = await GET(req(), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._forkedFrom).toMatchObject({
      deleted: true,
      creatorName: null,
      tournamentName: null,
      species: [],
    });
  });

  it("stays fault-tolerant when the lineage lookup fails mid-migration", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql("throw") as never);
    const res = await GET(req(), params());
    // A missing column must never 500 the shared-report read path.
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._forkedFrom).toBeNull();
  });
});

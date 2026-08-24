import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the boundaries the GET handler touches so the real access-control logic
// runs against an in-memory "database". ImageResponse is stubbed because we
// care about *whether* a graphic is produced, not what it looks like.
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("next/og", () => ({
  ImageResponse: class {
    status = 200;
    constructor(public element: unknown) {}
  },
}));

import { getDb } from "@/lib/db";
import { GET } from "@/app/api/team-graphic/route";

type Row = Record<string, unknown>;

function makeSql(row: Row | null) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/FROM shares WHERE id/.test(q)) return Promise.resolve(row ? [row] : []);
    return Promise.resolve([]);
  };
}

const VALID_ID = "abcd1234";
const PASTE = "Incineroar @ Assault Vest\nAbility: Intimidate\nTera Type: Grass\n";

function req(id: string = VALID_ID, style = "wide") {
  return new Request(`https://x.test/api/team-graphic?id=${id}&style=${style}`);
}

function share(overrides: Row = {}): Row {
  return {
    data: { paste: PASTE },
    is_public: true,
    is_unlisted: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
});

describe("GET /api/team-graphic — visibility", () => {
  // The bug: this route selected `data` with no visibility predicate at all, so
  // anyone holding a share ID could render a PRIVATE team as a PNG — species,
  // item, ability and Tera type — straight past the privacy rule the rest of
  // the share surface enforces (a full bypass of VGC-246).
  it("404s for a private report instead of rendering its team", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql(share({ is_public: false, is_unlisted: false })) as never,
    );

    const res = await GET(req());

    expect(res.status).toBe(404);
  });

  it("renders a public report", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(share()) as never);

    const res = await GET(req());

    expect(res.status).toBe(200);
  });

  it("renders an unlisted report — link-viewable by design", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql(share({ is_public: false, is_unlisted: true })) as never,
    );

    const res = await GET(req());

    expect(res.status).toBe(200);
  });

  it("404s when the share does not exist", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);

    const res = await GET(req());

    expect(res.status).toBe(404);
  });

  it("rejects a malformed share ID before touching the database", async () => {
    const sql = vi.fn(makeSql(share()));
    vi.mocked(getDb).mockReturnValue(sql as never);

    const res = await GET(req("../../etc/passwd"));

    expect(res.status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  });
});

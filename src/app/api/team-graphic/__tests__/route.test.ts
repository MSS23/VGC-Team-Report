import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the external boundaries so the real access-control logic runs against an
// in-memory "database". ImageResponse is stubbed so we can assert whether the
// route ever got as far as rendering pixels.
const imageResponseCalls = vi.fn();
vi.mock("next/og", () => ({
  ImageResponse: class {
    status = 200;
    constructor(...args: unknown[]) {
      imageResponseCalls(...args);
    }
  },
}));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

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
const PASTE = "Garchomp @ Life Orb\nAbility: Rough Skin\nEVs: 252 Atk\n";

function req(id = VALID_ID, style = "wide") {
  return new Request(`https://x.test/api/team-graphic?id=${id}&style=${style}`);
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  imageResponseCalls.mockReset();
});

describe("GET /api/team-graphic — access control", () => {
  it("does not render a private report (regression: IDOR PNG leak)", async () => {
    // A report that is neither public nor unlisted is Private — holding the
    // share id must not be enough to get a PNG of the team.
    vi.mocked(getDb).mockReturnValue(
      makeSql({ data: { paste: PASTE, tournamentName: "Secret Regional" }, is_public: false, is_unlisted: false }) as never,
    );
    const res = await GET(req());
    expect(res.status).toBe(404);
    expect(imageResponseCalls).not.toHaveBeenCalled();
  });

  it("renders a public report", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ data: { paste: PASTE }, is_public: true, is_unlisted: false }) as never,
    );
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(imageResponseCalls).toHaveBeenCalled();
  });

  it("renders an unlisted report (link-viewable by design)", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ data: { paste: PASTE }, is_public: false, is_unlisted: true }) as never,
    );
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(imageResponseCalls).toHaveBeenCalled();
  });

  it("returns 404 for a malformed share id", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const res = await GET(req("BAD"));
    expect(res.status).toBe(404);
    expect(imageResponseCalls).not.toHaveBeenCalled();
  });
});

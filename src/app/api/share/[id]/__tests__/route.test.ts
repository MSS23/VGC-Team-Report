import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock every external boundary the GET handler touches so we exercise the real
// access-control + redaction logic against an in-memory "database".
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

/**
 * A minimal tagged-template `sql` stand-in. Routes by query text: any
 * `FROM shares WHERE id` read returns the single share row; collaborator reads
 * return an empty set (no collaborators). `forked_from_id: null` keeps the
 * fork-metadata SELECT from firing.
 */
function makeSql(row: Row | null) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/FROM shares WHERE id/.test(q)) return Promise.resolve(row ? [row] : []);
    if (/FROM collaborators/.test(q)) return Promise.resolve([]);
    return Promise.resolve([]);
  };
}

const VALID_ID = "abcd1234";
function req(url = `https://x.test/api/share/${VALID_ID}`) {
  return new Request(url);
}
function params(id = VALID_ID) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
});

describe("GET /api/share/[id] — access control", () => {
  it("returns 404 for a malformed share id (no DB touched)", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const res = await GET(req("https://x.test/api/share/BAD"), params("BAD"));
    expect(res.status).toBe(404);
  });

  it("hides a private report from an anonymous outsider (404, no data leak)", async () => {
    // Regression for §2 broken-access-control: private = only owner/collaborators.
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: "Garchomp @ Life Orb\n", creatorName: "X" },
        version: 1,
        is_public: false,
        is_unlisted: false,
        forked_from_id: null,
      }) as never,
    );
    const res = await GET(req(), params());
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Not found" });
  });

  it("serves a public report to an outsider, read-only, with private fields redacted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: {
          paste: "Garchomp @ Life Orb\nAbility: Rough Skin\nEVs: 252 Atk\n",
          privateFields: ["item"],
          creatorName: "X",
          teamName: "T",
        },
        version: 3,
        is_public: true,
        is_unlisted: false,
        forked_from_id: null,
      }) as never,
    );
    const res = await GET(req(), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._isPublic).toBe(true);
    expect(body._isOwner).toBe(false);
    expect(body._editable).toBeUndefined(); // no edit info leaked to outsiders
    expect(body._editToken).toBeUndefined();
    expect(body._redactedFields).toContain("item");
    // The private "item" must be stripped from the viewer-facing paste.
    expect(String(body.paste)).not.toContain("Life Orb");
  });

  it("grants the owner full edit access including the edit token", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: "Garchomp @ Life Orb\n", creatorName: "X" },
        edit_token: "a".repeat(64),
        version: 5,
        is_public: true,
        is_unlisted: false,
        owner_id: "owner-1",
        forked_from_id: null,
      }) as never,
    );
    const res = await GET(req(), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body._editable).toBe(true);
    expect(body._isOwner).toBe(true);
    expect(body._editToken).toBe("a".repeat(64));
    // Owner sees their own item — redaction does not apply to the owner.
    expect(String(body.paste)).toContain("Life Orb");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Access-control + redaction tests for GET /api/team-graphic.
 *
 * Regression for the team-graphic leak: the route used to render a PNG for
 * ANY share id with no auth, no visibility check and no tiered-publishing
 * (VGC-142) redaction, so a private or unlisted report's species, items,
 * tournament and placement could be pulled out as an image.
 *
 * Every external boundary is mocked so the real decision logic runs against
 * an in-memory "database". `next/og` is stubbed with a recorder, which lets
 * us assert on the element tree that WOULD have been rasterised — i.e. prove
 * a redacted item never reaches the image — without invoking satori.
 */

const { renders } = vi.hoisted(() => ({
  renders: [] as Array<{ element: unknown; options: Record<string, unknown> }>,
}));

vi.mock("next/og", () => ({
  ImageResponse: class {
    status = 200;
    headers: Headers;
    constructor(element: unknown, options: Record<string, unknown> = {}) {
      renders.push({ element, options });
      this.headers = new Headers((options.headers as Record<string, string>) ?? {});
    }
  },
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { GET } from "@/app/api/team-graphic/route";

type Row = Record<string, unknown>;

const VALID_ID = "abcd1234";
const OWNER = "user_owner";
const PASTE = "Garchomp @ Life Orb\nAbility: Rough Skin\nTera Type: Fire\nEVs: 252 Atk / 4 SpD / 252 Spe\nAdamant Nature\n";

/** Tagged-template `sql` stand-in routed by query text. */
function makeSql(row: Row | null, isCollaborator = false) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/FROM collaborators/.test(q)) return Promise.resolve(isCollaborator ? [{ one: 1 }] : []);
    if (/FROM shares WHERE id/.test(q)) return Promise.resolve(row ? [row] : []);
    return Promise.resolve([]);
  };
}

function shareRow(over: Row = {}): Row {
  return {
    data: {
      paste: PASTE,
      tournamentName: "Secret Regionals",
      placement: "1st",
      creatorName: "Owner",
      record: "9-0",
      tags: { regulation: "Reg H" },
    },
    is_public: false,
    is_unlisted: false,
    owner_id: OWNER,
    ...over,
  };
}

function req(id: string | null = VALID_ID) {
  const url = id === null
    ? "https://x.test/api/team-graphic"
    : `https://x.test/api/team-graphic?id=${encodeURIComponent(id)}`;
  return new Request(url);
}

/** Flatten the recorded element tree to a searchable string. */
function lastRenderText(): string {
  const last = renders[renders.length - 1];
  return JSON.stringify(last?.element ?? null);
}

function signedInAs(userId: string | null) {
  vi.mocked(auth).mockResolvedValue({ userId } as never);
}

beforeEach(() => {
  renders.length = 0;
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
});

describe("GET /api/team-graphic — visibility gate", () => {
  it("rejects a missing id with 400", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const res = await GET(req(null));
    expect(res.status).toBe(400);
    expect(renders).toHaveLength(0);
  });

  it("404s a malformed share id without touching the database", async () => {
    signedInAs(null);
    const sql = vi.fn();
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await GET(req("not-a-valid-id"));
    expect(res.status).toBe(404);
    expect(sql).not.toHaveBeenCalled();
  });

  it("404s an unknown share id", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const res = await GET(req());
    expect(res.status).toBe(404);
    expect(renders).toHaveLength(0);
  });

  it("hides a private report from an anonymous caller (404, nothing rendered)", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    const res = await GET(req());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    expect(renders).toHaveLength(0);
  });

  it("hides a private report from a signed-in stranger (404, not 403 — no existence leak)", async () => {
    signedInAs("user_stranger");
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    const res = await GET(req());
    expect(res.status).toBe(404);
    expect(renders).toHaveLength(0);
  });

  it("renders a private report for its owner", async () => {
    signedInAs(OWNER);
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(lastRenderText()).toContain("Secret Regionals");
    expect(lastRenderText()).toContain("Life Orb");
  });

  it("renders a private report for an accepted collaborator", async () => {
    signedInAs("user_collab");
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow(), true) as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(lastRenderText()).toContain("Garchomp");
  });

  it("renders a public report for an anonymous caller", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow({ is_public: true })) as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(lastRenderText()).toContain("Garchomp");
  });

  it("renders an unlisted report for a link holder (matches /api/share/[id])", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow({ is_unlisted: true })) as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(lastRenderText()).toContain("Garchomp");
  });
});

describe("GET /api/team-graphic — tiered-publishing redaction (VGC-142)", () => {
  function withPrivateItem(over: Row = {}): Row {
    const row = shareRow({ is_public: true, ...over });
    row.data = { ...(row.data as Row), privateFields: ["item", "evs"] };
    return row;
  }

  it("strips a creator's private item before it reaches the image", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(makeSql(withPrivateItem()) as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    const text = lastRenderText();
    expect(text).toContain("Garchomp");
    expect(text).not.toContain("Life Orb");
  });

  it("still redacts for an unlisted report's link holders", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(
      makeSql(withPrivateItem({ is_public: false, is_unlisted: true })) as never,
    );
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(lastRenderText()).not.toContain("Life Orb");
  });

  it("does not redact for the owner", async () => {
    signedInAs(OWNER);
    vi.mocked(getDb).mockReturnValue(makeSql(withPrivateItem()) as never);
    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(lastRenderText()).toContain("Life Orb");
  });
});

describe("GET /api/team-graphic — cache headers", () => {
  it("keeps the shared edge cache for plain public reports", async () => {
    signedInAs(null);
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow({ is_public: true })) as never);
    const res = await GET(req());
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=86400");
  });

  it("never lets a per-viewer render into a shared cache", async () => {
    // Owner render of a private report: must not be replayable from the CDN.
    signedInAs(OWNER);
    vi.mocked(getDb).mockReturnValue(makeSql(shareRow()) as never);
    const res = await GET(req());
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("does not cache a redacted public render (owner and viewer differ)", async () => {
    signedInAs(null);
    const row = shareRow({ is_public: true });
    row.data = { ...(row.data as Row), privateFields: ["item"] };
    vi.mocked(getDb).mockReturnValue(makeSql(row) as never);
    const res = await GET(req());
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression suite for the unauthenticated IDOR on `/api/team-graphic`
 * (C4 security audit, 2026-08-31, P1-1).
 *
 * The route used to `SELECT data FROM shares WHERE id = $1` and render a card
 * from whatever came back, never consulting `is_public` / `is_unlisted`. Any
 * stranger who knew or guessed a share id could pull a fully rendered social
 * card — species, items, abilities, Tera types, tournament, placement — for a
 * report its owner had marked private, and the `privateFields` redaction that
 * `/api/share/[id]` applies was bypassed on the way.
 *
 * Every external boundary is mocked so the real access-control + redaction
 * logic runs against an in-memory "database" and a stubbed image renderer.
 */

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("next/og", () => ({
  // `new ImageResponse(...)` returning an object yields that object, so the
  // handler's return value is this Response and we can assert on its headers.
  // Must be constructible (`new ImageResponse(...)`), so not an arrow.
  ImageResponse: vi.fn(function (
    _element: unknown,
    opts?: { headers?: Record<string, string> },
  ) {
    return new Response("PNG", { status: 200, headers: opts?.headers });
  }),
}));

import { ImageResponse } from "next/og";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { GET } from "@/app/api/team-graphic/route";

type Row = Record<string, unknown>;

/** Minimal tagged-template `sql` stand-in, routed by query text. */
function makeSql(row: Row | null, isCollaborator = false) {
  return (strings: TemplateStringsArray) => {
    const q = strings.join(" ? ");
    if (/FROM shares/.test(q)) return Promise.resolve(row ? [row] : []);
    if (/FROM collaborators/.test(q)) return Promise.resolve(isCollaborator ? [{ "?column?": 1 }] : []);
    return Promise.resolve([]);
  };
}

const VALID_ID = "abcd1234";
const PASTE = "Garchomp @ Life Orb\nAbility: Rough Skin\nTera Type: Steel\nEVs: 252 Atk\n";

function req(id: string = VALID_ID, style = "wide") {
  return new Request(`https://x.test/api/team-graphic?id=${id}&style=${style}`);
}

/** Flatten every string that the (mocked) renderer was handed. */
function renderedText(): string {
  const el = vi.mocked(ImageResponse).mock.calls[0]?.[0];
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (node == null || node === false) return;
    if (typeof node === "string" || typeof node === "number") {
      out.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const props = (node as { props?: { children?: unknown } }).props;
    if (props) walk(props.children);
  };
  walk(el);
  return out.join(" ");
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(getDb).mockReset();
  vi.mocked(ImageResponse).mockClear();
  vi.mocked(auth).mockResolvedValue({ userId: null } as never);
});

describe("GET /api/team-graphic — visibility gate", () => {
  it("does NOT render a private report for an unauthenticated caller (IDOR regression)", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, creatorName: "Secret Player", tournamentName: "Worlds" },
        is_public: false,
        is_unlisted: false,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req());

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
    // Nothing was drawn — the team never reached the renderer at all.
    expect(ImageResponse).not.toHaveBeenCalled();
  });

  it("does not render a private report for a signed-in stranger", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "stranger-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, creatorName: "Secret Player" },
        is_public: false,
        is_unlisted: false,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req());
    expect(res.status).toBe(404);
    expect(ImageResponse).not.toHaveBeenCalled();
  });

  it("returns the same opaque 404 for a missing share as for a private one", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const res = await GET(req());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not found" });
  });

  it("still renders a public report for a logged-out caller (crawlers/unfurlers)", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, creatorName: "Player", tournamentName: "Worlds", placement: "1st" },
        is_public: true,
        is_unlisted: false,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req());

    expect(res.status).toBe(200);
    expect(ImageResponse).toHaveBeenCalledTimes(1);
    expect(renderedText()).toContain("Garchomp");
    // Public cards keep the aggressive edge cache unfurlers depend on.
    expect(res.headers.get("cache-control")).toContain("s-maxage=86400");
  });

  it("still renders an unlisted (link-shared) report for a logged-out caller", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, creatorName: "Player" },
        is_public: false,
        is_unlisted: true,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(ImageResponse).toHaveBeenCalledTimes(1);
  });

  it("renders a private report for its owner, but never from a shared cache", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, creatorName: "Player" },
        is_public: false,
        is_unlisted: false,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("renders a private report for an accepted collaborator", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, creatorName: "Player" },
        is_public: false,
        is_unlisted: false,
        owner_id: "owner-1",
      }, true) as never,
    );

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(ImageResponse).toHaveBeenCalledTimes(1);
  });

  it("rejects a malformed share id without touching the database", async () => {
    const sql = vi.fn();
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await GET(req("../../etc"));
    expect(res.status).toBe(404);
    expect(sql).not.toHaveBeenCalled();
  });
});

describe("GET /api/team-graphic — privateFields redaction", () => {
  it("does not draw an item the creator marked private", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, privateFields: ["item"], creatorName: "Player" },
        is_public: true,
        is_unlisted: false,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req());
    expect(res.status).toBe(200);
    const text = renderedText();
    expect(text).toContain("Garchomp"); // the public shell still renders
    expect(text).not.toContain("Life Orb"); // the hidden field does not
  });

  it("draws the item when the creator marked nothing private", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, creatorName: "Player" },
        is_public: true,
        is_unlisted: false,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req());
    expect(res.status).toBe(200);
    expect(renderedText()).toContain("Life Orb");
  });

  it("redacts on the wrapped (1080x1920) layout too", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        data: { paste: PASTE, privateFields: ["item"], creatorName: "Player" },
        is_public: true,
        is_unlisted: false,
        owner_id: "owner-1",
      }) as never,
    );

    const res = await GET(req(VALID_ID, "wrapped"));
    expect(res.status).toBe(200);
    expect(renderedText()).not.toContain("Life Orb");
  });
});

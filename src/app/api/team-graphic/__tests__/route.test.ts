import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Privacy regression tests for the team graphic (SWARM-TEAMGRAPHIC).
 *
 * The bug: GET /api/team-graphic selected `data FROM shares WHERE id = ?`
 * with no `is_public` / `is_unlisted` predicate and no `privateFields`
 * redaction, while /api/oembed publishes that same URL as `thumbnail_url`.
 * Anyone holding a share id could render a private report's team, including
 * items the creator had chosen to hide.
 *
 * The gate now matches /s/{id} and GET /api/share/{id}: public + unlisted are
 * renderable by link, private only for the owner or an accepted collaborator,
 * and a blocked request gets 404 (not 403) so the id is never confirmed.
 */

const { renders } = vi.hoisted(() => ({
  renders: [] as { element: unknown; options: Record<string, unknown> }[],
}));

vi.mock("next/og", () => ({
  ImageResponse: vi.fn().mockImplementation(function (
    element: unknown,
    options: Record<string, unknown>,
  ) {
    renders.push({ element, options });
    return new Response("png", {
      status: 200,
      headers: (options?.headers as Record<string, string>) ?? {},
    });
  }),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { GET } from "@/app/api/team-graphic/route";
import { GET as OEMBED_GET } from "@/app/api/oembed/route";

const PASTE = [
  "Incineroar @ Assault Vest",
  "Ability: Intimidate",
  "Tera Type: Grass",
  "EVs: 252 HP / 4 Atk / 252 SpD",
  "Adamant Nature",
  "- Fake Out",
].join("\n");

type Row = {
  is_public: boolean;
  is_unlisted: boolean;
  owner_id: string | null;
  privateFields?: string[];
};

function makeSql(row: Row | null, collaboratorId: string | null = null) {
  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.join(" ? ");

    if (/FROM collaborators/.test(query)) {
      const userId = values[1];
      return Promise.resolve(
        collaboratorId && userId === collaboratorId ? [{ "?column?": 1 }] : [],
      );
    }

    if (/FROM shares/.test(query)) {
      if (!row) return Promise.resolve([]);
      // Emulate the oEmbed route's own `is_public = TRUE` predicate so the
      // test fails if that predicate is ever dropped from the SQL.
      if (/is_public = TRUE/.test(query) && !row.is_public) return Promise.resolve([]);
      return Promise.resolve([
        {
          data: {
            paste: PASTE,
            tournamentName: "Regional",
            creatorName: "Trainer",
            ...(row.privateFields ? { privateFields: row.privateFields } : {}),
          },
          is_public: row.is_public,
          is_unlisted: row.is_unlisted,
          owner_id: row.owner_id,
        },
      ]);
    }

    return Promise.resolve([]);
  };
}

function request(id = "abcd1234", style = "wide") {
  return new Request(`https://x.test/api/team-graphic?id=${id}&style=${style}`);
}

/** Flatten every string rendered into the graphic's element tree. */
function renderedText(element: unknown): string {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (node === null || node === undefined || node === false || node === true) return;
    if (typeof node === "string" || typeof node === "number") {
      out.push(String(node));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object") {
      const props = (node as { props?: Record<string, unknown> }).props;
      if (props) {
        if (typeof props.alt === "string") out.push(props.alt);
        walk(props.children);
      }
    }
  };
  walk(element);
  return out.join(" | ");
}

function lastRender() {
  expect(renders.length).toBeGreaterThan(0);
  return renders[renders.length - 1];
}

beforeEach(() => {
  vi.clearAllMocks();
  renders.length = 0;
  vi.mocked(auth).mockResolvedValue({ userId: null } as never);
});

describe("GET /api/team-graphic — visibility gate", () => {
  it("renders a public report for an anonymous caller", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: true, is_unlisted: false, owner_id: "owner-1" }) as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(renders).toHaveLength(1);
    expect(renderedText(lastRender().element)).toContain("Incineroar");
  });

  it("blocks a private report with 404 and renders nothing", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: false, is_unlisted: false, owner_id: "owner-1" }) as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: "Not found" });
    expect(renders).toHaveLength(0);
  });

  it("uses 404 rather than 403 for a private report, so the id is not confirmed", async () => {
    const privateSql = makeSql({ is_public: false, is_unlisted: false, owner_id: "owner-1" });
    vi.mocked(getDb).mockReturnValue(privateSql as never);
    const blocked = await GET(request());

    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const missing = await GET(request("zzzz9999"));

    expect(blocked.status).toBe(404);
    expect(missing.status).toBe(404);
    await expect(blocked.json()).resolves.toEqual(await missing.json());
  });

  // DECISION: unlisted stays renderable. /s/{id} and GET /api/share/{id} both
  // serve unlisted reports to anonymous link holders ("Unlisted reports remain
  // link-viewable by design") and only 404 when a report is neither public nor
  // unlisted. The graphic matches that, so pasting an unlisted link still
  // unfurls. Only the edge-cache window is tightened for it.
  it("renders an unlisted report for an anonymous link holder (matches /s/{id})", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: false, is_unlisted: true, owner_id: "owner-1" }) as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(renders).toHaveLength(1);
    expect(lastRender().options.headers).toMatchObject({
      "Cache-Control": expect.stringContaining("s-maxage=30"),
    });
  });

  it("renders a private report for its owner, uncacheable", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: false, is_unlisted: false, owner_id: "owner-1" }) as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(lastRender().options.headers).toMatchObject({
      "Cache-Control": "private, no-store",
    });
  });

  it("renders a private report for an accepted collaborator", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "collab-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: false, is_unlisted: false, owner_id: "owner-1" }, "collab-1") as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(renders).toHaveLength(1);
  });

  it("blocks a signed-in outsider from a private report", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "outsider-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: false, is_unlisted: false, owner_id: "owner-1" }, "collab-1") as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(renders).toHaveLength(0);
  });

  it("still requires an id", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(null) as never);
    const response = await GET(new Request("https://x.test/api/team-graphic"));
    expect(response.status).toBe(400);
  });
});

describe("GET /api/team-graphic — creator-hidden fields", () => {
  it("omits a hidden item from the graphic", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        is_public: true,
        is_unlisted: false,
        owner_id: "owner-1",
        privateFields: ["item"],
      }) as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    const text = renderedText(lastRender().element);
    expect(text).toContain("Incineroar");
    expect(text).not.toContain("Assault Vest");
  });

  it("shows the item when the creator hid nothing", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: true, is_unlisted: false, owner_id: "owner-1" }) as never,
    );

    await GET(request());
    expect(renderedText(lastRender().element)).toContain("Assault Vest");
  });

  it("hides the item from the owner's own download too", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never);
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        is_public: false,
        is_unlisted: false,
        owner_id: "owner-1",
        privateFields: ["item"],
      }) as never,
    );

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(renderedText(lastRender().element)).not.toContain("Assault Vest");
  });

  it("ignores junk field names in privateFields", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({
        is_public: true,
        is_unlisted: false,
        owner_id: "owner-1",
        privateFields: ["species", "nonsense"],
      }) as never,
    );

    await GET(request());
    const text = renderedText(lastRender().element);
    expect(text).toContain("Incineroar");
    expect(text).toContain("Assault Vest");
  });
});

describe("GET /api/oembed — thumbnail_url stays inside the graphic's gate", () => {
  function oembedRequest(id = "abcd1234") {
    return new Request(
      `https://x.test/api/oembed?url=${encodeURIComponent(`https://pokemonvgcteamreport.com/s/${id}`)}`,
    );
  }

  it("publishes a thumbnail for a public report", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: true, is_unlisted: false, owner_id: "owner-1" }) as never,
    );

    const response = await OEMBED_GET(oembedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      thumbnail_url: expect.stringContaining("/api/team-graphic?id=abcd1234"),
    });
  });

  it("publishes no thumbnail for a private report", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: false, is_unlisted: false, owner_id: "owner-1" }) as never,
    );

    const response = await OEMBED_GET(oembedRequest());
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.not.toHaveProperty("thumbnail_url");
  });

  it("publishes no thumbnail for an unlisted report", async () => {
    vi.mocked(getDb).mockReturnValue(
      makeSql({ is_public: false, is_unlisted: true, owner_id: "owner-1" }) as never,
    );

    const response = await OEMBED_GET(oembedRequest());
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.not.toHaveProperty("thumbnail_url");
  });
});

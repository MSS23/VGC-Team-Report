import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * VGC-232 — sprite proxy fallback chain.
 *
 * Live upstream calls are mocked: this pins the ORDER of the chain, that the
 * common case still costs exactly one upstream request, that a species with
 * no sprite anywhere still returns a renderable image rather than an error
 * status (a broken <img> is the bug being fixed), and that the SSRF
 * allowlist rejects hostile `u` values before any fetch happens.
 */

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);

const imageRes = () =>
  new Response(PNG, { status: 200, headers: { "content-type": "image/png" } });
const notFound = () =>
  new Response("nope", { status: 404, headers: { "content-type": "text/html" } });

let calls: string[] = [];

function mockFetch(handler: (url: string) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push(url);
      return handler(url);
    }),
  );
}

/**
 * The route keeps an in-isolate negative cache at module scope, so each test
 * gets a fresh module to stay order-independent.
 */
async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/sprite/route")).GET;
}

const req = (qs: string) => new NextRequest(`https://example.test/api/sprite?${qs}`);

beforeEach(() => {
  calls = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/sprite", () => {
  it("400s when neither u nor species is given", async () => {
    mockFetch(() => imageRes());
    const GET = await loadRoute();
    expect((await GET(req(""))).status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("serves an existing sprite from the primary with exactly one upstream request", async () => {
    mockFetch(() => imageRes());
    const GET = await loadRoute();
    const res = await GET(req("species=Incineroar"));

    expect(res.status).toBe(200);
    expect(calls).toEqual(["https://play.pokemonshowdown.com/sprites/home/incineroar.png"]);
    expect(res.headers.get("Cache-Control")).toContain("immutable");
    expect(res.headers.get("X-Sprite-Source")).toBe("play.pokemonshowdown.com");
  });

  it("falls through to the PokemonDB HOME mirror when Showdown 404s", async () => {
    mockFetch((u) => (u.includes("pokemondb") ? imageRes() : notFound()));
    const GET = await loadRoute();
    const res = await GET(req("species=Ash-Greninja&animated=1"));

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Sprite-Source")).toBe("img.pokemondb.net");
    expect(calls).toEqual([
      "https://play.pokemonshowdown.com/sprites/ani/greninja-ash.gif",
      "https://play.pokemonshowdown.com/sprites/home/greninja-ash.png",
      "https://img.pokemondb.net/sprites/home/normal/greninja-ash.png",
    ]);
  });

  it("returns a renderable inline placeholder — not an error — when every upstream fails", async () => {
    mockFetch(() => notFound());
    const GET = await loadRoute();
    const res = await GET(req("species=Fakemon-Nonexistent"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("image/svg+xml");
    // Negative result: short TTL, never `immutable`.
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=300, s-maxage=300");
    expect(await res.text()).toContain("<svg");
  });

  it("negatively caches misses so the next render skips the known-bad links", async () => {
    mockFetch((u) => (u.includes("gen5") ? imageRes() : notFound()));
    const GET = await loadRoute();

    await GET(req("species=Zygarde-10%25"));
    const firstPass = calls.length;
    expect(firstPass).toBeGreaterThan(1);

    calls = [];
    await GET(req("species=Zygarde-10%25"));
    expect(calls).toEqual(["https://play.pokemonshowdown.com/sprites/gen5/zygarde-10.png"]);
  });

  it("treats a soft-404 (HTML body, status 200) as a miss and keeps walking", async () => {
    mockFetch((u) =>
      u.includes("/home/")
        ? new Response("<html>not found</html>", {
            status: 200,
            headers: { "content-type": "text/html" },
          })
        : u.includes("gen5")
          ? imageRes()
          : notFound(),
    );
    const GET = await loadRoute();
    const res = await GET(req("species=Sirfetch%27d"));

    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(calls).toContain("https://play.pokemonshowdown.com/sprites/gen5/sirfetchd.png");
  });

  it("keeps the caller's u as the primary (html2canvas export path)", async () => {
    mockFetch(() => imageRes());
    const GET = await loadRoute();
    const u = "https://play.pokemonshowdown.com/sprites/ani/incineroar.gif";
    const res = await GET(req(`u=${encodeURIComponent(u)}&species=Incineroar`));

    expect(res.status).toBe(200);
    expect(calls).toEqual([u]);
  });

  it.each([
    "http://169.254.169.254/latest/meta-data",
    "https://evil.tld/sprites/home/x.png",
    "https://play.pokemonshowdown.com@evil.tld/sprites/home/x.png",
    "file:///etc/passwd",
    "https://play.pokemonshowdown.com/admin/secret.png",
  ])("rejects hostile u %o without contacting any upstream", async (hostile) => {
    mockFetch(() => imageRes());
    const GET = await loadRoute();
    const res = await GET(req(`u=${encodeURIComponent(hostile)}`));

    expect(res.status).toBe(400);
    expect(calls).toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));

import { apiGuard } from "@/lib/security/api-guard";
import { GET } from "../route";

const SPRITE = "https://play.pokemonshowdown.com/sprites/home/incineroar.png";
const req = (u?: string) =>
  new NextRequest(`https://x.test/api/sprite${u === undefined ? "" : `?u=${encodeURIComponent(u)}`}`);

const png = (bytes = 8, headers: Record<string, string> = {}) =>
  new Response(new Uint8Array(bytes), { status: 200, headers: { "content-type": "image/png", ...headers } });
const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(apiGuard).mockReset().mockResolvedValue(null);
});
afterEach(() => vi.unstubAllGlobals());

describe("GET /api/sprite", () => {
  it("proxies an allowed sprite", async () => {
    fetchMock.mockResolvedValue(png(8));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect((await res.arrayBuffer()).byteLength).toBe(8);
    expect(fetchMock).toHaveBeenCalledWith(SPRITE, expect.objectContaining({ redirect: "manual" }));
  });

  it("is rate limited, and a blocked request never reaches upstream", async () => {
    vi.mocked(apiGuard).mockResolvedValue(NextResponse.json({ error: "Too many requests" }, { status: 429 }));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(429);
    expect(apiGuard).toHaveBeenCalledWith(expect.anything(), { rateLimit: { key: "sprite", max: 600 } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects http: even on the allowed host", async () => {
    const res = await GET(req("http://play.pokemonshowdown.com/sprites/home/incineroar.png"));
    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toBe("Protocol not allowed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["another host", "https://evil.example/sprites/home/x.png", "Host not allowed"],
    ["a path outside /sprites/", "https://play.pokemonshowdown.com/action.php", "Path not allowed"],
    ["a traversal out of /sprites/", "https://play.pokemonshowdown.com/sprites/../action.php", "Path not allowed"],
    ["an encoded traversal", "https://play.pokemonshowdown.com/sprites/..%2Faction.php", "Path not allowed"],
    ["another port on the allowed host", "https://play.pokemonshowdown.com:8443/sprites/home/x.png", "Host not allowed"],
    ["the allowed host as userinfo", "https://play.pokemonshowdown.com@evil.example/sprites/home/x.png", "Host not allowed"],
  ])("rejects %s", async (_label, url, message) => {
    const res = await GET(req(url));
    expect(res.status).toBe(400);
    await expect(res.text()).resolves.toBe(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("follows a redirect that stays inside the allowlist", async () => {
    fetchMock.mockResolvedValueOnce(redirect("/sprites/home/incineroar-2.png")).mockResolvedValueOnce(png(4));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://play.pokemonshowdown.com/sprites/home/incineroar-2.png",
      expect.anything(),
    );
  });

  it.each([
    ["another host", "https://evil.example/sprites/home/x.png"],
    ["an internal address", "https://169.254.169.254/sprites/meta-data"],
    ["plain http on the allowed host", "http://play.pokemonshowdown.com/sprites/home/x.png"],
    ["an unparseable location", "https://["],
    ["a path outside /sprites/", "https://play.pokemonshowdown.com/action.php"],
  ])("does not follow a redirect to %s", async (_label, location) => {
    fetchMock.mockResolvedValueOnce(redirect(location));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(502);
    await expect(res.text()).resolves.toBe("Redirect not allowed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up on a redirect loop", async () => {
    fetchMock.mockImplementation(async () => redirect("/sprites/home/loop.png"));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(502);
    await expect(res.text()).resolves.toBe("Too many redirects");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("refuses a body over the size cap when Content-Length says so", async () => {
    fetchMock.mockResolvedValue(png(1, { "content-length": String(5 * 1024 * 1024 + 1) }));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(502);
    await expect(res.text()).resolves.toBe("Sprite too large");
  });

  it("refuses a body over the size cap when Content-Length is absent or lies", async () => {
    const chunk = new Uint8Array(1024 * 1024);
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent++ < 6) controller.enqueue(chunk);
        else controller.close();
      },
    });
    fetchMock.mockResolvedValue(new Response(body, { status: 200, headers: { "content-type": "image/gif" } }));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(502);
    await expect(res.text()).resolves.toBe("Sprite too large");
  });

  it.each([
    ["HTML", "text/html"],
    ["an SVG, which can carry script", "image/svg+xml"],
  ])("does not serve %s from our origin", async (_label, type) => {
    fetchMock.mockResolvedValue(new Response("<script>1</script>", { status: 200, headers: { "content-type": type } }));
    const res = await GET(req(SPRITE));
    expect(res.status).toBe(502);
    await expect(res.text()).resolves.toBe("Upstream is not an image");
  });

  it("accepts a content type with parameters", async () => {
    fetchMock.mockResolvedValue(png(4, { "content-type": "image/gif; charset=binary" }));
    expect((await GET(req(SPRITE))).status).toBe(200);
  });

  it("keeps the existing 400 for a missing or unparseable url", async () => {
    expect((await GET(req())).status).toBe(400);
    expect((await GET(req("not a url"))).status).toBe(400);
  });
});

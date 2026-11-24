import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { linearFetch } from "@/lib/linear";

describe("linearFetch", () => {
  const fetchMock = vi.fn(async () => new Response("{}"));

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("LINEAR_API_KEY", "test-key");
  });
  afterEach(() => {
    fetchMock.mockClear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("POSTs the query and variables to Linear with the raw API key", async () => {
    await linearFetch("query { viewer { id } }", { a: 1 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.linear.app/graphql");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json", Authorization: "test-key" });
    expect(init.body).toBe(JSON.stringify({ query: "query { viewer { id } }", variables: { a: 1 } }));
    expect(init.signal).toBeUndefined();
  });

  it("adds an abort signal only when a timeout is given", async () => {
    await linearFetch("q", undefined, 5000);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("sends an empty Authorization header when the key is unset, without throwing", async () => {
    vi.stubEnv("LINEAR_API_KEY", undefined);
    await linearFetch("q");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("");
  });
});

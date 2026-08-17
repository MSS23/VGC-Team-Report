import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { linearRequest, linearQuery } from "@/lib/linear";

/**
 * Covers the single shared Linear GraphQL client introduced by VGC-273, which
 * replaced two near-identical `linearQuery` copies (src/lib/linear.ts and
 * src/app/api/discord/route.ts) that both returned `any`.
 *
 * The two entry points differ deliberately and the difference is load-bearing:
 *   linearRequest — returns the raw envelope, so a caller can treat a GraphQL
 *                   error as a miss. /status relies on this to fall back from
 *                   an id lookup to a number search.
 *   linearQuery   — unwraps to `data` and throws on any GraphQL error.
 */
describe("Linear GraphQL client", () => {
  const originalKey = process.env.LINEAR_API_KEY;

  beforeEach(() => {
    process.env.LINEAR_API_KEY = "lin_api_test_key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalKey === undefined) delete process.env.LINEAR_API_KEY;
    else process.env.LINEAR_API_KEY = originalKey;
  });

  /** Stub global fetch with a single JSON response. */
  function stubFetch(body: unknown, init: { ok?: boolean; status?: number } = {}) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("sends the query and variables as a GraphQL POST with the API key", async () => {
    const fetchMock = stubFetch({ data: { ok: true } });

    await linearRequest("query { viewer { id } }", { teamId: "team_1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.linear.app/graphql");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("lin_api_test_key");
    expect(JSON.parse(options.body)).toEqual({
      query: "query { viewer { id } }",
      variables: { teamId: "team_1" },
    });
  });

  it("omits the variables key entirely when none are passed", async () => {
    const fetchMock = stubFetch({ data: {} });

    await linearRequest("query { viewer { id } }");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      query: "query { viewer { id } }",
    });
  });

  it("linearRequest returns the raw envelope so callers can inspect errors", async () => {
    stubFetch({ data: null, errors: [{ message: "Entity not found" }] });

    const res = await linearRequest<{ issue: { id: string } | null }>("query { issue { id } }");

    // Must NOT throw — /status treats this as "not found" and falls back.
    expect(res.errors?.[0].message).toBe("Entity not found");
    expect(res.data?.issue).toBeUndefined();
  });

  it("linearQuery unwraps to data on success", async () => {
    stubFetch({ data: { issue: { id: "abc", identifier: "VGC-1" } } });

    const data = await linearQuery<{ issue: { id: string; identifier: string } }>(
      "query { issue { id identifier } }",
    );

    expect(data.issue.identifier).toBe("VGC-1");
  });

  it("linearQuery throws on a GraphQL-level error", async () => {
    stubFetch({ data: null, errors: [{ message: "Argument Validation Error" }] });

    await expect(linearQuery("mutation { issueCreate { id } }")).rejects.toThrow(
      /Argument Validation Error/,
    );
  });

  it("linearQuery throws when the response carries no data", async () => {
    stubFetch({});

    await expect(linearQuery("query { viewer { id } }")).rejects.toThrow(/no data/i);
  });

  it("throws on a non-2xx HTTP response, including the status", async () => {
    stubFetch({ error: "rate limited" }, { ok: false, status: 429 });

    await expect(linearRequest("query { viewer { id } }")).rejects.toThrow(/429/);
  });

  it("throws instead of sending an unauthenticated request when the key is unset", async () => {
    delete process.env.LINEAR_API_KEY;
    const fetchMock = stubFetch({ data: {} });

    await expect(linearRequest("query { viewer { id } }")).rejects.toThrow(/LINEAR_API_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/discord-webhook", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/discord-webhook")>()),
  postToBuildsChannel: vi.fn(async () => {}),
}));

import { getDb } from "@/lib/db";
import { postToBuildsChannel } from "@/lib/discord-webhook";
import { GET } from "../route";

const CRON = "cron-secret-for-tests";
const NOW = new Date("2026-11-24T17:00:00.000Z");
const fetchMock = vi.fn();
const linearBodies: { query: string; variables: Record<string, unknown> }[] = [];

function routeFetch() {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if (url === "https://api.linear.app/graphql") {
      const body = JSON.parse(String(init.body));
      linearBodies.push(body);
      const nodes = body.query.includes('"completed"')
        ? [{ identifier: "VGC-1", title: "Done thing" }]
        : body.query.includes('"In Review"')
          ? [{ identifier: "VGC-2", title: "Review thing" }]
          : [];
      return Response.json({ data: { team: { issues: { nodes } } } });
    }
    if (url.startsWith("https://registry.npmjs.org/")) return Response.json({ version: "999.0.0" });
    throw new Error(`unexpected fetch ${url}`);
  });
}

function makeSql(counts: number[]) {
  let i = 0;
  const sql = vi.fn(async () => [{ c: counts[i++] }]);
  vi.mocked(getDb).mockReturnValue(sql as never);
  return sql;
}

const req = (auth?: string) =>
  new Request("https://x.test/api/cron/weekly-report", { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.mocked(getDb).mockReset();
  vi.mocked(postToBuildsChannel).mockClear();
  fetchMock.mockReset();
  linearBodies.length = 0;
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("CRON_SECRET", CRON);
  vi.stubEnv("LINEAR_API_KEY", "linear-key-for-tests");
  vi.stubEnv("LINEAR_TEAM_ID", "team_test");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/cron/weekly-report — auth", () => {
  it.each([["no header", undefined], ["wrong secret", "Bearer nope"]])("returns 401 with %s and does no work", async (_l, auth) => {
    const res = await GET(req(auth));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDb).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(postToBuildsChannel).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await GET(req(`Bearer ${CRON}`))).status).toBe(401);
  });
});

describe("GET /api/cron/weekly-report — authorised run", () => {
  const auth = `Bearer ${CRON}`;

  it("posts one weekly embed with the Linear digest, growth trends and dependency updates", async () => {
    // shares tw/lw, feedback tw/lw, comments tw/lw, total
    const sql = makeSql([5, 3, 1, 4, 2, 2, 100]);
    routeFetch();

    const res = await GET(req(auth));
    await expect(res.json()).resolves.toEqual({ ok: true });

    expect(sql).toHaveBeenCalledTimes(7);
    expect(linearBodies).toHaveLength(3);
    expect(linearBodies[0].variables).toEqual({ teamId: "team_test", since: "2026-11-17T17:00:00.000Z" });

    expect(postToBuildsChannel).toHaveBeenCalledTimes(1);
    const embed = vi.mocked(postToBuildsChannel).mock.calls[0][0];
    expect(embed.title).toBe("Weekly Report (17 Nov - 24 Nov)");
    expect(embed.description).toContain("**Completed (1):**\n- VGC-1: Done thing");
    expect(embed.description).toContain("**In Review (1):**\n- VGC-2: Review thing");
    expect(embed.description).toContain("**In Progress (0):**\nNone");
    expect(embed.description).toContain("Reports: **5** (+2)\nFeedback: **1** (-3)\nComments: **2**\nTotal reports: 100");
    expect(embed.description).toMatch(/updates:\*\*\n- `next` .+ -> 999\.0\.0/);
  });

  it("skips Linear when it is not configured and still posts", async () => {
    vi.stubEnv("LINEAR_API_KEY", undefined);
    makeSql([0, 0, 0, 0, 0, 0, 0]);
    routeFetch();

    await GET(req(auth));

    expect(linearBodies).toHaveLength(0);
    expect(vi.mocked(postToBuildsChannel).mock.calls[0][0].description).toMatch(/^Linear not configured/);
  });

  it("reports a DB failure inside the embed instead of failing the cron", async () => {
    vi.mocked(getDb).mockImplementation(() => { throw new Error("db down"); });
    routeFetch();

    const res = await GET(req(auth));

    expect(res.status).toBe(200);
    expect(vi.mocked(postToBuildsChannel).mock.calls[0][0].description).toContain("**User Growth (vs last week):**\nFailed to query database");
  });
});

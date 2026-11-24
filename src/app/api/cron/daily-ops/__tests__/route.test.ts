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
const NOW = new Date("2026-11-24T09:00:00.000Z");
const HEALTHY_HTML = '<html><head><title>x</title><meta name="description" content="d"><meta property="og:image" content="i"></head></html>';

type Linear = { inProgress?: { identifier: string; title: string; updatedAt: string }[]; openOps?: { title: string }[]; labels?: { id: string; name: string }[] };

const fetchMock = vi.fn();
const linearBodies: { query: string; variables: Record<string, unknown> }[] = [];

/** Routes every outbound fetch: the site's own pages, and Linear GraphQL by query shape. */
function routeFetch(opts: { pageStatus?: Record<string, number>; linear?: Linear } = {}) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if (url === "https://api.linear.app/graphql") {
      const body = JSON.parse(String(init.body));
      linearBodies.push(body);
      const l = opts.linear ?? {};
      if (body.query.includes("[Ops Report]")) return Response.json({ data: { team: { issues: { nodes: l.openOps ?? [] } } } });
      if (body.query.includes("In Progress")) return Response.json({ data: { team: { issues: { nodes: l.inProgress ?? [] } } } });
      if (body.query.includes("labels { nodes")) return Response.json({ data: { team: { labels: { nodes: l.labels ?? [] } } } });
      if (body.query.includes("issueCreate")) return Response.json({ data: { issueCreate: { issue: { identifier: "VGC-900", url: "u" } } } });
      return Response.json({ data: {} });
    }
    const path = new URL(url).pathname;
    const status = opts.pageStatus?.[path] ?? 200;
    return new Response(status < 400 ? HEALTHY_HTML : "err", { status });
  });
}

function makeSql() {
  const queries: string[] = [];
  const sql = vi.fn(async (strings: TemplateStringsArray) => {
    const q = strings.join("?");
    queries.push(q);
    if (q.includes("pg_database_size")) return [{ db_size: "42 MB" }];
    if (q.includes("pg_tables")) return [{ tablename: "shares" }, { tablename: "feedback" }];
    return [];
  });
  vi.mocked(getDb).mockReturnValue(sql as never);
  return queries;
}

const req = (auth?: string) =>
  new Request("https://x.test/api/cron/daily-ops", { headers: auth ? { authorization: auth } : {} });

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

describe("GET /api/cron/daily-ops — auth", () => {
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
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/daily-ops — authorised run", () => {
  const auth = `Bearer ${CRON}`;

  it("all clear: purges expired guest shares, checks everything, creates no tickets, posts All Clear", async () => {
    const queries = makeSql();
    routeFetch({ linear: { inProgress: [{ identifier: "VGC-1", title: "fresh", updatedAt: "2026-11-23T00:00:00.000Z" }] } });

    const res = await GET(req(auth));
    const json = await res.json();

    expect(json).toMatchObject({ ok: true, createdTickets: [], tickets: { stale: 0, summary: "1 in progress, none stale" }, db: { ok: true, summary: "2 tables, 42 MB" } });
    expect(queries[0]).toContain("DELETE FROM quick_shares");
    // The keep-alive probe is sent with the cron bearer.
    const keepAlive = fetchMock.mock.calls.find(([u]) => u === "https://pokemonvgcteamreport.com/api/keep-alive");
    expect(keepAlive?.[1].headers.Authorization).toBe(auth);
    expect(linearBodies.some((b) => b.query.includes("issueCreate"))).toBe(false);
    expect(postToBuildsChannel).toHaveBeenCalledTimes(1);
    expect(vi.mocked(postToBuildsChannel).mock.calls[0][0].title).toBe("Daily Ops Report — All Clear");
  });

  it("homepage down: opens health (urgent) and SEO (medium) tickets with the ops label and posts Issues Found", async () => {
    makeSql();
    routeFetch({ pageStatus: { "/": 500 }, linear: { labels: [{ id: "lbl_ops", name: "ops-report" }] } });

    const json = await (await GET(req(auth))).json();

    const creates = linearBodies.filter((b) => b.query.includes("issueCreate")).map((b) => b.variables);
    expect(creates).toEqual([
      expect.objectContaining({ title: "[Ops Report] Site health check failures detected", priority: 1, labelIds: ["lbl_ops"], teamId: "team_test" }),
      expect.objectContaining({ title: "[Ops Report] SEO issues detected", priority: 3, labelIds: ["lbl_ops"] }),
    ]);
    expect(json.ok).toBe(false);
    expect(json.createdTickets).toEqual([
      "VGC-900: [Ops Report] Site health check failures detected",
      "VGC-900: [Ops Report] SEO issues detected",
    ]);
    expect(vi.mocked(postToBuildsChannel).mock.calls[0][0].title).toBe("Daily Ops Report — Issues Found");
  });

  it("does not open a duplicate when an open ticket with the same title exists, and creates the label if missing", async () => {
    makeSql();
    routeFetch({ pageStatus: { "/": 500 }, linear: { openOps: [{ title: "[Ops Report] Site health check failures detected" }] } });

    await GET(req(auth));

    expect(linearBodies.some((b) => b.query.includes("issueLabelCreate"))).toBe(true);
    const creates = linearBodies.filter((b) => b.query.includes("issueCreate(")).map((b) => b.variables.title);
    expect(creates).toEqual(["[Ops Report] SEO issues detected"]);
  });

  it("flags In Progress tickets untouched for 7+ days as stale without opening tickets for them", async () => {
    makeSql();
    routeFetch({ linear: { inProgress: [{ identifier: "VGC-7", title: "old", updatedAt: "2026-11-14T09:00:00.000Z" }] } });

    const json = await (await GET(req(auth))).json();

    expect(json.ok).toBe(false);
    expect(json.tickets).toEqual({ stale: 1, summary: "**1 stale (7d+):**\n- VGC-7: old (10d)" });
    expect(json.createdTickets).toEqual([]);
  });

  it("reports a DB failure as an urgent ticket rather than failing the cron", async () => {
    vi.mocked(getDb).mockImplementation(() => { throw new Error("db down"); });
    routeFetch();

    const res = await GET(req(auth));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.db).toEqual({ ok: false, summary: "Database connection failed" });
    const creates = linearBodies.filter((b) => b.query.includes("issueCreate(")).map((b) => b.variables);
    expect(creates).toEqual([expect.objectContaining({ title: "[Ops Report] Database health check failed", priority: 1 })]);
  });
});

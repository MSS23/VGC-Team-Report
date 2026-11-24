import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { getDb } from "@/lib/db";
import { DELETE, GET } from "../route";

const CRON = "cron-secret-for-tests";
const CLEANUP = "cleanup-secret-for-tests";

type Call = { q: string; vals: unknown[] };

/** Tagged-template sql fake: records every statement; SELECTs of share ids return the given rows. */
function makeSql(rows: { trash?: { id: string }[]; stale?: { id: string }[] } = {}) {
  const calls: Call[] = [];
  const sql = ((strings: TemplateStringsArray, ...vals: unknown[]) => {
    const q = strings.join("?");
    calls.push({ q, vals });
    if (/SELECT id FROM shares\s+WHERE deleted_at IS NOT NULL/.test(q)) return Promise.resolve(rows.trash ?? []);
    if (/SELECT id FROM shares\s+WHERE deleted_at IS NULL/.test(q)) return Promise.resolve(rows.stale ?? []);
    if (/DELETE FROM shares WHERE id = ANY/.test(q)) return Promise.resolve((vals[0] as string[]).map((id) => ({ id })));
    return Promise.resolve([]);
  }) as unknown as ReturnType<typeof getDb> & { transaction: ReturnType<typeof vi.fn> };
  sql.transaction = vi.fn(async () => []);
  vi.mocked(getDb).mockReturnValue(sql);
  return { sql, calls };
}

const req = (method: string, auth?: string, query = "") =>
  new NextRequest(`https://x.test/api/cleanup${query}`, {
    method,
    headers: auth ? { authorization: auth } : {},
  });

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.stubEnv("CRON_SECRET", CRON);
  vi.stubEnv("CLEANUP_SECRET", CLEANUP);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/cleanup — cron auth", () => {
  it.each([
    ["no header", undefined],
    ["wrong secret", "Bearer nope"],
    ["the CLEANUP_SECRET", `Bearer ${CLEANUP}`],
    ["a non-Bearer scheme", `Basic ${CRON}`],
  ])("returns 401 with %s and touches no DB", async (_label, auth) => {
    const res = await GET(req("GET", auth));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET is unset, even for 'Bearer ' with an empty secret", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(req("GET", "Bearer "))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await GET(req("GET", "Bearer undefined"))).status).toBe(401);
  });

  it("runs the cleanup with the default 90-day TTL for the cron bearer", async () => {
    const { calls } = makeSql();
    const res = await GET(req("GET", `Bearer ${CRON}`));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      deleted: 0, trashPurged: 0, versionsOrphaned: 0, changelogOrphaned: 0,
      versionsTrimmed: 0, changelogTrimmed: 0, ttlDays: 90, trashTtlDays: 30, hasMore: false,
    });
    const stale = calls.find((c) => /owner_id IS NULL/.test(c.q));
    expect(stale?.vals).toEqual([90, 500]);
  });
});

describe("DELETE /api/cleanup — CLEANUP_SECRET auth", () => {
  it.each([
    ["no header", undefined],
    ["wrong secret", "Bearer nope"],
    ["the CRON_SECRET", `Bearer ${CRON}`],
  ])("returns 401 with %s", async (_label, auth) => {
    const res = await DELETE(req("DELETE", auth));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 401 when CLEANUP_SECRET is unset", async () => {
    vi.stubEnv("CLEANUP_SECRET", undefined);
    expect((await DELETE(req("DELETE", `Bearer ${CLEANUP}`))).status).toBe(401);
  });

  it.each(["0", "-3", "abc"])("returns 400 for days=%s", async (days) => {
    makeSql();
    const res = await DELETE(req("DELETE", `Bearer ${CLEANUP}`, `?days=${days}`));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid days parameter" });
  });

  it("purges satellites in a transaction before hard-deleting trashed and stale anonymous shares", async () => {
    const { sql, calls } = makeSql({ trash: [{ id: "t1" }], stale: [{ id: "s1" }, { id: "s2" }] });
    const res = await DELETE(req("DELETE", `Bearer ${CLEANUP}`, "?days=14"));
    const json = await res.json();

    expect(json).toMatchObject({ trashPurged: 1, deleted: 2, ttlDays: 14, hasMore: false });
    expect(sql.transaction).toHaveBeenCalledTimes(2);
    const shareDeletes = calls.filter((c) => /DELETE FROM shares WHERE id = ANY/.test(c.q));
    expect(shareDeletes.map((c) => c.vals[0])).toEqual([["t1"], ["s1", "s2"]]);
    // Only anonymous shares are eligible for the stale sweep.
    expect(calls.find((c) => /owner_id IS NULL/.test(c.q))?.vals).toEqual([14, 500]);
  });

  it("returns 500 Cleanup failed when the database throws", async () => {
    vi.mocked(getDb).mockImplementation(() => { throw new Error("db down"); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await DELETE(req("DELETE", `Bearer ${CLEANUP}`));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Cleanup failed" });
  });
});

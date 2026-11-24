import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { getDb } from "@/lib/db";
import { GET } from "../route";

const CRON = "cron-secret-for-tests";
const req = (auth?: string) =>
  new Request("https://x.test/api/keep-alive", { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.stubEnv("CRON_SECRET", CRON);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/keep-alive", () => {
  it.each([["no header", undefined], ["wrong secret", "Bearer nope"]])("returns 401 with %s", async (_l, auth) => {
    const res = await GET(req(auth));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await GET(req(`Bearer ${CRON}`))).status).toBe(401);
  });

  it("runs SELECT 1 and returns ok for the cron bearer", async () => {
    const sql = vi.fn(async () => [{ "?column?": 1 }]);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await GET(req(`Bearer ${CRON}`));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect((sql.mock.calls[0] as unknown[])[0]).toEqual(["SELECT 1"]);
  });

  it("returns 500 { ok: false } when the ping fails", async () => {
    vi.mocked(getDb).mockReturnValue(vi.fn(async () => { throw new Error("db down"); }) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET(req(`Bearer ${CRON}`));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ ok: false });
  });
});

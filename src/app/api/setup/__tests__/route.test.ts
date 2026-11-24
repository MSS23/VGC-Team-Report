import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ ensureTable: vi.fn(async () => {}) }));

import { ensureTable } from "@/lib/db";
import { GET } from "../route";

const MIGRATE = "migrate-secret-for-tests";
const CRON = "cron-secret-for-tests";

const req = (auth?: string) =>
  new Request("https://x.test/api/setup", { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  vi.mocked(ensureTable).mockReset().mockResolvedValue(undefined);
  vi.stubEnv("MIGRATE_SECRET", MIGRATE);
  vi.stubEnv("CRON_SECRET", CRON);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/setup — auth", () => {
  it("returns 401 when neither secret is set", async () => {
    vi.stubEnv("MIGRATE_SECRET", undefined);
    vi.stubEnv("CRON_SECRET", undefined);
    const res = await GET(req(`Bearer ${MIGRATE}`));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(ensureTable).not.toHaveBeenCalled();
  });

  it.each([["no header", undefined], ["wrong secret", "Bearer nope"], ["non-Bearer scheme", MIGRATE]])(
    "returns 401 with %s",
    async (_label, auth) => {
      const res = await GET(req(auth));
      expect(res.status).toBe(401);
      expect(ensureTable).not.toHaveBeenCalled();
    },
  );

  it("accepts the MIGRATE_SECRET bearer and creates the tables", async () => {
    const res = await GET(req(`Bearer ${MIGRATE}`));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, message: "Table created" });
    expect(ensureTable).toHaveBeenCalledTimes(1);
  });

  it("accepts the CRON_SECRET bearer while MIGRATE_SECRET is also set", async () => {
    expect((await GET(req(`Bearer ${CRON}`))).status).toBe(200);
  });

  it("accepts the CRON_SECRET bearer when MIGRATE_SECRET is unset", async () => {
    vi.stubEnv("MIGRATE_SECRET", undefined);
    expect((await GET(req(`Bearer ${CRON}`))).status).toBe(200);
  });

  it("returns 401 for a valid CRON_SECRET bearer when MIGRATE_SECRET is an empty string", async () => {
    // Documents current behaviour: `MIGRATE_SECRET ?? CRON_SECRET` keeps "" and the first check fails closed.
    vi.stubEnv("MIGRATE_SECRET", "");
    const res = await GET(req(`Bearer ${CRON}`));
    expect(res.status).toBe(401);
    expect(ensureTable).not.toHaveBeenCalled();
  });

  it("returns 500 Setup failed when ensureTable throws", async () => {
    vi.mocked(ensureTable).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET(req(`Bearer ${MIGRATE}`));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Setup failed" });
  });
});

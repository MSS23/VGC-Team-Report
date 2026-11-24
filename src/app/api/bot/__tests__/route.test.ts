import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendWeeklySummary: vi.fn(), buildWeeklySummaryHtml: vi.fn(() => "<p/>") }));

import { getDb } from "@/lib/db";
import { sendWeeklySummary } from "@/lib/email";
import { GET } from "../route";

const CRON = "cron-secret-for-tests";
const fetchMock = vi.fn();

const req = (action: string, auth?: string) =>
  new NextRequest(`https://x.test/api/bot?action=${action}`, { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(sendWeeklySummary).mockReset();
  fetchMock.mockReset().mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("CRON_SECRET", CRON);
  vi.stubEnv("DISCORD_FEEDBACK_CHANNEL_ID", "chan_1");
  vi.stubEnv("DISCORD_BOT_TOKEN", "bot-token-for-tests");
  vi.stubEnv("SUMMARY_EMAIL", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/bot — auth", () => {
  it.each([["no header", undefined], ["wrong secret", "Bearer nope"]])("returns 401 with %s", async (_l, auth) => {
    const res = await GET(req("popular", auth));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDb).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", undefined);
    expect((await GET(req("popular", `Bearer ${CRON}`))).status).toBe(401);
  });
});

describe("GET /api/bot — authorised", () => {
  const auth = `Bearer ${CRON}`;

  it("returns 500 when the feedback channel is not configured", async () => {
    vi.stubEnv("DISCORD_FEEDBACK_CHANNEL_ID", undefined);
    const res = await GET(req("popular", auth));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Channel not configured" });
  });

  it("returns 400 for an unknown action", async () => {
    vi.mocked(getDb).mockReturnValue(vi.fn() as never);
    const res = await GET(req("nope", auth));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Unknown action. Use: summary, popular, bugs, weekly-email" });
  });

  it("popular: queries feature requests and posts one embed to the channel as the bot", async () => {
    const sql = vi.fn(async () => [{ title: "Dark mode", type: "feature", count: 3 }]);
    vi.mocked(getDb).mockReturnValue(sql as never);

    const res = await GET(req("popular", auth));
    await expect(res.json()).resolves.toEqual({ success: true, action: "popular" });

    expect(sql).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://discord.com/api/v10/channels/chan_1/messages");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bot bot-token-for-tests");
    expect(JSON.parse(init.body).embeds[0].description).toBe("1. **Dark mode** — 3x requested");
  });

  it("returns 500 Failed when DISCORD_BOT_TOKEN is unset", async () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", undefined);
    vi.mocked(getDb).mockReturnValue(vi.fn(async () => []) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await GET(req("popular", auth));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("weekly-email: returns 500 without sending when SUMMARY_EMAIL is unset", async () => {
    vi.mocked(getDb).mockReturnValue(vi.fn(async () => [{ total: 0, bugs: 0, features: 0, improvements: 0, other_count: 0, count: 0, title: "t", type: "bug" }]) as never);
    const res = await GET(req("weekly-email", auth));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "SUMMARY_EMAIL not set" });
    expect(sendWeeklySummary).not.toHaveBeenCalled();
  });
});

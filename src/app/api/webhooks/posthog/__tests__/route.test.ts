import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/linear", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/linear")>()),
  linearFetch: vi.fn(),
}));
vi.mock("@/lib/discord-webhook", () => ({
  resolveDiscordWebhook: vi.fn(() => null),
  postDiscordWebhook: vi.fn(async () => true),
}));

import { LINEAR_LABEL_IDS, linearFetch } from "@/lib/linear";
import { postDiscordWebhook, resolveDiscordWebhook } from "@/lib/discord-webhook";
import { GET, POST } from "../route";

const TOKEN = "posthog-shared-token-for-tests";

function req(body: unknown, token: string | null = TOKEN) {
  const headers: Record<string, string> = {};
  if (token !== null) headers["x-posthog-token"] = token;
  return new Request("https://x.test/api/webhooks/posthog", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// The route dedups in module memory for an hour, so every delivery needs its own fingerprint.
let n = 0;
const exception = () => ({
  event: "$exception",
  timestamp: "2026-11-01T00:00:00.000Z",
  person: { distinct_id: "d1", properties: { email: "t@example.test" } },
  properties: { $exception_message: `boom ${++n}`, $current_url: "https://site.test/x" },
});

const fetchMock = vi.fn();

beforeEach(() => {
  vi.mocked(linearFetch).mockReset();
  vi.mocked(resolveDiscordWebhook).mockReset().mockReturnValue(null);
  vi.mocked(postDiscordWebhook).mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("POSTHOG_WEBHOOK_SECRET", TOKEN);
  vi.stubEnv("LINEAR_API_KEY", "linear-key-for-tests");
  vi.stubEnv("LINEAR_TEAM_ID", "team_test");
  vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "");
  vi.stubEnv("POSTHOG_PROJECT_ID", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/posthog — shared token", () => {
  it("returns 401 when POSTHOG_WEBHOOK_SECRET is unset, even if a token is sent", async () => {
    vi.stubEnv("POSTHOG_WEBHOOK_SECRET", undefined);
    const res = await POST(req(exception()));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(linearFetch).not.toHaveBeenCalled();
  });

  it("returns 401 when POSTHOG_WEBHOOK_SECRET is empty and the token header is empty", async () => {
    vi.stubEnv("POSTHOG_WEBHOOK_SECRET", "");
    const res = await POST(req(exception(), ""));
    expect(res.status).toBe(401);
  });

  it("returns 401 when the token header is missing", async () => {
    const res = await POST(req(exception(), null));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 401 for a wrong token of the same length and of a different length", async () => {
    for (const bad of [TOKEN.replace(/.$/, "X"), "short"]) {
      const res = await POST(req(exception(), bad));
      expect(res.status).toBe(401);
    }
    expect(linearFetch).not.toHaveBeenCalled();
  });

  it("GET is 405 with an Allow: POST header", async () => {
    const res = GET();
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });
});

describe("POST /api/webhooks/posthog — accepted deliveries", () => {
  it("creates one Linear issue for an exception and notifies Discord when a webhook resolves", async () => {
    vi.mocked(resolveDiscordWebhook).mockReturnValue("https://discord.test/hook");
    vi.mocked(linearFetch).mockResolvedValue(new Response(JSON.stringify({
      data: { issueCreate: { success: true, issue: { identifier: "VGC-1", url: "https://linear.test/VGC-1" } } },
    })));
    const payload = exception();

    const res = await POST(req(payload));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, issue: { identifier: "VGC-1", url: "https://linear.test/VGC-1" } });
    expect(linearFetch).toHaveBeenCalledTimes(1);
    const [query, vars, timeout] = vi.mocked(linearFetch).mock.calls[0];
    expect(query).toContain("issueCreate");
    expect(vars).toMatchObject({
      title: `[PostHog] Error: ${payload.properties.$exception_message}`,
      teamId: "team_test",
      priority: 2,
      labelIds: [LINEAR_LABEL_IDS.bug, LINEAR_LABEL_IDS.webApp, LINEAR_LABEL_IDS.analytics],
    });
    expect(timeout).toBe(5000);
    expect(resolveDiscordWebhook).toHaveBeenCalledWith("DISCORD_BUILDS_WEBHOOK");
    expect(postDiscordWebhook).toHaveBeenCalledTimes(1);
    // No session id and no PostHog personal key: no timeline fetch goes out.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips a repeat of the same error inside the dedup window without calling Linear again", async () => {
    vi.mocked(linearFetch).mockResolvedValue(new Response(JSON.stringify({
      data: { issueCreate: { success: true, issue: { identifier: "VGC-2", url: "u" } } },
    })));
    const payload = exception();
    await POST(req(payload));
    const res = await POST(req(payload));
    await expect(res.json()).resolves.toEqual({ ok: true, skipped: true, reason: "duplicate within dedup window" });
    expect(linearFetch).toHaveBeenCalledTimes(1);
  });

  it("returns 200 { ok: false } when Linear is not configured", async () => {
    vi.stubEnv("LINEAR_API_KEY", "");
    const res = await POST(req(exception()));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: false, error: "Linear not configured" });
    expect(linearFetch).not.toHaveBeenCalled();
  });

  it("returns 200 { ok: false, error: internal } for an authorised but malformed JSON body", async () => {
    const res = await POST(req("{not json"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: false, error: "internal" });
  });
});

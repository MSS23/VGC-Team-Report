import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  discordWebhooksDisabled,
  isValidDiscordWebhookUrl,
  postDiscordWebhook,
  postEmbedToWebhook,
  redactWebhookUrl,
  resolveDiscordWebhook,
} from "../discord-webhook";

// Assembled from fragments so this file never contains a credential-shaped literal
// (the no-hardcoded-secrets scanner runs over its own test sources).
const ID = "11112222" + "33334444" + "55";
const TOKEN = "Ab1".repeat(24);
const GOOD = `https://discord.com/api/webhooks/${ID}/${TOKEN}`;

describe("discord webhook URL validation", () => {
  it("accepts official Discord webhook URLs", () => {
    expect(isValidDiscordWebhookUrl(GOOD)).toBe(true);
    expect(isValidDiscordWebhookUrl(GOOD + "/")).toBe(true);
    expect(isValidDiscordWebhookUrl(GOOD.replace("discord.com", "discordapp.com"))).toBe(true);
    expect(isValidDiscordWebhookUrl(`  ${GOOD}  `)).toBe(true);
  });

  it.each([
    ["http (not https)", GOOD.replace("https://", "http://")],
    ["lookalike host", GOOD.replace("discord.com", "discord.com.evil.example")],
    ["attacker host", `https://evil.example/api/webhooks/${ID}/${TOKEN}`],
    ["userinfo trick", `https://discord.com@evil.example/api/webhooks/${ID}/${TOKEN}`],
    ["non-numeric id", `https://discord.com/api/webhooks/not-a-snowflake/${TOKEN}`],
    ["short token", `https://discord.com/api/webhooks/${ID}/short`],
    ["placeholder", "https://discord.com/api/webhooks/xxxx/xxxx"],
    ["query string", `${GOOD}?wait=true`],
    ["empty", ""],
  ])("rejects %s", (_label, url) => {
    expect(isValidDiscordWebhookUrl(url)).toBe(false);
  });
});

describe("redactWebhookUrl", () => {
  it("keeps the id but never the token", () => {
    const out = redactWebhookUrl(GOOD);
    expect(out).toContain(ID);
    expect(out).not.toContain(TOKEN);
    expect(out.endsWith("/***")).toBe(true);
  });
});

describe("resolveDiscordWebhook", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  it("returns null when unset", () => {
    expect(resolveDiscordWebhook("DISCORD_BUILDS_WEBHOOK", {})).toBeNull();
  });

  it("returns the URL when valid", () => {
    expect(resolveDiscordWebhook("DISCORD_BUILDS_WEBHOOK", { DISCORD_BUILDS_WEBHOOK: GOOD })).toBe(GOOD);
  });

  it("refuses an invalid URL and logs without the token", () => {
    const bad = `https://evil.example/api/webhooks/${ID}/${TOKEN}`;
    expect(resolveDiscordWebhook("DISCORD_FEEDBACK_WEBHOOK", { DISCORD_FEEDBACK_WEBHOOK: bad })).toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0][0])).not.toContain(TOKEN);
  });

  it("honours the DISCORD_WEBHOOKS_DISABLED kill switch", () => {
    for (const v of ["1", "true", "YES"]) {
      expect(discordWebhooksDisabled({ DISCORD_WEBHOOKS_DISABLED: v })).toBe(true);
      expect(resolveDiscordWebhook("DISCORD_BUILDS_WEBHOOK", { DISCORD_BUILDS_WEBHOOK: GOOD, DISCORD_WEBHOOKS_DISABLED: v })).toBeNull();
    }
    expect(discordWebhooksDisabled({ DISCORD_WEBHOOKS_DISABLED: "0" })).toBe(false);
    expect(discordWebhooksDisabled({})).toBe(false);
  });
});

describe("postDiscordWebhook", () => {
  const fetchMock = vi.fn();
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    errorSpy.mockRestore();
  });

  it("never fetches a non-Discord URL", async () => {
    const ok = await postDiscordWebhook(`https://evil.example/api/webhooks/${ID}/${TOKEN}`, { content: "x" });
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs JSON to a valid webhook and reports success", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const ok = await postDiscordWebhook(GOOD, { content: "hello" });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(GOOD);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ content: "hello" });
  });

  it("logs a dead webhook (404/410) with the token redacted and does not throw", async () => {
    fetchMock.mockResolvedValue(new Response('{"message":"Unknown Webhook"}', { status: 404 }));
    const ok = await postDiscordWebhook(GOOD, { content: "x" });
    expect(ok).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = String(errorSpy.mock.calls[0][0]);
    expect(line).toContain("404");
    expect(line).not.toContain(TOKEN);
  });

  it("swallows network errors and redacts the token", async () => {
    fetchMock.mockRejectedValue(new Error(`ECONNRESET to ${GOOD}`));
    const ok = await postDiscordWebhook(GOOD, { content: "x" });
    expect(ok).toBe(false);
    // The thrown message itself echoed the full URL; the log line must not.
    expect(String(errorSpy.mock.calls[0][0])).not.toContain(TOKEN);
  });
});

describe("postEmbedToWebhook", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.DISCORD_BUILDS_WEBHOOK;
    delete process.env.DISCORD_WEBHOOKS_DISABLED;
  });

  it("skips silently when the env var is unset", async () => {
    expect(await postEmbedToWebhook("DISCORD_BUILDS_WEBHOOK", { title: "t", description: "d", color: 1 })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends nothing while the kill switch is on, even with a URL configured", async () => {
    process.env.DISCORD_BUILDS_WEBHOOK = GOOD;
    process.env.DISCORD_WEBHOOKS_DISABLED = "1";
    expect(await postEmbedToWebhook("DISCORD_BUILDS_WEBHOOK", { title: "t", description: "d", color: 1 })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("adds a timestamp and posts the embed", async () => {
    process.env.DISCORD_BUILDS_WEBHOOK = GOOD;
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    expect(await postEmbedToWebhook("DISCORD_BUILDS_WEBHOOK", { title: "t", description: "d", color: 1 })).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.embeds[0].title).toBe("t");
    expect(typeof body.embeds[0].timestamp).toBe("string");
  });
});

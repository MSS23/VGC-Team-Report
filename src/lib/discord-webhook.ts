/**
 * Discord webhook helpers for automated notifications.
 * Used by cron routes, the feedback route and the PostHog webhook — separate
 * from the bot integration in `discord-bot.ts`.
 *
 * SECURITY (Nov 2026 incident — a live webhook was abused):
 *   - Webhook URLs are read ONLY from the environment, never from source.
 *   - `resolveDiscordWebhook` rejects anything that is not a real
 *     `https://discord.com/api/webhooks/<id>/<token>` URL. A tampered or
 *     mistyped env var therefore cannot turn these helpers into an open
 *     server-side request forwarder.
 *   - Every log line goes through `redactWebhookUrl`; the token half of a
 *     webhook URL must never reach Vercel logs.
 *   - `DISCORD_WEBHOOKS_DISABLED=1` is a kill switch: every helper becomes a
 *     silent no-op without a redeploy. Use it while rotating a leaked webhook.
 */

import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
  url?: string;
}

/** Env var names that may hold a Discord webhook URL. */
export type DiscordWebhookEnv = "DISCORD_BUILDS_WEBHOOK" | "DISCORD_FEEDBACK_WEBHOOK";

/**
 * Strict shape of a Discord webhook URL: official hosts only, numeric
 * snowflake id, URL-safe token. `discordapp.com` is Discord's legacy domain
 * and still serves webhooks.
 */
const WEBHOOK_URL =
  /^https:\/\/(?:discord\.com|discordapp\.com|canary\.discord\.com|ptb\.discord\.com)\/api\/webhooks\/(\d{17,20})\/([A-Za-z0-9_-]{40,})\/?$/;

const DEFAULT_TIMEOUT_MS = 5000;

/** `https://discord.com/api/webhooks/123…/<token>` → `https://discord.com/api/webhooks/123…/***` */
export function redactWebhookUrl(url: string): string {
  return url.replace(/(\/api\/webhooks\/\d+\/)[^\s/?#]+/g, "$1***");
}

export function isValidDiscordWebhookUrl(url: string): boolean {
  return WEBHOOK_URL.test(url.trim());
}

/** Whether all outbound Discord webhook traffic is switched off. */
/** Minimal env shape so tests can pass plain objects. */
export type EnvLike = Record<string, string | undefined>;

export function discordWebhooksDisabled(env: EnvLike = process.env): boolean {
  const v = (env.DISCORD_WEBHOOKS_DISABLED ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * Read a webhook URL from the environment and validate it.
 * Returns `null` (and logs why, without the token) when it is unset, invalid,
 * or the kill switch is on. Callers treat `null` as "skip the notification".
 */
export function resolveDiscordWebhook(
  name: DiscordWebhookEnv,
  env: EnvLike = process.env,
): string | null {
  if (discordWebhooksDisabled(env)) return null;
  const raw = env[name]?.trim();
  if (!raw) {
    console.warn(`${name} not set, skipping Discord notification`);
    return null;
  }
  if (!isValidDiscordWebhookUrl(raw)) {
    console.error(`${name} is not a valid Discord webhook URL; refusing to send (${redactWebhookUrl(raw).slice(0, 80)})`);
    return null;
  }
  return raw;
}

/**
 * POST a payload to a validated webhook URL. Never throws: a dead webhook
 * (404/410 after deletion, 429 rate limit) is logged with the token redacted
 * so the crons do not look healthy while the channel hears nothing.
 * Returns true only on a 2xx response.
 */
export async function postDiscordWebhook(
  url: string,
  payload: { content?: string; embeds?: DiscordEmbed[] },
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<boolean> {
  if (!isValidDiscordWebhookUrl(url)) {
    console.error(`Refusing to POST to non-Discord webhook URL (${redactWebhookUrl(url).slice(0, 80)})`);
    return false;
  }
  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      timeoutMs,
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`Discord webhook ${redactWebhookUrl(url)} failed: ${res.status} ${text.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (e) {
    // Fetch/undici error messages can embed the request URL, token included —
    // redact the reason as well as the URL before it reaches the logs.
    const reason = e instanceof Error && e.name === "AbortError" ? "timed out" : redactWebhookUrl(String(e instanceof Error ? e.message : e));
    console.error(`Discord webhook ${redactWebhookUrl(url)} error: ${reason}`);
    return false;
  }
}

/** Send one embed to the env-configured webhook, or silently skip. */
export async function postEmbedToWebhook(name: DiscordWebhookEnv, embed: DiscordEmbed): Promise<boolean> {
  const url = resolveDiscordWebhook(name);
  if (!url) return false;
  return postDiscordWebhook(url, {
    embeds: [{ ...embed, timestamp: embed.timestamp ?? new Date().toISOString() }],
  });
}

export async function postToBuildsChannel(embed: DiscordEmbed): Promise<void> {
  await postEmbedToWebhook("DISCORD_BUILDS_WEBHOOK", embed);
}

/** Color constants for Discord embeds */
export const COLORS = {
  success: 0x57f287,  // green
  warning: 0xfee75c,  // yellow
  error: 0xed4245,    // red
  info: 0x5865f2,     // blurple
  neutral: 0x95a5a6,  // grey
} as const;

/**
 * Discord webhook helpers for automated notifications.
 * Used by cron routes and workflows — separate from the bot integration.
 */

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export async function postToBuildsChannel(embed: DiscordEmbed): Promise<void> {
  const url = process.env.DISCORD_BUILDS_WEBHOOK;
  if (!url) {
    console.warn("DISCORD_BUILDS_WEBHOOK not set, skipping notification");
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{ ...embed, timestamp: embed.timestamp ?? new Date().toISOString() }],
    }),
  });
  // A dead webhook (410 after deletion, 429 rate limit) otherwise fails
  // silently and the crons look healthy while #builds hears nothing.
  if (!res.ok) {
    console.error(`Discord builds webhook failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
}

/** Color constants for Discord embeds */
export const COLORS = {
  success: 0x57f287,  // green
  warning: 0xfee75c,  // yellow
  error: 0xed4245,    // red
  info: 0x5865f2,     // blurple
  neutral: 0x95a5a6,  // grey
} as const;

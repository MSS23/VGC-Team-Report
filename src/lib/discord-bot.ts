/**
 * Discord bot utilities for the VGC Team Report feedback system.
 * Posts rich embeds, manages threads, and responds to commands.
 * Uses Discord REST API (no gateway/websocket — works in serverless).
 */

const DISCORD_API = "https://discord.com/api/v10";

function getConfig() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_FEEDBACK_CHANNEL_ID;
  return { token, channelId, configured: !!(token && channelId) };
}

async function discordFetch(path: string, options: RequestInit = {}) {
  const { token } = getConfig();
  if (!token) throw new Error("DISCORD_BOT_TOKEN not set");

  const res = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Discord API ${res.status}: ${text}`);
  }

  return res.json();
}

const TYPE_COLORS: Record<string, number> = {
  feature: 0x10b981,
  bug: 0xef4444,
  improvement: 0xf59e0b,
  other: 0x3b82f6,
};

const TYPE_EMOJI: Record<string, string> = {
  feature: "\uD83D\uDCA1",
  bug: "\uD83D\uDC1B",
  improvement: "\u26A1",
  other: "\uD83D\uDCAC",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "\uD83D\uDD34 Urgent",
  2: "\uD83D\uDFE0 High",
  3: "\uD83D\uDFE1 Normal",
  4: "\u26AA Low",
};

/**
 * Post a rich feedback embed to the feedback channel and create/find a topic thread.
 */
export async function postFeedbackEmbed(opts: {
  type: string;
  title: string;
  description: string;
  submitterName: string;
  contact?: string;
  device?: string;
  browser?: string;
  screenSize?: string;
  linearUrl?: string;
  linearIdentifier?: string;
}) {
  const { channelId, configured } = getConfig();
  if (!configured) return null;

  const emoji = TYPE_EMOJI[opts.type] ?? "\uD83D\uDCAC";
  const color = TYPE_COLORS[opts.type] ?? 0x6366f1;
  const typeLabel = opts.type.charAt(0).toUpperCase() + opts.type.slice(1);

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    { name: "Description", value: opts.description.slice(0, 1024), inline: false },
    { name: "Submitted by", value: opts.submitterName, inline: true },
    { name: "Type", value: `${emoji} ${typeLabel}`, inline: true },
  ];

  if (opts.contact) {
    fields.push({ name: "Contact", value: opts.contact, inline: true });
  }
  if (opts.device || opts.browser) {
    fields.push({
      name: "Device",
      value: [opts.device, opts.browser, opts.screenSize].filter(Boolean).join(" / "),
      inline: true,
    });
  }
  if (opts.linearUrl && opts.linearIdentifier) {
    fields.push({
      name: "Linear",
      value: `[${opts.linearIdentifier}](${opts.linearUrl})`,
      inline: true,
    });
  }

  // Post the embed
  const message = await discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      embeds: [{
        title: `${emoji} ${typeLabel}: ${opts.title}`,
        color,
        fields,
        footer: { text: "VGC Team Report Feedback" },
        timestamp: new Date().toISOString(),
      }],
    }),
  });

  // Try to find an existing thread with a similar topic, or create one
  try {
    const threadName = `${emoji} ${opts.title.slice(0, 90)}`;
    await discordFetch(`/channels/${channelId}/messages/${message.id}/threads`, {
      method: "POST",
      body: JSON.stringify({
        name: threadName,
        auto_archive_duration: 10080, // 7 days
      }),
    });
  } catch {
    // Thread creation is non-critical
  }

  // Add reactions for quick voting
  try {
    await discordFetch(`/channels/${channelId}/messages/${message.id}/reactions/%F0%9F%91%8D/@me`, {
      method: "PUT",
      body: null,
    });
    await discordFetch(`/channels/${channelId}/messages/${message.id}/reactions/%F0%9F%91%8E/@me`, {
      method: "PUT",
      body: null,
    });
  } catch {
    // Reactions are non-critical
  }

  return message;
}

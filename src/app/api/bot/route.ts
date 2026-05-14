import { getDb } from "@/lib/db";
import { sendWeeklySummary, buildWeeklySummaryHtml } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const DISCORD_API = "https://discord.com/api/v10";

async function discordFetch(path: string, options: RequestInit = {}) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not set");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let response: Response;
  try {
    response = await fetch(`${DISCORD_API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${token}`,
        ...options.headers,
      },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Discord API request timed out: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  return response;
}

async function sendDiscordMessage(channelId: string, content: string, embeds?: unknown[]) {
  await discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: content || undefined, embeds }),
  });
}

/**
 * GET /api/bot?action=summary|popular|bugs|weekly-email
 * Called by scheduled triggers or manually.
 * Protected by a simple secret check.
 */
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  // Require CRON_SECRET via Authorization: Bearer header to avoid logging secrets in access logs.
  // Fail closed when CRON_SECRET is unset; use timing-safe comparison to prevent timing oracles.
  const authHeader = request.headers.get("authorization") ?? "";
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expected = `Bearer ${expectedSecret}`;
  const { timingSafeEqual } = await import("crypto");
  const aLen = Math.max(authHeader.length, expected.length);
  if (!timingSafeEqual(Buffer.from(authHeader.padEnd(aLen)), Buffer.from(expected.padEnd(aLen))) || authHeader.length !== expected.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channelId = process.env.DISCORD_FEEDBACK_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.json({ error: "Channel not configured" }, { status: 500 });
  }

  const sql = getDb();

  try {
    if (action === "summary" || action === "weekly-email") {
      // Get feedback stats for the last 7 days
      const stats = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE type = 'bug') as bugs,
          COUNT(*) FILTER (WHERE type = 'feature') as features,
          COUNT(*) FILTER (WHERE type = 'improvement') as improvements,
          COUNT(*) FILTER (WHERE type = 'other') as other_count
        FROM feedback
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;

      const recent = await sql`
        SELECT type, title, submitter_name, created_at
        FROM feedback
        WHERE created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      // Find trending: group similar titles
      const allRecent = await sql`
        SELECT title, type FROM feedback
        WHERE created_at > NOW() - INTERVAL '30 days'
      `;

      // Simple keyword clustering — count repeated words in titles
      const wordCounts: Record<string, { count: number; titles: Set<string> }> = {};
      for (const row of allRecent) {
        const title = (row.title as string).toLowerCase();
        const words = title.split(/\s+/).filter((w) => w.length > 3);
        for (const word of words) {
          if (!wordCounts[word]) wordCounts[word] = { count: 0, titles: new Set() };
          wordCounts[word].count++;
          wordCounts[word].titles.add(row.title as string);
        }
      }

      const trending = Object.entries(wordCounts)
        .filter(([, v]) => v.count >= 2)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([, v]) => ({
          title: [...v.titles][0] ?? "",
          count: v.count,
        }));

      const openBugs = await sql`
        SELECT COUNT(*) as count FROM feedback
        WHERE type = 'bug' AND status = 'new'
      `;

      const s = stats[0];
      const total = Number(s.total);
      const bugs = Number(s.bugs);
      const features = Number(s.features);
      const improvements = Number(s.improvements);

      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 86400000);
      const weekLabel = `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

      if (action === "weekly-email") {
        const email = process.env.SUMMARY_EMAIL;
        if (!email) {
          return NextResponse.json({ error: "SUMMARY_EMAIL not set" }, { status: 500 });
        }

        const html = buildWeeklySummaryHtml({
          totalNew: total,
          bugs,
          features,
          improvements,
          other: Number(s.other_count),
          topRequests: trending,
          recentItems: recent.map((r) => ({
            type: r.type as string,
            title: r.title as string,
            submitter: (r.submitter_name as string) ?? "Unknown",
            date: new Date(r.created_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          })),
          openBugs: Number(openBugs[0].count),
          weekLabel,
        });

        await sendWeeklySummary({
          to: email,
          subject: `VGC Team Report — Week of ${weekLabel}`,
          html,
        });

        return NextResponse.json({ success: true, action: "weekly-email" });
      }

      // Discord summary
      const embed = {
        title: "📊 Weekly Feedback Summary",
        description: `**${weekLabel}**`,
        color: 0xe11d48,
        fields: [
          { name: "Total New", value: `**${total}**`, inline: true },
          { name: "🐛 Bugs", value: `**${bugs}**`, inline: true },
          { name: "💡 Features", value: `**${features}**`, inline: true },
          { name: "⚡ Improvements", value: `**${improvements}**`, inline: true },
          { name: "🐛 Open Bugs", value: `**${Number(openBugs[0].count)}**`, inline: true },
          ...(trending.length > 0 ? [{
            name: "🔥 Trending",
            value: trending.map((t, i) => `${i + 1}. **${t.title}** (${t.count}x)`).join("\n"),
            inline: false,
          }] : []),
        ],
        footer: { text: "VGC Team Report" },
        timestamp: new Date().toISOString(),
      };

      await sendDiscordMessage(channelId, "", [embed]);
      return NextResponse.json({ success: true, action: "summary" });
    }

    if (action === "popular") {
      const popular = await sql`
        SELECT title, type, COUNT(*) as count
        FROM feedback
        WHERE type = 'feature' AND created_at > NOW() - INTERVAL '90 days'
        GROUP BY title, type
        ORDER BY count DESC
        LIMIT 10
      `;

      const lines = popular.map((r, i) =>
        `${i + 1}. **${r.title}** — ${r.count}x requested`
      ).join("\n");

      const embed = {
        title: "🔥 Most Requested Features",
        description: lines || "No feature requests yet.",
        color: 0x10b981,
        footer: { text: "Last 90 days" },
      };

      await sendDiscordMessage(channelId, "", [embed]);
      return NextResponse.json({ success: true, action: "popular" });
    }

    if (action === "bugs") {
      const bugs = await sql`
        SELECT title, submitter_name, created_at
        FROM feedback
        WHERE type = 'bug' AND status = 'new'
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const lines = bugs.map((r) => {
        const date = new Date(r.created_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        return `🐛 **${r.title}** — ${r.submitter_name ?? "Unknown"} (${date})`;
      }).join("\n");

      const embed = {
        title: "🐛 Open Bugs",
        description: lines || "No open bugs! 🎉",
        color: 0xef4444,
        footer: { text: `${bugs.length} open bug${bugs.length !== 1 ? "s" : ""}` },
      };

      await sendDiscordMessage(channelId, "", [embed]);
      return NextResponse.json({ success: true, action: "bugs" });
    }

    return NextResponse.json({ error: "Unknown action. Use: summary, popular, bugs, weekly-email" }, { status: 400 });
  } catch (e) {
    console.error("Bot action error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

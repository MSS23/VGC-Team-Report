import { NextRequest, NextResponse } from "next/server";

const DISCORD_BUILDS_WEBHOOK = process.env.DISCORD_BUILDS_WEBHOOK;
const BUILDER_SECRET = process.env.BUILDER_SECRET;

const EVENTS: Record<string, { title: string; color: number }> = {
  "no-work":   { title: "\ud83d\udd0d No Work Found",  color: 9807270  },  // grey
  "started":   { title: "\u2692\ufe0f Build Started",   color: 16753920 },  // orange
  "complete":  { title: "\u2705 Build Complete",        color: 5763719  },  // green
  "failed":    { title: "\u274c Build Failed",          color: 15548997 },  // red
};

/**
 * GET /api/builder/notify?secret=...&event=started&id=VGC-9&title=Fix+bug&detail=optional+extra+text
 *
 * Proxy for the cloud builder sandbox. Posts a build status embed to the
 * Discord #builds channel via webhook.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const secret = params.get("secret");
  if (!BUILDER_SECRET || secret !== BUILDER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!DISCORD_BUILDS_WEBHOOK) {
    return NextResponse.json({ error: "DISCORD_BUILDS_WEBHOOK not configured" }, { status: 500 });
  }

  const event = params.get("event") ?? "started";
  const issueId = params.get("id") ?? "";
  const issueTitle = params.get("title") ?? "";
  const detail = params.get("detail") ?? "";

  const eventConfig = EVENTS[event] ?? EVENTS["started"];

  let description = "";
  switch (event) {
    case "no-work":
      description = "Checked Linear \u2014 no issues in In Progress. Waiting for next run.";
      break;
    case "started":
      description = `**${issueId}: ${issueTitle}**\nClaude is now implementing this issue.`;
      break;
    case "complete":
      description = `**${issueId}: ${issueTitle}**\nPushed to main and moved to In Review.\n\nChanges will auto-deploy to [pokemonvgcteamreport.com](https://pokemonvgcteamreport.com) via Vercel.`;
      break;
    case "failed":
      description = `**${issueId}: ${issueTitle}**\nImplementation had errors. Issue remains In Progress for manual review.${detail ? `\n\n${detail}` : ""}`;
      break;
    default:
      description = detail || `${issueId}: ${issueTitle}`;
  }

  try {
    const res = await fetch(DISCORD_BUILDS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: eventConfig.title,
          description,
          color: eventConfig.color,
          footer: { text: "VGC Team Report Builder" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Discord webhook failed:", res.status, text);
      return NextResponse.json({ error: "Discord webhook failed", status: res.status }, { status: 502 });
    }

    return NextResponse.json({ ok: true, event });
  } catch (e) {
    console.error("Builder notify error:", e);
    return NextResponse.json({ error: "Failed to post to Discord" }, { status: 500 });
  }
}

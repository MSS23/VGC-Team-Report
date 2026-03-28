import { isCronAuthorized } from "@/lib/cron-auth";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

const LINEAR_API = "https://api.linear.app/graphql";
const STALE_DAYS = 7;

async function linearQuery(query: string) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY not set");

  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  return data.data;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) {
    return NextResponse.json({ error: "LINEAR_TEAM_ID not set" }, { status: 500 });
  }

  try {
    const data = await linearQuery(`{
      team(id: "${teamId}") {
        issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) {
          nodes {
            identifier
            title
            updatedAt
            assignee { name }
          }
        }
      }
    }`);

    const now = Date.now();
    const staleThreshold = STALE_DAYS * 24 * 60 * 60 * 1000;
    const issues = data.team.issues.nodes;

    const stale = issues.filter(
      (i: { updatedAt: string }) => now - new Date(i.updatedAt).getTime() > staleThreshold
    );

    if (stale.length > 0) {
      const list = stale
        .map((i: { identifier: string; title: string; updatedAt: string }) => {
          const daysAgo = Math.floor((now - new Date(i.updatedAt).getTime()) / (24 * 60 * 60 * 1000));
          return `- **${i.identifier}**: ${i.title} (${daysAgo}d stale)`;
        })
        .join("\n");

      await postToBuildsChannel({
        title: `${stale.length} Stale Ticket${stale.length > 1 ? "s" : ""} Detected`,
        description: `These issues have been "In Progress" for ${STALE_DAYS}+ days with no updates:\n\n${list}\n\nConsider moving them back to Todo or breaking them down.`,
        color: COLORS.warning,
        footer: { text: "VGC Ticket Monitor" },
      });
    }

    return NextResponse.json({ ok: true, stale: stale.length, total: issues.length });
  } catch (e) {
    console.error("Stale ticket check failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

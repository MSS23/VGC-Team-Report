import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import nacl from "tweetnacl";

const LINEAR_API = "https://api.linear.app/graphql";
const DISCORD_PUBLIC_KEY = "44b2cb02932ad5b5eae681352246314ffb23ecd299c2490d7875d5883e5596ae";

// Discord interaction types
const PING = 1;
const APPLICATION_COMMAND = 2;
// Response types
const PONG = 1;
const CHANNEL_MESSAGE = 4;

function getLinearAuth() {
  return process.env.LINEAR_API_KEY ?? "";
}
function getTeamId() {
  return process.env.LINEAR_TEAM_ID ?? "";
}

async function linearQuery(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: getLinearAuth() },
    body: JSON.stringify({ query, ...(variables ? { variables } : {}) }),
  });
  return res.json();
}

/**
 * POST /api/discord — Discord interaction endpoint
 * Handles slash commands from the VGC Team Report bot.
 */
export async function POST(request: NextRequest) {
  // Ed25519 signature verification (required by Discord)
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const rawBody = await request.text();

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const isValid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + rawBody),
    hexToUint8(signature),
    hexToUint8(DISCORD_PUBLIC_KEY),
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // Handle Discord ping (required for registering the endpoint)
  if (body.type === PING) {
    return NextResponse.json({ type: PONG });
  }

  if (body.type !== APPLICATION_COMMAND) {
    return NextResponse.json({ type: PONG });
  }

  const command = body.data?.name;
  const options = body.data?.options ?? [];
  const getOption = (name: string) => options.find((o: { name: string }) => o.name === name)?.value as string | undefined;

  try {
    if (command === "summary") {
      const sql = getDb();
      const stats = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE type = 'bug') as bugs,
          COUNT(*) FILTER (WHERE type = 'feature') as features,
          COUNT(*) FILTER (WHERE type = 'improvement') as improvements
        FROM feedback WHERE created_at > NOW() - INTERVAL '7 days'
      `;
      const openBugs = await sql`SELECT COUNT(*) as c FROM feedback WHERE type = 'bug' AND status = 'new'`;

      const s = stats[0];
      const lines = [
        `**This week:** ${s.total} new submissions`,
        `> 💡 Features: **${s.features}** | 🐛 Bugs: **${s.bugs}** | ⚡ Improvements: **${s.improvements}**`,
        `> 🐛 Open bugs: **${openBugs[0].c}**`,
      ];

      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: {
          embeds: [{
            title: "📊 Weekly Summary",
            description: lines.join("\n"),
            color: 0xe11d48,
            footer: { text: "Last 7 days" },
            timestamp: new Date().toISOString(),
          }],
        },
      });
    }

    if (command === "popular") {
      const sql = getDb();
      const popular = await sql`
        SELECT title, COUNT(*) as count FROM feedback
        WHERE type = 'feature' AND created_at > NOW() - INTERVAL '90 days'
        GROUP BY title ORDER BY count DESC LIMIT 10
      `;
      const lines = popular.length > 0
        ? popular.map((r, i) => `${i + 1}. **${r.title}** — ${r.count}x`).join("\n")
        : "No feature requests yet.";

      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: {
          embeds: [{
            title: "🔥 Most Requested Features",
            description: lines,
            color: 0x10b981,
            footer: { text: "Last 90 days" },
          }],
        },
      });
    }

    if (command === "bugs") {
      const sql = getDb();
      const bugs = await sql`
        SELECT title, submitter_name, created_at FROM feedback
        WHERE type = 'bug' AND status = 'new' ORDER BY created_at DESC LIMIT 10
      `;
      const lines = bugs.length > 0
        ? bugs.map((r) => {
            const date = new Date(r.created_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
            return `🐛 **${r.title}** — ${r.submitter_name ?? "Unknown"} (${date})`;
          }).join("\n")
        : "No open bugs! 🎉";

      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: {
          embeds: [{
            title: "🐛 Open Bugs",
            description: lines,
            color: 0xef4444,
            footer: { text: `${bugs.length} open` },
          }],
        },
      });
    }

    if (command === "status") {
      const issueId = getOption("issue")?.toUpperCase();
      if (!issueId) {
        return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: "Provide an issue ID (e.g., VGC-10)" } });
      }

      const result = await linearQuery(`{
        issue(id: "${issueId}") { identifier title description priority state { name } labels { nodes { name } } project { name } url }
      }`);

      // Try by identifier if direct ID fails
      let issue = result.data?.issue;
      if (!issue) {
        const searchResult = await linearQuery(`{
          team(id: "${getTeamId()}") {
            issues(filter: { number: { eq: ${parseInt(issueId.replace(/\D/g, "")) || 0} } }, first: 1) {
              nodes { identifier title description priority state { name } labels { nodes { name } } project { name } url }
            }
          }
        }`);
        issue = searchResult.data?.team?.issues?.nodes?.[0];
      }

      if (!issue) {
        return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: `Issue ${issueId} not found.` } });
      }

      const priMap: Record<number, string> = { 1: "🔴 Urgent", 2: "🟠 High", 3: "🟡 Normal", 4: "⚪ Low" };
      const labels = issue.labels?.nodes?.map((l: { name: string }) => l.name).join(", ") || "None";

      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: {
          embeds: [{
            title: `${issue.identifier}: ${issue.title}`,
            description: issue.description?.slice(0, 500) || "No description",
            color: 0x6366f1,
            fields: [
              { name: "Status", value: issue.state?.name ?? "Unknown", inline: true },
              { name: "Priority", value: priMap[issue.priority] ?? "None", inline: true },
              { name: "Labels", value: labels, inline: true },
              { name: "Project", value: issue.project?.name ?? "None", inline: true },
            ],
            url: issue.url,
            footer: { text: "Linear" },
          }],
        },
      });
    }

    if (command === "approve") {
      const issueId = getOption("issue")?.toUpperCase();
      if (!issueId) {
        return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: "Provide an issue ID (e.g., VGC-10)" } });
      }

      // Get Todo state ID and find the issue
      const teamData = await linearQuery(`{
        team(id: "${getTeamId()}") {
          states { nodes { id name type } }
          issues(filter: { number: { eq: ${parseInt(issueId.replace(/\D/g, "")) || 0} } }, first: 1) {
            nodes { id identifier title state { name } }
          }
        }
      }`);

      const todoState = teamData.data?.team?.states?.nodes?.find((s: { type: string }) => s.type === "unstarted");
      const issue = teamData.data?.team?.issues?.nodes?.[0];

      if (!issue) {
        return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: `Issue ${issueId} not found.` } });
      }
      if (!todoState) {
        return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: "Could not find Todo state." } });
      }

      await linearQuery(`mutation { issueUpdate(id: "${issue.id}", input: { stateId: "${todoState.id}" }) { issue { identifier state { name } } } }`);

      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: {
          embeds: [{
            title: `✅ Approved: ${issue.identifier}`,
            description: `**${issue.title}**\n\nMoved to **Todo**. The autonomous builder will pick this up when enabled.`,
            color: 0x10b981,
          }],
        },
      });
    }

    if (command === "reject") {
      const issueId = getOption("issue")?.toUpperCase();
      const reason = getOption("reason") ?? "No reason provided";
      if (!issueId) {
        return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: "Provide an issue ID (e.g., VGC-10)" } });
      }

      const teamData = await linearQuery(`{
        team(id: "${getTeamId()}") {
          states { nodes { id name type } }
          issues(filter: { number: { eq: ${parseInt(issueId.replace(/\D/g, "")) || 0} } }, first: 1) {
            nodes { id identifier title }
          }
        }
      }`);

      const wontDoState = teamData.data?.team?.states?.nodes?.find((s: { name: string }) => s.name === "Won't Do");
      const issue = teamData.data?.team?.issues?.nodes?.[0];

      if (!issue || !wontDoState) {
        return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: `Issue ${issueId} not found or missing state.` } });
      }

      await linearQuery(`mutation { issueUpdate(id: "${issue.id}", input: { stateId: "${wontDoState.id}" }) { issue { identifier } } }`);
      await linearQuery(
        `mutation($body: String!) { commentCreate(input: { issueId: "${issue.id}", body: $body }) { comment { id } } }`,
        { body: `Rejected via Discord: ${reason}` },
      );

      return NextResponse.json({
        type: CHANNEL_MESSAGE,
        data: {
          embeds: [{
            title: `❌ Rejected: ${issue.identifier}`,
            description: `**${issue.title}**\n\nMoved to **Won't Do**.\nReason: ${reason}`,
            color: 0xef4444,
          }],
        },
      });
    }

    return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: "Unknown command." } });
  } catch (e) {
    console.error("Discord interaction error:", e);
    return NextResponse.json({ type: CHANNEL_MESSAGE, data: { content: "Something went wrong. Check the logs." } });
  }
}

function hexToUint8(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

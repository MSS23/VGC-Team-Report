import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/posthog
 *
 * Receives PostHog webhook alerts (from Actions/Destinations) and creates
 * Linear issues automatically. Use this to turn PostHog insights
 * (error spikes, funnel drop-offs, user rage clicks) into Linear tickets.
 *
 * PostHog Webhook setup:
 *   1. PostHog > Data Pipeline > Destinations > Webhook
 *   2. URL: https://pokemonvgcteamreport.com/api/webhooks/posthog
 *   3. Headers: { "x-posthog-token": "<your POSTHOG_WEBHOOK_SECRET>" }
 */
export async function POST(request: Request) {
  try {
    // Verify webhook authenticity
    const token = request.headers.get("x-posthog-token");
    if (!process.env.POSTHOG_WEBHOOK_SECRET || token !== process.env.POSTHOG_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // PostHog webhook payload varies by trigger type
    // Common fields: event, person, properties, timestamp
    const event = body.event ?? body.data?.event_name ?? "unknown_event";
    const personEmail = body.person?.properties?.email ?? "anonymous";
    const personId = body.person?.distinct_id ?? "unknown";
    const timestamp = body.timestamp ?? new Date().toISOString();
    const properties = body.properties ?? body.data ?? {};

    // Build Linear issue
    const title = `[PostHog] ${formatEventTitle(event, properties)}`;
    const description = buildDescription(event, personEmail, personId, timestamp, properties);
    const priority = inferPriority(event, properties);

    const linearApiKey = process.env.LINEAR_API_KEY;
    const teamId = process.env.LINEAR_TEAM_ID;

    if (!linearApiKey || !teamId) {
      console.error("PostHog webhook: LINEAR_API_KEY or LINEAR_TEAM_ID not configured");
      return NextResponse.json({ error: "Linear not configured" }, { status: 500 });
    }

    // Create Linear issue
    const result = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: linearApiKey,
      },
      body: JSON.stringify({
        query: `mutation($title: String!, $description: String!, $teamId: String!, $priority: Int!) {
          issueCreate(input: {
            teamId: $teamId,
            title: $title,
            description: $description,
            priority: $priority
          }) {
            success
            issue { identifier url }
          }
        }`,
        variables: { title, description, teamId, priority },
      }),
    });

    const linearRes = await result.json();

    if (!linearRes.data?.issueCreate?.success) {
      console.error("PostHog webhook: Linear issue creation failed", linearRes);
      return NextResponse.json({ error: "Linear creation failed" }, { status: 500 });
    }

    const issue = linearRes.data.issueCreate.issue;

    // Notify Discord if webhook is configured
    const discordWebhook = process.env.DISCORD_BUILDS_WEBHOOK;
    if (discordWebhook) {
      await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "📊 PostHog Alert → Linear Issue",
              description: `**${issue.identifier}:** ${title}\n\n[View in Linear](${issue.url})\n\nTriggered by: \`${event}\`\nUser: ${personEmail}`,
              color: 0xf9a825, // amber
              footer: { text: "PostHog → Linear Integration" },
            },
          ],
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      issue: { identifier: issue.identifier, url: issue.url },
    });
  } catch (e) {
    console.error("PostHog webhook error:", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

function formatEventTitle(event: string, properties: Record<string, unknown>): string {
  switch (event) {
    case "$exception":
    case "exception":
      return `Error: ${(properties.$exception_message as string) ?? (properties.message as string) ?? "Unknown error"}`;
    case "$rageclick":
    case "rageclick":
      return `Rage clicks on ${(properties.$current_url as string) ?? "unknown page"}`;
    case "action_alert":
      return (properties.alert_name as string) ?? "Action alert triggered";
    default:
      return event.replace(/[_$]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function buildDescription(
  event: string,
  email: string,
  distinctId: string,
  timestamp: string,
  properties: Record<string, unknown>
): string {
  const url = properties.$current_url ?? properties.url ?? "N/A";
  const browser = properties.$browser ?? "Unknown";
  const os = properties.$os ?? "Unknown";

  const lines = [
    "## PostHog Alert",
    "",
    `**Event:** \`${event}\``,
    `**User:** ${email} (\`${distinctId}\`)`,
    `**Page:** ${url}`,
    `**Browser/OS:** ${browser} / ${os}`,
    `**Time:** ${timestamp}`,
  ];

  // Add error details if present
  if (properties.$exception_message || properties.message) {
    lines.push("", "### Error Details", "```", String(properties.$exception_message ?? properties.message));
    if (properties.$exception_stack_trace_raw) {
      lines.push(String(properties.$exception_stack_trace_raw));
    }
    lines.push("```");
  }

  // Add relevant extra properties
  const extras = Object.entries(properties).filter(
    ([k]) => !k.startsWith("$") && !["url", "message", "email"].includes(k)
  );
  if (extras.length > 0) {
    lines.push("", "### Additional Properties");
    for (const [key, value] of extras.slice(0, 10)) {
      lines.push(`- **${key}:** ${JSON.stringify(value)}`);
    }
  }

  lines.push("", "---", "*Auto-created by PostHog webhook integration*");

  return lines.join("\n");
}

function inferPriority(event: string, properties: Record<string, unknown>): number {
  // Linear priorities: 0=none, 1=urgent, 2=high, 3=medium, 4=low
  if (event === "$exception" || event === "exception") return 2;
  if (event === "$rageclick" || event === "rageclick") return 3;
  if ((properties.severity as string) === "critical") return 1;
  if ((properties.severity as string) === "high") return 2;
  return 3; // default medium
}

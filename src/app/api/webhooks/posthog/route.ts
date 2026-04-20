import { NextResponse } from "next/server";

// ── Session timeline enrichment ──────────────────────────────────────────────
// On every webhook, query PostHog for the user's last ~15 events leading up to
// the exception. The webhook fires once per Linear ticket, so this is a single
// extra HTTP call — no fan-out cost. With this context embedded in the ticket
// description, Claude (or a human) can diagnose root cause from text alone
// and never has to open the replay UI.
interface TimelineEvent {
  event: string;
  timestamp: string;
  properties: Record<string, unknown>;
}

async function fetchSessionTimeline(
  sessionId: string,
  beforeTimestamp: string,
): Promise<TimelineEvent[]> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) return [];

  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com")
    .replace("eu.i.posthog.com", "eu.posthog.com")
    .replace(/\/$/, "");

  // HogQL: pull every event from this session before the exception, newest first.
  // 15 rows is enough to see the user's last few clicks + page views without
  // bloating the Linear comment.
  const query = `
    SELECT event, timestamp, properties
    FROM events
    WHERE properties.$session_id = '${sessionId.replace(/'/g, "")}'
      AND timestamp <= '${beforeTimestamp.replace(/'/g, "")}'
    ORDER BY timestamp DESC
    LIMIT 15
  `;

  try {
    const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rows: unknown[][] = data?.results ?? [];
    return rows.map((r) => ({
      event: String(r[0] ?? ""),
      timestamp: String(r[1] ?? ""),
      properties: typeof r[2] === "string" ? JSON.parse(r[2]) : (r[2] as Record<string, unknown>) ?? {},
    }));
  } catch {
    return [];
  }
}

function formatTimelineForLinear(events: TimelineEvent[]): string[] {
  if (events.length === 0) return [];
  // Reverse so the oldest event is first — reads as a story leading up to the
  // exception, not a flipped log.
  const ordered = [...events].reverse();
  const lines: string[] = ["", "### User Timeline (last 15 events before exception)", ""];
  lines.push("| Time | Event | Detail |");
  lines.push("|------|-------|--------|");
  for (const e of ordered) {
    const time = e.timestamp ? new Date(e.timestamp).toISOString().slice(11, 19) : "?";
    const detail = summariseEvent(e);
    lines.push(`| \`${time}\` | \`${e.event}\` | ${detail} |`);
  }
  return lines;
}

function summariseEvent(e: TimelineEvent): string {
  const p = e.properties;
  const path = (() => {
    const url = String(p.$current_url ?? "");
    if (!url) return "";
    try {
      return new URL(url).pathname;
    } catch {
      return url.slice(0, 60);
    }
  })();
  switch (e.event) {
    case "$pageview":
      return path ? `Visited \`${path}\`` : "Page view";
    case "$pageleave":
      return path ? `Left \`${path}\`` : "Page leave";
    case "$autocapture": {
      const action = String(p.$event_type ?? "interaction");
      const text = String(p.$el_text ?? "").trim().slice(0, 60);
      return text ? `${action} on "${text}"` : action;
    }
    case "$rageclick": {
      const text = String(p.$el_text ?? "").trim().slice(0, 60);
      return text ? `Rage-clicked "${text}"` : "Rage click";
    }
    case "$exception":
      return `\u26A0 ${String(p.$exception_message ?? p.message ?? "Error")}`.slice(0, 100);
    default:
      return path ? `at \`${path}\`` : "—";
  }
}

/**
 * POST /api/webhooks/posthog
 *
 * Receives PostHog webhook alerts (from Actions/Destinations) and creates
 * Linear issues automatically. Turns PostHog error detection, rage clicks,
 * and funnel drop-offs into Linear tickets before users report them.
 *
 * PostHog Webhook setup:
 *   1. PostHog > Data Pipeline > Destinations > Webhook
 *   2. URL: https://pokemonvgcteamreport.com/api/webhooks/posthog
 *   3. Headers: { "x-posthog-token": "<your POSTHOG_WEBHOOK_SECRET>" }
 *   4. Create Actions for: $exception, $rageclick, high_error_rate
 *
 * Deduplication: uses a 1-hour in-memory window per error fingerprint
 * to prevent the same error from flooding Linear with duplicate tickets.
 */

// ── Deduplication ────────────────────────────────────────────────────────────
// In-memory cache of recently created tickets (fingerprint → timestamp).
// Serverless functions may cold-start, so this is best-effort — prevents
// rapid-fire duplicates within a single instance lifetime.
const recentTickets = new Map<string, number>();
const DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getFingerprint(event: string, properties: Record<string, unknown>): string {
  if (event === "$exception" || event === "exception") {
    const msg = String(properties.$exception_message ?? properties.message ?? "");
    const source = String(properties.$exception_source ?? properties.$current_url ?? "");
    return `exc:${msg.slice(0, 100)}:${source}`;
  }
  if (event === "$rageclick" || event === "rageclick") {
    return `rage:${String(properties.$current_url ?? "")}`;
  }
  return `evt:${event}:${String(properties.$current_url ?? "")}`;
}

function isDuplicate(fingerprint: string): boolean {
  const now = Date.now();
  // Clean stale entries
  for (const [key, ts] of recentTickets) {
    if (now - ts > DEDUP_WINDOW_MS) recentTickets.delete(key);
  }
  if (recentTickets.has(fingerprint)) return true;
  recentTickets.set(fingerprint, now);
  return false;
}

export async function POST(request: Request) {
  try {
    // Verify webhook authenticity
    const token = request.headers.get("x-posthog-token");
    if (!process.env.POSTHOG_WEBHOOK_SECRET || token !== process.env.POSTHOG_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // PostHog webhook payload varies by trigger type
    const event = body.event ?? body.data?.event_name ?? "unknown_event";
    const personEmail = body.person?.properties?.email ?? "anonymous";
    const personId = body.person?.distinct_id ?? "unknown";
    const timestamp = body.timestamp ?? new Date().toISOString();
    const properties = body.properties ?? body.data ?? {};

    // Deduplicate — skip if we already created a ticket for this error recently
    const fingerprint = getFingerprint(event, properties);
    if (isDuplicate(fingerprint)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "duplicate within dedup window" });
    }

    // Build Linear issue. Fetch session timeline in parallel with title so the
    // Linear ticket lands with the user's last 15 events embedded — Claude can
    // diagnose root cause from the ticket alone, no replay UI needed.
    const sessionId = properties.$session_id as string | undefined;
    const timeline = sessionId
      ? await fetchSessionTimeline(sessionId, timestamp)
      : [];

    const title = `[PostHog] ${formatEventTitle(event, properties)}`;
    const description = buildDescription(event, personEmail, personId, timestamp, properties, timeline);
    const priority = inferPriority(event, properties);
    const labelIds = inferLabels(event, properties);

    const linearApiKey = process.env.LINEAR_API_KEY;
    const teamId = process.env.LINEAR_TEAM_ID;

    if (!linearApiKey || !teamId) {
      console.error("PostHog webhook: LINEAR_API_KEY or LINEAR_TEAM_ID not configured");
      return NextResponse.json({ error: "Linear not configured" }, { status: 500 });
    }

    // Create Linear issue with Bug label
    const result = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: linearApiKey,
      },
      body: JSON.stringify({
        query: `mutation($title: String!, $description: String!, $teamId: String!, $priority: Int!, $labelIds: [String!]) {
          issueCreate(input: {
            teamId: $teamId,
            title: $title,
            description: $description,
            priority: $priority,
            labelIds: $labelIds
          }) {
            success
            issue { identifier url }
          }
        }`,
        variables: { title, description, teamId, priority, labelIds },
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
      const severityEmoji = priority <= 2 ? "🔴" : "🟡";
      await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: `${severityEmoji} PostHog Alert → ${issue.identifier}`,
              description: `**${title}**\n\n[View in Linear](${issue.url})\n\n**Event:** \`${event}\`\n**User:** ${personEmail}\n**Page:** ${properties.$current_url ?? "N/A"}`,
              color: priority <= 2 ? 0xef4444 : 0xf9a825,
              footer: { text: "PostHog → Linear auto-triage" },
              timestamp: new Date().toISOString(),
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEventTitle(event: string, properties: Record<string, unknown>): string {
  switch (event) {
    case "$exception":
    case "exception": {
      const msg = String(properties.$exception_message ?? properties.message ?? "Unknown error");
      // Truncate long error messages for the title
      return `Error: ${msg.length > 80 ? msg.slice(0, 77) + "..." : msg}`;
    }
    case "$rageclick":
    case "rageclick": {
      const page = String(properties.$current_url ?? "unknown page");
      // Strip domain for cleaner title
      const path = page.replace(/^https?:\/\/[^/]+/, "") || "/";
      return `Rage clicks on ${path}`;
    }
    case "$dead_click":
    case "dead_click": {
      const deadPage = String(properties.$current_url ?? "unknown page").replace(/^https?:\/\/[^/]+/, "") || "/";
      return `Dead clicks on ${deadPage}`;
    }
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
  properties: Record<string, unknown>,
  timeline: TimelineEvent[] = [],
): string {
  const url = properties.$current_url ?? properties.url ?? "N/A";
  const browser = properties.$browser ?? "Unknown";
  const os = properties.$os ?? "Unknown";
  const device = properties.$device_type ?? "Unknown";
  const sessionId = properties.$session_id as string | undefined;

  const lines = [
    "## PostHog Auto-Detected Issue",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Event** | \`${event}\` |`,
    `| **User** | ${email} (\`${distinctId}\`) |`,
    `| **Page** | ${url} |`,
    `| **Browser/OS** | ${browser} / ${os} |`,
    `| **Device** | ${device} |`,
    `| **Time** | ${timestamp} |`,
  ];

  // Link to session replay if available
  if (sessionId) {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com";
    lines.push("", `> 🎬 [Watch session replay](${posthogHost}/replay/${sessionId})`);
  }

  // Add error details if present
  if (properties.$exception_message || properties.message) {
    lines.push("", "### Error Details", "```", String(properties.$exception_message ?? properties.message));
    if (properties.$exception_stack_trace_raw) {
      lines.push(String(properties.$exception_stack_trace_raw));
    } else if (properties.$exception_source) {
      lines.push(`Source: ${properties.$exception_source}`);
    }
    lines.push("```");
  }

  // Embed the last 15 events leading up to the exception. Without this, every
  // ticket required opening the replay UI to understand context. With it, the
  // ticket is fully debuggable from text alone.
  lines.push(...formatTimelineForLinear(timeline));

  // Rage click context
  if (event === "$rageclick" || event === "rageclick") {
    const elements = properties.$elements as Array<Record<string, unknown>> | undefined;
    const selector = properties.$el_text ?? elements?.[0]?.text;
    if (selector) lines.push("", `**Clicked element:** \`${selector}\``);
    lines.push("", "User clicked rapidly on this element — likely frustrated by unresponsive UI or missing feedback.");
  }

  // Add relevant extra properties
  const extras = Object.entries(properties).filter(
    ([k]) => !k.startsWith("$") && !["url", "message", "email"].includes(k)
  );
  if (extras.length > 0) {
    lines.push("", "### Additional Context");
    for (const [key, value] of extras.slice(0, 10)) {
      lines.push(`- **${key}:** ${JSON.stringify(value)}`);
    }
  }

  lines.push("", "---", "*Auto-created by PostHog → Linear integration. Review the session replay to understand the full user experience.*");

  return lines.join("\n");
}

function inferPriority(event: string, properties: Record<string, unknown>): number {
  // Linear priorities: 0=none, 1=urgent, 2=high, 3=medium, 4=low
  if ((properties.severity as string) === "critical") return 1;
  if (event === "$exception" || event === "exception") return 2; // high — JS errors break UX
  if (event === "$rageclick" || event === "rageclick") return 3; // medium — frustrated user
  if (event === "$dead_click" || event === "dead_click") return 4; // low — confusing UI
  if ((properties.severity as string) === "high") return 2;
  return 3; // default medium
}

// Linear label IDs (from team labels)
const LABELS = {
  bug: "bbd03f4e-be6f-4617-ad7d-b9fdc596ce5c",
  improvement: "06d28974-98c3-457a-bbab-ab85456e51f0",
  webApp: "1f355942-6143-47a8-93be-4a5cbe0de0b0",
  mobile: "5389312c-66f8-4ced-a840-ff3cd46b68aa",
  analytics: "a13703f8-0865-4a6d-b74c-56a7abc2f563",
  infrastructure: "a0e2ddf6-557d-4164-b049-a4ee36ee342f",
} as const;

function inferLabels(event: string, properties: Record<string, unknown>): string[] {
  const labels: string[] = [];

  // Event type → primary label
  if (event === "$exception" || event === "exception") {
    labels.push(LABELS.bug);
  } else if (event === "$rageclick" || event === "rageclick" || event === "$dead_click" || event === "dead_click") {
    labels.push(LABELS.improvement);
  }

  // Platform detection → Web App or Mobile
  const deviceType = String(properties.$device_type ?? "").toLowerCase();
  const os = String(properties.$os ?? "").toLowerCase();
  if (deviceType === "mobile" || os === "android" || os === "ios") {
    labels.push(LABELS.mobile);
  } else {
    labels.push(LABELS.webApp);
  }

  // Always tag as analytics-sourced
  labels.push(LABELS.analytics);

  return labels;
}

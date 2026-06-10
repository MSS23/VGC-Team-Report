import { isCronAuthorized } from "@/lib/cron-auth";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

/**
 * GET /api/cron/posthog-errors
 *
 * Daily cron that queries PostHog Error Tracking for new/active error groups
 * and creates Linear tickets for any that don't already have one.
 *
 * Required env vars:
 *   - POSTHOG_PERSONAL_API_KEY  — PostHog > Settings > Personal API Keys
 *   - POSTHOG_PROJECT_ID        — numeric project ID from PostHog URL
 *   - LINEAR_API_KEY
 *   - LINEAR_TEAM_ID
 *
 * If POSTHOG_PERSONAL_API_KEY (or the fallback POSTHOG_API_KEY) is not set,
 * the route exits gracefully with a 200 warning rather than erroring.
 */

const LINEAR_API = "https://api.linear.app/graphql";

// Linear label IDs (same as the webhook handler)
const LABELS = {
  bug: "bbd03f4e-be6f-4617-ad7d-b9fdc596ce5c",
  analytics: "a13703f8-0865-4a6d-b74c-56a7abc2f563",
  webApp: "1f355942-6143-47a8-93be-4a5cbe0de0b0",
} as const;

// ── PostHog API ─────────────────────────────────────────────────────────────

interface PostHogErrorGroup {
  fingerprint: string;
  status: string;
  assignee: string | null;
  description: string;
  first_seen: string;
  last_seen: string;
  occurrences: number;
  sessions: number;
  users: number;
  volume: number[] | null;
}

interface PostHogErrorResponse {
  results: PostHogErrorGroup[];
}

async function fetchPostHogErrors(): Promise<PostHogErrorGroup[] | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY || process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!apiKey) {
    console.warn("[posthog-errors] POSTHOG_PERSONAL_API_KEY is not set — skipping PostHog query");
    return null;
  }

  if (!projectId) {
    console.warn("[posthog-errors] POSTHOG_PROJECT_ID is not set — skipping PostHog query");
    return null;
  }

  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com")
    .replace("eu.i.posthog.com", "eu.posthog.com")
    .replace(/\/$/, "");

  // Fetch active (unresolved) error groups from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL(`${host}/api/projects/${projectId}/error_tracking/`);
  url.searchParams.set("ordering", "-occurrences");
  url.searchParams.set("status", "active");
  url.searchParams.set("date_from", sevenDaysAgo);
  url.searchParams.set("limit", "20");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data: PostHogErrorResponse = await res.json();
  return data.results ?? [];
}

// ── Linear Helpers ──────────────────────────────────────────────────────────

async function linearGql(query: string, variables?: Record<string, unknown>) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function getExistingPostHogTickets(): Promise<Set<string>> {
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) return new Set();

  const result = await linearGql(
    `query($teamId: String!) {
      team(id: $teamId) {
        issues(filter: {
          title: { startsWith: "[PostHog]" }
          state: { type: { nin: ["completed", "canceled"] } }
        }, first: 100) {
          nodes { title description }
        }
      }
    }`,
    { teamId }
  );

  const titles = new Set<string>();
  const nodes = result?.data?.team?.issues?.nodes ?? [];
  for (const node of nodes) {
    titles.add(node.title);
    // Also extract fingerprints from descriptions for more precise dedup
    const match = node.description?.match(/Fingerprint.*`([^`]+)`/);
    if (match) titles.add(match[1]);
  }
  return titles;
}

async function createLinearTicket(
  errorGroup: PostHogErrorGroup
): Promise<{ identifier: string; url: string } | null> {
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) return null;

  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com")
    .replace("eu.i.posthog.com", "eu.posthog.com")
    .replace(/\/$/, "");

  const errorTitle = errorGroup.description.length > 80
    ? errorGroup.description.slice(0, 77) + "..."
    : errorGroup.description;

  const title = `[PostHog] ${errorTitle}`;

  const description = [
    "## PostHog Error Tracking — Auto-Synced",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Error** | ${errorGroup.description} |`,
    `| **Occurrences** | ${errorGroup.occurrences} |`,
    `| **Affected Users** | ${errorGroup.users} |`,
    `| **Sessions** | ${errorGroup.sessions} |`,
    `| **First Seen** | ${errorGroup.first_seen} |`,
    `| **Last Seen** | ${errorGroup.last_seen} |`,
    `| **Status** | ${errorGroup.status} |`,
    `| **Fingerprint** | \`${errorGroup.fingerprint}\` |`,
    "",
    `> [View in PostHog](${host}/project/${projectId}/error_tracking/${encodeURIComponent(errorGroup.fingerprint)})`,
    "",
    "---",
    "*Auto-created by PostHog Error Tracking → Linear daily sync.*",
  ].join("\n");

  // Higher priority for more occurrences/users
  let priority = 3; // medium
  if (errorGroup.occurrences >= 50 || errorGroup.users >= 10) priority = 2; // high
  if (errorGroup.occurrences >= 200 || errorGroup.users >= 50) priority = 1; // urgent

  const result = await linearGql(
    `mutation($teamId: String!, $title: String!, $description: String!, $priority: Int!, $labelIds: [String!]) {
      issueCreate(input: {
        teamId: $teamId
        title: $title
        description: $description
        priority: $priority
        labelIds: $labelIds
      }) {
        success
        issue { identifier url }
      }
    }`,
    {
      teamId,
      title,
      description,
      priority,
      labelIds: [LABELS.bug, LABELS.analytics, LABELS.webApp],
    }
  );

  return result?.data?.issueCreate?.issue ?? null;
}

// ── Main Route ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY || process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  if (!apiKey || !projectId) {
    const missing = !apiKey ? "POSTHOG_PERSONAL_API_KEY" : "POSTHOG_PROJECT_ID";
    console.warn(`[posthog-errors] ${missing} is not configured — skipping run`);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `${missing} is not configured`,
    });
  }

  try {
    // Fetch PostHog error groups and existing Linear tickets in parallel
    const [errorGroupsOrNull, existingTickets] = await Promise.all([
      fetchPostHogErrors(),
      getExistingPostHogTickets(),
    ]);

    // Guard: if PostHog query was skipped (missing env vars), exit gracefully
    if (errorGroupsOrNull === null) {
      return NextResponse.json({ ok: true, skipped: true, reason: "PostHog credentials not configured" });
    }

    const errorGroups = errorGroupsOrNull;

    const created: { identifier: string; url: string; description: string; occurrences: number }[] = [];
    const skipped: string[] = [];

    for (const group of errorGroups) {
      // Dedup: check if title or fingerprint already exists in Linear
      const titleKey = `[PostHog] ${group.description.length > 80 ? group.description.slice(0, 77) + "..." : group.description}`;
      if (existingTickets.has(titleKey) || existingTickets.has(group.fingerprint)) {
        skipped.push(group.description.slice(0, 60));
        continue;
      }

      const ticket = await createLinearTicket(group);
      if (ticket) {
        created.push({
          ...ticket,
          description: group.description,
          occurrences: group.occurrences,
        });
      }
    }

    // Build digest summary
    const totalErrors = errorGroups.reduce((sum, g) => sum + g.occurrences, 0);
    const totalUsers = errorGroups.reduce((sum, g) => sum + g.users, 0);

    const lines: string[] = [
      `**Error Groups (7d):** ${errorGroups.length}`,
      `**Total Occurrences:** ${totalErrors}`,
      `**Affected Users:** ${totalUsers}`,
    ];

    if (created.length > 0) {
      lines.push("", `**New Linear Tickets (${created.length}):**`);
      for (const t of created) {
        lines.push(`- [${t.identifier}](${t.url}): ${t.description.slice(0, 60)} (${t.occurrences}x)`);
      }
    }

    if (skipped.length > 0) {
      lines.push("", `**Already Tracked (${skipped.length}):** ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? ` +${skipped.length - 3} more` : ""}`);
    }

    if (errorGroups.length === 0) {
      lines.push("", "No active errors this week!");
    }

    // Post to Discord
    await postToBuildsChannel({
      title: "PostHog Error Digest — Daily Sync",
      description: lines.join("\n"),
      color: created.length > 0 ? COLORS.warning : COLORS.success,
      footer: { text: "PostHog → Linear Error Sync" },
    });

    return NextResponse.json({
      ok: true,
      errorGroups: errorGroups.length,
      created: created.length,
      skipped: skipped.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("PostHog error sync failed:", message);

    await postToBuildsChannel({
      title: "PostHog Error Sync — Failed",
      description: `Error: ${message}`,
      color: COLORS.error,
      footer: { text: "PostHog → Linear Error Sync" },
    });

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

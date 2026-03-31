import { isCronAuthorized } from "@/lib/cron-auth";
import { getDb } from "@/lib/db";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

const SITE_URL = "https://pokemonvgcteamreport.com";
const LINEAR_API = "https://api.linear.app/graphql";
const STALE_DAYS = 7;
const OPS_LABEL_NAME = "ops-report";

// ── Health Check ─────────────────────────────────────────────────────────────

const ENDPOINTS = [
  { path: "/", name: "Homepage" },
  { path: "/explore", name: "Explore" },
  { path: "/changelog", name: "Changelog" },
  { path: "/api/keep-alive", name: "API" },
  { path: "/dashboard", name: "Dashboard" },
];

async function runHealthCheck() {
  const results: { name: string; status: number; ok: boolean; ms: number }[] = [];

  for (const ep of ENDPOINTS) {
    const start = Date.now();
    try {
      const headers: Record<string, string> = { "User-Agent": "VGC-DailyOps/1.0" };
      if (ep.path.startsWith("/api/") && process.env.CRON_SECRET) {
        headers["Authorization"] = `Bearer ${process.env.CRON_SECRET}`;
      }
      const res = await fetch(`${SITE_URL}${ep.path}`, {
        method: "GET",
        headers,
        redirect: "follow",
      });
      results.push({ name: ep.name, status: res.status, ok: res.status < 400, ms: Date.now() - start });
    } catch {
      results.push({ name: ep.name, status: 0, ok: false, ms: Date.now() - start });
    }
  }

  const failures = results.filter((r) => !r.ok);
  const slow = results.filter((r) => r.ok && r.ms > 5000);

  const lines: string[] = [];
  if (failures.length > 0) {
    lines.push(`**DOWN (${failures.length}):**`);
    failures.forEach((f) => lines.push(`- ${f.name}: ${f.status === 0 ? "unreachable" : `HTTP ${f.status}`}`));
  }
  if (slow.length > 0) {
    lines.push(`**Slow (>5s):**`);
    slow.forEach((s) => lines.push(`- ${s.name}: ${s.ms}ms`));
  }
  if (failures.length === 0 && slow.length === 0) {
    lines.push(`All ${results.length} endpoints healthy (avg ${Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length)}ms)`);
  }

  return { ok: failures.length === 0, summary: lines.join("\n") };
}

// ── Stale Tickets ────────────────────────────────────────────────────────────

async function runStaleTicketCheck() {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!apiKey || !teamId) return { stale: 0, summary: "Linear not configured" };

  try {
    const res = await fetch(LINEAR_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify({
        query: `{ team(id: "${teamId}") { issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) { nodes { identifier title updatedAt } } } }`,
      }),
    });
    const data = await res.json();
    const now = Date.now();
    const threshold = STALE_DAYS * 24 * 60 * 60 * 1000;
    const issues = data.data?.team?.issues?.nodes ?? [];
    const stale = issues.filter((i: { updatedAt: string }) => now - new Date(i.updatedAt).getTime() > threshold);

    if (stale.length === 0) return { stale: 0, summary: `${issues.length} in progress, none stale` };

    const list = stale.map((i: { identifier: string; title: string; updatedAt: string }) => {
      const days = Math.floor((now - new Date(i.updatedAt).getTime()) / (24 * 60 * 60 * 1000));
      return `- ${i.identifier}: ${i.title} (${days}d)`;
    }).join("\n");

    return { stale: stale.length, summary: `**${stale.length} stale (${STALE_DAYS}d+):**\n${list}` };
  } catch {
    return { stale: 0, summary: "Failed to check Linear" };
  }
}

// ── SEO Check ────────────────────────────────────────────────────────────────

async function runSeoCheck() {
  const pages = ["/", "/explore", "/changelog", "/champions"];
  const issues: string[] = [];

  for (const path of pages) {
    try {
      const res = await fetch(`${SITE_URL}${path}`, { headers: { "User-Agent": "VGC-SEO/1.0" } });
      if (!res.ok) { issues.push(`${path}: HTTP ${res.status}`); continue; }
      const html = await res.text();
      const missing: string[] = [];
      if (!html.includes("<title>") && !html.includes("<title ")) missing.push("title");
      if (!html.includes('name="description"')) missing.push("meta desc");
      if (!html.includes('property="og:image"')) missing.push("og:image");
      if (missing.length > 0) issues.push(`${path}: missing ${missing.join(", ")}`);
    } catch {
      issues.push(`${path}: fetch failed`);
    }
  }

  if (issues.length === 0) return { ok: true, summary: `${pages.length} pages — all SEO tags present` };
  return { ok: false, summary: `**SEO issues:**\n${issues.map((i) => `- ${i}`).join("\n")}` };
}

// ── DB Health ────────────────────────────────────────────────────────────────

async function runDbCheck() {
  try {
    const sql = getDb();
    const [sizeResult] = await sql`SELECT pg_size_pretty(pg_database_size(current_database())) as db_size`;
    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
    return { ok: true, summary: `${tables.length} tables, ${sizeResult.db_size}` };
  } catch {
    return { ok: false, summary: "Database connection failed" };
  }
}

// ── Linear Ticket Creation ──────────────────────────────────────────────────

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

async function getOrCreateOpsLabel(): Promise<string | null> {
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) return null;

  // Check if label already exists
  const existing = await linearGql(
    `query($teamId: String!) { team(id: $teamId) { labels { nodes { id name } } } }`,
    { teamId }
  );

  const labels = existing?.data?.team?.labels?.nodes ?? [];
  const found = labels.find((l: { name: string }) => l.name === OPS_LABEL_NAME);
  if (found) return found.id;

  // Create the label
  const created = await linearGql(
    `mutation($teamId: String!, $name: String!, $color: String!) {
      issueLabelCreate(input: { teamId: $teamId, name: $name, color: $color }) {
        issueLabel { id }
      }
    }`,
    { teamId, name: OPS_LABEL_NAME, color: "#F59E0B" }
  );

  return created?.data?.issueLabelCreate?.issueLabel?.id ?? null;
}

interface OpsIssue {
  category: string;
  title: string;
  description: string;
  priority: number; // 1 = urgent, 2 = high, 3 = medium
}

async function createOpsTickets(issues: OpsIssue[]): Promise<string[]> {
  if (issues.length === 0) return [];

  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) return [];

  // Check for existing open ops tickets to avoid duplicates
  const existingResult = await linearGql(
    `query($teamId: String!) {
      team(id: $teamId) {
        issues(filter: { title: { contains: "[Ops Report]" }, state: { type: { nin: ["completed", "canceled"] } } }, first: 20) {
          nodes { title }
        }
      }
    }`,
    { teamId }
  );
  const existingTitles = new Set<string>(
    (existingResult?.data?.team?.issues?.nodes ?? []).map((n: { title: string }) => n.title)
  );

  const labelId = await getOrCreateOpsLabel();
  const created: string[] = [];

  for (const issue of issues) {
    // Skip if an open ticket with the same title already exists
    if (existingTitles.has(issue.title)) continue;
    try {
      const result = await linearGql(
        `mutation($teamId: String!, $title: String!, $description: String!, $priority: Int!, $labelIds: [String!]) {
          issueCreate(input: {
            teamId: $teamId
            title: $title
            description: $description
            priority: $priority
            labelIds: $labelIds
          }) { issue { identifier url } }
        }`,
        {
          teamId,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          labelIds: labelId ? [labelId] : [],
        }
      );

      const ticket = result?.data?.issueCreate?.issue;
      if (ticket) created.push(`${ticket.identifier}: ${issue.title}`);
    } catch {
      // Don't let ticket creation failure block the ops report
    }
  }

  return created;
}

function buildOpsIssues(
  health: { ok: boolean; summary: string },
  seo: { ok: boolean; summary: string },
  db: { ok: boolean; summary: string }
): OpsIssue[] {
  const issues: OpsIssue[] = [];

  if (!health.ok) {
    issues.push({
      category: "Health",
      title: "[Ops Report] Site health check failures detected",
      description: `## Auto-generated from Daily Ops Report\n\n${health.summary}\n\n---\n*Created automatically by the daily ops cron. Tagged \`ops-report\` for traceability.*`,
      priority: 1, // Urgent — site is down
    });
  }

  if (!db.ok) {
    issues.push({
      category: "Database",
      title: "[Ops Report] Database health check failed",
      description: `## Auto-generated from Daily Ops Report\n\n${db.summary}\n\n---\n*Created automatically by the daily ops cron. Tagged \`ops-report\` for traceability.*`,
      priority: 1, // Urgent — DB issues
    });
  }

  if (!seo.ok) {
    issues.push({
      category: "SEO",
      title: "[Ops Report] SEO issues detected",
      description: `## Auto-generated from Daily Ops Report\n\n${seo.summary}\n\n---\n*Created automatically by the daily ops cron. Tagged \`ops-report\` for traceability.*`,
      priority: 3, // Medium — not urgent but should be fixed
    });
  }

  return issues;
}

// ── Main Route ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [health, tickets, seo, db] = await Promise.all([
    runHealthCheck(),
    runStaleTicketCheck(),
    runSeoCheck(),
    runDbCheck(),
  ]);

  const hasProblems = !health.ok || tickets.stale > 0 || !seo.ok || !db.ok;

  // Auto-create Linear tickets for actionable issues
  const opsIssues = buildOpsIssues(health, seo, db);
  const createdTickets = await createOpsTickets(opsIssues);

  const ticketSection = createdTickets.length > 0
    ? `\n\n**Linear Tickets Created:**\n${createdTickets.map((t) => `- ${t}`).join("\n")}`
    : "";

  await postToBuildsChannel({
    title: hasProblems ? "Daily Ops Report — Issues Found" : "Daily Ops Report — All Clear",
    description: [
      `**Site Health:**\n${health.summary}`,
      "",
      `**Tickets:**\n${tickets.summary}`,
      "",
      `**SEO:**\n${seo.summary}`,
      "",
      `**Database:**\n${db.summary}`,
      ticketSection,
    ].join("\n"),
    color: hasProblems ? COLORS.warning : COLORS.success,
    footer: { text: "VGC Daily Ops" },
  });

  return NextResponse.json({ ok: !hasProblems, health, tickets, seo, db, createdTickets });
}

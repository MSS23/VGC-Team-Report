import { isCronAuthorized } from "@/lib/cron-auth";
import { getDb } from "@/lib/db";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

const LINEAR_API = "https://api.linear.app/graphql";

// ── Linear Weekly Summary ────────────────────────────────────────────────────

async function runLinearDigest() {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!apiKey || !teamId) return "Linear not configured";

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  async function query(q: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(LINEAR_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: apiKey! },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });
      return (await res.json()).data;
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    const completed = await query(`{ team(id: "${teamId}") { issues(filter: { state: { type: { eq: "completed" } }, completedAt: { gte: "${oneWeekAgo}" } }, first: 50) { nodes { identifier title } } } }`);
    const inProgress = await query(`{ team(id: "${teamId}") { issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) { nodes { identifier title } } } }`);
    const inReview = await query(`{ team(id: "${teamId}") { issues(filter: { state: { name: { eq: "In Review" } } }, first: 50) { nodes { identifier title } } } }`);

    const done = completed.team.issues.nodes;
    const wip = inProgress.team.issues.nodes;
    const review = inReview.team.issues.nodes;

    const format = (items: { identifier: string; title: string }[]) =>
      items.length > 0 ? items.map((i) => `- ${i.identifier}: ${i.title}`).join("\n") : "None";

    return [
      `**Completed (${done.length}):**\n${format(done)}`,
      `**In Review (${review.length}):**\n${format(review)}`,
      `**In Progress (${wip.length}):**\n${format(wip)}`,
    ].join("\n\n");
  } catch {
    return "Failed to fetch Linear data";
  }
}

// ── User Growth ──────────────────────────────────────────────────────────────

async function runGrowthDigest() {
  try {
    const sql = getDb();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [stw] = await sql`SELECT COUNT(*) as c FROM shares WHERE created_at >= ${oneWeekAgo.toISOString()}`;
    const [slw] = await sql`SELECT COUNT(*) as c FROM shares WHERE created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${oneWeekAgo.toISOString()}`;
    const [ftw] = await sql`SELECT COUNT(*) as c FROM feedback WHERE created_at >= ${oneWeekAgo.toISOString()}`;
    const [flw] = await sql`SELECT COUNT(*) as c FROM feedback WHERE created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${oneWeekAgo.toISOString()}`;
    const [ctw] = await sql`SELECT COUNT(*) as c FROM comments WHERE created_at >= ${oneWeekAgo.toISOString()}`;
    const [clw] = await sql`SELECT COUNT(*) as c FROM comments WHERE created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${oneWeekAgo.toISOString()}`;
    const [total] = await sql`SELECT COUNT(*) as c FROM shares WHERE deleted_at IS NULL`;

    function trend(tw: number, lw: number) {
      const diff = tw - lw;
      if (diff > 0) return ` (+${diff})`;
      if (diff < 0) return ` (${diff})`;
      return "";
    }

    const tw = Number(stw.c), lw = Number(slw.c);
    const ft = Number(ftw.c), fl = Number(flw.c);
    const ct = Number(ctw.c), cl = Number(clw.c);

    return [
      `Reports: **${tw}**${trend(tw, lw)}`,
      `Feedback: **${ft}**${trend(ft, fl)}`,
      `Comments: **${ct}**${trend(ct, cl)}`,
      `Total reports: ${total.c}`,
    ].join("\n");
  } catch {
    return "Failed to query database";
  }
}

// ── Dependency Check ─────────────────────────────────────────────────────────

async function runDependencyCheck() {
  try {
    // Check a few key deps against npm registry
    const keyDeps = ["next", "react", "tailwindcss", "@clerk/nextjs", "vitest"];
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const outdated: string[] = [];
    for (const name of keyDeps) {
      if (!allDeps[name]) continue;
      try {
        const npmCtrl = new AbortController();
        const npmTimer = setTimeout(() => npmCtrl.abort(), 5000);
        const res = await fetch(`https://registry.npmjs.org/${name}/latest`, { signal: npmCtrl.signal });
        clearTimeout(npmTimer);
        if (!res.ok) continue;
        const data = await res.json();
        const current = allDeps[name].replace(/^[\^~]/, "");
        if (current !== data.version) {
          outdated.push(`\`${name}\` ${current} -> ${data.version}`);
        }
      } catch { /* skip */ }
    }

    return outdated.length > 0
      ? `**${outdated.length} updates:**\n${outdated.map((o) => `- ${o}`).join("\n")}`
      : "Key dependencies up to date";
  } catch {
    return "Failed to check dependencies";
  }
}

// ── Main Route ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [linear, growth, deps] = await Promise.all([
    runLinearDigest(),
    runGrowthDigest(),
    runDependencyCheck(),
  ]);

  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const weekEnd = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  await postToBuildsChannel({
    title: `Weekly Report (${weekStart} - ${weekEnd})`,
    description: [
      linear,
      "",
      `**User Growth (vs last week):**\n${growth}`,
      "",
      `**Dependencies:**\n${deps}`,
    ].join("\n"),
    color: COLORS.info,
    footer: { text: "VGC Weekly Report" },
  });

  return NextResponse.json({ ok: true });
}

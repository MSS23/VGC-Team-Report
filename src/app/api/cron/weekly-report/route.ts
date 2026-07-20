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

  async function query(q: string, variables?: Record<string, unknown>) {
    const linearController = new AbortController();
    const linearTimeout = setTimeout(() => linearController.abort(), 5000);
    const res = await fetch(LINEAR_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey! },
      body: JSON.stringify({ query: q, variables }),
      signal: linearController.signal,
    }).finally(() => clearTimeout(linearTimeout));
    return (await res.json()).data;
  }

  try {
    // Three independent Linear queries — run in parallel. Was serial ~600ms;
    // now ~200ms bounded by the slowest.
    const [completed, inProgress, inReview] = await Promise.all([
      query(
        `query($teamId: String!, $since: DateTimeOrDuration!) { team(id: $teamId) { issues(filter: { state: { type: { eq: "completed" } }, completedAt: { gte: $since } }, first: 50) { nodes { identifier title } } } }`,
        { teamId, since: oneWeekAgo }
      ),
      query(
        `query($teamId: String!) { team(id: $teamId) { issues(filter: { state: { name: { eq: "In Progress" } } }, first: 50) { nodes { identifier title } } } }`,
        { teamId }
      ),
      query(
        `query($teamId: String!) { team(id: $teamId) { issues(filter: { state: { name: { eq: "In Review" } } }, first: 50) { nodes { identifier title } } } }`,
        { teamId }
      ),
    ]);

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

    // Three tables × two windows + one total = 7 counts. Collapse the per-
    // table counts into a single query with FILTER buckets — this drops the
    // round-trip fan-out (was 7 × ~50ms serial) to 3 parallel Neon calls.
    const oneWeekIso = oneWeekAgo.toISOString();
    const twoWeeksIso = twoWeeksAgo.toISOString();

    const [[sharesRow], [feedbackRow], [commentsRow]] = await Promise.all([
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= ${oneWeekIso}) AS tw,
          COUNT(*) FILTER (WHERE created_at >= ${twoWeeksIso} AND created_at < ${oneWeekIso}) AS lw,
          COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total
        FROM shares
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= ${oneWeekIso}) AS tw,
          COUNT(*) FILTER (WHERE created_at >= ${twoWeeksIso} AND created_at < ${oneWeekIso}) AS lw
        FROM feedback
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= ${oneWeekIso}) AS tw,
          COUNT(*) FILTER (WHERE created_at >= ${twoWeeksIso} AND created_at < ${oneWeekIso}) AS lw
        FROM comments
      `,
    ]);

    function trend(tw: number, lw: number) {
      const diff = tw - lw;
      if (diff > 0) return ` (+${diff})`;
      if (diff < 0) return ` (${diff})`;
      return "";
    }

    const tw = Number(sharesRow.tw), lw = Number(sharesRow.lw);
    const ft = Number(feedbackRow.tw), fl = Number(feedbackRow.lw);
    const ct = Number(commentsRow.tw), cl = Number(commentsRow.lw);
    const total = { c: sharesRow.total };

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

    // Was serial: N deps × up-to-5s each. Parallel fan-out bounds the whole
    // check at ~5s regardless of dep count, with per-request timeout preserved.
    const results = await Promise.all(
      keyDeps
        .filter((name) => allDeps[name])
        .map(async (name) => {
          try {
            const npmController = new AbortController();
            const npmTimeout = setTimeout(() => npmController.abort(), 5000);
            const res = await fetch(`https://registry.npmjs.org/${name}/latest`, {
              signal: npmController.signal,
            }).finally(() => clearTimeout(npmTimeout));
            if (!res.ok) return null;
            const data = await res.json();
            const current = allDeps[name].replace(/^[\^~]/, "");
            if (current !== data.version) {
              return `\`${name}\` ${current} -> ${data.version}`;
            }
            return null;
          } catch {
            return null;
          }
        })
    );
    const outdated: string[] = results.filter((r): r is string => r !== null);

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

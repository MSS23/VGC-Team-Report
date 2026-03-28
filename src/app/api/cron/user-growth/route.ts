import { isCronAuthorized } from "@/lib/cron-auth";
import { getDb } from "@/lib/db";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Shared reports this week vs last week
    const [sharesThisWeek] = await sql`
      SELECT COUNT(*) as count FROM shares
      WHERE created_at >= ${oneWeekAgo.toISOString()} AND created_at < ${now.toISOString()}
    `;
    const [sharesLastWeek] = await sql`
      SELECT COUNT(*) as count FROM shares
      WHERE created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${oneWeekAgo.toISOString()}
    `;

    // Public reports this week vs last week
    const [publicThisWeek] = await sql`
      SELECT COUNT(*) as count FROM shares
      WHERE is_public = TRUE AND created_at >= ${oneWeekAgo.toISOString()} AND created_at < ${now.toISOString()}
    `;
    const [publicLastWeek] = await sql`
      SELECT COUNT(*) as count FROM shares
      WHERE is_public = TRUE AND created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${oneWeekAgo.toISOString()}
    `;

    // Feedback submissions
    const [feedbackThisWeek] = await sql`
      SELECT COUNT(*) as count FROM feedback
      WHERE created_at >= ${oneWeekAgo.toISOString()} AND created_at < ${now.toISOString()}
    `;
    const [feedbackLastWeek] = await sql`
      SELECT COUNT(*) as count FROM feedback
      WHERE created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${oneWeekAgo.toISOString()}
    `;

    // Comments this week
    const [commentsThisWeek] = await sql`
      SELECT COUNT(*) as count FROM comments
      WHERE created_at >= ${oneWeekAgo.toISOString()} AND created_at < ${now.toISOString()}
    `;
    const [commentsLastWeek] = await sql`
      SELECT COUNT(*) as count FROM comments
      WHERE created_at >= ${twoWeeksAgo.toISOString()} AND created_at < ${oneWeekAgo.toISOString()}
    `;

    // Total counts
    const [totalShares] = await sql`SELECT COUNT(*) as count FROM shares WHERE deleted_at IS NULL`;
    const [totalPublic] = await sql`SELECT COUNT(*) as count FROM shares WHERE is_public = TRUE AND deleted_at IS NULL`;

    function trend(thisWeek: number, lastWeek: number): string {
      if (lastWeek === 0) return thisWeek > 0 ? ` (+${thisWeek} new)` : "";
      const diff = thisWeek - lastWeek;
      if (diff > 0) return ` (+${diff} from last week)`;
      if (diff < 0) return ` (${diff} from last week)`;
      return " (same as last week)";
    }

    const tw = Number(sharesThisWeek.count);
    const lw = Number(sharesLastWeek.count);
    const ptw = Number(publicThisWeek.count);
    const plw = Number(publicLastWeek.count);
    const ftw = Number(feedbackThisWeek.count);
    const flw = Number(feedbackLastWeek.count);
    const ctw = Number(commentsThisWeek.count);
    const clw = Number(commentsLastWeek.count);

    const weekStart = oneWeekAgo.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const weekEnd = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    await postToBuildsChannel({
      title: `User Growth (${weekStart} - ${weekEnd})`,
      description: [
        `**Reports created:** ${tw}${trend(tw, lw)}`,
        `**Public reports:** ${ptw}${trend(ptw, plw)}`,
        `**Feedback submitted:** ${ftw}${trend(ftw, flw)}`,
        `**Comments posted:** ${ctw}${trend(ctw, clw)}`,
        "",
        `**Totals:** ${totalShares.count} reports | ${totalPublic.count} public`,
      ].join("\n"),
      color: tw > lw ? COLORS.success : tw === lw ? COLORS.neutral : COLORS.warning,
      footer: { text: "VGC Growth Digest" },
    });

    return NextResponse.json({
      ok: true,
      thisWeek: { shares: tw, public: ptw, feedback: ftw, comments: ctw },
      lastWeek: { shares: lw, public: plw, feedback: flw, comments: clw },
    });
  } catch (e) {
    console.error("User growth digest failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

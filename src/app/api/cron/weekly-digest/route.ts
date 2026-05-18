import { isCronAuthorized } from "@/lib/cron-auth";
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const APP_URL = "https://pokemonvgcteamreport.com";
const MAX_USERS = 500;

// ── HTML Builders ─────────────────────────────────────────────────────────────

function buildDigestEmailHtml(data: {
  firstName: string | null;
  newReports: number;
  totalViews: number;
  newComments: number;
  newReactions: number;
}) {
  const name = data.firstName || "there";

  const statCard = (value: number, label: string, color: string) =>
    `<td style="padding:0 6px;" width="33%">
      <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:20px 8px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:${color};line-height:1;">${value}</div>
        <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;margin-top:8px;font-weight:600;">${label}</div>
      </div>
    </td>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your week on VGC Team Report</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#F4F4F5;">
    ${data.totalViews} views, ${data.newComments} comments, ${data.newReactions} reactions this week.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center">
            <tr>
              <td style="padding-right:10px;vertical-align:middle;">
                <div style="width:32px;height:32px;background:#E11D48;border-radius:8px;text-align:center;line-height:32px;">
                  <span style="color:#FFF;font-size:15px;font-weight:800;">V</span>
                </div>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:15px;font-weight:700;color:#111827;">VGC Team Report</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Main card -->
        <tr><td>
          <div style="background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;padding:28px;">

            <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px;">Your week on VGC Team Report, ${name}!</h1>
            <p style="font-size:13px;color:#6B7280;margin:0 0 24px;">Here's how your reports performed over the last 7 days.</p>

            <!-- Stat cards -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                ${statCard(data.totalViews, "New Views", "#2563EB")}
                ${statCard(data.newComments, "Comments", "#D97706")}
                ${statCard(data.newReactions, "Reactions", "#E11D48")}
              </tr>
            </table>

            ${data.newReports > 0 ? `
            <!-- New reports callout -->
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px 16px;margin-bottom:24px;">
              <p style="font-size:13px;font-weight:600;color:#15803D;margin:0;">
                You published ${data.newReports} new report${data.newReports > 1 ? "s" : ""} this week. Keep it up!
              </p>
            </div>
            ` : ""}

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${APP_URL}/dashboard" style="display:inline-block;padding:12px 28px;background:#111827;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;" target="_blank">View your reports</a>
            </div>

          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="font-size:12px;color:#9CA3AF;margin:0 0 6px;">
            <a href="${APP_URL}/explore" style="color:#6B7280;text-decoration:none;font-weight:500;">Explore</a>
            <span style="margin:0 6px;color:#D1D5DB;">&middot;</span>
            <a href="${APP_URL}/dashboard" style="color:#6B7280;text-decoration:none;font-weight:500;">Dashboard</a>
          </p>
          <p style="font-size:11px;color:#D1D5DB;margin:0;">
            VGC Team Report &mdash; pokemonvgcteamreport.com<br>
            To unsubscribe from weekly digests, visit your notification preferences.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

function buildTrendingDigestHtml(data: {
  firstName: string | null;
  topTitles: string[];
}) {
  const name = data.firstName || "there";

  const titleRows = data.topTitles.length > 0
    ? data.topTitles.map((title) =>
        `<tr>
          <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#111827;">${title}</td>
        </tr>`
      ).join("")
    : `<tr><td style="padding:24px;text-align:center;font-size:13px;color:#9CA3AF;">Check out the latest reports from the community</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Trending this week on VGC Team Report</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#F4F4F5;">
    Here's what's trending this week in VGC.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center">
            <tr>
              <td style="padding-right:10px;vertical-align:middle;">
                <div style="width:32px;height:32px;background:#E11D48;border-radius:8px;text-align:center;line-height:32px;">
                  <span style="color:#FFF;font-size:15px;font-weight:800;">V</span>
                </div>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:15px;font-weight:700;color:#111827;">VGC Team Report</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Main card -->
        <tr><td>
          <div style="background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;padding:28px;">

            <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Hey ${name}, here's what's trending in VGC this week!</h1>
            <p style="font-size:13px;color:#6B7280;margin:0 0 24px;">The community has been busy. Check out the most-viewed reports.</p>

            <!-- Top reports -->
            <div style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;margin-bottom:24px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                ${titleRows}
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${APP_URL}/explore" style="display:inline-block;padding:12px 28px;background:#111827;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;" target="_blank">Explore trending teams</a>
            </div>

          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="font-size:12px;color:#9CA3AF;margin:0 0 6px;">
            <a href="${APP_URL}/explore" style="color:#6B7280;text-decoration:none;font-weight:500;">Explore</a>
            <span style="margin:0 6px;color:#D1D5DB;">&middot;</span>
            <a href="${APP_URL}/dashboard" style="color:#6B7280;text-decoration:none;font-weight:500;">Dashboard</a>
          </p>
          <p style="font-size:11px;color:#D1D5DB;margin:0;">
            VGC Team Report &mdash; pokemonvgcteamreport.com<br>
            To unsubscribe from weekly digests, visit your notification preferences.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ── Main Route ────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  let sent = 0;
  let errors = 0;
  let skipped = 0;

  // 1. Get top trending public shares for fallback emails
  let topTitles: string[] = [];
  try {
    const trending = await sql`
      SELECT COALESCE(data->>'tournamentName', data->>'creatorName', 'Untitled Report') AS title
      FROM shares
      WHERE is_public = TRUE
        AND deleted_at IS NULL
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY view_count DESC
      LIMIT 3
    `;
    topTitles = trending.map((r) => r.title as string);
  } catch (e) {
    console.warn("[weekly-digest] Failed to fetch trending shares:", e);
  }

  // 2. Get distinct active users with at least 1 share older than 7 days
  let userIds: string[] = [];
  try {
    const rows = await sql`
      SELECT DISTINCT owner_id
      FROM shares
      WHERE owner_id IS NOT NULL
        AND deleted_at IS NULL
        AND created_at < NOW() - INTERVAL '7 days'
      LIMIT ${MAX_USERS + 1}
    `;
    userIds = rows.map((r) => r.owner_id as string);

    if (userIds.length > MAX_USERS) {
      console.warn(`[weekly-digest] User count (${userIds.length}) exceeds cap of ${MAX_USERS}. Truncating.`);
      userIds = userIds.slice(0, MAX_USERS);
    }
  } catch (e) {
    console.error("[weekly-digest] Failed to fetch user list:", e);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  // 3. Process each user
  const clerk = await clerkClient();

  for (const userId of userIds) {
    try {
      // a. Fetch Clerk user
      let user;
      try {
        user = await clerk.users.getUser(userId);
      } catch (e) {
        console.warn(`[weekly-digest] Could not fetch Clerk user ${userId}:`, e);
        skipped++;
        continue;
      }

      const email = user.emailAddresses?.[0]?.emailAddress ?? "";
      if (!email) {
        skipped++;
        continue;
      }

      // b. Check unsubscribe preference
      if (user.publicMetadata?.digestUnsubscribed === true) {
        skipped++;
        continue;
      }

      const firstName = user.firstName ?? null;

      // c. Query engagement stats
      const [stats] = await sql`
        SELECT
          COUNT(DISTINCT r.id) FILTER (WHERE r.created_at > NOW() - INTERVAL '7 days') AS new_reports,
          COALESCE(SUM(r.view_count), 0) AS total_views,
          COUNT(DISTINCT c.id) AS new_comments,
          COUNT(DISTINCT rc.id) AS new_reactions
        FROM shares r
        LEFT JOIN comments c ON c.share_id = r.id AND c.created_at > NOW() - INTERVAL '7 days'
        LEFT JOIN reactions rc ON rc.share_id = r.id AND rc.created_at > NOW() - INTERVAL '7 days'
        WHERE r.owner_id = ${userId} AND r.deleted_at IS NULL
      `;

      const newReports = Number(stats.new_reports ?? 0);
      const totalViews = Number(stats.total_views ?? 0);
      const newComments = Number(stats.new_comments ?? 0);
      const newReactions = Number(stats.new_reactions ?? 0);

      // d. Check if user has any activity at all
      const hasActivity = newReports > 0 || newComments > 0 || newReactions > 0 || totalViews > 0;

      // e. Check if user has any shares (needed to decide trending vs personalized)
      const [shareCount] = await sql`
        SELECT COUNT(*) AS c FROM shares
        WHERE owner_id = ${userId} AND deleted_at IS NULL
      `;
      const totalShares = Number(shareCount.c ?? 0);
      const sendTrending = totalShares === 0 && !hasActivity;

      let html: string;
      let subject: string;

      if (sendTrending) {
        html = buildTrendingDigestHtml({ firstName, topTitles });
        subject = "Here's what's trending in VGC this week";
      } else {
        html = buildDigestEmailHtml({ firstName, newReports, totalViews, newComments, newReactions });
        subject = `Your reports this week, ${firstName || "there"}!`;
      }

      await sendEmail({ to: email, subject, html });
      sent++;
    } catch (e) {
      console.error(`[weekly-digest] Error processing user ${userId}:`, e);
      errors++;
    }
  }

  console.log(`[weekly-digest] Done — sent:${sent} skipped:${skipped} errors:${errors}`);
  return NextResponse.json({ ok: true, sent, skipped, errors });
}

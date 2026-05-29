/**
 * Email utilities using Resend for weekly feedback summaries.
 */

import { escapeHtml } from "@/lib/utils/sanitize";

const RESEND_API = "https://api.resend.com";

/**
 * From address — uses RESEND_FROM_EMAIL env var.
 * For sandbox testing: "VGC Team Report <onboarding@resend.dev>"
 * For production: verify pokemonvgcteamreport.com in Resend, then use
 *   "VGC Team Report <updates@pokemonvgcteamreport.com>"
 */
const DEFAULT_FROM = "VGC Team Report <onboarding@resend.dev>";

const APP_URL = "https://pokemonvgcteamreport.com";
const LINEAR_URL = "https://linear.app/vgc-team-report";
const GITHUB_URL = "https://github.com/MSS23/VGC-Team-Report";

/**
 * Generic email sender via Resend.
 * Returns null if RESEND_API_KEY is not set or the request fails.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return null;
  }

  const from = (process.env.RESEND_FROM_EMAIL || DEFAULT_FROM).replace(/[\r\n]/g, "");

  // Defence in depth: strip CRLF from the subject line to prevent email header injection
  // if a user-controlled value (e.g. report title, name) slips a newline through.
  const subject = opts.subject.replace(/[\r\n]/g, "");

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Resend error:", res.status, text);
    return null;
  }

  return res.json();
}

/** @deprecated Use sendEmail instead */
export const sendWeeklySummary = sendEmail;

/**
 * Send a comment notification email to the report owner.
 * Fire-and-forget — never throws.
 */
export async function sendCommentNotificationEmail(opts: {
  ownerEmail: string;
  commenterName: string;
  commentBody: string;
  reportTitle: string;
  shareId: string;
}) {
  try {
    const reportUrl = `${APP_URL}/report/${opts.shareId}`;
    const html = buildCommentNotificationHtml(opts.commenterName, opts.commentBody, opts.reportTitle, reportUrl);
    await sendEmail({
      to: opts.ownerEmail,
      subject: `New comment on "${opts.reportTitle}"`,
      html,
    });
  } catch (e: unknown) {
    console.warn("Failed to send comment notification email:", e);
  }
}

/**
 * Build the HTML for a comment notification email.
 */
function buildCommentNotificationHtml(
  commenterName: string,
  commentBody: string,
  reportTitle: string,
  reportUrl: string,
) {
  // Escape all user-controlled values before embedding in HTML to prevent stored XSS.
  const safeCommenterName = escapeHtml(commenterName);
  const safeCommentBody = escapeHtml(commentBody);
  const safeReportTitle = escapeHtml(reportTitle);
  const safeReportUrl = escapeHtml(reportUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>New comment on your report</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

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
            <h1 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 8px;">New comment on your report</h1>
            <p style="font-size:14px;color:#6B7280;margin:0 0 20px;">
              <strong>${safeCommenterName}</strong> commented on <strong>${safeReportTitle}</strong>
            </p>

            <!-- Comment body -->
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;margin-bottom:24px;">
              <p style="font-size:14px;color:#374151;margin:0;line-height:1.5;white-space:pre-wrap;">${safeCommentBody}</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${safeReportUrl}" style="display:inline-block;padding:12px 24px;background:#111827;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;" target="_blank">View Report</a>
            </div>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="font-size:11px;color:#D1D5DB;margin:0;">
            VGC Team Report &mdash; pokemonvgcteamreport.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/**
 * Send a welcome email to a newly signed-up user.
 * Day 0 of the welcome series.
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  firstName: string | null;
}) {
  try {
    const displayName = opts.firstName || "there";
    const html = buildWelcomeEmailHtml(displayName);
    await sendEmail({
      to: opts.to,
      subject: "Welcome to VGC Team Report!",
      html,
    });
  } catch (e: unknown) {
    console.warn("Failed to send welcome email:", e);
  }
}

/**
 * Build the HTML for a Day 0 welcome email.
 * Table-based light theme matching the comment notification pattern.
 */
function buildWelcomeEmailHtml(firstName: string): string {
  // Escape user-controlled name (Clerk firstName) before embedding in HTML to prevent stored XSS.
  const safeFirstName = escapeHtml(firstName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Welcome to VGC Team Report!</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

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
            <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">Welcome to VGC Team Report, ${safeFirstName}!</h1>
            <p style="font-size:14px;color:#6B7280;margin:0 0 24px;">You're ready to build and share your VGC team reports.</p>

            <!-- Quick-start steps -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding-bottom:12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#FEF2F2;border-radius:50%;text-align:center;line-height:24px;">
                          <span style="font-size:12px;font-weight:700;color:#E11D48;">1</span>
                        </div>
                      </td>
                      <td style="vertical-align:top;padding-left:4px;">
                        <p style="font-size:14px;font-weight:600;color:#111827;margin:0 0 2px;">Paste your Showdown export</p>
                        <p style="font-size:13px;color:#6B7280;margin:0;">Get an instant, shareable team report in seconds.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#FEF2F2;border-radius:50%;text-align:center;line-height:24px;">
                          <span style="font-size:12px;font-weight:700;color:#E11D48;">2</span>
                        </div>
                      </td>
                      <td style="vertical-align:top;padding-left:4px;">
                        <p style="font-size:14px;font-weight:600;color:#111827;margin:0 0 2px;">Share your link with teammates or coaches</p>
                        <p style="font-size:13px;color:#6B7280;margin:0;">One link, every detail — no screenshots needed.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width:32px;vertical-align:top;">
                        <div style="width:24px;height:24px;background:#FEF2F2;border-radius:50%;text-align:center;line-height:24px;">
                          <span style="font-size:12px;font-weight:700;color:#E11D48;">3</span>
                        </div>
                      </td>
                      <td style="vertical-align:top;padding-left:4px;">
                        <p style="font-size:14px;font-weight:600;color:#111827;margin:0 0 2px;">Explore what other players are running</p>
                        <p style="font-size:13px;color:#6B7280;margin:0;">Browse public reports and discover new team ideas.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="https://pokemonvgcteamreport.com/" style="display:inline-block;padding:12px 24px;background:#E11D48;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;" target="_blank">Build your first report</a>
            </div>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="font-size:11px;color:#D1D5DB;margin:0;">
            You received this because you signed up for VGC Team Report. pokemonvgcteamreport.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

/**
 * Build the HTML for a weekly feedback summary email.
 * Clean light theme, table-based layout for email client compatibility.
 */
export function buildWeeklySummaryHtml(data: {
  totalNew: number;
  bugs: number;
  features: number;
  improvements: number;
  other: number;
  topRequests: Array<{ title: string; count: number }>;
  recentItems: Array<{ type: string; title: string; submitter: string; date: string }>;
  openBugs: number;
  weekLabel: string;
}) {
  const typeLabel: Record<string, string> = {
    feature: "Feature",
    bug: "Bug",
    improvement: "Improve",
    other: "Other",
  };
  const typeDot: Record<string, string> = {
    feature: "#2563EB",
    bug: "#DC2626",
    improvement: "#D97706",
    other: "#6B7280",
  };

  const recentRows = data.recentItems.slice(0, 8).map((item) => {
    // Escape user-controlled / DB-sourced strings before embedding in HTML.
    const safeType = escapeHtml(item.type);
    const safeTypeLabel = escapeHtml(typeLabel[item.type] ?? item.type);
    const safeTitle = escapeHtml(item.title);
    const safeDate = escapeHtml(item.date);
    return `<tr>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:8px;padding-right:8px;vertical-align:middle;">
            <div style="width:8px;height:8px;border-radius:50%;background:${typeDot[safeType] ?? "#6B7280"};"></div>
          </td>
          <td style="vertical-align:middle;">
            <span style="font-size:10px;font-weight:700;color:${typeDot[safeType] ?? "#6B7280"};text-transform:uppercase;letter-spacing:0.05em;">${safeTypeLabel}</span>
          </td>
        </tr></table>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#111827;vertical-align:top;">${safeTitle}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#9CA3AF;vertical-align:top;white-space:nowrap;">${safeDate}</td>
    </tr>`;
  }).join("");

  const topRequestRows = data.topRequests.slice(0, 5).map((req) => {
    const safeReqTitle = escapeHtml(req.title);
    return `<tr>
      <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#111827;">${safeReqTitle}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:12px;font-weight:700;color:#E11D48;text-align:right;white-space:nowrap;">${req.count}x</td>
    </tr>`;
  }).join("");

  // Helpers
  const statCard = (value: number, label: string, color: string) =>
    `<td style="padding:0 6px;" width="25%">
      <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:20px 8px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:${color};line-height:1;">${value}</div>
        <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;margin-top:8px;font-weight:600;">${label}</div>
      </div>
    </td>`;

  const sectionTitle = (text: string) =>
    `<h2 style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;margin:0 0 12px;padding:0 4px;">${escapeHtml(text)}</h2>`;

  const linkBtn = (href: string, text: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 20px;background:#111827;color:#FFFFFF;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;" target="_blank">${escapeHtml(text)}</a>`;

  // Defence in depth: escape the week label even though it's server-generated today.
  const safeWeekLabel = escapeHtml(data.weekLabel);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Weekly Summary &mdash; ${safeWeekLabel}</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#F4F4F5;">
    ${data.totalNew} new items this week &mdash; ${data.bugs} bugs, ${data.features} features, ${data.improvements} improvements.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo + header -->
        <tr><td style="padding-bottom:32px;text-align:center;">
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
          <div style="background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;overflow:hidden;">

            <!-- Card header -->
            <div style="padding:28px 28px 0;">
              <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px;">Weekly Summary</h1>
              <p style="font-size:13px;color:#6B7280;margin:0;">${safeWeekLabel}</p>
            </div>

            <!-- Stats -->
            <div style="padding:24px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  ${statCard(data.totalNew, "Total", "#111827")}
                  ${statCard(data.bugs, "Bugs", "#DC2626")}
                  ${statCard(data.features, "Features", "#2563EB")}
                  ${statCard(data.improvements, "Improve", "#D97706")}
                </tr>
              </table>
            </div>

            ${data.openBugs > 0 ? `
            <!-- Bug alert -->
            <div style="padding:0 28px 20px;">
              <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:12px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                  <td style="padding-right:8px;vertical-align:middle;font-size:14px;">&#x26A0;&#xFE0F;</td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:13px;font-weight:600;color:#991B1B;">${data.openBugs} open bug${data.openBugs > 1 ? "s" : ""} need attention</span>
                  </td>
                  <td style="vertical-align:middle;text-align:right;padding-left:12px;">
                    <a href="${LINEAR_URL}" style="font-size:12px;font-weight:600;color:#DC2626;text-decoration:none;">View in Linear &rarr;</a>
                  </td>
                </tr></table>
              </div>
            </div>
            ` : ""}

            ${topRequestRows ? `
            <!-- Trending -->
            <div style="padding:0 28px 24px;">
              ${sectionTitle("Trending Requests")}
              <div style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
                <table role="presentation" style="width:100%;border-collapse:collapse;">${topRequestRows}</table>
              </div>
            </div>
            ` : ""}

            <!-- Recent items -->
            <div style="padding:0 28px 28px;">
              ${sectionTitle("Recent Submissions")}
              <div style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
                <table role="presentation" style="width:100%;border-collapse:collapse;">
                  ${recentRows || '<tr><td style="padding:24px;text-align:center;color:#9CA3AF;font-size:13px;">No submissions this week</td></tr>'}
                </table>
              </div>
            </div>

            <!-- CTA buttons -->
            <div style="padding:0 28px 28px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="padding-right:8px;">
                    ${linkBtn(`${APP_URL}/dashboard`, "Open Dashboard")}
                  </td>
                  <td style="padding-left:8px;">
                    <a href="${LINEAR_URL}" style="display:inline-block;padding:10px 20px;background:#FFFFFF;color:#111827;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;border:1px solid #E5E7EB;" target="_blank">Open Linear</a>
                  </td>
                </tr>
              </table>
            </div>

          </div>
        </td></tr>

        <!-- Footer links -->
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="font-size:12px;color:#9CA3AF;margin:0 0 8px;">
            <a href="${APP_URL}" style="color:#6B7280;text-decoration:none;font-weight:500;">App</a>
            <span style="margin:0 6px;color:#D1D5DB;">&middot;</span>
            <a href="${APP_URL}/feedback" style="color:#6B7280;text-decoration:none;font-weight:500;">Feedback</a>
            <span style="margin:0 6px;color:#D1D5DB;">&middot;</span>
            <a href="${APP_URL}/explore" style="color:#6B7280;text-decoration:none;font-weight:500;">Explore</a>
            <span style="margin:0 6px;color:#D1D5DB;">&middot;</span>
            <a href="${GITHUB_URL}" style="color:#6B7280;text-decoration:none;font-weight:500;">GitHub</a>
            <span style="margin:0 6px;color:#D1D5DB;">&middot;</span>
            <a href="${LINEAR_URL}" style="color:#6B7280;text-decoration:none;font-weight:500;">Linear</a>
          </p>
          <p style="font-size:11px;color:#D1D5DB;margin:0;">
            VGC Team Report &mdash; pokemonvgcteamreport.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

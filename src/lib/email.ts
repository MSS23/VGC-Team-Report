/**
 * Email utilities using Resend for weekly feedback summaries.
 */

const RESEND_API = "https://api.resend.com";

/**
 * Default from address — override with RESEND_FROM_EMAIL env var.
 * Must be a verified domain in Resend (not onboarding@resend.dev for production).
 */
const DEFAULT_FROM = "VGC Team Report <updates@pokemonvgcteamreport.com>";

export async function sendWeeklySummary(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return null;
  }

  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
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

/**
 * Build the HTML for a weekly feedback summary email.
 * Light theme, modern design, optimized for email clients.
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
    improvement: "Improvement",
    other: "Other",
  };

  const typeBg: Record<string, string> = {
    feature: "#DBEAFE",
    bug: "#FEE2E2",
    improvement: "#FEF3C7",
    other: "#F3F4F6",
  };

  const typeColor: Record<string, string> = {
    feature: "#1D4ED8",
    bug: "#DC2626",
    improvement: "#D97706",
    other: "#6B7280",
  };

  const recentRows = data.recentItems.slice(0, 10).map((item) =>
    `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px;">
        <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;background:${typeBg[item.type] ?? "#F3F4F6"};color:${typeColor[item.type] ?? "#6B7280"};">${typeLabel[item.type] ?? item.type}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#111827;">${item.title}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#9CA3AF;">${item.submitter}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:12px;color:#9CA3AF;">${item.date}</td>
    </tr>`
  ).join("");

  const topRequestRows = data.topRequests.slice(0, 5).map((req, i) =>
    `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#9CA3AF;width:28px;">${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;color:#111827;">${req.title}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:700;color:#E11D48;text-align:right;white-space:nowrap;">${req.count}</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#F9FAFB;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#E11D48;width:40px;height:40px;border-radius:10px;line-height:40px;margin-bottom:16px;">
        <span style="color:white;font-size:18px;font-weight:800;">V</span>
      </div>
      <h1 style="font-size:20px;font-weight:700;margin:0;color:#111827;">Weekly Feedback Summary</h1>
      <p style="font-size:13px;color:#6B7280;margin:6px 0 0;">${data.weekLabel}</p>
    </div>

    <!-- Stats row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:0 4px 0 0;" width="25%">
          <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:16px 12px;text-align:center;">
            <div style="font-size:26px;font-weight:800;color:#111827;line-height:1;">${data.totalNew}</div>
            <div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;font-weight:600;">Total</div>
          </div>
        </td>
        <td style="padding:0 4px;" width="25%">
          <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:16px 12px;text-align:center;">
            <div style="font-size:26px;font-weight:800;color:#DC2626;line-height:1;">${data.bugs}</div>
            <div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;font-weight:600;">Bugs</div>
          </div>
        </td>
        <td style="padding:0 4px;" width="25%">
          <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:16px 12px;text-align:center;">
            <div style="font-size:26px;font-weight:800;color:#2563EB;line-height:1;">${data.features}</div>
            <div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;font-weight:600;">Features</div>
          </div>
        </td>
        <td style="padding:0 0 0 4px;" width="25%">
          <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:16px 12px;text-align:center;">
            <div style="font-size:26px;font-weight:800;color:#D97706;line-height:1;">${data.improvements}</div>
            <div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;margin-top:6px;font-weight:600;">Improve</div>
          </div>
        </td>
      </tr>
    </table>

    ${data.openBugs > 0 ? `
    <!-- Bug alert -->
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;vertical-align:middle;"><span style="font-size:16px;">&#x1F41B;</span></td>
        <td style="vertical-align:middle;"><span style="font-size:13px;font-weight:600;color:#991B1B;">${data.openBugs} open bug${data.openBugs > 1 ? "s" : ""} need attention</span></td>
      </tr></table>
    </div>
    ` : ""}

    ${topRequestRows ? `
    <!-- Trending requests -->
    <div style="margin-bottom:24px;">
      <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin:0 0 10px;">Trending Requests</h2>
      <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">${topRequestRows}</table>
      </div>
    </div>
    ` : ""}

    <!-- Recent submissions -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6B7280;margin:0 0 10px;">Recent Submissions</h2>
      <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">${recentRows || '<tr><td style="padding:20px;text-align:center;color:#9CA3AF;font-size:13px;">No submissions this week</td></tr>'}</table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:20px;border-top:1px solid #E5E7EB;">
      <p style="font-size:12px;color:#9CA3AF;margin:0 0 8px;">
        <a href="https://pokemonvgcteamreport.com/dashboard" style="color:#E11D48;text-decoration:none;font-weight:600;">Dashboard</a>
        <span style="margin:0 8px;color:#D1D5DB;">&middot;</span>
        <a href="https://pokemonvgcteamreport.com/feedback" style="color:#E11D48;text-decoration:none;font-weight:600;">Feedback</a>
        <span style="margin:0 8px;color:#D1D5DB;">&middot;</span>
        <a href="https://pokemonvgcteamreport.com/explore" style="color:#E11D48;text-decoration:none;font-weight:600;">Explore</a>
      </p>
      <p style="font-size:11px;color:#D1D5DB;margin:0;">
        VGC Team Report &mdash; pokemonvgcteamreport.com
      </p>
    </div>

  </div>
</body>
</html>`;
}

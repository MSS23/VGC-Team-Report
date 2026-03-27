/**
 * Email utilities using Resend for weekly feedback summaries.
 */

const RESEND_API = "https://api.resend.com";

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

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "VGC Team Report <onboarding@resend.dev>",
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
  const typeEmoji: Record<string, string> = {
    feature: "\uD83D\uDCA1",
    bug: "\uD83D\uDC1B",
    improvement: "\u26A1",
    other: "\uD83D\uDCAC",
  };

  const recentRows = data.recentItems.slice(0, 10).map((item) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;font-size:13px;">${typeEmoji[item.type] ?? ""} ${item.type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;font-size:13px;font-weight:600;">${item.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;font-size:13px;color:#7A7AA0;">${item.submitter}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #2a2a3e;font-size:13px;color:#7A7AA0;">${item.date}</td>
    </tr>`
  ).join("");

  const topRequestRows = data.topRequests.slice(0, 5).map((req, i) =>
    `<tr>
      <td style="padding:6px 12px;font-size:13px;color:#7A7AA0;">${i + 1}.</td>
      <td style="padding:6px 12px;font-size:13px;font-weight:600;">${req.title}</td>
      <td style="padding:6px 12px;font-size:13px;color:#E11D48;font-weight:700;">${req.count} requests</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0B0B1A;color:#F0EDE6;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:22px;font-weight:800;margin:0;">
        <span style="color:#F0EDE6;">VGC Team</span> <span style="color:#E11D48;">Report</span>
      </h1>
      <p style="font-size:14px;color:#7A7AA0;margin:8px 0 0;">Weekly Feedback Summary &mdash; ${data.weekLabel}</p>
    </div>

    <!-- Stats cards -->
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#1C1C2E;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
        <div style="font-size:28px;font-weight:800;color:#E11D48;">${data.totalNew}</div>
        <div style="font-size:11px;color:#7A7AA0;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">New</div>
      </div>
      <div style="flex:1;background:#1C1C2E;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
        <div style="font-size:28px;font-weight:800;color:#EF4444;">${data.bugs}</div>
        <div style="font-size:11px;color:#7A7AA0;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Bugs</div>
      </div>
      <div style="flex:1;background:#1C1C2E;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
        <div style="font-size:28px;font-weight:800;color:#10B981;">${data.features}</div>
        <div style="font-size:11px;color:#7A7AA0;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Features</div>
      </div>
      <div style="flex:1;background:#1C1C2E;border-radius:12px;padding:16px;text-align:center;border:1px solid #2a2a3e;">
        <div style="font-size:28px;font-weight:800;color:#F59E0B;">${data.improvements}</div>
        <div style="font-size:11px;color:#7A7AA0;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Improvements</div>
      </div>
    </div>

    ${data.openBugs > 0 ? `
    <!-- Bug alert -->
    <div style="background:#2a1215;border:1px solid #ef4444;border-radius:12px;padding:14px 16px;margin-bottom:24px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:20px;">\uD83D\uDC1B</span>
      <span style="font-size:13px;font-weight:600;color:#FCA5A5;">${data.openBugs} open bug${data.openBugs > 1 ? "s" : ""} need attention</span>
    </div>
    ` : ""}

    ${topRequestRows ? `
    <!-- Top requests -->
    <div style="margin-bottom:24px;">
      <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7A7AA0;margin:0 0 12px;">\uD83D\uDD25 Trending Requests</h2>
      <div style="background:#1C1C2E;border-radius:12px;border:1px solid #2a2a3e;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">${topRequestRows}</table>
      </div>
    </div>
    ` : ""}

    <!-- Recent items -->
    <div style="margin-bottom:24px;">
      <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7A7AA0;margin:0 0 12px;">Recent Submissions</h2>
      <div style="background:#1C1C2E;border-radius:12px;border:1px solid #2a2a3e;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">${recentRows || '<tr><td style="padding:16px;text-align:center;color:#7A7AA0;font-size:13px;">No submissions this week</td></tr>'}</table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;border-top:1px solid #2a2a3e;">
      <p style="font-size:12px;color:#7A7AA0;margin:0;">
        <a href="https://linear.app/vgc-team-report" style="color:#E11D48;text-decoration:none;font-weight:600;">Open Linear</a>
        &nbsp;&middot;&nbsp;
        <a href="https://pokemonvgcteamreport.com" style="color:#E11D48;text-decoration:none;font-weight:600;">Open App</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

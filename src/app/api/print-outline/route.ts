import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { NextResponse } from "next/server";

/**
 * GET /api/print-outline?id=SHARE_ID
 * Returns a printable HTML page with blank note-taking outlines.
 * VGC-legal: contains only lines and shapes, no words or symbols.
 * Structure matches the team's matchup plan layout.
 */
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "print", max: 10 } });
  if (guard) return guard;

  const url = new URL(request.url);
  const shareId = url.searchParams.get("id");
  if (!shareId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = rows[0].data as Record<string, unknown>;
  const paste = (data.paste as string) ?? "";
  const matchupPlans = (data.matchupPlans as Array<Record<string, unknown>>) ?? [];

  // Count Pokemon from paste
  const pokemonCount = paste.trim().split(/\n\s*\n/).filter((b) => b.trim()).length;
  const planCount = matchupPlans.length;

  // Generate blank grid HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tournament Notes</title>
  <style>
    @media print { @page { margin: 1cm; } body { -webkit-print-color-adjust: exact; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #333; padding: 16px; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .grid { display: grid; gap: 8px; margin-bottom: 16px; }
    .team-grid { grid-template-columns: repeat(${Math.min(pokemonCount, 3)}, 1fr); }
    .matchup-grid { grid-template-columns: repeat(2, 1fr); }
    .box {
      border: 1.5px solid #ccc; border-radius: 6px; padding: 10px;
      min-height: 60px; position: relative;
    }
    .box-tall { min-height: 100px; }
    .box-wide { grid-column: span 2; }
    .circle {
      width: 40px; height: 40px; border: 1.5px solid #ddd;
      border-radius: 50%; display: inline-block; margin: 2px;
    }
    .line { border-bottom: 1px solid #e0e0e0; height: 24px; }
    .bring-row { display: flex; gap: 6px; margin-bottom: 8px; }
    .section { margin-bottom: 20px; }
    .divider { border-top: 1px solid #e0e0e0; margin: 12px 0; }
    h2 { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
    .round-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .round-num { width: 24px; height: 24px; border: 1.5px solid #ccc; border-radius: 50%; }
    .result-box { width: 24px; height: 24px; border: 1.5px solid #ccc; border-radius: 4px; }
  </style>
</head>
<body>
  <!-- Page 1: Team grid + general notes -->
  <div class="page">
    <div class="section">
      <div class="grid team-grid">
        ${Array.from({ length: pokemonCount }, () => `
          <div class="box">
            <div class="circle"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="section">
      <div class="box box-tall box-wide" style="grid-column: span ${Math.min(pokemonCount, 3)}">
        ${Array.from({ length: 6 }, () => '<div class="line"></div>').join("")}
      </div>
    </div>
  </div>

  <!-- Page 2+: Matchup grids (one section per matchup plan, or generic rounds) -->
  <div class="page">
    ${planCount > 0
      ? matchupPlans.map((_, i) => `
        <div class="section">
          <div class="round-header">
            <div class="round-num"></div>
            <div style="flex: 1; border-bottom: 1px solid #e0e0e0; height: 12px;"></div>
            <div class="result-box"></div>
          </div>
          <div class="bring-row">
            ${Array.from({ length: 4 }, () => '<div class="circle"></div>').join("")}
          </div>
          <div class="box box-tall">
            ${Array.from({ length: 4 }, () => '<div class="line"></div>').join("")}
          </div>
          ${i < planCount - 1 ? '<div class="divider"></div>' : ""}
        </div>
      `).join("")
      : Array.from({ length: 6 }, (_, i) => `
        <div class="section">
          <div class="round-header">
            <div class="round-num"></div>
            <div style="flex: 1; border-bottom: 1px solid #e0e0e0; height: 12px;"></div>
            <div class="result-box"></div>
          </div>
          <div class="bring-row">
            ${Array.from({ length: 4 }, () => '<div class="circle"></div>').join("")}
          </div>
          <div class="box">
            ${Array.from({ length: 3 }, () => '<div class="line"></div>').join("")}
          </div>
          ${i < 5 ? '<div class="divider"></div>' : ""}
        </div>
      `).join("")
    }
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

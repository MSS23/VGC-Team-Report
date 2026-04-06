import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { captureServerEvent } from "@/lib/posthog-server";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { after } from "next/server";
import { getLogger, flushLogs } from "@/instrumentation";
import { NextResponse } from "next/server";
import { z } from "zod";

// In-memory dedup: prevent same session from incrementing more than once per cycle
const recentViews = new Set<string>();
setInterval(() => recentViews.clear(), 10 * 60 * 1000); // clear every 10 min

const ViewBody = z.object({ sessionId: z.string().min(1) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const guard = await apiGuard(request, { rateLimit: { key: "views", max: 60 } });
    if (guard) return guard;

    const raw = await request.json();
    const parsed = ViewBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const key = `${shareId}:${parsed.data.sessionId}`;
    if (recentViews.has(key)) {
      // Already counted this session recently — return current count
      const sql = getDb();
      const rows = await sql`SELECT COALESCE(view_count, 0) as vc FROM shares WHERE id = ${shareId} AND is_public = TRUE AND deleted_at IS NULL`;
      return NextResponse.json({ viewCount: rows[0]?.vc ?? 0 });
    }

    recentViews.add(key);
    const sql = getDb();
    const rows = await sql`
      UPDATE shares SET view_count = COALESCE(view_count, 0) + 1
      WHERE id = ${shareId} AND is_public = TRUE AND deleted_at IS NULL
      RETURNING view_count
    `;
    if (rows.length === 0) {
      return NextResponse.json({ viewCount: 0 });
    }

    captureServerEvent(parsed.data.sessionId, "report_viewed", {
      report_id: shareId,
      view_count: rows[0].view_count,
    });

    // OTel log to PostHog
    const logger = getLogger();
    logger.emit({
      body: `Report viewed: ${shareId}`,
      severityNumber: SeverityNumber.INFO,
      attributes: {
        endpoint: "/api/views",
        share_id: shareId,
        view_count: rows[0].view_count,
      },
    });
    after(flushLogs);

    return NextResponse.json({ viewCount: rows[0].view_count });
  } catch (e) {
    console.error("View count error:", e);
    const errLogger = getLogger();
    errLogger.emit({
      body: `View count error: ${e instanceof Error ? e.message : String(e)}`,
      severityNumber: SeverityNumber.ERROR,
      attributes: { endpoint: "/api/views" },
    });
    after(flushLogs);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

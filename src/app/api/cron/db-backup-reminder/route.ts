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

    // Check database size and table counts as a health indicator
    const tables = await sql`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const sizeResult = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
    `;

    const rowCounts: { table: string; count: number }[] = [];
    for (const t of tables) {
      const countResult = await sql`
        SELECT count(*) as c FROM ${sql(t.tablename)}
      `.catch(() => [{ c: 0 }]);
      rowCounts.push({ table: t.tablename, count: Number(countResult[0].c) });
    }

    const totalRows = rowCounts.reduce((sum, r) => sum + r.count, 0);
    const dbSize = sizeResult[0]?.db_size ?? "unknown";

    const tableList = rowCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((r) => `- \`${r.table}\`: ${r.count.toLocaleString()} rows`)
      .join("\n");

    await postToBuildsChannel({
      title: "Weekly Database Report",
      description: [
        `**Database size:** ${dbSize}`,
        `**Total rows:** ${totalRows.toLocaleString()}`,
        `**Tables (${tables.length}):**`,
        tableList,
        "",
        "Neon handles automatic backups. Check [Neon dashboard](https://console.neon.tech) to verify backup status.",
      ].join("\n"),
      color: COLORS.info,
      footer: { text: "VGC Database Monitor" },
    });

    return NextResponse.json({ ok: true, tables: tables.length, totalRows, size: dbSize });
  } catch (e) {
    console.error("DB backup reminder failed:", e);

    await postToBuildsChannel({
      title: "Database Health Check Failed",
      description: "Could not connect to the database. Check Neon dashboard immediately.",
      color: COLORS.error,
      footer: { text: "VGC Database Monitor" },
    });

    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

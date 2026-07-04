import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "oembed", max: 60 } });
  if (guard) return guard;

  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const match = targetUrl.match(/\/s\/([A-Za-z0-9]{6,12})/);
  if (!match) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const shareId = match[1];
  const baseUrl = "https://pokemonvgcteamreport.com";

  const sql = getDb();
  const rows = await sql`SELECT data FROM shares WHERE id = ${shareId} AND is_public = TRUE AND deleted_at IS NULL`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = rows[0].data as Record<string, unknown>;
  const tournamentName = (data.tournamentName as string) ?? "VGC Team Report";
  const creatorName = (data.creatorName as string) ?? "";

  const res = NextResponse.json({
    version: "1.0",
    type: "rich",
    provider_name: "VGC Team Report",
    provider_url: baseUrl,
    title: creatorName ? `${tournamentName} by ${creatorName}` : tournamentName,
    html: `<iframe src="${baseUrl}/embed/${encodeURIComponent(shareId)}" width="100%" height="200" frameborder="0" style="border-radius:8px;overflow:hidden;"></iframe>`,
    width: 600,
    height: 200,
    thumbnail_url: `${baseUrl}/api/team-graphic?id=${shareId}&style=wide`,
    thumbnail_width: 1200,
    thumbnail_height: 400,
  });
  // oEmbed payloads are polled repeatedly by Discord/Slack unfurlers and change
  // rarely — let the CDN serve them for an hour to keep the DB lookup cold.
  res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res;
}

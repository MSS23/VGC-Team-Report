import { isCronAuthorized } from "@/lib/cron-auth";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

const SITE_URL = "https://pokemonvgcteamreport.com";
const ENDPOINTS = [
  { path: "/", name: "Homepage" },
  { path: "/explore", name: "Explore" },
  { path: "/changelog", name: "Changelog" },
  { path: "/api/keep-alive", name: "API (keep-alive)" },
];

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { name: string; status: number; ok: boolean; ms: number }[] = [];

  for (const endpoint of ENDPOINTS) {
    const start = Date.now();
    try {
      const res = await fetch(`${SITE_URL}${endpoint.path}`, {
        method: "GET",
        headers: { "User-Agent": "VGC-HealthCheck/1.0" },
        redirect: "follow",
      });
      results.push({
        name: endpoint.name,
        status: res.status,
        ok: res.status >= 200 && res.status < 400,
        ms: Date.now() - start,
      });
    } catch {
      results.push({
        name: endpoint.name,
        status: 0,
        ok: false,
        ms: Date.now() - start,
      });
    }
  }

  const failures = results.filter((r) => !r.ok);
  const allOk = failures.length === 0;

  if (!allOk) {
    const failList = failures
      .map((f) => `- **${f.name}**: ${f.status === 0 ? "unreachable" : `HTTP ${f.status}`}`)
      .join("\n");

    await postToBuildsChannel({
      title: "Site Health Check Failed",
      description: `**${failures.length}/${results.length} endpoints down**\n\n${failList}\n\nCheck [Vercel dashboard](https://vercel.com) for deploy status.`,
      color: COLORS.error,
      footer: { text: "VGC Health Monitor" },
    });
  }

  return NextResponse.json({
    ok: allOk,
    results,
    checkedAt: new Date().toISOString(),
  });
}

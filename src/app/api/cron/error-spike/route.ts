import { isCronAuthorized } from "@/lib/cron-auth";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

const SITE_URL = "https://pokemonvgcteamreport.com";

/**
 * Check key API routes for error responses.
 * Vercel doesn't expose function error logs via API on free tier,
 * so we probe endpoints and look for non-200 responses.
 */
const PROBE_ENDPOINTS = [
  { path: "/api/keep-alive", name: "Keep Alive", method: "GET" as const },
  { path: "/api/explore", name: "Explore API", method: "GET" as const },
  { path: "/", name: "Homepage", method: "GET" as const },
  { path: "/explore", name: "Explore Page", method: "GET" as const },
  { path: "/dashboard", name: "Dashboard", method: "GET" as const },
  { path: "/changelog", name: "Changelog", method: "GET" as const },
];

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: { name: string; status: number; ms: number }[] = [];
  const slow: { name: string; ms: number }[] = [];
  const SLOW_THRESHOLD_MS = 5000;

  for (const endpoint of PROBE_ENDPOINTS) {
    const start = Date.now();
    try {
      const res = await fetch(`${SITE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: { "User-Agent": "VGC-ErrorMonitor/1.0" },
        redirect: "follow",
      });
      const ms = Date.now() - start;

      if (res.status >= 500) {
        errors.push({ name: endpoint.name, status: res.status, ms });
      } else if (ms > SLOW_THRESHOLD_MS) {
        slow.push({ name: endpoint.name, ms });
      }
    } catch {
      errors.push({ name: endpoint.name, status: 0, ms: Date.now() - start });
    }
  }

  const hasIssues = errors.length > 0 || slow.length > 0;

  if (hasIssues) {
    const sections: string[] = [];

    if (errors.length > 0) {
      sections.push(
        `**Errors (${errors.length}):**\n` +
        errors.map((e) => `- **${e.name}**: ${e.status === 0 ? "unreachable" : `HTTP ${e.status}`} (${e.ms}ms)`).join("\n")
      );
    }

    if (slow.length > 0) {
      sections.push(
        `**Slow responses (>${SLOW_THRESHOLD_MS}ms):**\n` +
        slow.map((s) => `- **${s.name}**: ${s.ms}ms`).join("\n")
      );
    }

    await postToBuildsChannel({
      title: errors.length > 0 ? "Error Spike Detected" : "Performance Degradation",
      description: sections.join("\n\n") + "\n\nCheck Vercel function logs for details.",
      color: errors.length > 0 ? COLORS.error : COLORS.warning,
      footer: { text: "VGC Error Monitor" },
    });
  }

  return NextResponse.json({
    ok: !hasIssues,
    errors: errors.length,
    slow: slow.length,
    probed: PROBE_ENDPOINTS.length,
  });
}

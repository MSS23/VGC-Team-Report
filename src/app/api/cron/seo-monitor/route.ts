import { isCronAuthorized } from "@/lib/cron-auth";
import { postToBuildsChannel, COLORS } from "@/lib/discord-webhook";
import { NextResponse } from "next/server";

const SITE_URL = "https://pokemonvgcteamreport.com";

const PAGES_TO_CHECK = [
  { path: "/", name: "Homepage" },
  { path: "/explore", name: "Explore" },
  { path: "/changelog", name: "Changelog" },
  { path: "/feedback", name: "Feedback" },
  { path: "/champions", name: "Champions" },
];

interface SeoIssue {
  page: string;
  issues: string[];
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problems: SeoIssue[] = [];

  for (const page of PAGES_TO_CHECK) {
    try {
      const res = await fetch(`${SITE_URL}${page.path}`, {
        headers: { "User-Agent": "VGC-SEO-Monitor/1.0" },
      });

      if (!res.ok) {
        problems.push({ page: page.name, issues: [`HTTP ${res.status}`] });
        continue;
      }

      const html = await res.text();
      const issues: string[] = [];

      // Check for meta title
      if (!html.includes("<title>") && !html.includes("<title ")) {
        issues.push("Missing <title> tag");
      }

      // Check for meta description
      if (!html.includes('name="description"')) {
        issues.push("Missing meta description");
      }

      // Check for OG tags
      if (!html.includes('property="og:title"')) {
        issues.push("Missing og:title");
      }
      if (!html.includes('property="og:description"')) {
        issues.push("Missing og:description");
      }
      if (!html.includes('property="og:image"')) {
        issues.push("Missing og:image");
      }

      // Check for canonical
      if (!html.includes('rel="canonical"')) {
        issues.push("Missing canonical URL");
      }

      // Check for viewport
      if (!html.includes('name="viewport"')) {
        issues.push("Missing viewport meta");
      }

      if (issues.length > 0) {
        problems.push({ page: page.name, issues });
      }
    } catch {
      problems.push({ page: page.name, issues: ["Failed to fetch"] });
    }
  }

  if (problems.length > 0) {
    const desc = problems
      .map((p) => `**${p.page}:**\n${p.issues.map((i) => `  - ${i}`).join("\n")}`)
      .join("\n\n");

    await postToBuildsChannel({
      title: `SEO Issues Found on ${problems.length} Page${problems.length > 1 ? "s" : ""}`,
      description: desc + "\n\nFix these to maintain search rankings.",
      color: COLORS.warning,
      footer: { text: "VGC SEO Monitor" },
    });
  }

  return NextResponse.json({
    ok: problems.length === 0,
    pagesChecked: PAGES_TO_CHECK.length,
    issues: problems.length,
    details: problems,
  });
}

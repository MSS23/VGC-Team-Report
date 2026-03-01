import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for fetching PokéPaste content.
 * Returns the raw paste text and the page title (team name).
 *
 * GET /api/pokepaste?url=https://pokepast.es/abc123
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate it's a pokepast.es URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsed.hostname !== "pokepast.es") {
    return NextResponse.json({ error: "Only pokepast.es URLs are supported" }, { status: 400 });
  }

  // Build the /raw URL and the HTML page URL
  const basePath = parsed.pathname.replace(/\/raw\/?$/, "").replace(/\/$/, "");
  const rawUrl = `https://pokepast.es${basePath}/raw`;
  const htmlUrl = `https://pokepast.es${basePath}`;

  try {
    // Fetch both raw paste and HTML page in parallel
    const [rawRes, htmlRes] = await Promise.all([
      fetch(rawUrl, { headers: { "User-Agent": "VGC-Team-Report/1.0" } }),
      fetch(htmlUrl, { headers: { "User-Agent": "VGC-Team-Report/1.0" } }),
    ]);

    if (!rawRes.ok) {
      return NextResponse.json(
        { error: `PokéPaste returned ${rawRes.status}` },
        { status: rawRes.status }
      );
    }

    const text = await rawRes.text();

    // Extract title from HTML page
    let title: string | null = null;
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const titleMatch = html.match(/<h1>(.*?)<\/h1>/i) ?? html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        const raw = titleMatch[1].trim();
        // Only use if it's not a generic/empty title
        if (raw && raw.toLowerCase() !== "untitled" && raw !== "pokepast.es") {
          title = raw;
        }
      }
    }

    return NextResponse.json({ paste: text, title });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from PokéPaste" },
      { status: 502 }
    );
  }
}

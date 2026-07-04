import { apiGuard } from "@/lib/security/api-guard";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PokePasteCreateSchema = z.object({
  paste: z.string().min(1).max(50_000),
  title: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  notes: z.string().max(5_000).optional(),
});

const PokePasteUrlSchema = z.string().url().refine(
  (val: string) => {
    try {
      return new URL(val).hostname === "pokepast.es";
    } catch {
      return false;
    }
  },
  { message: "Only pokepast.es URLs are supported" }
);

/**
 * Proxy endpoint for fetching PokéPaste content.
 * Returns the raw paste text and the page title (team name).
 *
 * GET /api/pokepaste?url=https://pokepast.es/abc123
 */
export async function GET(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "pokepaste", max: 20 } });
  if (guard) return guard;

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const urlResult = PokePasteUrlSchema.safeParse(url);
  if (!urlResult.success) {
    const msg = urlResult.error.issues[0]?.message;
    if (msg === "Only pokepast.es URLs are supported") {
      return NextResponse.json({ error: "Only pokepast.es URLs are supported" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const parsed = new URL(urlResult.data);

  // Build the /raw URL and the HTML page URL
  const basePath = parsed.pathname.replace(/\/raw\/?$/, "").replace(/\/$/, "");
  const rawUrl = `https://pokepast.es${basePath}/raw`;
  const htmlUrl = `https://pokepast.es${basePath}`;

  try {
    // Fetch both raw paste and HTML page in parallel, each under a 5s timeout
    const [rawRes, htmlRes] = await Promise.all([
      fetchWithTimeout(rawUrl, { headers: { "User-Agent": "VGC-Team-Report/1.0" } }, 5000),
      fetchWithTimeout(htmlUrl, { headers: { "User-Agent": "VGC-Team-Report/1.0" } }, 5000),
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
        // Decode HTML entities (&#39; → ', &amp; → &, etc.)
        const raw = titleMatch[1]
          .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
          .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim();
        // Only use if it's not a generic/empty title
        if (raw && raw.toLowerCase() !== "untitled" && raw !== "pokepast.es") {
          title = raw;
        }
      }
    }

    return NextResponse.json({ paste: text, title });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Failed to fetch from PokéPaste" },
      { status: 502 }
    );
  }
}

/**
 * Creates a new paste on pokepast.es and returns the resulting URL.
 *
 * POST /api/pokepaste
 * Body: { paste: string, title?: string, author?: string, notes?: string }
 * Response: { url: string }
 */
export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "pokepaste-create", max: 20 } });
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PokePasteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { paste, title, author, notes } = parsed.data;

  // pokepast.es's parser splits Pokemon blocks on blank CRLF lines —
  // browsers normalize textarea content to CR+LF before form submit per
  // the HTML spec, so their server assumes that encoding. With bare LF
  // line endings the entire paste collapses into a single Pokemon block
  // and every sprite resolves to 0-0.png (unknown). Normalize to CRLF
  // here so we match what a browser form submission would send.
  const crlfPaste = paste.replace(/\r\n?|\n/g, "\r\n");
  const form = new URLSearchParams();
  form.set("paste", crlfPaste);
  if (title) form.set("title", title);
  if (author) form.set("author", author);
  if (notes) form.set("notes", notes);

  try {
    const res = await fetchWithTimeout("https://pokepast.es/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "VGC-Team-Report/1.0",
      },
      body: form.toString(),
      redirect: "manual",
    }, 8000);

    // pokepast.es responds with 302 Location: /<id> on success
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) {
        const url = location.startsWith("http")
          ? location
          : `https://pokepast.es${location.startsWith("/") ? "" : "/"}${location}`;
        return NextResponse.json({ url });
      }
    }

    // Some variants return HTML on 200 — try to extract the canonical URL
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/https:\/\/pokepast\.es\/[A-Za-z0-9]+/);
      if (match) {
        return NextResponse.json({ url: match[0] });
      }
    }

    return NextResponse.json(
      { error: `PokéPaste returned ${res.status}` },
      { status: 502 }
    );
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Failed to create PokéPaste" },
      { status: 502 }
    );
  }
}

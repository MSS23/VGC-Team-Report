import { apiGuard } from "@/lib/security/api-guard";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { normalizePokePasteUrl } from "@/lib/utils/pokepaste-url";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PokePasteCreateSchema = z.object({
  paste: z.string().min(1).max(50_000),
  title: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  notes: z.string().max(5_000).optional(),
});

/**
 * Largest paste we will pull into memory. A full 6-mon Showdown export is
 * ~2 KB; 512 KB is generous and still bounds a hostile/huge response.
 */
const MAX_PASTE_BYTES = 512 * 1024;

/** Read a response body with a hard byte cap, aborting once the cap is passed. */
async function readCappedText(res: Response, maxBytes: number): Promise<string | null> {
  const declared = Number(res.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return null;

  const body = res.body;
  if (!body) return null;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

/**
 * Proxy endpoint for fetching PokéPaste content.
 * Returns the raw paste text and the page title (team name).
 *
 * GET /api/pokepaste?url=https://pokepast.es/abc123
 *
 * SECURITY: this fetches a URL supplied by the caller, so it is an SSRF
 * surface. `normalizePokePasteUrl` enforces an exact-hostname allowlist and
 * rebuilds the outbound URL from the validated paste id alone; we additionally
 * refuse to follow redirects (a 30x off-host is an error, not a hop) and cap
 * the response body. Upstream response bodies are never echoed back.
 */
export async function GET(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: { key: "pokepaste", max: 20 } });
  if (guard) return guard;

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Reject non-https explicitly: an http (or any other scheme) URL is a client
  // bug worth surfacing, and we only ever make https requests ourselves.
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(url.trim()) && !/^https:\/\//i.test(url.trim())) {
    return NextResponse.json(
      { error: "Only https pokepast.es URLs are supported" },
      { status: 400 },
    );
  }

  const target = normalizePokePasteUrl(url);
  if (!target) {
    return NextResponse.json(
      { error: "Only pokepast.es URLs are supported" },
      { status: 400 },
    );
  }

  const { rawUrl, htmlUrl } = target;

  try {
    // Fetch both raw paste and HTML page in parallel, each under a 5s timeout.
    // `redirect: "manual"` keeps a redirect from carrying us to another host.
    const fetchOptions: RequestInit = {
      headers: { "User-Agent": "VGC-Team-Report/1.0" },
      redirect: "manual",
    };
    const [rawRes, htmlRes] = await Promise.all([
      fetchWithTimeout(rawUrl, fetchOptions, 5000),
      fetchWithTimeout(htmlUrl, fetchOptions, 5000),
    ]);

    if (rawRes.status === 404) {
      return NextResponse.json({ error: "Paste not found" }, { status: 404 });
    }

    // A redirect is not a hop we are willing to take — it could point anywhere.
    if (rawRes.status >= 300 && rawRes.status < 400) {
      return NextResponse.json(
        { error: "PokéPaste redirected the request; refusing to follow" },
        { status: 502 },
      );
    }

    if (!rawRes.ok) {
      // Deliberately does not echo the upstream body.
      return NextResponse.json(
        { error: "PokéPaste is unavailable right now" },
        { status: 502 }
      );
    }

    const text = await readCappedText(rawRes, MAX_PASTE_BYTES);
    if (text === null) {
      return NextResponse.json(
        { error: "That paste is too large to import" },
        { status: 413 },
      );
    }

    // Extract title from HTML page
    let title: string | null = null;
    if (htmlRes.ok) {
      // The title is a nicety — if the page is oversized, skip it rather than
      // failing the whole import.
      const html = await readCappedText(htmlRes, MAX_PASTE_BYTES);
      const titleMatch = html
        ? html.match(/<h1>(.*?)<\/h1>/i) ?? html.match(/<title>(.*?)<\/title>/i)
        : null;
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

import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");
const KeySchema = z.string().regex(/^[0-9a-f]{64}$/, "Invalid edit key");

// ── In-memory presence tracking ──────────────────────────────────────
// Maps shareId → Set of { sessionId, lastSeen }
const presence = new Map<string, Map<string, number>>();
const PRESENCE_TIMEOUT = 30_000; // 30 seconds

function cleanPresence(shareId: string) {
  const sessions = presence.get(shareId);
  if (!sessions) return;
  const now = Date.now();
  for (const [sid, lastSeen] of sessions) {
    if (now - lastSeen > PRESENCE_TIMEOUT) sessions.delete(sid);
  }
  if (sessions.size === 0) presence.delete(shareId);
}

function touchPresence(shareId: string, sessionId: string) {
  if (!presence.has(shareId)) presence.set(shareId, new Map());
  presence.get(shareId)!.set(sessionId, Date.now());
}

function getCollaboratorCount(shareId: string): number {
  cleanPresence(shareId);
  return presence.get(shareId)?.size ?? 0;
}

// Clean up stale presence entries periodically
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    for (const shareId of presence.keys()) {
      cleanPresence(shareId);
    }
  }, 60_000);
}

/**
 * SSE endpoint for real-time collaborative sync.
 *
 * Clients connect with: GET /api/sync/{shareId}?key={editKey}&session={sessionId}&since={version}
 *
 * Events emitted:
 * - `version` — when a newer version is detected (includes full state data)
 * - `presence` — collaborator count updates
 * - `ping` — keepalive every 15s
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`sync:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many connections" }, { status: 429 });
  }

  const { id: rawId } = await params;
  const idResult = IdSchema.safeParse(rawId);
  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const shareId = idResult.data;

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const sessionId = url.searchParams.get("session") ?? "anon";
  const sinceParam = url.searchParams.get("since");

  if (!key) {
    return NextResponse.json({ error: "Edit key required" }, { status: 401 });
  }
  const keyResult = KeySchema.safeParse(key);
  if (!keyResult.success) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  // Validate the edit key before opening the stream
  const sql = getDb();
  const authRows = await sql`
    SELECT 1 FROM shares WHERE id = ${shareId} AND edit_token = ${key} AND deleted_at IS NULL
  `;
  if (authRows.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let knownVersion = sinceParam ? parseInt(sinceParam, 10) : 0;

  // Register presence
  touchPresence(shareId, sessionId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial presence count
      send("presence", { collaborators: getCollaboratorCount(shareId) });

      // Poll for version changes every 2 seconds (much faster than client-side polling)
      const pollInterval = setInterval(async () => {
        if (closed) { clearInterval(pollInterval); return; }
        try {
          touchPresence(shareId, sessionId);

          const rows = await sql`
            SELECT data, COALESCE(version, 1) AS version, is_public
            FROM shares WHERE id = ${shareId} AND deleted_at IS NULL
          `;
          if (rows.length === 0) { clearInterval(pollInterval); return; }

          const serverVersion = Number(rows[0].version);

          // First check — record version
          if (knownVersion === 0) {
            knownVersion = serverVersion;
            return;
          }

          // Newer version detected — push to client
          if (serverVersion > knownVersion) {
            knownVersion = serverVersion;
            const data = rows[0].data as Record<string, unknown>;
            send("version", {
              version: serverVersion,
              state: data,
              isPublic: !!rows[0].is_public,
            });
          }

          // Send presence updates
          send("presence", { collaborators: getCollaboratorCount(shareId) });
        } catch {
          // DB error — skip this cycle
        }
      }, 2000);

      // Keepalive ping every 15 seconds
      const pingInterval = setInterval(() => {
        if (closed) { clearInterval(pingInterval); return; }
        send("ping", { t: Date.now() });
      }, 15_000);

      // Handle client disconnect via AbortSignal
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(pingInterval);
        // Remove from presence
        const sessions = presence.get(shareId);
        if (sessions) {
          sessions.delete(sessionId);
          if (sessions.size === 0) presence.delete(shareId);
        }
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

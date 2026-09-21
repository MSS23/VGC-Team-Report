import { getDb } from "@/lib/db";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");

// Cap each SSE stream. The client's EventSource reconnects automatically
// (with ?since=version, so nothing is missed) — without a cap, a tab left
// open overnight polls Postgres every 5s indefinitely.
const MAX_STREAM_MS = 5 * 60_000;

/**
 * SSE endpoint for real-time collaborative sync.
 *
 * Clients connect with: GET /api/sync/{shareId}?session={sessionId}&since={version}
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
  const guard = await apiGuard(request, { rateLimit: { key: "sync", max: 10 } });
  if (guard) return guard;

  const { id: rawId } = await params;
  const idResult = IdSchema.safeParse(rawId);
  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const shareId = idResult.data;

  const url = new URL(request.url);
  const sinceParam = url.searchParams.get("since");

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Presence and full-state sync are available only to the owner or an
  // accepted account collaborator. URL tokens are never authorization.
  const sql = getDb();
  const authRows = await sql`
    SELECT 1 FROM shares s
    WHERE s.id = ${shareId} AND s.deleted_at IS NULL
      AND (
        s.owner_id = ${userId}
        OR EXISTS (
          SELECT 1 FROM collaborators c
          WHERE c.share_id = s.id AND c.user_id = ${userId}
            AND COALESCE(c.status, 'accepted') = 'accepted'
        )
      )
  `;
  if (authRows.length === 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let knownVersion = sinceParam ? parseInt(sinceParam, 10) : 0;


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



      // Poll for version changes every 5 seconds. Each cycle first reads only the
      // lightweight `version`/`is_public` columns; the full `data` JSONB blob is
      // fetched in a second query ONLY when a newer version is detected. This keeps
      // Neon from shipping the whole report every poll when nothing has changed.
      const pollInterval = setInterval(async () => {
        if (closed) { clearInterval(pollInterval); return; }
        try {
          // Recheck access throughout a long-lived stream after revocation.
          const allowed = await sql`SELECT 1 FROM shares s WHERE s.id = ${shareId} AND s.deleted_at IS NULL
            AND (s.owner_id = ${userId} OR EXISTS (SELECT 1 FROM collaborators c WHERE c.share_id = s.id
              AND c.user_id = ${userId} AND COALESCE(c.status, 'accepted') = 'accepted'))`;
          if (!allowed.length) { shutdown(); return; }

          const metaRows = await sql`
            SELECT COALESCE(version, 1) AS version, is_public
            FROM shares WHERE id = ${shareId} AND deleted_at IS NULL
          `;
          if (metaRows.length === 0) { clearInterval(pollInterval); return; }

          const serverVersion = Number(metaRows[0].version);


          // Newer version detected — fetch the full data blob and push to client
          if (serverVersion > knownVersion) {
            const dataRows = await sql`
              SELECT data, COALESCE(version, 1) AS version FROM shares WHERE id = ${shareId} AND deleted_at IS NULL
            `;
            if (dataRows.length > 0) {
              const data = dataRows[0].data as Record<string, unknown>;
              knownVersion = Number(dataRows[0].version);
              send("version", {
                version: knownVersion,
                state: data,
                isPublic: !!metaRows[0].is_public,
              });
            }
          }

          // Send presence updates
          const active = await sql`SELECT COUNT(*) AS count FROM collaboration_presence WHERE share_id = ${shareId} AND seen_at > NOW() - INTERVAL '45 seconds'`;
          send("presence", { collaborators: Number(active[0]?.count ?? 0) });
        } catch {
          // DB error — skip this cycle
        }
      }, 5000);

      // Keepalive ping every 15 seconds
      const pingInterval = setInterval(() => {
        if (closed) { clearInterval(pingInterval); return; }
        send("ping", { t: Date.now() });
      }, 15_000);

      const shutdown = () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(pingInterval);
        clearTimeout(deadline);
        try { controller.close(); } catch { /* already closed */ }
      };

      // Close after MAX_STREAM_MS; the client reconnects and resumes.
      const deadline = setTimeout(shutdown, MAX_STREAM_MS);

      // Handle client disconnect via AbortSignal
      request.signal.addEventListener("abort", shutdown);
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

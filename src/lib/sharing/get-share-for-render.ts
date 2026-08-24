/**
 * Server-side loader for the shared-report route (`/s/[id]`).
 *
 * VGC-275 / VGC-228: `/s/[id]` used to ship a client redirect, so the team
 * content only ever arrived via a browser-side `fetch("/api/share/…")`.
 * `public/robots.txt` disallows `/api/`, and Googlebot's renderer honours
 * robots.txt for XHR, so that fetch was refused and the pages were
 * structurally unindexable. This module lets the route read the share
 * straight from Postgres during the server render instead — no self-call to
 * our own HTTP API, and nothing for a crawler to be blocked from.
 *
 * SECURITY — this data ends up in public, CDN-cacheable HTML:
 *  - A report that is neither public nor unlisted is *private*. It resolves to
 *    `{ status: "private" }` and its `data` is never returned, so it cannot be
 *    server-rendered or leak into <head>. This mirrors the anonymous branch of
 *    `GET /api/share/[id]` exactly (404 for outsiders on a private report).
 *  - Owners/collaborators are deliberately NOT special-cased here. The server
 *    render is the outsider view for everyone; signed-in owners get their
 *    editable copy from the client fetch, exactly as before. Rendering an
 *    owner-only view here would risk caching it for the next visitor.
 *  - Tiered-publishing redaction (VGC-142) is always applied, for the same
 *    reason: the HTML is the public view.
 */

import { getDb } from "@/lib/db";
import { normalizeReportData } from "@/lib/utils/normalize-report";
import { normalizePrivateFields, redactPasteFields } from "@/lib/sharing/redact-paste";

export interface RenderableShare {
  /** Normalized + redaction-applied report data, safe for public HTML. */
  data: Record<string, unknown>;
  isPublic: boolean;
  isUnlisted: boolean;
  /** Accepted collaborator display names. */
  collaborators: string[];
  createdAt: string | null;
  updatedAt: string | null;
  /** Fields the creator hid from public viewers, if any. */
  redactedFields: string[];
}

/**
 * Three-way result so callers can keep the existing distinction between
 * "no such report" and "exists but private" — the two produce different
 * <head> output (the private one is explicitly noindex/nofollow).
 */
export type ShareRenderResult =
  | { status: "not-found" }
  | { status: "private" }
  | { status: "visible"; share: RenderableShare };

type Row = Record<string, unknown>;

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

/**
 * Pure visibility + redaction gate. Split out from the query so the rule that
 * keeps private reports out of the HTML is unit-testable without a database.
 */
export function buildRenderableShare(rows: Row[], collabRows: Row[] = []): ShareRenderResult {
  if (!Array.isArray(rows) || rows.length === 0) return { status: "not-found" };

  const row = rows[0] ?? {};
  const isPublic = row.is_public === true;
  const isUnlisted = row.is_unlisted === true;

  // Private = only the owner and accepted collaborators, and they are served
  // by the authenticated API — never by this server render.
  if (!isPublic && !isUnlisted) return { status: "private" };

  const rawData = (row.data && typeof row.data === "object" ? row.data : {}) as Row;
  const normalized = normalizeReportData(rawData);

  const redactedFields = normalizePrivateFields(
    normalized.privateFields as string[] | undefined,
  );
  const data = redactedFields.length
    ? {
        ...normalized,
        paste: redactPasteFields((normalized.paste as string) ?? "", redactedFields),
      }
    : normalized;

  return {
    status: "visible",
    share: {
      data,
      isPublic,
      isUnlisted,
      collaborators: collabRows
        .map((r) => (typeof r.user_name === "string" ? r.user_name : ""))
        .filter((name) => name.length > 0),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
      redactedFields,
    },
  };
}

/**
 * Read one share for server rendering. Never throws — a DB hiccup degrades to
 * `not-found`, which renders the same neutral shell the route used to show
 * when its best-effort JSON-LD query failed.
 */
export async function getShareForRender(id: string): Promise<ShareRenderResult> {
  try {
    const sql = getDb();
    const [rows, collabRows] = await Promise.all([
      sql`SELECT data, is_public, is_unlisted, created_at, updated_at FROM shares WHERE id = ${id} AND deleted_at IS NULL`,
      sql`SELECT user_name FROM collaborators WHERE share_id = ${id} AND COALESCE(status, 'accepted') = 'accepted'`,
    ]);
    return buildRenderableShare(rows as Row[], collabRows as Row[]);
  } catch {
    return { status: "not-found" };
  }
}

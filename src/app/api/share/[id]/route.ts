import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from "@/lib/cache";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/, "Invalid share ID");

/** Migrate old calc entries that may be stored as plain strings to {text, category} objects */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateCalcEntries(rawCalcs: any): Record<string, Array<{ text: string; category: string }>> {
  if (!rawCalcs || typeof rawCalcs !== "object") return {};
  const result: Record<string, Array<{ text: string; category: string }>> = {};
  for (const [key, entries] of Object.entries(rawCalcs)) {
    if (!Array.isArray(entries)) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[key] = (entries as any[]).map((entry) => {
      if (typeof entry === "string") return { text: entry, category: "offensive" };
      if (entry && typeof entry === "object" && "text" in entry) {
        return { text: entry.text ?? "", category: entry.category ?? "offensive" };
      }
      return { text: String(entry), category: "offensive" };
    });
  }
  return result;
}
const KeySchema = z.string().regex(/^[0-9a-f]{64}$/, "Invalid edit key");

/**
 * Normalize old report data to the current template format.
 * Ensures all fields expected by the client exist with sensible defaults,
 * and migrates legacy matchup plan structures to the current gamePlans[] format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeReportData(data: Record<string, any>): Record<string, any> {
  // Ensure matchupPlans is always an array
  const rawPlans = Array.isArray(data.matchupPlans) ? data.matchupPlans : [];

  // Migrate each matchup plan to the current format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchupPlans = rawPlans.map((plan: any) => {
    // Already has gamePlans array — just ensure each game plan has all fields
    if (Array.isArray(plan.gamePlans) && plan.gamePlans.length > 0) {
      return {
        opponentPaste: plan.opponentPaste ?? "",
        opponentLabel: plan.opponentLabel ?? "",
        showSlide: plan.showSlide,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gamePlans: plan.gamePlans.map((gp: any) => ({
          bring: Array.isArray(gp.bring) ? gp.bring : [null, null, null, null],
          notes: gp.notes ?? "",
          replays: Array.isArray(gp.replays) ? gp.replays : [],
          result: gp.result ?? undefined,
        })),
      };
    }

    // Legacy: migrate planA/planB or selectedIndices → gamePlans[0]
    let bring: [number | null, number | null, number | null, number | null] = [null, null, null, null];
    if (plan.planA) {
      bring = [plan.planA.lead?.[0] ?? null, plan.planA.lead?.[1] ?? null, plan.planA.back?.[0] ?? null, plan.planA.back?.[1] ?? null];
    } else if (Array.isArray(plan.selectedIndices)) {
      bring = [
        plan.selectedIndices[0] ?? null,
        plan.selectedIndices[1] ?? null,
        plan.selectedIndices[2] ?? null,
        plan.selectedIndices[3] ?? null,
      ];
    }

    return {
      opponentPaste: plan.opponentPaste ?? "",
      opponentLabel: plan.opponentLabel ?? "",
      showSlide: plan.showSlide,
      gamePlans: [{
        bring,
        notes: plan.notes ?? "",
        replays: [],
      }],
    };
  });

  return {
    ...data,
    paste: data.paste ?? "",
    notes: data.notes ?? {},
    calcs: migrateCalcEntries(data.calcs),
    roles: data.roles ?? {},
    spreadNotes: data.spreadNotes ?? {},
    teamSummary: data.teamSummary ?? "",
    tournamentName: data.tournamentName ?? undefined,
    placement: data.placement ?? undefined,
    record: data.record ?? undefined,
    mvpIndex: data.mvpIndex ?? null,
    rentalCode: data.rentalCode ?? undefined,
    creatorName: data.creatorName ?? undefined,
    matchupPlans,
    spriteSettings: data.spriteSettings ?? undefined,
    hiddenSlides: Array.isArray(data.hiddenSlides) ? data.hiddenSlides : [],
    allowComments: data.allowComments ?? false,
    tags: data.tags ?? undefined,
    templateId: data.templateId ?? undefined,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`share-get:${ip}`, 60, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { id: rawId } = await params;
    const idResult = IdSchema.safeParse(rawId);
    if (!idResult.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const id = idResult.data;

    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key) {
      const keyResult = KeySchema.safeParse(key);
      if (!keyResult.success) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const sql = getDb();

    // Support version-check polling: ?since=N returns 304 if not changed
    const sinceVersion = url.searchParams.get("since");

    if (key) {
      // Validate edit key — return data + editable flag + version + visibility
      const rows = await sql`
        SELECT data, (edit_token = ${key}) AS editable, COALESCE(version, 1) AS version, is_public FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (rows.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // If polling with ?since=N, return 304 if version hasn't changed
      if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
        return new Response(null, { status: 304 });
      }

      return NextResponse.json({
        ...normalizeReportData(rows[0].data as Record<string, unknown>),
        _editable: !!rows[0].editable,
        _version: Number(rows[0].version),
        _isPublic: !!rows[0].is_public,
      });
    }

    // Public access — check if the signed-in user is the owner
    let userId: string | null = null;
    try {
      const { userId: uid } = await auth();
      userId = uid;
    } catch { /* not authenticated */ }

    // If the user is the owner, grant full edit access (same as having the edit key)
    if (userId) {
      const ownerRows = await sql`
        SELECT data, edit_token, COALESCE(version, 1) AS version, is_public, owner_id
        FROM shares WHERE id = ${id} AND deleted_at IS NULL
      `;
      if (ownerRows.length > 0 && ownerRows[0].owner_id === userId) {
        if (sinceVersion && Number(sinceVersion) >= Number(ownerRows[0].version)) {
          return new Response(null, { status: 304 });
        }
        return NextResponse.json({
          ...normalizeReportData(ownerRows[0].data as Record<string, unknown>),
          _editable: true,
          _editToken: ownerRows[0].edit_token as string,
          _version: Number(ownerRows[0].version),
          _isPublic: !!ownerRows[0].is_public,
        });
      }
    }

    // Non-owner public access — read-only, no edit info leaked
    // Check cache first for public reads (skip if polling for version changes)
    if (!sinceVersion) {
      const cached = await cacheGet<Record<string, unknown>>(CacheKeys.share(id));
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const rows = await sql`
      SELECT data, COALESCE(version, 1) AS version, is_public FROM shares WHERE id = ${id} AND deleted_at IS NULL
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If polling with ?since=N, return 304 if version hasn't changed
    if (sinceVersion && Number(sinceVersion) >= Number(rows[0].version)) {
      return new Response(null, { status: 304 });
    }

    const responseData = {
      ...normalizeReportData(rows[0].data as Record<string, unknown>),
      _version: Number(rows[0].version),
      _isPublic: !!rows[0].is_public,
    };

    // Cache public shares for 5 minutes
    if (rows[0].is_public) {
      await cacheSet(CacheKeys.share(id), responseData, CacheTTL.SHARE_PUBLIC);
    }

    return NextResponse.json(responseData);
  } catch (e) {
    console.error("Share fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load share" },
      { status: 500 }
    );
  }
}

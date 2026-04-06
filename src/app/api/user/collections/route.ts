import { getDb } from "@/lib/db";
import { captureServerEvent } from "@/lib/posthog-server";
import { apiGuard } from "@/lib/security/api-guard";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateCollectionBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  regulation: z.string().max(20).optional(),
});

const AddItemBody = z.object({
  collectionId: z.string(),
  shareId: z.string(),
});

const RemoveItemBody = z.object({
  collectionId: z.string(),
  shareId: z.string(),
});

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// GET /api/user/collections — list user's collections with item counts
export async function GET(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "collections-read", max: 60 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const collections = await sql`
      SELECT c.id, c.name, c.description, c.regulation, c.created_at, c.updated_at,
             COALESCE(ci.item_count, 0)::int as item_count
      FROM collections c
      LEFT JOIN (
        SELECT collection_id, COUNT(*)::int as item_count
        FROM collection_items
        GROUP BY collection_id
      ) ci ON ci.collection_id = c.id
      WHERE c.user_id = ${userId}
      ORDER BY c.updated_at DESC
    `;

    return NextResponse.json({
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        regulation: c.regulation,
        itemCount: c.item_count,
        createdAt: (c.created_at as Date).toISOString(),
        updatedAt: (c.updated_at as Date).toISOString(),
      })),
    });
  } catch (e) {
    console.error("Collections GET error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/user/collections — create collection, add item, or remove item
export async function POST(request: Request) {
  const guard = await apiGuard(request, { rateLimit: { key: "collections-write", max: 20 } });
  if (guard) return guard;

  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const raw = await request.json();
    const action = raw.action as string;
    const sql = getDb();

    if (action === "create") {
      const parsed = CreateCollectionBody.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      const { name, description, regulation } = parsed.data;
      const id = generateId();
      await sql`
        INSERT INTO collections (id, user_id, name, description, regulation)
        VALUES (${id}, ${userId}, ${name}, ${description ?? null}, ${regulation ?? null})
      `;
      captureServerEvent(userId, "collection_created", {
        collection_id: id,
        has_regulation: !!regulation,
      });
      return NextResponse.json({ id, name });
    }

    if (action === "add-item") {
      const parsed = AddItemBody.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      const { collectionId, shareId } = parsed.data;
      // Verify ownership
      const own = await sql`SELECT id FROM collections WHERE id = ${collectionId} AND user_id = ${userId}`;
      if (own.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await sql`
        INSERT INTO collection_items (collection_id, share_id)
        VALUES (${collectionId}, ${shareId})
        ON CONFLICT DO NOTHING
      `;
      await sql`UPDATE collections SET updated_at = NOW() WHERE id = ${collectionId}`;
      captureServerEvent(userId, "collection_item_added", {
        collection_id: collectionId,
        report_id: shareId,
      });
      return NextResponse.json({ added: true });
    }

    if (action === "remove-item") {
      const parsed = RemoveItemBody.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      const { collectionId, shareId } = parsed.data;
      const own = await sql`SELECT id FROM collections WHERE id = ${collectionId} AND user_id = ${userId}`;
      if (own.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await sql`DELETE FROM collection_items WHERE collection_id = ${collectionId} AND share_id = ${shareId}`;
      return NextResponse.json({ removed: true });
    }

    if (action === "delete") {
      const collectionId = raw.collectionId as string;
      if (!collectionId) return NextResponse.json({ error: "Missing collectionId" }, { status: 400 });
      await sql`DELETE FROM collections WHERE id = ${collectionId} AND user_id = ${userId}`;
      captureServerEvent(userId, "collection_deleted", { collection_id: collectionId });
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error("Collections POST error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

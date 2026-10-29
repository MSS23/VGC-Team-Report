import { put, del } from "@vercel/blob";
import { after } from "next/server";
import { z } from "zod";
import { cacheGet, cacheSet, cacheDel, cacheSetIfAbsent } from "@/lib/cache";
import { renderTeamGraphic } from "@/lib/sharing/team-graphic-image";

/**
 * Pre-rendered og:image cards for shared reports.
 *
 * Rendering the card on demand (an opengraph-image route, or pointing og:image
 * at /api/team-graphic) made Discord/X unfurls time out, so the card is
 * rendered once when a report is saved and stored in Vercel Blob. The share
 * page then points og:image at a static Blob URL that unfurlers can fetch fast.
 *
 * The Blob URL lives in Redis (no Neon writes), keyed by share id, together
 * with a fingerprint of the fields the card shows so autosaves that don't
 * change the card skip the render.
 *
 * Without BLOB_READ_WRITE_TOKEN every function here is a no-op and share links
 * keep their text-only unfurl.
 */

/** The card reuses the downloadable "wide" team graphic. */
export const OG_IMAGE_STYLE = "wide";
export const OG_IMAGE_SIZE = { width: 1200, height: 400 } as const;

// shortcut: the Redis entry expires after 90 days; the next save or share-page
// view re-renders it. Move to a DB column if the card ever needs to be permanent.
const OG_TTL_SECONDS = 60 * 60 * 24 * 90;
const RENDER_LOCK_SECONDS = 300;

const ogCardSchema = z.object({ url: z.string().url(), fp: z.string() });
type OgCard = z.infer<typeof ogCardSchema>;

const cardKey = (shareId: string) => `og:${shareId}`;
const blobPath = (shareId: string) => `og/${shareId}.png`;

export function ogImageEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/** FNV-1a over the fields renderTeamGraphic draws, so equal cards hash equal. */
export function ogCardFingerprint(data: Record<string, unknown>): string {
  const input = JSON.stringify([
    data.paste ?? "",
    data.tournamentName ?? "",
    data.placement ?? "",
    data.creatorName ?? "",
    data.record ?? "",
    data.tags ?? null,
    data.privateFields ?? null,
  ]);
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Stored card for a share, or null when none has been rendered yet. */
export async function getShareOgCard(shareId: string): Promise<OgCard | null> {
  if (!ogImageEnabled()) return null;
  return cacheGet(cardKey(shareId), ogCardSchema);
}

/** Remove a share's card (report made private or deleted). */
export async function removeShareOgImage(shareId: string): Promise<void> {
  if (!ogImageEnabled()) return;
  const card = await getShareOgCard(shareId);
  if (!card) return;
  try {
    await del(card.url.split("?")[0]);
  } catch (err) {
    console.error("og image delete failed:", err);
  }
  await cacheDel(cardKey(shareId));
}

/**
 * Render and store the card for a share in its current state. Private reports
 * lose any card they had, since the Blob URL is public.
 */
export async function publishShareOgImage(
  shareId: string,
  data: Record<string, unknown>,
  visibility: { isPublic: boolean; isUnlisted: boolean },
): Promise<void> {
  if (!ogImageEnabled()) return;
  if (!visibility.isPublic && !visibility.isUnlisted) {
    await removeShareOgImage(shareId);
    return;
  }
  const fp = ogCardFingerprint(data);
  const existing = await getShareOgCard(shareId);
  if (existing?.fp === fp) return;

  try {
    const image = renderTeamGraphic(data, OG_IMAGE_STYLE, "no-store");
    const png = await image.arrayBuffer();
    const { url } = await put(blobPath(shareId), png, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60, // the path is reused on re-render
    });
    // ?v= changes whenever the card does, so unfurler caches pick up edits.
    await cacheSet(cardKey(shareId), { url: `${url}?v=${fp}`, fp }, OG_TTL_SECONDS);
  } catch (err) {
    console.error("og image render/upload failed:", err);
  }
}

/** Queue publishShareOgImage to run after the response is sent. */
export function schedulePublishShareOgImage(
  shareId: string,
  data: Record<string, unknown>,
  visibility: { isPublic: boolean; isUnlisted: boolean },
): void {
  if (!ogImageEnabled()) return;
  after(() => publishShareOgImage(shareId, data, visibility));
}

/**
 * Backfill from the share page: reports saved before this existed (or whose
 * card expired or went stale) get a card rendered after the page responds.
 * The lock keeps a burst of crawler hits from rendering it more than once.
 */
export function scheduleOgImageBackfill(
  shareId: string,
  data: Record<string, unknown>,
  visibility: { isPublic: boolean; isUnlisted: boolean },
): void {
  if (!ogImageEnabled()) return;
  after(async () => {
    if (!(await cacheSetIfAbsent(`og-lock:${shareId}`, RENDER_LOCK_SECONDS))) return;
    await publishShareOgImage(shareId, data, visibility);
  });
}

import { z } from "zod";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Random [A-Za-z0-9] string. Share and draft ids use length 8, collection ids 10.
 * Byte-mod-62 keeps the exact output distribution of the route copies it replaces.
 */
export function generateAlphanumericId(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHANUMERIC[b % ALPHANUMERIC.length]).join("");
}

/** 32 random bytes as 64 lowercase hex chars: the `shares.edit_token` format. */
export function generateEditToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Exactly the ids `generateAlphanumericId(8)` produces. Used by share, fork, versions, sync, collections. */
export const STRICT_SHARE_ID_RE = /^[A-Za-z0-9]{8}$/;

/** Looser check kept by comments, reactions and views: 6-16 chars, also allows `_` and `-`. */
export const LOOSE_SHARE_ID_RE = /^[a-zA-Z0-9_-]{6,16}$/;

/** Unanchored: captures the id (group 1) from a `/s/<id>` path inside a URL. Used by oembed. */
export const SHARE_URL_ID_RE = /\/s\/([A-Za-z0-9]{6,12})/;

/** The `IdSchema` the share/[id] family of routes declares locally. */
export const ShareIdSchema = z.string().regex(STRICT_SHARE_ID_RE, "Invalid share ID");

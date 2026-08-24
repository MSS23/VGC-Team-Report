import type { CalcEntry } from "@/hooks/useDamageCalcs";

/**
 * Zod validation schemas live in `./url-codec.schemas` and are loaded with a
 * dynamic `import()` below (VGC-256). This module sits in the homepage client
 * graph (page.tsx → useHomePage → useShareFlow → useShareUrl), so a static
 * `import { z } from "zod"` here shipped ~265 kB raw / ~63 kB gzip of zod to
 * every visitor of `/`. Do NOT re-add a static import of ./url-codec.schemas
 * to this file — that would undo the split. Server routes import the schemas
 * module directly and are unaffected.
 */
let schemasPromise: Promise<typeof import("./url-codec.schemas")> | null = null;

function getSchemas(): Promise<typeof import("./url-codec.schemas")> {
  schemasPromise ??= import("./url-codec.schemas").catch((err) => {
    // Never cache a failed chunk fetch — a transient network error would
    // otherwise permanently break decoding for the rest of the session.
    schemasPromise = null;
    throw err;
  });
  return schemasPromise;
}

export interface SerializedGamePlan {
  bring: [number | null, number | null, number | null, number | null];
  notes: string;
  result?: "W" | "L" | "T" | null;
}

export interface SerializedMatchupPlan {
  opponentPaste: string;
  opponentLabel: string;
  showSlide?: boolean;
  gamePlans?: SerializedGamePlan[];
  notes?: string;
  selectedIndices?: number[];
  planA?: { lead: [number | null, number | null]; back: [number | null, number | null] };
  planB?: { lead: [number | null, number | null]; back: [number | null, number | null] };
}

export interface ShareableState {
  paste: string;
  notes: Record<string, string>;
  calcs?: Record<string, CalcEntry[]>;
  roles?: Record<string, string>;
  teamSummary?: string;
  commonModes?: {
    combinations?: { id: string; leads: number[]; back: number[]; strategy: string }[];
    leads?: string;
    modes?: string;
    strengths?: string;
    weaknesses?: string;
    gameplan?: string;
  };
  teamName?: string;
  tournamentName?: string;
  placement?: string;
  record?: string;
  mvpIndex?: number | null;
  rentalCode?: string;
  creatorName?: string;
  matchupPlans: SerializedMatchupPlan[];
  spriteSettings?: Record<string, { shiny?: boolean; animated?: boolean }>;
  hiddenSlides?: string[];
  allowComments?: boolean;
  tags?: { archetype?: string[]; regulation?: string; eventType?: string; regulationAutoDetected?: boolean };
  templateId?: string;
  privateFields?: string[];
  /**
   * Creator's gen theme (accent color palette). When present on a shared view,
   * viewers are pinned to this theme so the report looks the same as when the
   * creator built it, regardless of the viewer's own stored preference.
   */
  genTheme?: string;
}

function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) base64 += "=".repeat(4 - pad);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function decodeShareState(encoded: string): Promise<ShareableState | null> {
  try {
    // Strip version prefix if present; legacy URLs have no prefix
    let payload = encoded;
    if (payload.startsWith("1:")) {
      payload = payload.slice(2);
    }
    const bytes = fromBase64Url(payload);

    const ds = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    writer.write(bytes.buffer as ArrayBuffer);
    writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    const json = new TextDecoder().decode(result);
    const parsed: unknown = JSON.parse(json);

    // Runtime validation guards against malformed or malicious URLs.
    // safeParse returns null on shape mismatch instead of letting bad
    // data leak into the report viewer (VGC-146).
    //
    // The schemas (and zod itself) are fetched on demand here — this is the
    // only client-side path that needs them, and it already runs inside an
    // effect, so the extra await costs nothing on the render path (VGC-256).
    const { ShareableStateSchema } = await getSchemas();
    const result2 = ShareableStateSchema.safeParse(parsed);
    if (!result2.success) return null;
    return result2.data as ShareableState;
  } catch {
    return null;
  }
}

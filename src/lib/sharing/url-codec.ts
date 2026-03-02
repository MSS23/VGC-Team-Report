import type { CalcEntry } from "@/hooks/useDamageCalcs";

export interface SerializedGamePlan {
  bring: [number | null, number | null, number | null, number | null];
  notes: string;
}

export interface SerializedMatchupPlan {
  opponentPaste: string;
  opponentLabel: string;
  gamePlans?: SerializedGamePlan[];
  // Legacy fields for backward compat
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
  matchupPlans: SerializedMatchupPlan[];
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

export async function encodeShareState(state: ShareableState): Promise<string> {
  const json = JSON.stringify(state);
  const encoded = new TextEncoder().encode(json);

  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(encoded);
  writer.close();

  const reader = cs.readable.getReader();
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

  return toBase64Url(result);
}

export async function decodeShareState(encoded: string): Promise<ShareableState | null> {
  try {
    const bytes = fromBase64Url(encoded);

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
    return JSON.parse(json) as ShareableState;
  } catch {
    return null;
  }
}

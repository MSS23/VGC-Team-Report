import { z } from "zod";

const POKEPASTE_REGEX = /^https?:\/\/pokepast\.es\/[a-zA-Z0-9]+\/?(?:raw\/?)?$/;

export function isPokePasteUrl(input: string): boolean {
  return POKEPASTE_REGEX.test(input.trim());
}

interface PokePasteResult {
  paste: string;
  title: string | null;
}

/**
 * Shape of responses returned by our `/api/pokepaste` proxy. All fields are
 * optional because failure cases return `{ error }` while success cases
 * return `{ paste, title }` (GET) or `{ url }` (POST). Parsed with
 * `safeParse` so a malformed response surfaces as a typed empty object
 * rather than a runtime exception.
 */
const PokePasteResponseSchema = z.object({
  paste: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  error: z.string().optional(),
});

type PokePasteResponse = z.infer<typeof PokePasteResponseSchema>;

async function parseJsonResponse(res: Response): Promise<PokePasteResponse> {
  const json = (await res.json()) as unknown;
  const parsed = PokePasteResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : {};
}

async function parseJsonResponseSafe(res: Response): Promise<PokePasteResponse> {
  try {
    return await parseJsonResponse(res);
  } catch {
    return {};
  }
}

/**
 * Fetches a PokéPaste team from a pokepast.es URL via our API proxy.
 * Returns the raw Showdown paste text and the page title (team name).
 */
export async function fetchPokePaste(url: string): Promise<PokePasteResult> {
  const res = await fetch(`/api/pokepaste?url=${encodeURIComponent(url.trim())}`);
  if (!res.ok) {
    const data = await parseJsonResponseSafe(res);
    throw new Error(data.error ?? `Failed to fetch (${res.status})`);
  }
  const data = await parseJsonResponse(res);
  return { paste: data.paste ?? "", title: data.title ?? null };
}

interface CreatePokePasteInput {
  paste: string;
  title?: string;
  author?: string;
  notes?: string;
}

/**
 * Creates a new paste on pokepast.es via our API proxy and returns the URL
 * of the resulting paste.
 */
export async function createPokePaste(input: CreatePokePasteInput): Promise<string> {
  const res = await fetch("/api/pokepaste", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await parseJsonResponseSafe(res);
    throw new Error(data.error ?? `Failed to create (${res.status})`);
  }
  const data = await parseJsonResponse(res);
  if (!data.url || typeof data.url !== "string") {
    throw new Error("PokéPaste response missing url");
  }
  return data.url;
}

import {
  normalizePokePasteUrl,
  errorKindForStatus,
  PokePasteImportError,
} from "./pokepaste-url";

// URL detection/normalisation lives in `pokepaste-url.ts` so the API route can
// share the exact same host allowlist. Re-exported here for existing callers.
export { isPokePasteUrl, normalizePokePasteUrl, PokePasteImportError } from "./pokepaste-url";
export type { PokePasteErrorKind } from "./pokepaste-url";

interface PokePasteResult {
  paste: string;
  title: string | null;
}

/**
 * Fetches a PokéPaste team from a pokepast.es URL via our API proxy.
 * Returns the raw Showdown paste text and the page title (team name).
 *
 * Throws a `PokePasteImportError` whose `kind` identifies the failure, so the
 * UI can show a specific message instead of a generic one.
 */
export async function fetchPokePaste(url: string): Promise<PokePasteResult> {
  // Validate client-side first: an obviously wrong link should not cost a
  // round trip or burn the caller's rate-limit budget.
  const target = normalizePokePasteUrl(url);
  if (!target) {
    throw new PokePasteImportError("invalid-url");
  }

  let res: Response;
  try {
    res = await fetch(`/api/pokepaste?url=${encodeURIComponent(target.htmlUrl)}`);
  } catch {
    // Network failure / offline — never surfaced as a status code.
    throw new PokePasteImportError("upstream");
  }

  if (!res.ok) {
    throw new PokePasteImportError(errorKindForStatus(res.status));
  }

  const data = await res.json().catch(() => null);
  if (!data || typeof data.paste !== "string") {
    throw new PokePasteImportError("upstream");
  }
  return { paste: data.paste, title: data.title ?? null };
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
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to create (${res.status})`);
  }
  const data = await res.json();
  if (!data.url || typeof data.url !== "string") {
    throw new Error("PokéPaste response missing url");
  }
  return data.url;
}

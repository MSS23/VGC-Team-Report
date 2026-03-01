const POKEPASTE_REGEX = /^https?:\/\/pokepast\.es\/[a-zA-Z0-9]+\/?(?:raw\/?)?$/;

export function isPokePasteUrl(input: string): boolean {
  return POKEPASTE_REGEX.test(input.trim());
}

export interface PokePasteResult {
  paste: string;
  title: string | null;
}

/**
 * Fetches a PokéPaste team from a pokepast.es URL via our API proxy.
 * Returns the raw Showdown paste text and the page title (team name).
 */
export async function fetchPokePaste(url: string): Promise<PokePasteResult> {
  const res = await fetch(`/api/pokepaste?url=${encodeURIComponent(url.trim())}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to fetch (${res.status})`);
  }
  const data = await res.json();
  return { paste: data.paste, title: data.title ?? null };
}

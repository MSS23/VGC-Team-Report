// Per-locale move-name tables, loaded on demand.
//
// The combined 6-language catalogue is ~111 kB raw / ~46 kB gzip and used to be
// imported at module scope, so every visitor downloaded all six languages even
// though `translateMove` short-circuits for English. Each locale now lives in
// its own chunk and is fetched only when that language is actually selected.

export type MoveTranslationLanguage = "fr" | "it" | "es" | "ja" | "ko" | "zh";

const loaders: Record<MoveTranslationLanguage, () => Promise<{ default: Record<string, string> }>> =
  {
    fr: () => import("./fr"),
    it: () => import("./it"),
    es: () => import("./es"),
    ja: () => import("./ja"),
    ko: () => import("./ko"),
    zh: () => import("./zh"),
  };

const tables = new Map<MoveTranslationLanguage, Map<string, string>>();
const inFlight = new Map<MoveTranslationLanguage, Promise<void>>();

export function isTranslatableLanguage(lang: string): lang is MoveTranslationLanguage {
  return lang in loaders;
}

/**
 * Fetch the move-name table for `lang`. Resolves immediately for English (and
 * any language without a table) and is idempotent — concurrent callers share
 * one request. Never rejects: a failed chunk load leaves the English names in
 * place rather than breaking the render.
 */
export function loadMoveNames(lang: string): Promise<void> {
  if (!isTranslatableLanguage(lang) || tables.has(lang)) return Promise.resolve();

  const existing = inFlight.get(lang);
  if (existing) return existing;

  const pending = loaders[lang]()
    .then((mod) => {
      tables.set(lang, new Map(Object.entries(mod.default)));
    })
    .catch(() => {
      // Keep English names; drop the memo so a later render can retry.
      inFlight.delete(lang);
    });

  inFlight.set(lang, pending);
  return pending;
}

/** The already-loaded table for `lang`, or undefined if it has not arrived yet. */
export function getLoadedMoveNames(lang: string): Map<string, string> | undefined {
  return isTranslatableLanguage(lang) ? tables.get(lang) : undefined;
}

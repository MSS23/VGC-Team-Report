"use client";

import { useSyncExternalStore } from "react";
import type { LanguageCode } from "@/lib/i18n";

/**
 * Move-name localisation.
 *
 * `@/lib/data/move-names` is a ~127KB generated table (every move × 6
 * localised names). It used to be a static import here, which pulled it into
 * every chunk that rendered a move label — i.e. the whole report view, for
 * every user, including the ~English-default majority that can never read a
 * single byte of it.
 *
 * It is now behind a dynamic `import()` so the bundler emits it as its own
 * async chunk, fetched only once a non-English language is actually selected.
 * The English path below never touches the table at all.
 *
 * Types are referenced via type-position `import()` so nothing static leaks
 * back into the module graph (see homepage-eager-imports.test.ts).
 */
type MoveNamesTable = typeof import("@/lib/data/move-names").MOVE_NAMES;
type MoveTranslations = MoveNamesTable[string];

type MoveIndex = Map<string, { name: string; translations: MoveTranslations }>;

function normalizeMoveName(moveName: string): string {
  return moveName
    .trim()
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

let moveIndex: MoveIndex | null = null;
let pendingLoad: Promise<void> | null = null;
const listeners = new Set<() => void>();

function buildIndex(table: MoveNamesTable): MoveIndex {
  return new Map(
    Object.entries(table).map(([name, translations]) => [
      normalizeMoveName(name),
      { name, translations },
    ]),
  );
}

/**
 * Fetch + index the localised move table. Idempotent and cached; safe to call
 * from anywhere (render, effect, event handler). Resolves once
 * `translateMove` can return localised names.
 */
export function loadMoveNames(): Promise<void> {
  if (moveIndex) return Promise.resolve();
  pendingLoad ??= import("@/lib/data/move-names").then((mod) => {
    moveIndex = buildIndex(mod.MOVE_NAMES);
    for (const listener of listeners) listener();
  });
  return pendingLoad;
}

/** True once the localised table is in memory. */
export function areMoveNamesLoaded(): boolean {
  return moveIndex !== null;
}

/**
 * Translate a move name from English to the target language.
 * Returns the English name if no translation is available.
 *
 * Synchronous and allocation-free for `lang === "en"`. For a non-English
 * language before the table has loaded it returns the English name and kicks
 * off the load; pair it with `useMoveNames(lang)` (or await `loadMoveNames()`)
 * so the caller re-renders with the localised labels.
 */
export function translateMove(englishName: string, lang: LanguageCode): string {
  if (lang === "en") return englishName.trim();

  if (!moveIndex) {
    void loadMoveNames();
    return englishName.trim();
  }

  const match = moveIndex.get(normalizeMoveName(englishName));
  return match?.translations[lang] ?? match?.name ?? englishName.trim();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => moveIndex !== null;
const getServerSnapshot = () => false;

/**
 * Ensures the localised move table is loaded for `lang` and re-renders the
 * calling component once it is. Components that render `translateMove(...)`
 * call this once; English stays a no-op (nothing is fetched).
 */
export function useMoveNames(lang: LanguageCode): boolean {
  const loaded = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // Warm the cache as early as possible. `loadMoveNames` is idempotent, so a
  // double invoke under StrictMode reuses the same in-flight promise.
  if (lang !== "en" && !loaded) void loadMoveNames();
  return loaded;
}

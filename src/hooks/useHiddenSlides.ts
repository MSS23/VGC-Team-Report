"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { readStorageJSON, writeStorageJSON, STORAGE_KEY_BUILDERS } from "@/lib/utils/safe-storage";
import { isSharePath } from "@/hooks/share-path";

export function useHiddenSlides(speciesKeys: string[], persist = true) {
  // v2 namespace — bumped after the localStorage leak incident on 2026-04-10.
  const storageKey = STORAGE_KEY_BUILDERS.hiddenSlides(speciesKeys);
  const prevKey = useRef(storageKey);

  const [hidden, setHidden] = useState<Set<string>>(() => {
    if (!persist || speciesKeys.length === 0) return new Set();
    try {
      return new Set(readStorageJSON<string[]>(storageKey, []));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (storageKey === prevKey.current) return;
    prevKey.current = storageKey;
    if (speciesKeys.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reload per-team state from storage when the team key changes
      setHidden(new Set());
      return;
    }
    if (!persist) return;
    try {
      setHidden(new Set(readStorageJSON<string[]>(storageKey, [])));
    } catch {
      setHidden(new Set());
    }
  }, [storageKey, speciesKeys.length, persist]);

  // Belt-and-suspenders: also block writes when the URL is /s/{id}.
  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    if (isSharePath()) return;
    writeStorageJSON(storageKey, [...hidden]); // false on quota exceeded
  }, [hidden, storageKey, speciesKeys.length, persist]);

  const toggleSlide = useCallback((key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isHidden = useCallback((key: string) => hidden.has(key), [hidden]);

  const setHiddenFull = useCallback((keys: string[]) => {
    setHidden(new Set(keys));
  }, []);

  return { hiddenSlides: hidden, toggleSlide, isHidden, setHiddenFull };
}

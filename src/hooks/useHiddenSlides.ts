"use client";

import { useState, useCallback, useEffect, useRef } from "react";

function buildKey(speciesKeys: string[]): string {
  const sorted = [...speciesKeys].sort();
  return `vgc-hidden-slides-${sorted.join(",")}`;
}

export function useHiddenSlides(speciesKeys: string[], persist = true) {
  const storageKey = buildKey(speciesKeys);
  const prevKey = useRef(storageKey);

  const [hidden, setHidden] = useState<Set<string>>(() => {
    if (!persist || speciesKeys.length === 0) return new Set();
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (storageKey === prevKey.current) return;
    prevKey.current = storageKey;
    if (speciesKeys.length === 0) {
      setHidden(new Set());
      return;
    }
    if (!persist) return;
    try {
      const stored = localStorage.getItem(storageKey);
      setHidden(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch {
      setHidden(new Set());
    }
  }, [storageKey, speciesKeys.length, persist]);

  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...hidden]));
    } catch {
      /* quota exceeded */
    }
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

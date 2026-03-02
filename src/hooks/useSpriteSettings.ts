"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface SpriteConfig {
  shiny: boolean;
  animated: boolean;
}

function buildTeamKey(speciesKeys: string[]): string {
  const sorted = [...speciesKeys].sort();
  return `vgc-sprites-${sorted.join(",")}`;
}

export function useSpriteSettings(
  speciesKeys: string[],
  defaults: Record<string, { shiny: boolean }>,
  persist = true
) {
  const teamKey = buildTeamKey(speciesKeys);
  const prevTeamKey = useRef(teamKey);

  const [settings, setSettings] = useState<Record<string, SpriteConfig>>(() => {
    if (speciesKeys.length === 0) return {};
    if (persist) {
      try {
        const stored = localStorage.getItem(teamKey);
        if (stored) return JSON.parse(stored);
      } catch {
        // fall through
      }
    }
    // Init from defaults (parsed.shiny)
    const init: Record<string, SpriteConfig> = {};
    for (const key of speciesKeys) {
      init[key] = { shiny: defaults[key]?.shiny ?? false, animated: true };
    }
    return init;
  });

  // When team changes, load or init settings
  useEffect(() => {
    if (teamKey === prevTeamKey.current) return;
    prevTeamKey.current = teamKey;

    if (speciesKeys.length === 0) {
      setSettings({});
      return;
    }

    if (persist) {
      try {
        const stored = localStorage.getItem(teamKey);
        if (stored) {
          setSettings(JSON.parse(stored));
          return;
        }
      } catch {
        // fall through
      }
    }

    const init: Record<string, SpriteConfig> = {};
    for (const key of speciesKeys) {
      init[key] = { shiny: defaults[key]?.shiny ?? false, animated: true };
    }
    setSettings(init);
  }, [teamKey, speciesKeys, defaults, persist]);

  // Persist
  useEffect(() => {
    if (!persist || speciesKeys.length === 0) return;
    try {
      localStorage.setItem(teamKey, JSON.stringify(settings));
    } catch {
      // quota exceeded
    }
  }, [settings, teamKey, speciesKeys.length, persist]);

  const getConfig = useCallback(
    (key: string): SpriteConfig =>
      settings[key] ?? { shiny: defaults[key]?.shiny ?? false, animated: true },
    [settings, defaults]
  );

  const toggleShiny = useCallback((key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], shiny: !(prev[key]?.shiny ?? false), animated: prev[key]?.animated ?? true },
    }));
  }, []);

  const toggleAnimated = useCallback((key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], shiny: prev[key]?.shiny ?? false, animated: !(prev[key]?.animated ?? true) },
    }));
  }, []);

  const setSettingsFull = useCallback((newSettings: Record<string, SpriteConfig>) => {
    setSettings(newSettings);
  }, []);

  return { settings, getConfig, toggleShiny, toggleAnimated, setSettingsFull };
}

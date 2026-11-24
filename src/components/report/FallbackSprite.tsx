"use client";

import { useState } from "react";
import { getSpriteUrls } from "@/lib/utils/sprite-slug";

// Kept apart from PokemonSprite.tsx on purpose: that module imports useTheme,
// whose load registers a dark-mode watcher. Pages that only need this sprite
// (explore, dashboard, Mega guides) must not pull that in.

interface FallbackSpriteProps {
  species: string;
  /** Sets the width/height attributes; sizing classes go in `className`. */
  size: number;
  className: string;
  /** Defaults to `species`. */
  alt?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  crossOrigin?: "anonymous";
  /** Serve each URL through the same-origin /api/sprite proxy (for canvas capture). */
  proxied?: boolean;
}

/**
 * Theme-independent sprite: walks `getSpriteUrls` (animated GIF first) and
 * advances one URL per error. Unlike `PokemonSprite` it ignores the gen theme
 * and print mode, adds no inline style, and does not reset its fallback
 * position when `species` changes — matching the local copies it replaces.
 */
export function FallbackSprite({
  species,
  size,
  className,
  alt = species,
  loading,
  fetchPriority,
  crossOrigin,
  proxied = false,
}: FallbackSpriteProps) {
  const raw = getSpriteUrls(species);
  const urls = proxied ? raw.map((u) => `/api/sprite?u=${encodeURIComponent(u)}`) : raw;
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={urls[Math.min(idx, urls.length - 1)]}
      alt={alt}
      width={size}
      height={size}
      loading={loading}
      fetchPriority={fetchPriority}
      crossOrigin={crossOrigin}
      className={className}
      onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
    />
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { getGenThemedSpriteUrls, isGenThemePixelated } from "@/lib/utils/sprite-url";
import { useTheme } from "@/hooks/useTheme";

interface PokemonSpriteProps {
  species: string;
  size?: number;
  className?: string;
  animated?: boolean;
  shiny?: boolean;
}

/**
 * Renders a Pokemon sprite that automatically adapts to the current
 * generation theme. Falls back through multiple sprite sources on error.
 */
export function PokemonSprite({
  species,
  size = 64,
  className = "",
  animated = true,
  shiny = false,
}: PokemonSpriteProps) {
  const { genTheme } = useTheme();
  const [urlIndex, setUrlIndex] = useState(0);

  // Reset fallback index when inputs change
  useEffect(() => {
    setUrlIndex(0);
  }, [species, shiny, animated, genTheme]);

  const urls = useMemo(
    () => getGenThemedSpriteUrls(species, genTheme, animated, shiny),
    [species, genTheme, animated, shiny],
  );

  const src = urls[Math.min(urlIndex, urls.length - 1)];
  const isGif = src.endsWith(".gif");
  const pixelated = isGenThemePixelated(genTheme) && !isGif;

  return (
    <img
      src={src}
      alt={species}
      width={size}
      height={size}
      loading="lazy"
      className={`object-contain ${className}`}
      style={{
        maxWidth: size,
        maxHeight: size,
        ...(pixelated ? { imageRendering: "pixelated" as const } : {}),
      }}
      onError={() => {
        setUrlIndex((prev) => Math.min(prev + 1, urls.length - 1));
      }}
    />
  );
}

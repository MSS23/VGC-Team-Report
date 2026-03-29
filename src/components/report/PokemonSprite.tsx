"use client";

import { useState, useEffect, useMemo } from "react";
import { getGenThemedSpriteUrls, isGenThemePixelated } from "@/lib/utils/sprite-url";
import { useTheme } from "@/hooks/useTheme";
import { useIsPrintMode } from "@/components/ui/PdfExport";

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
 * In print mode, forces static PNGs (GIFs don't render in PDF).
 */
export function PokemonSprite({
  species,
  size = 64,
  className = "",
  animated = true,
  shiny = false,
}: PokemonSpriteProps) {
  const { genTheme } = useTheme();
  const isPrint = useIsPrintMode();
  const [urlIndex, setUrlIndex] = useState(0);

  // In print mode, force static sprites (GIFs don't render in PDF)
  const effectiveAnimated = isPrint ? false : animated;

  // Reset fallback index when inputs change
  useEffect(() => {
    setUrlIndex(0);
  }, [species, shiny, effectiveAnimated, genTheme]);

  const urls = useMemo(
    () => getGenThemedSpriteUrls(species, genTheme, effectiveAnimated, shiny),
    [species, genTheme, effectiveAnimated, shiny],
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
      loading={isPrint ? "eager" : "lazy"}
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
